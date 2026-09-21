const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

let reloads = 0;
let confirmed = false;
const context = {
    console,
    confirm: () => confirmed,
    location: { reload: () => reloads++ },
    setTimeout: callback => callback(),
    clearTimeout: () => {},
    AbortController,
    crypto: webcrypto,
    document: { getElementById: () => null },
    window: {}
};
context.window = context;
const mainScript = fs.readFileSync(path.join(__dirname, 'javascript', 'dol-optimization.js'), 'utf8');
vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'javascript', 'modloader-optimization.js'), 'utf8'), context);

context.dolOptShowToast = () => {};
assert.equal([...context.dolOptFindTextOffsets('Error error ERROR', 'error')].join(','), '0,6,12');
assert.equal(context.dolOptIsManagerTabLabel('模组市场2'), true, '带更新徽标的模组市场仍应属于管理器标签');
assert.equal(context.dolOptIsManagerTabLabel('织境记忆'), false, '外部日志标签不得被误认成管理器标签');

const container = {
    innerHTML: '',
    querySelectorAll: () => [
        { dataset: { section: 'side' }, open: false },
        { dataset: { section: 'beauty' }, open: true },
        { dataset: { section: 'core' }, open: false }
    ]
};
context.document.getElementById = id => id === 'dolOptModManageContainer' ? container : null;
context._dolOptModState = { sideEnabled: [], sideDisabled: [], builtInMods: [] };
context._dolOptBeautyState = { enabledList: [], disabledList: [], allMap: new Map() };
context.dolOptGetGui = () => ({ gModUtils: { getMod: () => ({ bootJson: {} }) } });
context.dolOptRenderBeautyUI = () => {};
context.dolOptRenderModManageUI();
assert.ok(container.innerHTML.includes('data-section="side">'));
assert.ok(container.innerHTML.includes('data-section="beauty" open>'));
assert.ok(container.innerHTML.includes('data-section="core">'));

const boots = {
    Feature: { name: 'Feature', dependenceInfo: [{ modName: 'Core' }] },
    Core: { name: 'Core' }
};
context._dolOptModState = { sideEnabled: ['Feature', 'Core'], sideDisabled: [], builtInMods: [] };
context._dolOptBeautyState = {
    enabledList: [
        { type: 'BaseArt', modRef: { name: 'Base', bootJson: { name: 'Base' } } },
        { type: 'OverlayArt', modRef: { name: 'Overlay', bootJson: { name: 'Overlay', dependenceInfo: [{ modName: 'Base' }] } } }
    ],
    disabledList: [],
    allMap: new Map()
};
let readmeReads = 0;
context.dolOptGetGui = () => ({
    getModTReadMe: async () => (++readmeReads, Promise.reject(new Error('README must not be read while sorting'))),
    gModUtils: { getMod: name => ({ bootJson: boots[name] || {} }) }
});
const originalRenderModManageUI = context.dolOptRenderModManageUI;
const originalSaveModManageState = context.dolOptSaveModManageState;
const originalOfferReload = context.dolOptOfferReload;
context.dolOptRenderModManageUI = () => {};
let modSaves = 0;
let beautySaves = 0;
let reloadOffers = 0;
let reloadMessage = '';
const toastMessages = [];
context.dolOptSaveModManageState = async () => (++modSaves, true);
context.dolOptSaveBeautyState = async () => (++beautySaves, true);
context.dolOptShowToast = message => toastMessages.push(message);
context.dolOptOfferReload = message => (reloadOffers++, reloadMessage = message);

(async () => {
    const remoteElement = { dataset: { remote: 'https://example.test/data', replace: 'true' }, style: {}, textContent: '' };
    const asApiContext = {
        console,
        window: null,
        queueMicrotask: callback => callback(),
        document: { querySelectorAll: () => [remoteElement] },
        fetch: async () => ({ json: async () => ({ value: '<img src=x onerror=globalThis.pwned=true>\n第二行' }) })
    };
    asApiContext.window = asApiContext;
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'javascript', 'AsAPI.js'), 'utf8'), asApiContext);
    asApiContext.AsAPI.loadRemote();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(remoteElement.textContent, '<img src=x onerror=globalThis.pwned=true>\n第二行', '远程内容必须按纯文本显示');
    assert.equal(remoteElement.style.whiteSpace, 'pre-line', '远程多行文本必须保留换行显示');
    assert.equal(asApiContext.pwned, undefined, '远程内容不得执行 HTML 事件脚本');

    await context.dolOptSmartSortAll();
    assert.equal([...context._dolOptModState.sideEnabled].join(','), 'Core,Feature');
    assert.equal([...context._dolOptBeautyState.enabledList].map(item => item.type).join(','), 'OverlayArt,BaseArt');
    assert.equal(modSaves, 1);
    assert.equal(beautySaves, 1);
    assert.equal(reloadOffers, 1);
    assert.equal(readmeReads, 0);
    assert.equal(toastMessages.at(-1), '已按依赖关系智能整理【旁加载加载顺序 与 美化覆盖顺序】');
    assert.equal(reloadMessage, '已按依赖关系智能整理【旁加载加载顺序 与 美化覆盖顺序】。配置已保存。');

    await context.dolOptSmartSortAll();
    assert.equal(toastMessages.at(-1), '智能整理完成，暂时无需调整');
    assert.equal(reloadOffers, 1);

    // 2. 拖拽重排功能测试 (dolOptReorderList)
    context._dolOptModState.sideEnabled = ['A', 'B', 'C', 'D'];
    // 将 D (index 3) 拖拽到 A (index 0) 之前 (isAfter = false) -> 期望 ['D', 'A', 'B', 'C']
    await context.dolOptReorderList('side', 3, 0, false);
    assert.equal([...context._dolOptModState.sideEnabled].join(','), 'D,A,B,C');
    assert.ok(toastMessages.at(-1).includes('已将【D】排序调整至第 1 位'));

    // 将 D (index 0) 拖拽到 B (index 2) 之后 (isAfter = true) -> 期望 ['A', 'B', 'D', 'C']
    await context.dolOptReorderList('side', 0, 2, true);
    assert.equal([...context._dolOptModState.sideEnabled].join(','), 'A,B,D,C');

    // 3. 模组导入与智能分流测试 (dolOptHandleAddMod)
    let clickedTabs = [];
    context.document.querySelectorAll = selector => {
        if (selector === '#overlayTabs button') {
            return [
                { textContent: '通用', click: () => clickedTabs.push('通用') },
                { textContent: '模组管理', click: () => clickedTabs.push('模组管理') },
                { textContent: '模组说明', click: () => clickedTabs.push('模组说明') },
                { textContent: '加载日志', click: () => clickedTabs.push('加载日志') }
            ];
        }
        return [];
    };

    let currentSideMods = ['CoreMod'];
    const fakeGui = {
        listSideLoadModNameOnly: async () => [...currentSideMods],
        listSideLoadHiddenModNameOnly: async () => [],
        loadAndAddMod: async (fileInput) => {
            for (let f of fileInput.files) {
                currentSideMods.push(f.name.replace('.zip', ''));
            }
        },
        getModTReadMe: async (name) => {
            if (name === 'ModWithReadme') return '# ReadMe Title\nDocumentation content';
            return '';
        },
        gModUtils: {
            getMod: () => ({ bootJson: {} }),
            getModListNameNoAlias: () => []
        }
    };
    context.dolOptGetGui = () => fakeGui;

    // 单模组导入 - 拥有 ReadMe -> 应自动切换到【模组说明】
    clickedTabs = [];
    const singleFileWithReadme = {
        files: [{ name: 'ModWithReadme.zip' }],
        value: 'ModWithReadme.zip'
    };
    await context.dolOptHandleAddMod(singleFileWithReadme);
    assert.equal(context._dolOptSelectedMod, 'ModWithReadme');
    assert.ok(clickedTabs.includes('模组说明'), '含有 ReadMe 的单模组应跳转至模组说明');

    // 单模组导入 - 无 ReadMe -> 应切换到【模组管理】并高亮
    clickedTabs = [];
    const singleFileWithoutReadme = {
        files: [{ name: 'ModWithoutReadme.zip' }],
        value: 'ModWithoutReadme.zip'
    };
    await context.dolOptHandleAddMod(singleFileWithoutReadme);
    assert.ok(context._dolOptHighlightMods.has('ModWithoutReadme'), '无 ReadMe 的单模组应被高亮');
    assert.ok(clickedTabs.includes('模组管理'), '无 ReadMe 的单模组应切换至模组管理');

    // 批量模组导入 -> 不切走页面，全量高亮保留在模组管理界面
    clickedTabs = [];
    const batchFiles = {
        files: [
            { name: 'BatchA.zip' },
            { name: 'BatchB.zip' },
            { name: 'BatchC.zip' }
        ],
        value: 'batch'
    };
    await context.dolOptHandleAddMod(batchFiles);
    assert.ok(context._dolOptHighlightMods.has('BatchA'), 'BatchA 应在高亮集合中');
    assert.ok(context._dolOptHighlightMods.has('BatchB'), 'BatchB 应在高亮集合中');
    assert.ok(context._dolOptHighlightMods.has('BatchC'), 'BatchC 应在高亮集合中');
    assert.ok(!clickedTabs.includes('模组说明'), '批量导入绝对不能跳转到模组说明');
    assert.ok(toastMessages.at(-1).includes('已成功导入 3 个模组'), '批量导入提示信息正确');

    // 4. 样式与 Twee 文件校验
    const twee = fs.readFileSync(path.join(__dirname, 'twee', 'modloader', 'modloader.twee'), 'utf8');
    const script = fs.readFileSync(path.join(__dirname, 'javascript', 'modloader-optimization.js'), 'utf8');
    const css = fs.readFileSync(path.join(__dirname, 'stylesheet', 'modloader-optimization.css'), 'utf8');
    assert.ok(!twee.includes('<<button "美化管理">>'));
    assert.ok(!twee.includes('<<button "通用">>'), '通用选项卡已并入模组管理');
    assert.ok(twee.includes('<<button "模组管理">>'));
    assert.ok(twee.includes('<<button "模组市场">>'));
    assert.ok(twee.includes('<<button "模组说明">>'));
    assert.ok(twee.includes('class="tab dol-opt-modloader-tabs"'), '模组管理器必须标记自己的标签栏');
    assert.ok(twee.includes('setTimeout(function ()'), '必须等待标签栏挂载后再标记管理器标签');
    assert.ok(twee.includes('core.not(".customOverlayClose").length >= 4'), '识别完整四个标签后才能启用隔离');
    assert.ok(twee.includes('addClass("dol-opt-tabs-ready")'), '识别成功后必须启用标签隔离');
    assert.ok(css.includes('#overlayTabs.dol-opt-modloader-tabs.dol-opt-tabs-ready > button:not(.dol-opt-core-tab)'), '模组管理器必须仅在准备完成后隐藏其他模组后插入的标签按钮');
    assert.ok(script.includes('id="dolOptEnvInfo"'), '模组管理界面必须包含环境看板容器');
    assert.ok(script.includes('id="toggleSafeMode"'), '模组管理界面必须包含安全模式切换');
    assert.ok(script.indexOf('id="dolOptImportModBtn"') < script.indexOf('id="dolOptRestartGameBtn"'), '导入模组按钮必须排在重新载入游戏按钮左侧');
    assert.ok(script.includes('await window.dolOptHandleAddMod(input, { askRestart: true })'), '导入模组必须默认询问是否重启生效');
    assert.equal((script.match(/<details class="dol-opt-collapsible-section"/g) || []).length, 3);
    assert.ok(script.includes('智能整理模组与美化顺序'));
    assert.ok(script.includes('导入模组'));
    assert.ok(script.includes('dol-opt-drag-handle'));
    assert.ok(script.includes('dol-opt-item-highlight'));
    assert.ok(css.includes('dol-opt-drag-handle'));
    assert.ok(css.includes('dolOptHighlightPulse'));
    assert.equal(context.dolOptHasReadmeContent('<<没有ReadMe>>'), false, 'ModLoader 的无 ReadMe 占位符不得当作正文');
    assert.equal(context.dolOptHasReadmeContent('# 正常说明'), true);
    const renderedReadme = context.dolOptRenderMarkdown('![](https://raw.githubusercontent.com/example/mod/main/how-to.png)\n\n---');
    assert.ok(renderedReadme.includes('class="dol-opt-readme-image"'), 'ReadMe 图片语法必须渲染为图片');
    assert.ok(renderedReadme.includes('class="dol-opt-readme-rule"'), 'ReadMe 分隔线必须渲染为水平线');
    assert.ok(!context.dolOptRenderMarkdown('![](javascript:alert(1))').includes('<img'), 'ReadMe 图片只允许 HTTP(S) 地址');

    // Shields.io 离线矢量 SVG 生成验证
    const shieldsSvg = context.dolOptGenerateShieldsSvg('https://img.shields.io/badge/By-Vrelnir-purple', 'Author');
    assert.ok(shieldsSvg && shieldsSvg.startsWith('data:image/svg+xml;utf8,'), 'Shields 静态徽章必须本地生成 SVG Data URL');
    assert.ok(decodeURIComponent(shieldsSvg).includes('Vrelnir'), '生成的 SVG 必须包含徽章状态文本');
    assert.ok(decodeURIComponent(shieldsSvg).includes('#795298'), '生成的 SVG 必须映射标准紫色');

    // 复合图片超链接与无破碎字符验证
    const renderedBadge = context.dolOptRenderMarkdown('[![Author](https://img.shields.io/badge/By-Vrelnir-purple)](https://vrelnir.blogspot.com/)');
    assert.ok(renderedBadge.includes('class="dol-opt-readme-link dol-opt-readme-badge-link"'), '复合图片链接必须渲染为徽章链接');
    assert.ok(renderedBadge.includes('href="https://vrelnir.blogspot.com/"'), '必须保留外层跳转地址');
    assert.ok(!renderedBadge.includes(']('), '不得残留未解析的链接语法字符');
    assert.ok(!renderedBadge.startsWith('['), '不得残留未闭合的左方括号');

    // 连续多行徽章聚合为流式 row 容器
    const multiBadges = context.dolOptRenderMarkdown(
        '[![Author](https://img.shields.io/badge/By-Vrelnir-purple)](https://vrelnir.blogspot.com/)\n' +
        '[![Game](https://img.shields.io/badge/Game-DoL-purple)](https://gitgud.io/Vrelnir/degrees-of-lewdity)'
    );
    assert.ok(multiBadges.includes('class="dol-opt-readme-badge-row"'), '连续徽章行必须自动聚合为 badge-row 容器');

    // 普通超链接与 XSS 过滤验证
    const renderedLink = context.dolOptRenderMarkdown('[原版维基](https://degreesoflewdity.miraheze.org/)');
    assert.ok(renderedLink.includes('class="dol-opt-readme-link"'));
    assert.ok(renderedLink.includes('href="https://degreesoflewdity.miraheze.org/"'));
    assert.ok(!context.dolOptRenderMarkdown('[攻击](javascript:alert(1))').includes('href="javascript:'), '超链接必须严格防御 javascript 注入');

    // 模组包内置相对路径图片标记与回退 SVG 验证
    const localImg = context.dolOptRenderMarkdown('![预览图](./images/preview.png)');
    assert.ok(localImg.includes('data-local-mod-path="./images/preview.png"'), '相对路径必须标记为本地模组资源');
    const fallbackSvg = context.dolOptGenerateFallbackBadgeSvg('downloads', 'https://img.shields.io/github/downloads/MaplebirchLeaf/SCML-DOL-maplebirchFramework/total');
    assert.ok(fallbackSvg && fallbackSvg.startsWith('data:image/svg+xml;utf8,'), '动态徽章加载失败时必须可生成离线降级 SVG');

    assert.ok(script.includes('此模组没有说明文档。'), '无 ReadMe 时必须显示完整空状态说明');
    assert.ok(script.includes('访问模组仓库'), '说明文档必须允许展示市场仓库入口');
    assert.ok(script.includes('模组技术信息'), '有 ReadMe 且有依赖时必须在文末展示技术信息');
    assert.match(css, /#dolOptMarketStats\s*\{[\s\S]*?grid-template-columns:\s*repeat\(4,/);
    assert.match(css, /@media \(max-width: 640px\)[\s\S]*?#dolOptMarketStats\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,/);
    assert.doesNotMatch(css, /#dolOptMarketStats[^}]*repeat\(3,/);
    assert.ok(css.includes('dol-opt-header-actions'));
    assert.ok(!script.includes('\uD83E\uDE84'));
    assert.ok(twee.includes('class="dol-opt-log-search-row"'));
    assert.ok(twee.includes('class="dol-opt-log-actions-row"'));
    assert.ok(twee.includes('id="btnToggleLogFullscreen"'), '必须包含全屏展示切换按钮');
    assert.ok(twee.includes('window.dolOptCaptureLogScreenshot()'), '必须包含一键截图长图调用');
    assert.ok(twee.includes('class="dol-opt-log-filter-group"'), '必须包含日志级别筛选胶囊组');
    assert.ok(css.includes('dol-opt-overlay-fullscreen'), 'CSS 必须包含全屏管理弹窗规则');
    assert.ok(css.includes('filter-error-only'), 'CSS 必须包含仅错误日志筛选规则');
    assert.ok(css.includes('dol-opt-container-fullscreen'), 'CSS 必须包含父容器全屏同步扩展规则');

    assert.equal(typeof context.dolOptToggleLogFullscreen, 'function');
    assert.equal(typeof context.dolOptSetLogLevelFilter, 'function');
    assert.equal(typeof context.dolOptCaptureLogScreenshot, 'function');

    // 验证全屏切换与容器类名联动
    const fakeContainer = {
        classList: {
            _set: new Set(),
            contains(c) { return this._set.has(c); },
            toggle(c, force) {
                if (typeof force === 'boolean') {
                    if (force) this._set.add(c); else this._set.delete(c);
                    return force;
                }
                if (this._set.has(c)) { this._set.delete(c); return false; }
                this._set.add(c); return true;
            }
        }
    };
    const fakeOverlay = {
        classList: {
            _set: new Set(),
            contains(c) { return this._set.has(c); },
            toggle(c, force) {
                if (typeof force === 'boolean') {
                    if (force) this._set.add(c); else this._set.delete(c);
                    return force;
                }
                if (this._set.has(c)) { this._set.delete(c); return false; }
                this._set.add(c); return true;
            }
        },
        parentElement: fakeContainer,
        closest(sel) { return sel.includes('customOverlayContainer') ? fakeContainer : null; }
    };
    const fakeBtn = { textContent: '', title: '', classList: { toggle: () => {} } };
    const origGetElementById = context.document.getElementById;
    context.document.getElementById = id => {
        if (id === 'customOverlay') return fakeOverlay;
        if (id === 'btnToggleLogFullscreen') return fakeBtn;
        return origGetElementById ? origGetElementById.call(context.document, id) : null;
    };

    context.dolOptToggleLogFullscreen();
    assert.ok(fakeOverlay.classList.contains('dol-opt-overlay-fullscreen'), '开启全屏必须为 overlay 添加全屏类名');
    assert.ok(fakeContainer.classList.contains('dol-opt-container-fullscreen'), '开启全屏必须为父级遮罩容器添加全屏同步类名以阻断包含块裁切');
    assert.equal(fakeBtn.textContent, '还原窗口', '全屏开启后按钮文本必须变为还原窗口');

    context.dolOptToggleLogFullscreen(false);
    assert.ok(!fakeOverlay.classList.contains('dol-opt-overlay-fullscreen'), '退出全屏必须移除 overlay 全屏类名');
    assert.ok(!fakeContainer.classList.contains('dol-opt-container-fullscreen'), '退出全屏必须移除容器全屏类名');
    assert.equal(fakeBtn.textContent, '全屏展示', '全屏退出后按钮文本必须恢复为全屏展示');
    context.document.getElementById = origGetElementById;

    context.dolOptSetLogLevelFilter('error');
    assert.equal(context._dolOptCurrentLogLevelFilter, 'error', '设置仅错误筛选状态必须生效');
    context.dolOptSetLogLevelFilter('all');
    assert.equal(context._dolOptCurrentLogLevelFilter, 'all', '恢复全部筛选状态必须生效');

    const basePatch = fs.readFileSync(path.join(__dirname, 'twee', 'modloader', 'modloader-patch-base.twee'), 'utf8');
    assert.ok(basePatch.includes('T.currentOverlay = "modloader"'), '进入模组管理器时必须锁定独立 Overlay 状态');
    assert.ok(basePatch.includes('attr("data-overlay", "modloader")'), '进入模组管理器时必须同步写入 DOM Overlay 身份');
    assert.ok(basePatch.indexOf('T.currentOverlay = "modloader"') < basePatch.indexOf('<<replace #customOverlayTitle>>'), '必须先锁定 Overlay 状态再重建页签');

    // 测试模组智能副标题解析
    assert.equal(context.dolOptGetModSubtext('CustomMod', { bootJson: { nickName: { 'zh-CN': '中文自定义' } } }), '中文自定义');
    assert.equal(context.dolOptGetModSubtext('CustomMod2', { bootJson: { nickName: '单字符串别名' } }), '单字符串别名');
    assert.equal(context.dolOptGetModSubtext('ModI18N', { bootJson: {} }), '游戏中文汉化补丁');
    assert.equal(context.dolOptGetModSubtext('AutoClean', { bootJson: {} }), '自动清洁身体污垢');
    assert.equal(context.dolOptGetModSubtext('ModLoader', { bootJson: {} }, true), 'Mod 加载器核心引擎');
    assert.equal(context.dolOptGetModSubtext('UnknownCore', { bootJson: {} }, true), '系统核心');
    assert.equal(context.dolOptGetModSubtext('UnknownMod', { bootJson: {} }, false), '');
    assert.equal(
        context.dolOptResolveImportedModName(
            'Dol-Optimization-v1.1.0.zip',
            ['原版优化', 'WardrobeIncrementalExpansion']
        ),
        '原版优化',
        '同版本更新原版优化时必须从文件名与别名识别目标，不得误取列表末项'
    );
    assert.equal(
        context.dolOptResolveImportedModName('Unknown-Package.zip', ['原版优化', 'WardrobeIncrementalExpansion']),
        null,
        '无法确认目标时必须返回空值，不得猜测其他已安装模组'
    );
    assert.ok(!script.includes('afterEnabled[afterEnabled.length - 1]'), '导入识别不得回退到启用列表最后一项');

    // 同名模组只统计一次，且重复导入后优先读取最后加载的新版本档案
    assert.deepEqual([...context.dolOptUniqueModNames(['ModA', 'moda', 'ModB', 'ModB'])], ['ModA', 'ModB']);
    context.dolOptGetGui = () => ({
        gModUtils: {
            getMod: name => name === 'RepeatMod'
                ? { name: 'RepeatMod', bootJson: { version: '1.0.0' } }
                : null,
            getModLoader: () => ({
                getModCacheArray: () => [
                    { mod: { name: 'RepeatMod', bootJson: { version: '1.0.0' } } },
                    { mod: { name: 'RepeatMod', bootJson: { version: '2.0.0' } } }
                ]
            })
        }
    });
    assert.equal(context.dolOptGetModInfo('RepeatMod').bootJson.version, '2.0.0');

    const indexStore = {};
    const indexLoader = {
        customStore: indexStore,
        constructor: { calcModNameKey: name => `modDataIndexDBZip:${name}` }
    };
    let disabledReadKey = '';
    context.dolOptGetGui = () => ({
        listSideLoadHiddenModNameOnly: async () => ['SimLife'],
        checkModZipFileIndexDB: async data => data === 'sim-life-zip'
            ? { name: 'SimLife', nickName: '模拟人生', version: 'v0.8.1.6.2' }
            : null,
        gModUtils: {
            getMod: () => null,
            getModLoader: () => ({
                getModCacheArray: () => [],
                getIndexDBLoader: () => indexLoader
            }),
            getIdbKeyValRef: () => ({
                get: async (key, store) => {
                    disabledReadKey = key;
                    assert.equal(store, indexStore);
                    return 'sim-life-zip';
                }
            })
        }
    });
    assert.equal(await context.dolOptLoadDisabledModInfo(), 1, '应从 IndexedDB 读取已禁用模组档案');
    assert.equal(disabledReadKey, 'modDataIndexDBZip:SimLife');
    assert.equal(context.dolOptGetModInfo('SimLife').bootJson.version, 'v0.8.1.6.2');

    const statsEl = { innerHTML: '' };
    context.document.getElementById = id => id === 'dolOptEnvInfo' ? statsEl : null;
    context.dolOptGetGui = () => ({
        gModUtils: {
            version: '2.101.1',
            getModListNameNoAlias: () => ['CoreMod', 'RepeatMod', 'repeatmod']
        },
        listSideLoadModNameOnly: async () => ['RepeatMod', 'repeatmod'],
        listSideLoadHiddenModNameOnly: async () => ['OtherMod', 'othermod']
    });
    await context.dolOptUpdateGeneralInfo();
    assert.ok(statsEl.innerHTML.includes('<div class="dol-opt-stat-num gold">2</div>'), '已加载模组统计必须去重');
    assert.ok(statsEl.innerHTML.includes('<div class="dol-opt-stat-num green">1</div>'), '已启用模组统计必须去重');
    assert.ok(statsEl.innerHTML.includes('<div class="dol-opt-stat-num">1</div>'), '已禁用模组统计必须去重');

    // 验证渲染中完全不包含“| 旁加载”技术废话
    context.document.getElementById = id => id === 'dolOptModManageContainer' ? container : null;
    context.dolOptRenderModManageUI = originalRenderModManageUI;
    context.dolOptGetGui = () => ({ gModUtils: { getMod: name => ({ bootJson: {} }) } });
    context._dolOptModState = {
        sideEnabled: ['ModI18N'],
        sideDisabled: ['AutoClean'],
        builtInMods: ['ModLoader']
    };
    context._dolOptHighlightMods = new Set(['ModI18N']);
    context.dolOptRenderModManageUI();
    assert.ok(!container.innerHTML.includes('| 旁加载'), '模组列表中不应再包含“| 旁加载”');
    assert.ok(container.innerHTML.includes('游戏中文汉化补丁'), '应渲染出 ModI18N 的友好中文别名');
    assert.ok(container.innerHTML.includes('自动清洁身体污垢'), '应渲染出 AutoClean 的友好中文别名');
    assert.ok(container.innerHTML.includes('Mod 加载器核心引擎'), '核心组件应渲染出中文职能说明');
    assert.ok(container.innerHTML.includes('导入模组'), '页面应包含导入模组按钮');
    assert.ok(container.innerHTML.includes('dol-opt-drag-handle'), '应渲染出拖拽手柄');
    assert.ok(container.innerHTML.includes('dol-opt-item-highlight'), '高亮项应带有高亮样式');
    assert.ok(!container.innerHTML.includes('未参与加载'), '禁用模组不得再显示含义生硬的“未参与加载”');
    assert.ok(container.innerHTML.includes('已禁用'), '禁用模组必须在副标题显示“已禁用”');
    assert.ok(!container.innerHTML.includes('>[已启用]</span>'), '旁加载模组不得再显示冗余的左侧“已启用”标签');
    assert.ok(!container.innerHTML.includes('>[已禁用]</span>'), '旁加载模组不得再显示冗余的左侧“已禁用”标签');
    assert.ok(container.innerHTML.includes('dol-opt-sticky-toolbar'), '模组管理页面顶部应包含吸顶工具栏');
    assert.ok(container.innerHTML.includes('dolOptRestartGameBtn'), '吸顶工具栏中应包含重新载入游戏按钮');
    assert.ok(container.innerHTML.includes('智能整理将根据需要自动调整MOD的顺序'), '应包含自然流畅的模组管理提示语');
    assert.ok(css.includes('.dol-opt-sticky-toolbar'), '样式表中应包含吸顶工具栏样式');

    // 5. 校验 boot.json 版本号为 1.1.0
    const bootJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'boot.json'), 'utf8'));
    assert.equal(bootJson.version, '1.1.0', 'boot.json 版本号必须为 1.1.0');
    assert.ok(bootJson.scriptFileList.includes('javascript/dol-mod-market.js'), 'boot.json 必须注册 dol-mod-market.js');

    // 6. 验证 ModLoadController 持久化与模组禁用/删除修复
    context.dolOptSaveModManageState = originalSaveModManageState;
    let controllerSavedEnabled = null;
    let controllerSavedDisabled = null;
    const fakeController = {
        overwriteModIndexDBModList: async (list) => { controllerSavedEnabled = [...list]; },
        overwriteModIndexDBHiddenModList: async (list) => { controllerSavedDisabled = [...list]; }
    };
    // 模拟真实的 ModLoader 运行环境：gui 上没有 overwrite 方法，方法位于 modModLoadController
    context.dolOptGetGui = () => ({});
    context.modModLoadController = fakeController;

    await context.dolOptSaveIndexDBModList(['ModA', 'moda', 'ModB', 'ModB'], ['ModB', 'ModC', 'modc']);
    assert.deepEqual([...controllerSavedEnabled], ['ModA', 'ModB']);
    assert.deepEqual([...controllerSavedDisabled], ['ModC']);

    context._dolOptModState = {
        sideEnabled: ['ModA', 'ModB'],
        sideDisabled: ['ModC'],
        builtInMods: []
    };

    // 测试禁用 ModA：在同组排序机制下，ModA在原位变为禁用，不改变相对顺序
    await context.dolOptToggleSideMod('ModA', false);
    assert.deepEqual([...context._dolOptModState.sideEnabled], ['ModB']);
    assert.deepEqual([...context._dolOptModState.sideDisabled], ['ModA', 'ModC']);
    assert.deepEqual([...controllerSavedEnabled], ['ModB']);
    assert.deepEqual([...controllerSavedDisabled], ['ModA', 'ModC']);

    // 测试重新启用 ModA：ModA 必须在原位恢复启用，绝对不掉到队尾（仍保持 ModA 在 ModB 之前）
    await context.dolOptToggleSideMod('ModA', true);
    assert.deepEqual([...context._dolOptModState.sideEnabled], ['ModA', 'ModB']);
    assert.deepEqual([...context._dolOptModState.sideDisabled], ['ModC']);
    assert.deepEqual([...controllerSavedEnabled], ['ModA', 'ModB']);
    assert.deepEqual([...controllerSavedDisabled], ['ModC']);

    // 测试长按上移置顶（'top'）：将索引 1 的 ModB 直接置顶到第 0 位
    await context.dolOptMoveSideMod(1, 'top');
    assert.deepEqual([...context._dolOptModState.sideEnabled], ['ModB', 'ModA']);

    // 测试长按下移置底（'bottom'）：将索引 0 的 ModB 直接置底到末尾
    await context.dolOptMoveSideMod(0, 'bottom');
    assert.deepEqual([...context._dolOptModState.sideMods.map(m => m.name)], ['ModA', 'ModC', 'ModB']);

    // 测试删除 ModC
    confirmed = true;
    await context.dolOptDeleteSideMod('ModC');
    assert.deepEqual([...context._dolOptModState.sideDisabled], []);
    assert.deepEqual([...controllerSavedDisabled], []);

    // 7. 验证自动滚动相关代码存在性与语法正确性
    assert.ok(script.includes('stepAutoScroll'), '脚本中必须包含自动滚屏 stepAutoScroll');
    assert.ok(script.includes('edgeThreshold'), '脚本中必须包含边缘阈值 edgeThreshold');
    assert.ok(script.includes('dolOptGetController'), '脚本中必须包含 dolOptGetController');
    assert.ok(script.includes('dolOptSaveIndexDBModList'), '脚本中必须包含 dolOptSaveIndexDBModList');

    // 8. 验证游戏原生暗黑风格模态框 dolOptConfirm / dolOptAlert 与 dolOptOfferReload
    assert.ok(script.includes('dolOptConfirm'), '脚本中必须包含 dolOptConfirm');
    assert.ok(script.includes('dolOptAlert'), '脚本中必须包含 dolOptAlert');
    assert.ok(css.includes('dol-opt-modal-backdrop'), 'CSS 必须包含模态遮罩类 dol-opt-modal-backdrop');
    assert.ok(css.includes('dol-opt-modal-dialog'), 'CSS 必须包含模态对话框类 dol-opt-modal-dialog');
    assert.ok(css.includes('dol-opt-btn-danger'), 'CSS 必须包含危险确认按钮类 dol-opt-btn-danger');
    assert.ok(script.includes('selectOptions'), '原生暗黑对话框必须支持下拉选项');
    assert.ok(script.includes('requireSelection'), '必须支持未选择安装包时禁用确认按钮');
    assert.ok(css.includes('dol-opt-modal-select'), '线路选择框必须保持原生暗黑样式');
    assert.ok(css.includes('.dol-opt-install-dialog'), '安装清单弹窗必须有独立的宽版样式');

    context.dolOptOfferReload = originalOfferReload;
    reloads = 0;
    confirmed = false;
    await context.dolOptOfferReload('测试取消重载');
    assert.equal(reloads, 0, '取消时不应触发 reload');

    confirmed = true;
    await context.dolOptOfferReload('测试确认重载');
    assert.equal(reloads, 1, '确定时应触发 reload');

    // 9. 测试美化自动启用已启用旁加载模组的美化 (dolOptLoadBeautyState & dolOptToggleBeauty)
    context.localStorage = {
        _data: {},
        getItem(k) { return this._data[k] ?? null; },
        setItem(k, v) { this._data[k] = String(v); }
    };
    context.addonBeautySelectorAddon = {
        typeOrderUsed: [],
        getTypeOrder() {
            return [
                { type: 'SideModBeauty', modRef: { name: 'ModB' } },
                { type: 'OtherBeauty', modRef: { name: 'DisabledMod' } }
            ];
        },
        async saveOrder(order) {
            this.typeOrderUsed = order.map(t => ({ type: t }));
            return true;
        }
    };
    // 当前已启用旁加载模组包含 ModB
    context._dolOptModState.sideEnabled = ['ModB'];
    context._dolOptBeautyState = null;

    // 默认开启自动美化
    assert.equal(context.dolOptIsAutoBeautyEnabled(), true);
    await context.dolOptLoadBeautyState();
    assert.ok(context._dolOptBeautyState.enabledList.some(item => item.type === 'SideModBeauty'), 'ModB的美化必须自动移至已启用列表');
    assert.ok(context._dolOptBeautyState.disabledList.some(item => item.type === 'OtherBeauty'), '未启用模组的美化保留在已停用列表');

    // 尝试禁用受保护的美化项应被拦截
    const beautyBeforeLen = context._dolOptBeautyState.enabledList.length;
    await context.dolOptToggleBeauty('SideModBeauty', false);
    assert.equal(context._dolOptBeautyState.enabledList.length, beautyBeforeLen, '自动启用的美化项不可手动禁用');

    // 10. 测试通用页面快捷添加模组直接加载与询问重启 (dolOptHandleAddMod)
    let reloadsBefore = reloads;
    const fakeAddonInput = {
        files: [{ name: 'TestFastAddMod.zip' }],
        value: ''
    };
    let addedFiles = null;
    fakeGui.loadAndAddMod = async (input) => { addedFiles = input.files; };
    fakeGui.listSideLoadModNameOnly = async () => ['ModB', 'TestFastAddMod'];
    context.dolOptGetGui = () => fakeGui;

    // 10.1 兼容 autoRestart: true 直接重启
    await context.dolOptHandleAddMod(fakeAddonInput, { autoRestart: true });
    assert.ok(addedFiles !== null, '必须调用 loadAndAddMod');
    assert.equal(reloads, reloadsBefore + 1, '快捷添加模组 autoRestart 必须触发游戏重启');

    // 10.2 测试 askRestart: true 且用户确认重启
    confirmed = true;
    reloadsBefore = reloads;
    await context.dolOptHandleAddMod(fakeAddonInput, { askRestart: true });
    assert.equal(reloads, reloadsBefore + 1, '用户确认立即重载时必须触发游戏重启');

    // 10.3 测试 askRestart: true 但用户选择稍后重载
    confirmed = false;
    reloadsBefore = reloads;
    await context.dolOptHandleAddMod(fakeAddonInput, { askRestart: true });
    assert.equal(reloads, reloadsBefore, '用户选择稍后重载时不应触发游戏重启');

    // 11. 测试日志分析诊断引擎 (dolOptAnalyzeLogs)
    const sampleLog = `
2026-09-17 14:00:01 [[logInfo]] ModLoader ========= version: [2.101.1]
2026-09-17 14:00:02 [[logWarning]] ModLoadController Warning: mod [LegacyMod] has deprecated fields in file legacy.twee
2026-09-17 14:00:03 [[logError]] ModLoadController PatchModToGame mod [ModB] failed: ReplacePatcher failed cannot find target in file script.js
2026-09-17 14:00:04 [[logError]] Error: cannot find mod [SimpleFramework] dependency not satisfied
    `;
    const analysis = context.dolOptAnalyzeLogs(sampleLog);
    assert.equal(analysis.errorCount, 2, '应识别出 2 处错误');
    assert.equal(analysis.warnCount, 1, '应识别出 1 处警告');
    assert.ok(analysis.errorMods.includes('ModB') || analysis.errorMods.includes('SimpleFramework'), '应准确识别出报错模组名');
    assert.ok(analysis.errorFiles.includes('script.js'), '应准确识别出报错文件名');
    assert.ok(analysis.matchedIssues.some(i => i.id === 'patch-conflict'), '应匹配到补丁冲突排查知识库');
    assert.ok(analysis.matchedIssues.some(i => i.id === 'missing-dep'), '应匹配到前置依赖缺失知识库');
    const versionAnalysis = context.dolOptAnalyzeLogs(`
00:19:08 [[logError]] DependenceChecker.checkGameVersion() not satisfies: mod[maplebirch] need gameVersion[&gt;=0.5.12.11] but gameVersion is [0.5.11.9].
00:19:09 [[logError]] DependenceChecker.check() not satisfies ModLoader: mod[NewApiMod] need mod[ModLoader] version[^2.2.0] but find ModLoader[2.101.1].
00:19:10 [[logError]] DependenceChecker.check() not satisfies: mod[FeatureMod] need mod[CoreMod] version[^3.0.0] but find version[2.4.0].
00:19:11 [[logError]] DependenceChecker.check() not satisfies order: mod[FeatureMod] need mod[CoreMod] load before it.
    `);
    assert.ok(versionAnalysis.lines[0].message.includes('>=0.5.12.11'), '日志中的 HTML 版本比较符必须还原为可读文本');
    const gameVersionIssue = versionAnalysis.matchedIssues.find(issue => issue.id === 'game-version-mismatch');
    assert.ok(gameVersionIssue?.desc.includes('maplebirch') && gameVersionIssue.desc.includes('0.5.11.9'));
    assert.ok(gameVersionIssue?.solution.includes('>=0.5.12.11'), '游戏版本错误必须给出精确兼容版本处理建议');
    assert.ok(versionAnalysis.matchedIssues.some(issue => issue.id === 'modloader-version-mismatch'));
    assert.ok(versionAnalysis.matchedIssues.some(issue => issue.id === 'dependency-version-mismatch'));
    assert.ok(versionAnalysis.matchedIssues.some(issue => issue.id === 'dependency-order'));

    // 12. 测试启动时加载错误检测与自动弹窗定位 (dolOptCheckAndAutoOpenErrorLog)
    let tabSwitched = '';
    context.dolOptSwitchTab = tab => { tabSwitched = tab; return true; };
    context._dolOptErrorDialogShown = false;
    fakeGui.gLoadingProgress = {
        getLoadLogHtml() { return sampleLog; }
    };
    context.dolOptCheckAndAutoOpenErrorLog();
    assert.ok(context._dolOptErrorDialogShown, '检测到错误且开启配置时必须标记已弹窗');

    // 13. 测试同排序组统一管理、就地启闭与长按置顶置底完整流程
    context._dolOptModState = {
        sideMods: [
            { name: 'Alpha', enabled: true },
            { name: 'Beta', enabled: false },
            { name: 'Gamma', enabled: true }
        ]
    };
    context.dolOptEnsureModStateSync(context._dolOptModState);

    // 13.1 验证长按上移直接置顶：将 Beta (索引 1) 置顶到索引 0
    await context.dolOptMoveSideMod(1, 'top');
    assert.equal(context._dolOptModState.sideMods[0].name, 'Beta', 'Beta 应直接被置顶');
    assert.equal(context._dolOptModState.sideMods[0].enabled, false, '置顶后原禁用状态必须保持');
    assert.deepEqual([...context._dolOptModState.sideMods.map(m => m.name)], ['Beta', 'Alpha', 'Gamma']);

    // 13.2 验证长按下移直接置底：将 Beta (索引 0) 置底到末尾
    await context.dolOptMoveSideMod(0, 'bottom');
    assert.equal(context._dolOptModState.sideMods[2].name, 'Beta', 'Beta 应直接被置底');
    assert.deepEqual([...context._dolOptModState.sideMods.map(m => m.name)], ['Alpha', 'Gamma', 'Beta']);

    // 13.3 验证就地启用：启用末尾的 Beta，位置依然在末尾，不发生意外重排
    await context.dolOptToggleSideMod('Beta', true);
    assert.equal(context._dolOptModState.sideMods[2].name, 'Beta');
    assert.equal(context._dolOptModState.sideMods[2].enabled, true);

    // 13.4 验证就地禁用：禁用中间的 Gamma，位置依然在中间（索引 1），绝不掉到队尾
    await context.dolOptToggleSideMod('Gamma', false);
    assert.equal(context._dolOptModState.sideMods[1].name, 'Gamma', 'Gamma 就地禁用后位置不变');
    assert.equal(context._dolOptModState.sideMods[1].enabled, false);
    assert.deepEqual([...context._dolOptModState.sideMods.map(m => m.name)], ['Alpha', 'Gamma', 'Beta']);

    // 13.5 重复状态必须在统一同步入口去重，避免安装数量累加
    context._dolOptModState = {
        sideMods: [
            { name: 'RepeatMod', enabled: true },
            { name: 'repeatmod', enabled: true },
            { name: 'OtherMod', enabled: false }
        ]
    };
    context.dolOptEnsureModStateSync(context._dolOptModState);
    assert.deepEqual([...context._dolOptModState.sideMods.map(m => m.name)], ['RepeatMod', 'OtherMod']);

    // =========================================================================
    // 14. 模组市场 (Dol Mod Market) 核心服务单元测试
    // =========================================================================
    const storageStore = new Map();
    context.localStorage = {
        getItem: k => storageStore.get(k) || null,
        setItem: (k, v) => storageStore.set(k, String(v)),
        removeItem: k => storageStore.delete(k)
    };
    context.document.createElement = tag => ({ tagName: tag, type: '', files: [] });
    context.Blob = Blob;
    context.URL = URL;
    context.URLSearchParams = URLSearchParams;
    context.Node = {
        DOCUMENT_POSITION_FOLLOWING: 4,
        DOCUMENT_POSITION_PRECEDING: 2
    };

    // 在 context 中执行 dol-mod-market.js
    const marketScript = fs.readFileSync(path.join(__dirname, 'javascript', 'dol-mod-market.js'), 'utf8');
    vm.runInNewContext(marketScript, context);
    assert.ok(context.dolModMarket, '必须成功挂载 window.dolModMarket 全局接口');

    const {
        deriveClassification,
        deriveTags,
        compareVersions,
        satisfiesVersion,
        buildDependencyPlan,
        getAcceleratedUrl,
        getDownloadUrl,
        readDownloadResponse,
        verifyAssetDigest,
        checkModInstallStatus,
        findMarketModByLocalName,
        cancelDownload,
        getLocalInstalledProfiles,
        fetchModRelease,
        fetchRecentCompanionAssets,
        fetchGithubReadme,
        getReadmeImageProxyUrl,
        buildReleaseAssetPlan,
        formatReleaseInstallPlan,
        promptDownloadMirrorAndInstall,
        downloadAndInstallMod,
        loadMarketData,
        RELEASE_INDEX_URL,
        IDENTITY_CATALOG_URL,
        normalizeReleaseIndex,
        applyIdentityCatalog,
        loadIdentityCatalog,
        shouldShowCategoryFilters,
        MIRROR_SERVERS
    } = context.dolModMarket;

    const readmeProxyUrl = getReadmeImageProxyUrl(
        'https://github.com/Owner/Repo',
        'https://raw.githubusercontent.com/Owner/Repo/main/images/demo.png'
    );
    assert.ok(readmeProxyUrl.includes('/readme-image?'), 'GitHub 原图必须改走同源 Worker 代理');
    assert.equal(new URL(readmeProxyUrl).searchParams.get('repo'), 'owner/repo');
    assert.ok(getReadmeImageProxyUrl(
        'https://github.com/Owner/Repo',
        'https://github.com/user-attachments/assets/10f70309-7e74-41ef-9dd7-c106b00b494c'
    ).includes('/readme-image?'), 'GitHub README 附件图片也必须改走 Worker 代理');
    const savedReadmeFetch = context.fetch;
    context.fetch = async url => {
        const requestUrl = new URL(url);
        assert.equal(requestUrl.pathname, '/readme');
        assert.equal(requestUrl.searchParams.get('repo'), 'owner/repo');
        return {
            ok: true,
            status: 200,
            json: async () => ({ markdown: '# 远程说明', sourceUrl: 'https://github.com/Owner/Repo/blob/main/README.md' })
        };
    };
    assert.equal((await fetchGithubReadme('https://github.com/Owner/Repo')).markdown, '# 远程说明');
    context.fetch = savedReadmeFetch;

    const proxiedRemoteImage = context.dolOptRenderMarkdown('![截图](images/demo.png)', {
        repositoryUrl: 'https://github.com/Owner/Repo',
        remoteImageBaseUrl: 'https://raw.githubusercontent.com/Owner/Repo/main/README.md',
        remoteLinkBaseUrl: 'https://github.com/Owner/Repo/blob/main/README.md',
        escapeRawHtml: true
    });
    assert.ok(proxiedRemoteImage.includes('data-remote-image-url='), '远程 README 图片必须标记为代理加载');
    assert.doesNotMatch(proxiedRemoteImage, /\ssrc="https:\/\/raw\.githubusercontent\.com/i, '图片 src 不得直接触发 CSP 禁止的 GitHub 域名');
    assert.ok(context.dolOptRenderMarkdown('<script>alert(1)</script>', { escapeRawHtml: true }).includes('&lt;script&gt;'), '远程 README 原始 HTML 必须转义');

    const remoteImg = {
        alt: '截图',
        src: 'data:image/gif;base64,placeholder',
        dataset: { originalSrc: 'https://raw.githubusercontent.com/Owner/Repo/main/images/demo.png' },
        classList: { contains: () => false, add: () => {} },
        getAttribute: name => name === 'data-remote-image-url' ? readmeProxyUrl : null,
        removeAttribute: name => { remoteImg.removedAttribute = name; }
    };
    const savedFileReader = context.FileReader;
    context.fetch = async () => ({ ok: true, blob: async () => new Blob(['image'], { type: 'image/png' }) });
    context.FileReader = class {
        readAsDataURL() {
            this.result = 'data:image/png;base64,aW1hZ2U=';
            this.onload();
        }
    };
    await context.dolOptSetupReadmeImages({
        querySelectorAll: selector => selector === 'img[data-remote-image-url]' ? [remoteImg] : [],
        addEventListener: () => {}
    }, 'RemoteReadme');
    assert.equal(remoteImg.src, 'data:image/png;base64,aW1hZ2U=', 'Worker 图片响应必须转成 CSP 允许的 data URL');
    assert.equal(remoteImg.removedAttribute, 'data-remote-image-url');
    context.fetch = savedReadmeFetch;
    context.FileReader = savedFileReader;

    const readmeMarketMod = findMarketModByLocalName('maplebirch', [{
        name: '秋枫白桦框架',
        author: '枫桦叶',
        description: '提供模组开发接口',
        githubUrl: 'https://github.com/MaplebirchLeaf/SCML-DOL-maplebirchframework'
    }]);
    assert.equal(readmeMarketMod?.name, '秋枫白桦框架', 'ReadMe 空状态必须复用市场别名匹配结果');
    assert.ok(marketScript.includes('class="macro-button dol-opt-market-update-all"'), '一键全更必须独立为整行按钮');

    context.dolOptGetGui = () => ({
        gModUtils: {
            getModListNameNoAlias: () => ['RepeatMod', 'RepeatMod'],
            getMod: name => name === 'RepeatMod'
                ? { name: 'RepeatMod', bootJson: { version: '1.0.0' } }
                : null,
            getModLoader: () => ({
                getModCacheArray: () => [
                    { mod: { name: 'RepeatMod', bootJson: { version: '1.0.0' } } },
                    { mod: { name: 'RepeatMod', bootJson: { version: '2.0.0' } } }
                ]
            })
        }
    });
    const repeatProfiles = getLocalInstalledProfiles().filter(profile => profile.name === 'RepeatMod');
    assert.equal(repeatProfiles.length, 1);
    assert.equal(repeatProfiles[0].version, '2.0.0');

    const repeatGui = context.dolOptGetGui;
    const renamedLocalMod = {
        name: 'TechnicalLocalName',
        bootJson: {
            version: '1.0.0',
            nickName: { cn: '本地展示名' },
            repository: 'https://github.com/example/canonical-mod'
        }
    };
    context.dolOptGetGui = () => ({
        gModUtils: {
            getModList: () => [renamedLocalMod],
            getModListNameNoAlias: () => ['TechnicalLocalName'],
            getMod: () => renamedLocalMod
        }
    });
    const renamedMarketMod = findMarketModByLocalName('TechnicalLocalName', [{
        name: '市场展示名',
        githubUrl: 'https://github.com/example/canonical-mod',
        repositoryKeys: ['example/canonical-mod']
    }]);
    assert.equal(renamedMarketMod?.name, '市场展示名', 'ReadMe 仓库跳转必须使用本地 boot.json 的完整身份信息匹配市场条目');
    assert.equal(findMarketModByLocalName('TechnicalLocalName', [{
        name: 'TechnicalLocalNameExtra',
        githubUrl: 'https://github.com/example/unrelated-mod'
    }]), null, 'ReadMe 作者等资料不得使用名称包含关系做模糊匹配');
    context.dolOptGetGui = repeatGui;

    context._dolOptDisabledModInfo.set('simlife', {
        name: 'SimLife',
        bootJson: { name: 'SimLife', nickName: '模拟人生', version: 'v0.8.1.6.2' }
    });
    context._dolOptModState = {
        sideMods: [{ name: 'SimLife', enabled: false }],
        sideEnabled: [],
        sideDisabled: ['SimLife'],
        builtInMods: []
    };
    const disabledProfiles = getLocalInstalledProfiles();
    const disabledSimLife = disabledProfiles.find(profile => profile.name === 'SimLife');
    assert.equal(disabledSimLife.version, 'v0.8.1.6.2', '已禁用模组仍应保留本地版本');
    assert.equal(
        checkModInstallStatus({ name: 'SimLife', version: 'v0.8.1.7' }, disabledProfiles),
        'update_available',
        '已禁用模组仍应参与市场更新检测'
    );

    // 14.1 测试主分类、内容标签与保守回退
    assert.equal(deriveClassification('TweeReplacer', '前置补丁与框架').category, '框架与前置');
    assert.equal(deriveClassification('高画质立绘美化包', '替换NPC立绘').category, '外观与资源');
    assert.ok(deriveTags('现代发型与服装扩展', '增加50套日常衣服').includes('服装'));
    assert.equal(deriveClassification('无限金钱修改', '作弊与快捷按键').category, '规则与数值');
    assert.equal(deriveClassification('新城镇互动事件', '新增玩法与新地点剧情').category, '剧情与角色');
    assert.equal(deriveClassification('神秘模组', '普通文本描述').category, '待分类');
    assert.equal(
        deriveClassification('露出拓展', '拓展露出剧情，并加入随处脱衣、勇气系统、任务系统、服装道具拓展等其他玩法').category,
        '玩法与内容',
        '分类应综合标题与描述打分，不能被描述中先匹配到的服装关键词抢走'
    );
    assert.equal(shouldShowCategoryFilters('all'), true);
    assert.equal(shouldShowCategoryFilters('installable'), true);
    assert.equal(shouldShowCategoryFilters('installed'), false);
    assert.equal(shouldShowCategoryFilters('updatable'), false);
    assert.equal(deriveClassification('原版优化', '支持在医院实施处女膜修复手术').category, '界面与便利');
    assert.equal(deriveClassification('頭部遮罩相容', '修正新版显示异常').category, '修复与兼容');
    assert.equal(
        deriveClassification('日落伊甸园', '新增地图与剧情，依赖简易框架').category,
        '剧情与角色',
        '依赖某框架的内容模组不得被误标为框架'
    );
    const explicitClassification = deriveClassification('自定义模组', '普通文本', '玩法与内容', ['自定义标签']);
    assert.equal(explicitClassification.category, '玩法与内容', '身份表中的权威主分类必须覆盖关键词回退');
    assert.deepEqual([...explicitClassification.tags], ['自定义标签'], '身份表中的权威标签必须覆盖关键词回退');

    // 14.2 测试语义化版本号对比 (compareVersions)
    assert.equal(compareVersions('1.2.0', '1.1.9'), 1, '1.2.0 应大于 1.1.9');
    assert.equal(compareVersions('v1.0.0', '1.0.0'), 0, '带前缀 v 应判定相等');
    assert.equal(compareVersions('0.9.5', '1.0.0'), -1, '0.9.5 应小于 1.0.0');
    assert.equal(compareVersions('1.0.9.3', '1.0.9.2'), 1, '四位版本号第4位递增');
    assert.equal(compareVersions('vmaplebirch-release-v4.3.5', 'v4.2.1'), 1, '仓库名称前缀不得吞掉实际版本号');
    assert.equal(satisfiesVersion('1.8.0', '^1.2.0'), true, '同主版本且高于下限应满足 ^ 范围');
    assert.equal(satisfiesVersion('2.0.0', '^1.2.0'), false, '跨主版本不得满足 ^ 范围');
    assert.equal(satisfiesVersion('1.4.9', '~1.4.0'), true, '同次版本应满足 ~ 范围');

    const dependencyMods = [
        { id: 'feature', name: 'Feature', githubUrl: 'https://github.com/example/feature', dependencies: [{ id: 'core', version: '^2.0.0' }] },
        { id: 'core', name: 'Core', version: '2.1.0', githubUrl: 'https://github.com/example/core', dependencies: [{ id: 'base' }] },
        { id: 'base', name: 'Base', version: '1.0.0', githubUrl: 'https://github.com/example/base' }
    ];
    const dependencyPlan = buildDependencyPlan(
        dependencyMods[0],
        dependencyMods,
        [{ name: 'Core', version: '1.5.0' }, { name: 'Base', version: '1.0.0' }],
        new Set(['Base'])
    );
    assert.deepEqual([...dependencyPlan.actions.map(action => `${action.type}:${action.mod.name}`)], ['enable:Base', 'update:Core']);
    assert.equal(dependencyPlan.unavailable.length, 0);
    assert.equal(buildDependencyPlan(
        { id: 'broken', name: 'Broken', dependencies: [{ id: 'missing' }] },
        dependencyMods,
        []
    ).unavailable[0].dependency.id, 'missing', '目录中不存在的依赖必须阻止自动安装');
    const maplebirchPlan = buildDependencyPlan(
        { id: 'no-bus-harassment', name: '公交车防骚扰', dependencies: [{ id: 'maplebirch' }] },
        [{ id: 'maplebirch', name: '秋枫白桦框架', version: '2.0.0', githubUrl: 'https://github.com/MaplebirchLeaf/SCML-DOL-maplebirchframework' }],
        []
    );
    assert.deepEqual(
        [...maplebirchPlan.actions.map(action => `${action.type}:${action.mod.id}`)],
        ['install:maplebirch'],
        '未安装秋枫白桦框架时必须生成前置下载动作'
    );
    const inferredDependencyPlan = buildDependencyPlan(
        { id: 'eden-visuals', name: '伊甸互动头像', description: '伊甸相关剧情添加立绘或 cg（依赖简易框架）' },
        [{ id: 'simple-framework', name: '简易框架', version: '2.0.5', githubUrl: 'https://github.com/emicoto/SCMLSimpleFramework' }],
        [{ name: '简易框架', version: '2.0.5' }]
    );
    assert.equal(inferredDependencyPlan.requirements[0].mod.id, 'simple-framework', 'Wiki 描述中明确写出的常见前置必须进入安装计划');
    assert.equal(inferredDependencyPlan.actions.length, 0, '已满足的前置不应重复安装');
    assert.ok(marketScript.includes("states.join('并') || '已满足'"), '安装确认框必须列出已满足的前置状态');

    // 14.3 测试下载线路 URL 生成 (getAcceleratedUrl)
    const testUrl = 'https://github.com/user/repo/releases/download/v1.0/mod.zip';
    assert.deepEqual([...MIRROR_SERVERS.map(mirror => mirror.id)], ['jasonzeng', 'ddlc', 'worker', 'github']);
    assert.deepEqual(
        [...MIRROR_SERVERS.map(mirror => mirror.name)],
        ['加速通道 1（JasonZeng）', '加速通道 2（DDLC）', '加速通道 3（Cloudflare）', 'GitHub 直连（浏览器）']
    );
    assert.deepEqual(
        [...MIRROR_SERVERS.map(mirror => mirror.shortName)],
        ['JasonZeng', 'DDLC', 'Cloudflare', 'GitHub'],
        '顶部下载线路卡必须为四条线路提供对应的短名称'
    );
    assert.ok(marketScript.includes("let currentMirrorId = 'jasonzeng'"), '默认下载线路必须为 JasonZeng');
    assert.ok(marketScript.includes('${selectedMirror.shortName}'), '顶部下载线路卡必须读取当前选中的线路，禁止写死为直连');
    assert.equal(
        getDownloadUrl(testUrl),
        `https://gh.jasonzeng.dev/${testUrl}`,
        '未指定线路时必须默认通过 JasonZeng 镜像下载'
    );
    assert.equal(
        getDownloadUrl(testUrl, 'worker'),
        `https://dol.alseece.top/download?url=${encodeURIComponent(testUrl)}`,
        '自建 Worker 必须继续作为默认一键安装线路'
    );
    assert.equal(
        getDownloadUrl(testUrl, 'ddlc'),
        `https://gh.ddlc.top/${testUrl}`,
        'DDLC 必须保留为第二加速线路'
    );
    assert.equal(
        getDownloadUrl(testUrl, 'jasonzeng'),
        `https://gh.jasonzeng.dev/${testUrl}`,
        '默认安装包必须通过 JasonZeng 镜像下载'
    );
    assert.equal(getDownloadUrl(testUrl, 'github'), testUrl, 'GitHub 直连必须保留官方原始地址');
    assert.equal(MIRROR_SERVERS.find(mirror => mirror.id === 'github').browserOnly, true, 'GitHub 直连必须明确使用浏览器下载');
    const progressValues = [];
    const chunks = [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])];
    const streamedBlob = await readDownloadResponse({
        headers: { get: name => name === 'Content-Length' ? '6' : 'application/zip' },
        body: { getReader: () => ({ read: async () => chunks.length ? { value: chunks.shift(), done: false } : { done: true } }) }
    }, value => progressValues.push(Math.round(value)));
    assert.equal(streamedBlob.size, 6);
    assert.deepEqual(progressValues, [50, 100], '下载流必须持续报告真实进度');
    const denseProgressValues = [];
    const denseChunks = Array.from({ length: 1000 }, () => new Uint8Array([1]));
    await readDownloadResponse({
        headers: { get: name => name === 'Content-Length' ? '1000' : 'application/zip' },
        body: { getReader: () => ({ read: async () => denseChunks.length ? { value: denseChunks.shift(), done: false } : { done: true } }) }
    }, value => denseProgressValues.push(value));
    assert.ok(denseProgressValues.length <= 101, '高频下载分块必须合并为最多每个整数百分比一次，避免进度 DOM 刷新拖慢鼠标');
    assert.equal(new Set(denseProgressValues).size, denseProgressValues.length, '下载进度不得重复报告同一整数百分比');
    const unknownProgressValues = [];
    const unknownChunks = Array.from({ length: 100 }, () => new Uint8Array([1]));
    await readDownloadResponse({
        headers: { get: () => null },
        body: { getReader: () => ({ read: async () => unknownChunks.length ? { value: unknownChunks.shift(), done: false } : { done: true } }) }
    }, value => unknownProgressValues.push(value));
    assert.deepEqual(unknownProgressValues, [null], '未知总大小的下载流只能报告一次等待态，禁止每个分块重复刷新 DOM');
    const digestBlob = new Blob(['zip-data']);
    const digestHex = Buffer.from(await webcrypto.subtle.digest('SHA-256', await digestBlob.arrayBuffer())).toString('hex');
    assert.equal(await verifyAssetDigest(digestBlob, `sha256:${digestHex}`), true);
    await assert.rejects(
        verifyAssetDigest(digestBlob, `sha256:${'0'.repeat(64)}`),
        error => error.code === 'DIGEST_MISMATCH',
        '镜像安装包与 GitHub 官方摘要不一致时必须阻止安装'
    );
    let oversizedReaderCanceled = false;
    const oversizedChunks = [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])];
    await assert.rejects(
        readDownloadResponse({
            headers: { get: () => null },
            body: { getReader: () => ({
                read: async () => oversizedChunks.length ? { value: oversizedChunks.shift(), done: false } : { done: true },
                cancel: async () => { oversizedReaderCanceled = true; }
            }) }
        }, () => {}, 5),
        error => error.code === 'FILE_TOO_LARGE'
    );
    assert.equal(oversizedReaderCanceled, true, '超限下载必须立即取消读取');
    assert.equal(checkModInstallStatus(
        { name: 'D.O.L.I', version: '9.9.9', githubUrl: 'https://github.com/attacker/Degrees-of-Lewdity-Intelligence' },
        [{ name: 'DOLI', version: '0.2.2' }]
    ), 'not_installed', '离线身份兜底也必须拒绝同仓库尾名的跨所有者冒充');

    // 14.3.1 Cloudflare 身份字典必须能动态补充本地技术名映射
    assert.equal(RELEASE_INDEX_URL, 'https://dol.alseece.top/release-index.json');
    assert.equal(IDENTITY_CATALOG_URL, 'https://dolmod-catalog-pages.pages.dev/mod-identities.json');
    assert.equal(applyIdentityCatalog({
        schemaVersion: 1,
        mods: [{
            name: '远程映射测试模组',
            bootNames: ['RemoteCatalogBoot'],
            aliases: ['远程测试'],
            repositories: ['RemoteCatalogRepo'],
            repositoryKeys: ['example/RemoteCatalogRepo'],
            category: '剧情与角色',
            tags: ['剧情']
        }]
    }), 1);
    assert.equal(deriveClassification('远程映射测试模组', '普通文本').category, '剧情与角色');
    assert.deepEqual([...deriveClassification('远程映射测试模组', '普通文本').tags], ['剧情']);
    applyIdentityCatalog({
        schemaVersion: 1,
        mods: [{ name: '远程映射测试模组', category: '待分类', tags: [] }]
    });
    assert.equal(
        deriveClassification('远程映射测试模组', '普通文本', '待分类').category,
        '剧情与角色',
        '旧索引中的待分类不得覆盖身份表中的明确分类'
    );
    assert.equal(checkModInstallStatus(
        { name: '远程映射测试模组', version: '1.2.3', githubUrl: 'https://github.com/example/RemoteCatalogRepo', repositoryKeys: ['example/RemoteCatalogRepo'] },
        [{ name: 'RemoteCatalogBoot', version: '1.2.3' }]
    ), 'up_to_date', 'Cloudflare 身份字典必须让新增技术名无需发版即可被识别');
    assert.equal(checkModInstallStatus(
        { name: '远程映射测试模组', version: '9.9.9', githubUrl: 'https://github.com/attacker/RemoteCatalogRepo' },
        [{ name: 'RemoteCatalogBoot', version: '1.2.3' }]
    ), 'not_installed', '同名仓库尾名但不同所有者不得冒充已安装模组');
    assert.equal(checkModInstallStatus(
        { name: '远程映射测试模组', version: '2.0.0', githubUrl: 'https://github.com/example/RemoteCatalogRepo' },
        [{
            name: 'RemoteCatalogBoot', version: '1.2.3', displayNames: ['RemoteCatalogBoot', '远程映射测试模组'],
            normalizedNames: ['remotecatalogboot', '远程映射测试模组'], repos: ['remotecatalogrepo'],
            repositoryKeys: ['attacker/remotecatalogrepo']
        }]
    ), 'not_installed', '本地仓库所有者冲突时不得仅凭同名或仓库尾名判定可更新');

    const indexedMods = normalizeReleaseIndex({
        schemaVersion: 1,
        identities: [{
            id: 'indexed-test',
            name: '统一索引测试模组',
            bootNames: ['IndexedBoot'],
            repositories: ['IndexedRepo'],
            repositoryKeys: ['example/IndexedRepo'],
            category: '界面与便利',
            tags: ['任务']
        }],
        mods: [{
            identityId: 'indexed-test',
            name: '统一索引测试模组',
            wikiName: 'Wiki 测试模组',
            aliases: [],
            repositories: ['IndexedRepo'],
            repositoryKeys: ['example/IndexedRepo'],
            version: '2.0.0',
            updateDate: '2026-09-20',
            githubUrl: 'https://github.com/example/IndexedRepo',
            description: '功能扩展',
            author: '测试作者',
            category: '界面与便利',
            tags: ['任务'],
            dependencies: [{ id: 'core', version: '^1.0.0' }, { id: '' }]
        }]
    });
    assert.equal(indexedMods[0].version, '2.0.0');
    assert.deepEqual([...indexedMods[0].githubUrls], ['https://github.com/example/IndexedRepo']);
    assert.equal(indexedMods[0].category, '界面与便利');
    assert.deepEqual([...indexedMods[0].tags], ['任务']);
    assert.deepEqual([...indexedMods[0].dependencies.map(item => `${item.id}:${item.version}`)], ['core:^1.0.0']);
    assert.equal(checkModInstallStatus(indexedMods[0], [{ name: 'IndexedBoot', version: '1.0.0' }]), 'update_available');

    const reclassifiedIndexMod = normalizeReleaseIndex({
        schemaVersion: 1,
        mods: [{
            identityId: null,
            name: '露出拓展',
            description: '拓展露出剧情，并加入随处脱衣、勇气系统、任务系统、服装道具拓展等其他玩法',
            category: '外观与资源',
            tags: ['剧情', '服装']
        }]
    })[0];
    assert.equal(reclassifiedIndexMod.category, '玩法与内容', '未命中身份表的索引分类必须按新规则重新打分');

    storageStore.delete('dol_opt_market_wiki_v5');
    context.fetch = async url => {
        assert.equal(url, RELEASE_INDEX_URL);
        return { ok: true, status: 200, json: async () => ({ schemaVersion: 1, mods: indexedMods }) };
    };
    const loadedIndex = await loadMarketData(true);
    assert.equal(loadedIndex[0].version, '2.0.0', '模组市场必须优先读取 Cloudflare 统一索引');
    let repeatedMarketFetches = 0;
    context.fetch = async () => (++repeatedMarketFetches, Promise.reject(new Error('不应重复请求')));
    assert.equal((await loadMarketData(false))[0].version, '2.0.0', '进入市场时必须复用启动阶段载入的数据');
    assert.equal(repeatedMarketFetches, 0, '进入市场时不得重复请求远程索引');

    storageStore.set('dol_opt_market_identities_v3', JSON.stringify({
        timestamp: Date.now(),
        data: { schemaVersion: 1, mods: [{ name: '缓存兜底', bootNames: ['CachedFallback'] }] }
    }));
    context.fetch = async () => ({ ok: true, status: 200, json: async () => ({ schemaVersion: 2, mods: [] }) });
    const fallbackCatalog = await loadIdentityCatalog(true);
    assert.equal(fallbackCatalog.mods[0].bootNames[0], 'CachedFallback', '远程字典异常时必须回退本地缓存');

    storageStore.set('dol_opt_market_identities_v3', JSON.stringify({
        timestamp: Date.now(),
        data: { schemaVersion: 1, mods: [{ name: {}, bootNames: [null, 42] }] }
    }));
    const malformedCatalog = await loadIdentityCatalog(true);
    assert.equal(malformedCatalog, null, '损坏的身份缓存不得阻断市场加载');

    storageStore.delete('dol_opt_market_identities_v3');
    context.fetch = (_url, options) => new Promise((resolve, reject) => {
        const abort = () => reject(Object.assign(new Error('timeout'), { name: 'AbortError' }));
        if (options?.signal?.aborted) abort();
        else options?.signal?.addEventListener('abort', abort, { once: true });
    });
    const timedOutCatalog = await loadIdentityCatalog(true);
    assert.equal(timedOutCatalog, null, '身份字典请求悬挂时必须超时并继续使用内置映射');
    delete context.fetch;

    // 14.4 测试本地安装状态比对 (checkModInstallStatus)
    const mockProfiles = [
        {
            name: 'DoLQuestAssistant',
            version: '0.3.4',
            displayNames: ['DoLQuestAssistant', '欲都孤儿任务助手'],
            normalizedNames: ['dolquestassistant', '欲都孤儿任务助手'],
            repos: ['dolquestassistant']
        },
        {
            name: 'Dynamicest',
            version: '3.1',
            displayNames: ['Dynamicest', '极致动态Dynamicest'],
            normalizedNames: ['dynamicest', '极致动态dynamicest'],
            repos: ['dynamicest']
        },
        {
            name: 'OldMod',
            version: '1.0.0',
            displayNames: ['OldMod'],
            normalizedNames: ['oldmod'],
            repos: ['oldmod']
        },
        {
            name: 'AIStoryGen',
            version: '0.1.606',
            displayNames: ['AIStoryGen', '织境空间', 'Woven Realm'],
            normalizedNames: ['aistorygen', '织境空间', 'wovenrealm'],
            repos: ['aistorygen', 'wovenrealm']
        },
        {
            name: 'WovenRealmCookingAddon',
            version: '0.4.19',
            displayNames: ['WovenRealmCookingAddon', '织境空间·料理扩展（完整循环测试版）', 'Woven Realm Cooking Addon (Full Loop Test)'],
            normalizedNames: ['wovenrealmcookingaddon', '织境空间料理扩展完整循环测试版', 'wovenrealmcookingaddonfulllooptest'],
            repos: ['wovenrealmcookingaddon']
        },
        {
            name: 'NPC Avatars Mod',
            version: '1.4.1',
            displayNames: ['NPC Avatars Mod'],
            normalizedNames: ['npcavatarsmod'],
            repos: ['npcavatarsmod']
        }
    ];

    // 14.4.1 测试中文名市场模组通过 GitHub 仓库名或中文别名精准识别本地已安装
    const questMod = {
        name: '欲都孤儿任务助手',
        version: '0.3.3',
        githubUrl: 'https://github.com/JohnLiao501/DoL-Quest-Assistant'
    };
    const questStatus = checkModInstallStatus(questMod, mockProfiles);
    assert.equal(questStatus, 'up_to_date', '本地 0.3.4 比市场 0.3.3 新，必须判定为已安装且最新');
    assert.ok(questMod._matchedLocal, '必须成功匹配到本地档案');
    assert.equal(questMod._matchedLocal.name, 'DoLQuestAssistant');
    assert.equal(questMod._matchedLocal.version, '0.3.4');

    // 14.4.2 测试中英混合模组匹配
    const dynMod = {
        name: '极致动态Dynamicest',
        version: '3.1',
        githubUrl: 'https://github.com/ANLINSTUDIO/Degrees-of-Lewdity-DolDynamicest'
    };
    const dynStatus = checkModInstallStatus(dynMod, mockProfiles);
    assert.equal(dynStatus, 'up_to_date', '中英混合模组必须成功识别');
    assert.equal(dynMod._matchedLocal.name, 'Dynamicest');

    // 14.4.3 测试发现新版本
    const updateAvailStatus = checkModInstallStatus({ name: 'OldMod', version: '1.2.0', githubUrl: 'https://github.com/a/OldMod' }, mockProfiles);
    assert.equal(updateAvailStatus, 'update_available', '远程版本更新应为 update_available');

    // 14.4.4 测试未安装模组
    const notInstalledStatus = checkModInstallStatus({ name: 'NewMod', version: '1.0.0', githubUrl: 'https://github.com/a/NewMod' }, mockProfiles);
    assert.equal(notInstalledStatus, 'not_installed', '未安装模组应为 not_installed');

    // 14.4.5 测试仅外部链接模组
    const externalOnlyStatus = checkModInstallStatus({ name: 'BaiduMod', version: '1.0.0', githubUrl: null, otherUrl: 'https://pan.baidu.com/s/xyz' }, mockProfiles);
    assert.equal(externalOnlyStatus, 'external_only', '仅外部网盘链接应为 external_only');

    // 14.4.6 测试同系列主模组与子扩展模块精准隔离（解决织境空间穿透误报）
    // 主模组：织境空间 -> 必须准确对撞本地 AIStoryGen (0.1.606)
    const coreMod = {
        name: '织境空间',
        version: '0.1.575',
        githubUrl: 'https://github.com/Kanna-hanabi/WovenRealm'
    };
    const coreStatus = checkModInstallStatus(coreMod, mockProfiles);
    assert.equal(coreStatus, 'up_to_date', '织境空间主模组必须识别为已安装');
    assert.equal(coreMod._matchedLocal.name, 'AIStoryGen');
    assert.equal(coreMod._matchedLocal.version, '0.1.606');

    // 子扩展：织境空间-料理扩展 -> 必须准确对撞本地 WovenRealmCookingAddon (0.4.19)
    const cookingMod = {
        name: '织境空间-料理扩展',
        version: '0.4.19',
        githubUrl: 'https://github.com/Kanna-hanabi/WovenRealm'
    };
    const cookingStatus = checkModInstallStatus(cookingMod, mockProfiles);
    assert.equal(cookingStatus, 'up_to_date', '料理扩展必须对撞本地 WovenRealmCookingAddon，不能被主模组抢占');
    assert.equal(cookingMod._matchedLocal.name, 'WovenRealmCookingAddon');
    assert.equal(cookingMod._matchedLocal.version, '0.4.19');

    // 未安装子扩展：织境空间-场景互动扩展 -> 绝不能错误匹配到本地主模组！必须判定为未安装！
    const sceneMod = {
        name: '织境空间-场景互动扩展',
        version: '0.8.7',
        githubUrl: 'https://github.com/Kanna-hanabi/WovenRealmUI'
    };
    const sceneStatus = checkModInstallStatus(sceneMod, mockProfiles);
    assert.equal(sceneStatus, 'not_installed', '未安装的场景互动扩展绝不能误配到主模组上');
    assert.equal(sceneMod._matchedLocal, null, '未安装的子扩展匹配对象必须为 null');

    // 14.4.7 测试通用停用词防误识别（如带有 NPC 的陌生模组严禁泛化误配到 NPC Avatars Mod）
    const npcSideMod = {
        name: 'NPC社交栏头像',
        version: '1.4.1',
        githubUrl: 'https://github.com/author/dolnpciconmods'
    };
    const npcStatus = checkModInstallStatus(npcSideMod, mockProfiles);
    assert.equal(npcStatus, 'not_installed', '陌生 NPC 模组严禁单凭 npc 词块误配到本地');

    // 14.4.8 测试复杂版本号解析与语义比较
    assert.equal(context.dolOptCompareVersions('5.5.9.9', '5.5.9.9(foodstuff-compat)'), 0, '括号后缀版本应判定为相等');
    assert.equal(context.dolOptCompareVersions('0.0.8', '0.0.8-for-dol-0.5.10'), 0, '构建环境后缀版本应判定为相等');
    assert.equal(context.dolOptCompareVersions('0.8.7', '0.1.606'), 1, '0.8.7 应大于 0.1.606');
    assert.equal(context.dolOptCompareVersions('0.1.575', '0.1.606'), -1, '0.1.575 应小于 0.1.606');
    assert.equal(context.dolOptFormatVersion('0.1.606'), 'v0.1.606', '无 v 前缀应补上 v');
    assert.equal(context.dolOptFormatVersion('v0.8.7'), 'v0.8.7', '已有 v 前缀严禁出现 vv');

    // 14.4.9 技术名 AIStoryGen 必须通过内置别名识别为“织境空间”并读取本地版本
    const wovenStatus = checkModInstallStatus(
        { name: '织境空间', version: '0.1.606', githubUrl: 'https://github.com/Kanna-hanabi/WovenRealm' },
        [{ name: 'AIStoryGen', version: '0.1.606' }]
    );
    assert.equal(wovenStatus, 'up_to_date');

    // 14.5 测试 GitHub Release 请求与源码包排除逻辑
    let fetchedUrl = '';
    context.fetch = async url => {
        fetchedUrl = url;
        return {
            ok: true,
            status: 200,
            json: async () => ({
                tag_name: 'v2.0.0',
                name: 'Release 2.0.0',
                html_url: 'https://github.com/test/repo/releases/latest',
                published_at: '2026-09-17T00:00:00Z',
                assets: [
                    { name: 'Source code (zip)', size: 100, browser_download_url: 'https://github.com/test/repo/archive/v2.zip' },
                    { name: 'MyAwesomeMod.zip', size: 2000, digest: `sha256:${'a'.repeat(64)}`, browser_download_url: 'https://github.com/test/repo/releases/download/v2/MyAwesomeMod.zip' }
                ]
            })
        };
    };

    const rel = await fetchModRelease({ githubUrl: 'https://github.com/test/repo' }, { useCache: false });
    assert.equal(rel.version, 'v2.0.0');
    assert.equal(rel.assetName, 'MyAwesomeMod.zip', '必须自动排除源码包并选取真正的发布包');
    assert.equal(rel.assetUrl, 'https://github.com/test/repo/releases/download/v2/MyAwesomeMod.zip');
    assert.equal(rel.assetSize, 2000, 'Release 资源大小必须传给下载边界检查');
    assert.equal(rel.assetDigest, `sha256:${'a'.repeat(64)}`, 'Release 官方摘要必须传给安装完整性校验');
    assert.equal(rel.assets.length, 1, '单包 Release 必须生成一个安装项');

    const releaseAsset = name => ({ name, size: 1024, digest: `sha256:${'b'.repeat(64)}`, downloadUrl: `https://example.test/${name}` });
    const smartphonePlan = buildReleaseAssetPlan([
        releaseAsset('DoL-SmartPhone-Alpha.valpha.3.84.1.zip'),
        releaseAsset('DoL-SmartPhone-Alpha.valpha.3.84.2.zip'),
        releaseAsset('DoL-SmartPhone-Alpha.valpha.3.84b.zip')
    ], '0.5.11.9');
    assert.deepEqual([...smartphonePlan.assets.map(asset => asset.name)], ['DoL-SmartPhone-Alpha.valpha.3.84.2.zip'], '多个主包必须按文件名版本选择最高版本');

    const photoPackPlan = buildReleaseAssetPlan([
        releaseAsset('DoL-SmartPhone-Alpha.valpha.3.82.zip'),
        releaseAsset('DoL-SmartPhone-PhotoPack-Alpha.3.82.zip')
    ], '0.5.11.9');
    assert.deepEqual(
        [...photoPackPlan.assets.map(asset => asset.name)],
        ['DoL-SmartPhone-Alpha.valpha.3.82.zip', 'DoL-SmartPhone-PhotoPack-Alpha.3.82.zip'],
        '同版本主包与 PhotoPack 必须生成联合安装计划'
    );
    const photoPackSummary = formatReleaseInstallPlan({ assets: photoPackPlan.assets });
    assert.ok(photoPackSummary.includes('主模组：DoL-SmartPhone-Alpha.valpha.3.82.zip'));
    assert.ok(photoPackSummary.includes('附属图包/资源包：DoL-SmartPhone-PhotoPack-Alpha.3.82.zip'));
    assert.ok(photoPackSummary.includes('检测到 1 个，将与主模组一并下载并安装'));
    assert.ok(formatReleaseInstallPlan({ assets: [releaseAsset('SmartPhone-v0.3.85.zip')] }).includes('本次 Release 未提供独立图包/资源包'));

    const compatiblePlan = buildReleaseAssetPlan([
        releaseAsset('maplebirch-0.5.10.12-v4.1.10.mod.zip'),
        releaseAsset('maplebirch-0.5.11.9-v4.1.10.mod.zip'),
        releaseAsset('maplebirch-0.5.9.8-v4.1.10.mod.zip')
    ], '0.5.11.9');
    assert.equal(compatiblePlan.assets[0].name, 'maplebirch-0.5.11.9-v4.1.10.mod.zip', '必须按当前 StartConfig.version 精确选择 DoL 兼容包');

    const incompatiblePlan = buildReleaseAssetPlan([
        releaseAsset('maplebirch-0.5.10.12-v4.1.10.mod.zip'),
        releaseAsset('maplebirch-0.5.9.8-v4.1.10.mod.zip')
    ], '0.5.11.9');
    assert.equal(incompatiblePlan.needsChoice, true, '没有当前 DoL 对应包时不得静默猜测兼容版本');
    assert.deepEqual([...incompatiblePlan.assets], []);

    const ambiguousPlan = buildReleaseAssetPlan([
        releaseAsset('Inuno.0.0.6.DoLP.zip'),
        releaseAsset('Inuno.0.0.6.zip')
    ], '0.5.11.9');
    assert.equal(ambiguousPlan.needsChoice, true, '同版本但用途不明的并列包必须交给玩家选择');
    assert.ok(formatReleaseInstallPlan({
        requiresManualSelection: true,
        candidateAssets: ambiguousPlan.candidates,
        selectionReason: ambiguousPlan.reason
    }).includes('候选安装包：Inuno.0.0.6.DoLP.zip'));

    const planTrack = { removeAttribute() {}, setAttribute() {} };
    const planBar = { style: {} };
    const planLabel = { textContent: '' };
    const planCancel = { hidden: true };
    const planButton = { disabled: false, textContent: '下载安装', dataset: { idleText: '下载安装' } };
    const planProgress = {
        hidden: true,
        classList: { toggle() {}, remove() {} },
        querySelector: selector => ({
            '.dol-opt-download-track': planTrack,
            '.dol-opt-download-bar': planBar,
            '.dol-opt-download-label': planLabel,
            '.dol-opt-download-cancel': planCancel
        })[selector]
    };
    const planCard = {
        dataset: { modName: '安装计划测试' },
        querySelector: selector => selector === '.dol-opt-download-progress' ? planProgress : planButton
    };
    const beforePlanQuerySelectorAll = context.document.querySelectorAll;
    context.document.querySelectorAll = selector => selector === '.dol-opt-market-card' ? [planCard] : [];
    let installPlanPrompt = null;
    context.dolOptConfirm = async options => (installPlanPrompt = options, false);
    context.fetch = async () => ({
        ok: true,
        status: 200,
        json: async () => ({
            tag_name: 'v3.82',
            assets: [
                { name: 'DoL-SmartPhone-Alpha.valpha.3.82.zip', size: 1024, browser_download_url: 'https://github.com/test/plan/releases/download/v3.82/main.zip' },
                { name: 'DoL-SmartPhone-PhotoPack-Alpha.3.82.zip', size: 2048, browser_download_url: 'https://github.com/test/plan/releases/download/v3.82/photos.zip' }
            ]
        })
    });
    assert.equal(await promptDownloadMirrorAndInstall({ name: '安装计划测试', githubUrl: 'https://github.com/test/install-plan' }), false);
    assert.ok(installPlanPrompt.message.includes('DoL-SmartPhone-Alpha.valpha.3.82.zip'));
    assert.ok(installPlanPrompt.message.includes('DoL-SmartPhone-PhotoPack-Alpha.3.82.zip'));
    assert.ok(installPlanPrompt.message.includes('将与主模组一并下载并安装'));
    assert.equal(installPlanPrompt.dialogClass, 'dol-opt-install-dialog');
    assert.ok(installPlanPrompt.trustedMessageHtml.includes('dol-opt-install-overview'));
    assert.ok(installPlanPrompt.trustedMessageHtml.includes('版本选择'));
    assert.ok(installPlanPrompt.trustedMessageHtml.includes('下载线路'));
    assert.ok(!installPlanPrompt.trustedMessageHtml.includes('安全回退'), '安装确认框不应展示难以理解的线路回退实现细节');
    assert.equal(planProgress.hidden, true, '取消安装确认后必须隐藏“正在生成安装包清单”进度');
    assert.equal(planButton.disabled, false, '取消安装确认后必须恢复下载按钮');
    assert.equal(planButton.textContent, '下载安装');

    let planFetchStarted;
    const planFetchReady = new Promise(resolve => { planFetchStarted = resolve; });
    let planDialogShown = false;
    context.dolOptConfirm = async () => (planDialogShown = true, false);
    context.fetch = async (_url, options) => {
        planFetchStarted();
        return new Promise((resolve, reject) => options.signal.addEventListener('abort', () => {
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
        }, { once: true }));
    };
    const cancelledPlan = promptDownloadMirrorAndInstall({ name: '安装计划测试', githubUrl: 'https://github.com/test/cancel-plan' });
    await planFetchReady;
    assert.equal(cancelDownload('安装计划测试'), true, '生成安装包清单时也必须允许取消');
    assert.equal(await cancelledPlan, false);
    assert.equal(planDialogShown, false, '清单读取被取消后不得继续弹出安装确认框');
    assert.equal(planProgress.hidden, true);
    context.document.querySelectorAll = beforePlanQuerySelectorAll;

    const historyMod = { name: '历史图包测试', githubUrl: 'https://github.com/test/history-packs' };
    context.fetch = async url => ({
        ok: true,
        status: 200,
        json: async () => url.includes('per_page=20') ? [
            { tag_name: 'v3.82', published_at: '2026-04-29T00:00:00Z', assets: [{ name: 'PhotoPack-3.82.zip', size: 2048, browser_download_url: 'https://github.com/test/history-packs/releases/download/v3.82/photos.zip' }] },
            { tag_name: 'v3.7', published_at: '2026-03-29T00:00:00Z', assets: [{ name: 'ImagePack-3.7.zip', size: 1024, browser_download_url: 'https://github.com/test/history-packs/releases/download/v3.7/images.zip' }] },
            { tag_name: 'v3.6', published_at: '2026-03-03T00:00:00Z', assets: [{ name: 'ResourcePack-3.6.zip', size: 512, browser_download_url: 'https://github.com/test/history-packs/releases/download/v3.6/resources.zip' }] },
            { tag_name: 'v3.5', published_at: '2026-03-02T00:00:00Z', assets: [{ name: 'AssetPack-3.5.zip', size: 256, browser_download_url: 'https://github.com/test/history-packs/releases/download/v3.5/assets.zip' }] }
        ] : {}
    });
    const recentCompanions = await fetchRecentCompanionAssets(historyMod, 3, { useCache: false });
    assert.deepEqual([...recentCompanions.map(asset => asset.name)], ['PhotoPack-3.82.zip', 'ImagePack-3.7.zip', 'ResourcePack-3.6.zip']);

    // 14.6 模拟下载与自动旁加载装载测试 (downloadAndInstallMod)
    let installedInput = null;
    let installedOptions = null;
    context.dolOptHandleAddMod = async (input, opts) => {
        installedInput = input;
        installedOptions = opts;
    };
    context.dolOptConfirm = async () => true;

    // mock fetch 二进制流
    const testDownloadBlob = new Blob([new Uint8Array(1024)], { type: 'application/zip' });
    const testDownloadDigest = Buffer.from(await webcrypto.subtle.digest('SHA-256', await testDownloadBlob.arrayBuffer())).toString('hex');
    let historicalSelectionPrompt = null;
    context.dolOptConfirm = async options => {
        historicalSelectionPrompt = options;
        return options.selectOptions?.length ? 'history:0' : true;
    };
    context.fetch = async url => {
        if (url.includes('releases/latest')) {
            return {
                ok: true,
                status: 200,
                json: async () => ({
                    tag_name: 'v0.3.85',
                    assets: [{ name: 'SmartPhone-v0.3.85.zip', size: 1024, digest: `sha256:${testDownloadDigest}`, browser_download_url: 'https://github.com/test/history-install/releases/download/v0.3.85/main.zip' }]
                })
            };
        }
        if (url.includes('releases?per_page=20')) {
            return {
                ok: true,
                status: 200,
                json: async () => [{
                    tag_name: 'v3.82',
                    published_at: '2026-04-29T00:00:00Z',
                    assets: [{ name: 'SmartPhone-PhotoPack-3.82.zip', size: 1024, digest: `sha256:${testDownloadDigest}`, browser_download_url: 'https://github.com/test/history-install/releases/download/v3.82/photos.zip' }]
                }]
            };
        }
        return { ok: true, status: 200, blob: async () => testDownloadBlob };
    };
    assert.equal(await promptDownloadMirrorAndInstall({ name: '历史图包安装测试', githubUrl: 'https://github.com/test/history-install' }), true);
    assert.deepEqual([...installedInput.files.map(file => file.name)], ['SmartPhone-v0.3.85.zip', 'SmartPhone-PhotoPack-3.82.zip']);
    assert.deepEqual([...historicalSelectionPrompt.selectOptions.map(option => option.value)], ['none', 'history:0']);

    let manualAssetPrompt = null;
    context.dolOptConfirm = async options => {
        manualAssetPrompt = options;
        return 'asset:1';
    };
    context.fetch = async url => {
        if (url.includes('releases/latest')) {
            return {
                ok: true,
                status: 200,
                json: async () => ({
                    tag_name: 'v0.0.6',
                    assets: [
                        { name: 'Inuno.0.0.6.DoLP.zip', size: 1024, digest: `sha256:${testDownloadDigest}`, browser_download_url: 'https://github.com/test/manual-install/releases/download/v0.0.6/Inuno.0.0.6.DoLP.zip' },
                        { name: 'Inuno.0.0.6.zip', size: 1024, digest: `sha256:${testDownloadDigest}`, browser_download_url: 'https://github.com/test/manual-install/releases/download/v0.0.6/Inuno.0.0.6.zip' }
                    ]
                })
            };
        }
        return { ok: true, status: 200, blob: async () => testDownloadBlob };
    };
    assert.equal(await promptDownloadMirrorAndInstall({ name: '多安装包选择测试', githubUrl: 'https://github.com/test/manual-install' }), true);
    assert.deepEqual([...manualAssetPrompt.selectOptions.map(option => option.value)], ['', 'asset:0', 'asset:1']);
    assert.equal(manualAssetPrompt.requireSelection, true);
    assert.equal(manualAssetPrompt.confirmText, '安装所选包');
    assert.deepEqual([...installedInput.files.map(file => file.name)], ['Inuno.0.0.6.zip']);

    context.dolOptConfirm = async () => true;
    const downloadFetches = [];
    let downloadAttempts = 0;
    context.fetch = async url => {
        downloadFetches.push(url);
        if (url.includes('api.github.com')) {
            return {
                ok: true,
                status: 200,
                json: async () => ({
                    tag_name: 'v1.0.0',
                    assets: [{ name: 'TestMod.zip', size: 1024, digest: `sha256:${testDownloadDigest}`, browser_download_url: 'https://github.com/test/testmod/releases/download/v1/TestMod.zip' }]
                })
            };
        }
        downloadAttempts++;
        if (downloadAttempts === 1) throw new TypeError('Failed to fetch');
        return {
            ok: true,
            status: 200,
            blob: async () => testDownloadBlob
        };
    };

    await downloadAndInstallMod({ name: '测试模组', githubUrl: 'https://github.com/test/testmod', _matchedLocal: { name: 'TestMod' } }, 'ddlc');
    assert.ok(installedInput !== null, '必须自动调用 dolOptHandleAddMod 进行旁加载装载');
    assert.ok(installedInput.files && installedInput.files.length === 1, '必须构造合法的虚拟模组文件');
    assert.equal(installedOptions.targetModName, 'TestMod', '市场更新必须把已匹配的本地技术名传给导入器');
    assert.equal(installedOptions.displayName, '测试模组', '市场更新必须把社区显示名传给确认弹窗');
    assert.equal(downloadAttempts, 2, '页面内下载连接中断后必须自动重试一次');
    assert.equal(
        downloadFetches.at(-1),
        'https://gh.ddlc.top/https://github.com/test/testmod/releases/download/v1/TestMod.zip',
        '安装包请求必须使用当前所选镜像'
    );
    assert.ok(marketScript.includes("new URL('/download', RELEASE_INDEX_URL)"), '市场必须保留自建 Worker 下载线路');
    assert.ok(marketScript.includes('getDownloadUrl(asset.downloadUrl, mirrorId)'), '浏览器下载必须让安装计划中的每个包使用当前线路');
    assert.ok(marketScript.includes('仅此文件改走'), '缺少官方摘要时必须明确仅回退当前文件，不能误报为全局切换线路');

    const singlePackageFetch = context.fetch;
    context.fetch = async url => {
        if (url.includes('api.github.com')) {
            return {
                ok: true,
                status: 200,
                json: async () => ({
                    tag_name: 'v3.82',
                    assets: [
                        { name: 'DoL-SmartPhone-Alpha.valpha.3.82.zip', size: 1024, digest: `sha256:${testDownloadDigest}`, browser_download_url: 'https://github.com/test/phone/releases/download/v3.82/main.zip' },
                        { name: 'DoL-SmartPhone-PhotoPack-Alpha.3.82.zip', size: 1024, digest: `sha256:${testDownloadDigest}`, browser_download_url: 'https://github.com/test/phone/releases/download/v3.82/photos.zip' }
                    ]
                })
            };
        }
        return { ok: true, status: 200, blob: async () => testDownloadBlob };
    };
    await downloadAndInstallMod({ name: '智能手机', githubUrl: 'https://github.com/test/phone' }, 'ddlc', { askRestart: false });
    assert.deepEqual(
        [...installedInput.files.map(file => file.name)],
        ['DoL-SmartPhone-Alpha.valpha.3.82.zip', 'DoL-SmartPhone-PhotoPack-Alpha.3.82.zip'],
        '主包与图包必须下载后一次性批量交给 ModLoader 导入'
    );
    context.fetch = singlePackageFetch;

    const unsignedFetches = [];
    const toastCountBeforeUnsignedDownload = toastMessages.length;
    context.fetch = async url => {
        unsignedFetches.push(url);
        return { ok: true, status: 200, blob: async () => testDownloadBlob };
    };
    assert.equal(await downloadAndInstallMod({ name: '无摘要模组' }, 'jasonzeng', {
        askRestart: false,
        releaseInfo: {
            version: '1.0.0',
            assets: [{ name: 'Unsigned.zip', size: 1024, downloadUrl: 'https://github.com/test/unsigned/releases/download/v1/Unsigned.zip' }]
        }
    }), true);
    assert.ok(unsignedFetches[0].includes('/download?url='), '公共镜像遇到无摘要文件时必须只让该文件回退到自建 Worker');
    assert.ok(toastMessages.slice(toastCountBeforeUnsignedDownload).some(message => message.includes('首选线路仍为 加速通道 1（JasonZeng）')), '回退提示必须说明首选线路未改变');
    context.fetch = singlePackageFetch;

    const successfulDownloadFetch = context.fetch;
    const originalDocumentBody = context.document.body;
    let browserDownloadStarts = 0;
    let browserDownloadUrl = '';
    let fallbackPrompt = null;
    context.document.body = { appendChild: frame => (browserDownloadStarts++, browserDownloadUrl = frame.src) };
    context.dolOptConfirm = async options => (fallbackPrompt = options, false);
    let directPackageFetches = 0;
    let directPackageUrl = '';
    context.fetch = async url => {
        if (url.includes('api.github.com')) {
            return {
                ok: true,
                status: 200,
                json: async () => ({
                    tag_name: 'v1.0.0',
                    assets: [{ name: 'DirectMod.zip', size: 1024, browser_download_url: 'https://github.com/test/directmod/releases/download/v1/DirectMod.zip' }]
                })
            };
        }
        directPackageFetches++;
        directPackageUrl = url;
        return {
            ok: true,
            status: 200,
            blob: async () => testDownloadBlob
        };
    };
    assert.equal(await downloadAndInstallMod({ name: '直连模组', githubUrl: 'https://github.com/test/directmod' }, 'github'), false);
    assert.equal(browserDownloadStarts, 1, 'GitHub 直连必须直接启动浏览器下载');
    assert.equal(browserDownloadUrl, 'https://github.com/test/directmod/releases/download/v1/DirectMod.zip');
    assert.equal(directPackageFetches, 0, 'GitHub 直连不得触发会被 CORS 拦截的页面 fetch');
    assert.equal(fallbackPrompt.title, '浏览器下载已启动');

    browserDownloadStarts = 0;
    browserDownloadUrl = '';
    assert.equal(await downloadAndInstallMod({ name: '旧版模组', githubUrl: 'https://github.com/test/legacymod' }, 'ddlc'), true);
    assert.equal(browserDownloadStarts, 0, '缺少官方摘要的旧资源不应交给第三方镜像或浏览器下载');
    assert.equal(
        directPackageUrl,
        'https://dol.alseece.top/download?url=https%3A%2F%2Fgithub.com%2Ftest%2Fdirectmod%2Freleases%2Fdownload%2Fv1%2FDirectMod.zip',
        '缺少摘要时必须回退自建 Worker'
    );
    assert.equal(directPackageFetches, 1);

    browserDownloadStarts = 0;
    browserDownloadUrl = '';
    fallbackPrompt = null;
    context.fetch = async url => {
        if (url.includes('api.github.com')) {
            return {
                ok: true,
                status: 200,
                json: async () => ({
                    tag_name: 'v1.0.0',
                    assets: [{ name: 'FailMod.zip', size: 1024, digest: `sha256:${'0'.repeat(64)}`, browser_download_url: 'https://github.com/test/failmod/releases/download/v1/FailMod.zip' }]
                })
            };
        }
        throw new TypeError('Failed to fetch');
    };
    assert.equal(await downloadAndInstallMod({ name: '失败模组', githubUrl: 'https://github.com/test/failmod' }), false);
    assert.equal(fallbackPrompt.title, '自动安装失败', '重试仍失败后必须允许用户选择其他线路');
    assert.deepEqual([...fallbackPrompt.selectOptions.map(option => option.value)], ['ddlc', 'worker', 'github']);
    assert.equal(fallbackPrompt.confirmText, '切换并重试');
    assert.equal(browserDownloadStarts, 0, '用户未确认时不得自动启动浏览器下载');

    let switchedPrompt = null;
    const switchedFetches = [];
    context.dolOptConfirm = async options => {
        switchedPrompt = options;
        return options.selectOptions ? 'worker' : false;
    };
    context.fetch = async url => {
        if (url.includes('api.github.com')) {
            return {
                ok: true,
                status: 200,
                json: async () => ({
                    tag_name: 'v1.0.0',
                    assets: [{ name: 'SwitchMod.zip', size: 1024, digest: `sha256:${testDownloadDigest}`, browser_download_url: 'https://github.com/test/switchmod/releases/download/v1/SwitchMod.zip' }]
                })
            };
        }
        switchedFetches.push(url);
        if (url.startsWith('https://gh.ddlc.top/')) return { ok: false, status: 429 };
        return { ok: true, status: 200, blob: async () => testDownloadBlob };
    };
    assert.equal(await downloadAndInstallMod({ name: '切换线路模组', githubUrl: 'https://github.com/test/switchmod' }, 'ddlc', { askRestart: false }), true);
    assert.ok(switchedPrompt.message.includes('HTTP 429'), 'DDLC 限流必须给出明确原因');
    assert.ok(switchedFetches.some(url => url.includes('/download?url=')), '选择 Cloudflare 后必须立即通过新线路重试');

    let packageRequestStarted;
    const packageStarted = new Promise(resolve => { packageRequestStarted = resolve; });
    let cancelPromptShown = false;
    context.dolOptConfirm = async () => (cancelPromptShown = true, false);
    context.fetch = async (url, options) => {
        if (url.includes('api.github.com')) {
            return {
                ok: true,
                status: 200,
                json: async () => ({
                    tag_name: 'v1.0.0',
                    assets: [{ name: 'CancelMod.zip', size: 1024, digest: `sha256:${testDownloadDigest}`, browser_download_url: 'https://github.com/test/cancelmod/releases/download/v1/CancelMod.zip' }]
                })
            };
        }
        packageRequestStarted();
        return new Promise((resolve, reject) => options.signal.addEventListener('abort', () => {
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
        }, { once: true }));
    };
    const cancelledDownload = downloadAndInstallMod({ name: '可取消模组', githubUrl: 'https://github.com/test/cancelmod' }, 'worker', { askRestart: false });
    await packageStarted;
    assert.equal(cancelDownload('可取消模组'), true, '下载中必须可以触发 AbortController');
    assert.equal(await cancelledDownload, false);
    assert.equal(cancelPromptShown, false, '用户主动取消不得弹出线路故障对话框');
    assert.ok(marketScript.includes('dol-opt-download-cancel'), '下载进度区必须包含取消下载按钮');
    context.fetch = successfulDownloadFetch;
    context.dolOptConfirm = async () => true;
    context.document.body = originalDocumentBody;

    const makeProgressCard = name => {
        const track = { removeAttribute() {}, setAttribute() {} };
        const bar = { style: {} };
        const label = { textContent: '' };
        const button = { disabled: false, textContent: '' };
        const progress = {
            hidden: true,
            classList: { toggle() {} },
            querySelector: selector => ({
                '.dol-opt-download-track': track,
                '.dol-opt-download-bar': bar,
                '.dol-opt-download-label': label
            })[selector]
        };
        return {
            dataset: { modName: name },
            progress,
            label,
            querySelector: selector => selector === '.dol-opt-download-progress' ? progress : button
        };
    };
    const dependencyCard = makeProgressCard('秋枫白桦框架');
    const targetCard = makeProgressCard('公交车防骚扰');
    const previousQuerySelectorAll = context.document.querySelectorAll;
    context.document.querySelectorAll = selector => selector === '.dol-opt-market-card' ? [dependencyCard, targetCard] : [];
    await downloadAndInstallMod(
        { name: '秋枫白桦框架', githubUrl: 'https://github.com/test/testmod' },
        'ddlc',
        { askRestart: false, progressTargetName: '公交车防骚扰', progressPrefix: '1/2 前置【秋枫白桦框架】：' }
    );
    context.document.querySelectorAll = previousQuerySelectorAll;
    assert.equal(dependencyCard.label.textContent, '下载完成，正在安装...', '前置模组卡片必须显示原有安装进度');
    assert.equal(targetCard.label.textContent, '1/2 前置【秋枫白桦框架】：下载完成，正在安装...', '目标模组卡片必须同步显示前置下载阶段');
    assert.equal(targetCard.progress.hidden, false, '目标模组卡片必须显示下载动画');

    // 14.7 验证方案 C：全域立体模组更新提醒体系
    // 14.7.1 验证 CSS 中全域方案 C 关键选择器齐全
    assert.ok(css.includes('.dol-opt-tab-badge'), '样式表中必须包含 Tab 数字胶囊徽标样式');
    assert.ok(css.includes('.dol-opt-update-banner'), '样式表中必须包含置顶金边更新横幅样式');
    assert.ok(css.includes('.btn-inline-update'), '样式表中必须包含原地一键升级按钮样式');
    assert.ok(css.includes('.dol-opt-market-card-updatable'), '样式表中必须包含置顶微光金边卡片样式');
    const pulseGoldStyle = css.match(/\.dol-opt-pulse-gold\s*\{([^}]*)\}/s)?.[1] || '';
    assert.ok(pulseGoldStyle, '样式表中必须保留金色更新数字强调样式');
    assert.doesNotMatch(pulseGoldStyle, /animation\s*:/, '更新数字不得使用常驻动画持续触发重绘');
    assert.ok(css.includes('.dol-opt-download-progress'), '模组卡片必须包含原地下载进度条样式');
    const marketCardStyle = css.match(/\.dol-opt-market-card\s*\{([^}]*)\}/s)?.[1] || '';
    const marketDescStyle = css.match(/\.dol-opt-market-desc\s*\{([^}]*)\}/s)?.[1] || '';
    assert.match(marketCardStyle, /height:\s*290px/, '模组市场卡片必须保持统一高度');
    assert.match(marketDescStyle, /overflow-y:\s*auto/, '模组市场长简介必须支持卡片内滚动');
    assert.match(marketDescStyle, /scrollbar-width:\s*none/, '模组市场简介必须隐藏可见滚动条');
    assert.ok(css.includes('.dol-opt-market-desc::-webkit-scrollbar'), 'Chromium 内核必须隐藏简介滚动条');
    assert.ok(!marketDescStyle.includes('line-clamp'), '模组市场简介不得再按行数裁切');
    assert.ok(marketScript.includes('window.dolOptInitMarket = async function(forceRefresh = false)'), '进入模组市场时必须默认复用启动刷新结果');
    assert.ok(marketScript.includes('await loadMarketData(forceRefresh)'), '模组市场初始化必须把刷新参数传给数据加载器');
    assert.ok(mainScript.includes('await window.dolModMarket.loadMarketData(true)'), '游戏加载完成后必须强制刷新一次模组市场');
    assert.ok(mainScript.includes('window.dolOptNotifyUpdateState?.(updates.length, updates)'), '启动刷新完成后必须同步更新提示状态');
    assert.ok(!script.includes('window.dolModMarket.loadMarketData(false).then'), '打开模组管理页时不得再次触发旧的市场请求');

    // 14.7.2 验证 Tab 胶囊徽标动态创建与销毁
    let fakeMarketTab = {
        textContent: '模组市场',
        children: [],
        querySelector: sel => sel === '.dol-opt-tab-badge' ? fakeMarketTab.badge : null,
        appendChild: el => { fakeMarketTab.badge = el; fakeMarketTab.children.push(el); }
    };
    fakeMarketTab.badge = null;
    context.document.querySelectorAll = sel => sel === '#overlayTabs button' ? [fakeMarketTab] : [];
    context.document.createElement = tag => ({ tagName: tag, textContent: '', className: '', remove: () => { fakeMarketTab.badge = null; } });

    context.dolOptUpdateMarketTabBadge(3);
    assert.ok(fakeMarketTab.badge !== null, '发现 3 个更新时必须为模组市场 Tab 注入徽标');
    assert.equal(fakeMarketTab.badge.textContent, 3, '徽标数字必须为 3');
    context.dolOptUpdateMarketTabBadge(0);
    assert.ok(fakeMarketTab.badge === null, '更新数为 0 时必须彻底移除徽标');

    // 14.7.3 验证模组管理列表原地更新按钮与提示标签渲染
    context._dolOptUpdatableMap = new Map([
        ['UpdatableMod', { newVersion: '2.5.0', localName: 'UpdatableMod' }]
    ]);
    context._dolOptModState = {
        sideMods: [{ name: 'UpdatableMod', enabled: true }],
        sideEnabled: ['UpdatableMod'],
        sideDisabled: [],
        builtInMods: []
    };
    context.dolOptRenderModManageUI();
    assert.ok(container.innerHTML.includes('btn-inline-update'), '有更新的模组必须在列表中直接渲染【更新】按钮');
    assert.ok(container.innerHTML.includes('可更新'), '有更新的模组必须在副标题渲染可更新标签');
    assert.ok(container.innerHTML.includes('data-mod-action="update"'), '更新按钮必须通过安全事件代理绑定原地更新');
    assert.ok(!container.innerHTML.includes('onclick="window.dolOptUpdateModDirectly'), '模组名不得拼进内联事件处理器');
    assert.ok(container.innerHTML.includes('id="dolOptUpdateBanner"'), '模组管理页面必须包含置顶更新横幅容器');

    // 14.7.4 验证模组市场接口挂载与公共函数
    assert.equal(typeof context.dolModMarket.getUpdatableMods, 'function', 'dolModMarket 必须导出 getUpdatableMods');
    assert.equal(typeof context.dolModMarket.filterUpdatableOnly, 'function', 'dolModMarket 必须导出 filterUpdatableOnly');
    assert.equal(typeof context.dolModMarket.updateAllMods, 'function', 'dolModMarket 必须导出 updateAllMods');
    assert.equal(typeof context.dolOptGoToMarketUpdates, 'function', '必须全局提供 dolOptGoToMarketUpdates');
    assert.equal(typeof context.dolOptUpdateModDirectly, 'function', '必须全局提供 dolOptUpdateModDirectly');

    // 14.8 验证社区异常模组容错规则及用户手动忽略更新功能
    const checkStatus = context.dolModMarket.checkModInstallStatus;
    
    // 14.8.1 D.O.L.I 本地 0.2.2 遭遇作者打包未递增的远程 v0.2.3 -> 必须判定为 up_to_date
    const doliStatus = checkStatus(
        { name: 'D.O.L.I', version: 'v0.2.3', githubUrl: 'https://github.com/ArsNativa/Degrees-of-Lewdity-Intelligence' },
        [{ name: 'DOLI', version: '0.2.2', displayNames: ['DOLI'], normalizedNames: ['doli'], repos: ['doli'] }]
    );
    assert.equal(doliStatus, 'up_to_date', 'D.O.L.I 本地 0.2.2 必须匹配远程 0.2.3 并判定为最新，不再死循环误报更新');

    // 14.8.2 惠特尼剧情扩展 本地 0.3.1 遭遇 Wiki 误填的 v1.0 -> 必须判定为 up_to_date
    const whitneyStatus = checkStatus(
        { name: '惠特尼剧情扩展', version: 'v1.0', githubUrl: 'https://github.com/Ayusai31/WhitneyExpansion/tree/Whitney/' },
        [{ name: 'WhitneyExpansion', version: '0.3.1', displayNames: ['WhitneyExpansion', '惠特尼剧情扩展'], normalizedNames: ['whitneyexpansion', '惠特尼剧情扩展'], repos: ['whitneyexpansion'] }]
    );
    assert.equal(whitneyStatus, 'up_to_date', '惠特尼剧情扩展 本地 0.3.1 必须正确识别为最新，解除 Wiki 虚高 v1.0 误报');

    // 14.8.3 Release 标签与包内 boot.json 版本写法不一致时，应识别当前最新版且不屏蔽后续版本
    const robinVersionMismatchProfile = [{
        name: 'DomRobin',
        version: 'v0.0.8-for-dol-0.5.10',
        displayNames: ['DomRobin', '强势罗宾扩展'],
        normalizedNames: ['domrobin', '强势罗宾扩展'],
        repos: ['degreesoflewdityrobinmod']
    }];
    assert.equal(checkStatus(
        { name: '强势罗宾扩展', version: 'v0.08-for-dol-510', githubUrl: 'https://github.com/ZeroRing233/Degrees-of-Lewdity-RobinMod' },
        robinVersionMismatchProfile
    ), 'up_to_date', '强势罗宾扩展 0.08 与包内 0.0.8 应视为同一版本');
    assert.equal(checkStatus(
        { name: '强势罗宾扩展', version: 'v0.09-for-dol-511', githubUrl: 'https://github.com/ZeroRing233/Degrees-of-Lewdity-RobinMod' },
        robinVersionMismatchProfile
    ), 'update_available', '强势罗宾扩展后续版本不得被异常规则屏蔽');

    const sydneyVersionMismatchProfile = [{
        name: 'Sydney Bare Study Mod',
        version: '0.1',
        displayNames: ['Sydney Bare Study Mod', '悉尼裸体学习'],
        normalizedNames: ['sydneybarestudymod', '悉尼裸体学习'],
        repos: ['dolsydneybarestudymod']
    }];
    assert.equal(checkStatus(
        { name: '悉尼裸体学习', version: 'v1.5', githubUrl: 'https://github.com/koooooiCarp/DOL-Sydney-Bare-Study-Mod' },
        sydneyVersionMismatchProfile
    ), 'up_to_date', '悉尼裸体学习 Release v1.5 与包内 0.1 应视为同一版本');
    assert.equal(checkStatus(
        { name: '悉尼裸体学习', version: 'v1.6', githubUrl: 'https://github.com/koooooiCarp/DOL-Sydney-Bare-Study-Mod' },
        sydneyVersionMismatchProfile
    ), 'update_available', '悉尼裸体学习后续版本不得被异常规则屏蔽');

    // 14.8.4 验证应用商店式“忽略本次/永久忽略/查看已忽略”功能
    context.dolModMarket.setModUpdateIgnored('CustomProblematicMod', 'v2.0.0', true);
    const ignoredMod = { name: 'CustomProblematicMod', version: 'v2.0.0', githubUrl: 'https://github.com/test/custom' };
    const ignoredStatus = checkStatus(
        ignoredMod,
        [{ name: 'CustomProblematicMod', version: '1.0.0', displayNames: ['CustomProblematicMod'], normalizedNames: ['customproblematicmod'], repos: ['custom'] }]
    );
    assert.equal(ignoredStatus, 'up_to_date', '用户忽略本次更新后不得继续计入可更新');
    assert.equal(ignoredMod._isIgnored, true, '被忽略的更新必须进入已忽略列表');

    const laterVersionStatus = checkStatus(
        { name: 'CustomProblematicMod', version: 'v2.1.0', githubUrl: 'https://github.com/test/custom' },
        [{ name: 'CustomProblematicMod', version: '1.0.0', displayNames: ['CustomProblematicMod'], normalizedNames: ['customproblematicmod'], repos: ['custom'] }]
    );
    assert.equal(laterVersionStatus, 'update_available', '忽略本次不得屏蔽后续更高版本');

    context.dolModMarket.setModUpdateIgnored('CustomProblematicMod', 'ignored', true);
    const permanentlyIgnoredMod = { name: 'CustomProblematicMod', version: 'v9.0.0', githubUrl: 'https://github.com/test/custom' };
    assert.equal(checkStatus(
        permanentlyIgnoredMod,
        [{ name: 'CustomProblematicMod', version: '1.0.0', displayNames: ['CustomProblematicMod'], normalizedNames: ['customproblematicmod'], repos: ['custom'] }]
    ), 'up_to_date', '永久忽略必须屏蔽后续更高版本');
    assert.equal(permanentlyIgnoredMod._ignoredVersion, 'ignored');

    // 取消忽略后应重新提示更新，并清理旧的界面状态
    context.dolModMarket.setModUpdateIgnored('CustomProblematicMod', '', false);
    const unignoredStatus = checkStatus(
        ignoredMod,
        [{ name: 'CustomProblematicMod', version: '1.0.0', displayNames: ['CustomProblematicMod'], normalizedNames: ['customproblematicmod'], repos: ['custom'] }]
    );
    assert.equal(unignoredStatus, 'update_available', '取消忽略后应恢复 update_available 状态');
    assert.equal(ignoredMod._isIgnored, false, '取消忽略后必须立即清理旧的已忽略状态');

    storageStore.set('dol_opt_market_confirmed_updates_v1', JSON.stringify({ ConfirmedInstall: 'v2.0.0' }));
    const confirmedInstall = { name: 'ConfirmedInstall', version: 'v2.0.0', githubUrl: 'https://github.com/test/confirmed' };
    assert.equal(checkStatus(
        confirmedInstall,
        [{ name: 'ConfirmedInstall', version: '1.0.0', displayNames: ['ConfirmedInstall'], normalizedNames: ['confirmedinstall'], repos: ['confirmed'] }]
    ), 'up_to_date', '安装确权必须阻止包内旧版本号造成循环更新');
    assert.equal(confirmedInstall._isIgnored, false, '安装确权不得伪装成用户忽略更新');

    assert.equal(typeof context.dolModMarket.filterIgnoredOnly, 'function', '必须提供查看已忽略模组的独立入口');
    assert.ok(marketScript.includes('_marketIndex: marketIndex'), '筛选和排序后的卡片必须保留原始市场索引，确保所有操作按钮命中正确模组');
    assert.ok(marketScript.includes('忽略本次'), '可更新模组必须提供忽略本次操作');
    assert.ok(marketScript.includes('永久忽略'), '可更新模组必须提供永久忽略操作');
    assert.ok(marketScript.includes('查看已忽略模组'), '模组市场必须提供已忽略模组列表入口');
    assert.ok(!marketScript.includes('>恢复检测</button>'), '模组卡片不得继续使用含义模糊的恢复检测文案');
    assert.ok(marketScript.includes('DOL 中文社区 Wiki「模组列表」'), '模组市场必须声明 DOL 中文社区 Wiki 数据来源');
    assert.ok(marketScript.includes('https://degreesoflewditycn.miraheze.org/wiki/%E6%A8%A1%E7%BB%84%E5%88%97%E8%A1%A8'), 'Wiki 来源必须链接到模组列表页面');

    // 14.10 验证知名模组中英文全能别名匹配与子模块精准区分
    const userMods = [
        { name: 'SmartPhone Alpha', version: '0.1.0' },
        { name: 'DomRobin', version: '1.0.0' },
        { name: 'maplebirch', version: 'v4.2.1' },
        { name: 'WovenRealmCookingAddon', version: '1.0.0' },
        { name: 'BabyHawk', version: '1.0.0' },
        { name: 'DOLArcadeExpansion', version: '1.0.2' },
        { name: 'AutoClean', version: '1.0.0' },
        { name: 'cummilk', version: '1.1.2' },
        { name: 'MoreFarmUpgrade', version: '1.1.0' },
        { name: 'Sydney Bare Study Mod', version: '1.0.0' }
    ];

    // SmartPhone Alpha 必须精准匹配 Wiki 的“万能的智能手机”
    const phoneStatus = checkStatus(
        { name: '万能的智能手机', version: '0.1.0', githubUrl: 'https://github.com/ANLINSTUDIO/Degrees-of-Lewdity-DolSmartPhone' },
        userMods
    );
    assert.equal(phoneStatus, 'up_to_date', 'SmartPhone Alpha 必须成功匹配并识别为已安装');

    // SmartPhone Alpha 绝不得被误识别为唐百玎HY的“手机”模组
    const tangPhoneStatus = checkStatus(
        { name: '手机', version: '0.1.0', githubUrl: 'https://github.com/HCPTangHY/DOL-PhoneMod' },
        userMods
    );
    assert.equal(tangPhoneStatus, 'not_installed', 'SmartPhone Alpha 绝不得被误判为唐百玎HY的 手机 模组');

    // 验证 findMarketModByLocalName 在两模组并存（且 手机 排在前）时仍能精准命中 万能的智能手机
    const matchedSmartphoneMarket = context.dolModMarket.findMarketModByLocalName('SmartPhone Alpha', [
        { name: '手机', version: '0.1.0', githubUrl: 'https://github.com/HCPTangHY/DOL-PhoneMod', author: '唐百玎HY', description: '可以网购和聊天' },
        { name: '万能的智能手机', version: 'v0.3.85', githubUrl: 'https://github.com/ANLINSTUDIO/Degrees-of-Lewdity-DolSmartPhone', author: 'NEEDMEET 遇欲', description: '在此模组中...' }
    ]);
    assert.equal(matchedSmartphoneMarket?.name, '万能的智能手机', 'SmartPhone Alpha 必须精准关联 万能的智能手机，绝不能被位置靠前的 手机 拦截');

    // DomRobin 必须精准匹配 Wiki 的“Dom罗宾”
    const robinStatus = checkStatus(
        { name: 'Dom罗宾', version: '1.0.0', githubUrl: 'https://github.com/ZeroRing233/Degrees-of-Lewdity-RobinMod' },
        userMods
    );
    assert.equal(robinStatus, 'up_to_date', 'DomRobin 必须成功匹配 Dom罗宾 并识别为已安装');

    // maplebirch 必须精准匹配 Wiki 的“秋枫白桦框架”
    const mbStatus = checkStatus(
        { name: '秋枫白桦框架', version: '1.2.0', githubUrl: 'https://github.com/MaplebirchLeaf/SCML-DOL-maplebirchframework' },
        userMods
    );
    assert.equal(mbStatus, 'up_to_date', 'maplebirch 必须成功匹配 秋枫白桦框架');
    assert.equal(checkStatus(
        { name: '秋枫白桦框架', version: 'vmaplebirch-release-v4.3.5', githubUrl: 'https://github.com/MaplebirchLeaf/SCML-DOL-maplebirchframework' },
        userMods
    ), 'update_available', '秋枫白桦远程发布标签带仓库前缀时仍须检测到新版');

    // WovenRealmCookingAddon 必须精准匹配“织境空间-料理扩展”，且不能被主模组“织境空间”误认
    const cookingAddonStatus = checkStatus(
        { name: '织境空间-料理扩展', version: '1.0.0', githubUrl: 'https://github.com/Kanna-hanabi/WovenRealm' },
        userMods
    );
    assert.equal(cookingAddonStatus, 'up_to_date', 'WovenRealmCookingAddon 必须成功匹配 料理扩展');

    const mainRealmStatus = checkStatus(
        { name: '织境空间', version: '1.0.0', githubUrl: 'https://github.com/Kanna-hanabi/WovenRealm' },
        userMods
    );
    assert.notEqual(mainRealmStatus, 'up_to_date', '本地只装了料理扩展时，主模组织境空间不应被误判为已安装');

    // DOLArcadeExpansion 必须精准匹配“遊戲廳拓展”
    const arcadeStatus = checkStatus(
        { name: '遊戲廳拓展', version: '1.0.2', githubUrl: 'https://github.com/chris81605/DOLArcadeExpansion' },
        userMods
    );
    assert.equal(arcadeStatus, 'up_to_date', 'DOLArcadeExpansion 必须成功匹配 遊戲廳拓展');

    // 14.11 验证模组市场筛选重置闭环（resetFilters / filterInstalledOnly / filterUpdatableOnly）
    assert.equal(typeof context.dolModMarket.resetFilters, 'function', '必须导出 resetFilters 方法');
    assert.equal(typeof context.dolModMarket.filterInstalledOnly, 'function', '必须导出 filterInstalledOnly 方法');
    assert.equal(context.dolModMarket.isStatsFilterActive('all'), true, '默认应高亮社区收录');
    context.dolModMarket.filterInstalledOnly();
    assert.equal(context.dolModMarket.isStatsFilterActive('installed'), true, '已安装筛选应高亮本地已装');
    assert.equal(context.dolModMarket.isStatsFilterActive('all'), false, '已安装筛选时不应继续高亮社区收录');
    context.dolModMarket.filterUpdatableOnly();
    assert.equal(context.dolModMarket.isStatsFilterActive('updatable'), true, '更新筛选应高亮发现新版');
    context.dolModMarket.resetFilters();
    assert.equal(context.dolModMarket.isStatsFilterActive('all'), true, '返回全部后应恢复社区收录高亮');
    assert.ok(css.includes('#dolOptMarketStats .dol-opt-stat-card.is-selected'), '市场统计卡片必须提供选中态样式');

    const readmeBody = { innerHTML: '' };
    context.document.getElementById = id => id === 'dolOptReadmeBody' ? readmeBody : null;
    context.dolOptGetGui = () => ({ getModTReadMe: async () => '<<没有ReadMe>>' });
    context.dolOptGetModInfo = () => ({ bootJson: { version: '1.0.4' } });
    let readmeMarketMatchCalls = 0;
    let readmeMarketLoadCalls = 0;
    const readmeMarketEntry = {
        author: '测试作者',
        description: '来自模组市场的简要说明',
        githubUrl: 'https://github.com/example/readme-test'
    };
    context.dolModMarket.findMarketModByLocalName = () => ++readmeMarketMatchCalls > 1 ? readmeMarketEntry : null;
    context.dolModMarket.loadMarketData = async () => {
        readmeMarketLoadCalls++;
        return [readmeMarketEntry];
    };
    context.dolModMarket.fetchGithubReadme = async () => null;
    await context.dolOptLoadReadme('ReadmeTest');
    assert.equal(readmeMarketLoadCalls, 1, 'ReadMe 首次匹配失败时必须自动加载市场身份数据后重试');
    assert.ok(readmeBody.innerHTML.includes('此模组没有说明文档。'));
    assert.ok(readmeBody.innerHTML.includes('来自模组市场的简要说明'));
    assert.ok(readmeBody.innerHTML.includes('测试作者'));
    assert.ok(readmeBody.innerHTML.includes('访问模组仓库'));

    context.dolModMarket.fetchGithubReadme = async repositoryUrl => {
        assert.equal(repositoryUrl, readmeMarketEntry.githubUrl);
        return {
            markdown: '# 仓库说明\n远程 README 正文',
            downloadUrl: 'https://raw.githubusercontent.com/example/readme-test/main/README.md',
            sourceUrl: 'https://github.com/example/readme-test/blob/main/README.md'
        };
    };
    await context.dolOptLoadReadme('ReadmeTest');
    assert.ok(readmeBody.innerHTML.includes('以下说明来自'));
    assert.ok(readmeBody.innerHTML.includes('远程 README 正文'));
    assert.ok(!readmeBody.innerHTML.includes('此模组没有说明文档。'));

    context.dolOptGetModInfo = () => ({
        bootJson: { version: '1.0.4', repository: 'https://github.com/example/boot-repository' }
    });
    context.dolModMarket.findMarketModByLocalName = () => null;
    context.dolModMarket.loadMarketData = async () => { throw new Error('offline'); };
    context.dolModMarket.fetchGithubReadme = async () => null;
    await context.dolOptLoadReadme('BootRepositoryTest');
    assert.ok(readmeBody.innerHTML.includes('https://github.com/example/boot-repository'), '市场离线时必须优先保留 boot.json 自带仓库跳转');
    // 14.12 验证窗口级全局拖拽守护器注册
    assert.equal(typeof context.dolOptInitGlobalDragDrop, 'function', '必须导出 dolOptInitGlobalDragDrop 全局拖拽守护函数');

    // 14.13 验证 boot.json 版本号基准与脚本注册
    assert.equal(bootJson.version, '1.1.0', 'boot.json 版本号必须为 1.1.0');
    assert.ok(bootJson.scriptFileList.includes('javascript/dol-mod-market.js'), 'boot.json 必须注册 dol-mod-market.js');

    // 14.14 验证按钮长按手势与防二次短按误触
    assert.equal(typeof context.dolOptBindLongPressMove, 'function', '必须导出 dolOptBindLongPressMove 方法');
    function createMockBtn() {
        const listeners = {};
        return {
            classList: {
                classes: new Set(),
                add(c) { this.classes.add(c); },
                remove(c) { this.classes.delete(c); },
                contains(c) { return this.classes.has(c); }
            },
            addEventListener(event, fn) {
                if (!listeners[event]) listeners[event] = [];
                listeners[event].push(fn);
            },
            dispatch(event, e = {}) {
                if (listeners[event]) {
                    listeners[event].forEach(fn => fn({ button: 0, clientX: 0, clientY: 0, preventDefault: () => {}, stopPropagation: () => {}, ...e }));
                }
            }
        };
    }

    let savedSetTimeout = context.setTimeout;
    let savedClearTimeout = context.clearTimeout;
    let pendingTimerCb = null;
    context.setTimeout = (cb) => {
        pendingTimerCb = cb;
        return 999;
    };
    context.clearTimeout = () => {
        pendingTimerCb = null;
    };

    try {
        // 测试场景 1: 普通短按（快速点击）触发短按回调，不触发长按
        let shortCount = 0;
        let longCount = 0;
        const btn1 = createMockBtn();
        context.dolOptBindLongPressMove(btn1, () => shortCount++, () => longCount++);
        btn1.dispatch('mousedown');
        assert.equal(typeof pendingTimerCb, 'function', '按下时应注册长按延时定时器');
        btn1.dispatch('mouseup');
        assert.equal(shortCount, 1, '短按应触发短按回调');
        assert.equal(longCount, 0, '短按不得触发长按回调');

        // 测试场景 2: 未按下即在按钮上松开鼠标（如外部拖动释放），不得触发短按
        const btnUnpressed = createMockBtn();
        let unpressedShort = 0;
        context.dolOptBindLongPressMove(btnUnpressed, () => unpressedShort++, () => {});
        btnUnpressed.dispatch('mouseup');
        assert.equal(unpressedShort, 0, '未按下按钮即触发 mouseup 不得触发短按操作');

        // 测试场景 3: 触发长按后松开原按钮，不得触发短按
        let longPressedShort = 0;
        let longPressedLong = 0;
        const btnLong = createMockBtn();
        context.dolOptBindLongPressMove(btnLong, () => longPressedShort++, () => longPressedLong++);
        btnLong.dispatch('mousedown');
        assert.equal(typeof pendingTimerCb, 'function');
        pendingTimerCb(); // 模拟长按定时器触发
        assert.equal(longPressedLong, 1, '到达阈值应触发长按置顶/置底');
        btnLong.dispatch('mouseup');
        assert.equal(longPressedShort, 0, '长按触发后释放鼠标，原按钮绝对不得触发短按');

        // 测试场景 4: 长按触发后界面重绘，释放鼠标落在新就位的同位置按钮上，绝不误触短按
        const btnReplaced = createMockBtn();
        let replacedShort = 0;
        context.dolOptBindLongPressMove(btnReplaced, () => replacedShort++, () => {});
        btnReplaced.dispatch('mouseup');
        assert.equal(replacedShort, 0, '长按置顶重绘后，落在新占据该位置的按钮上的 mouseup 绝对不得误触上移');
    } finally {
        context.setTimeout = savedSetTimeout;
        context.clearTimeout = savedClearTimeout;
    }

    console.log('Dol-Optimization v1.1.0 all tests including Cloudflare identity catalog PASSED!');
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
