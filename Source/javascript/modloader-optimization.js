/**
 * Dol-Optimization - 模组加载器优化与增强模块
 * 提供基于游戏内置界面的模组管理、美化包排序、ReadMe 查看与通用运行设置
 */

// 统一 Toast 提示
window.dolOptShowToast = function(message, type = '') {
    let toast = document.getElementById('dolOptToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'dolOptToast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = 'toast ' + type + ' show';
    if (window._dolOptToastTimer) clearTimeout(window._dolOptToastTimer);
    window._dolOptToastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
};

// 工具函数：获取 ModLoader Gui 实例
window.dolOptGetGui = function() {
    return window.modLoaderGui || window.modLoaderGuiInstance || null;
};

// 工具函数：转义 HTML
window.dolOptEscapeHtml = function(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

// 简单 Markdown 解析器（用于 ReadMe 渲染）
window.dolOptRenderMarkdown = function(md) {
    if (!md) return '';
    let html = window.dolOptEscapeHtml(md);

    // 代码块
    html = html.replace(/```([\s\S]*?)```/g, '<pre class="dol-opt-code-block"><code>$1</code></pre>');
    // 行内代码
    html = html.replace(/`([^`]+)`/g, '<code class="dol-opt-inline-code">$1</code>');
    // 标题
    html = html.replace(/^### (.*$)/gim, '<h4 class="dol-opt-h4">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 class="dol-opt-h3">$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h2 class="dol-opt-h2">$1</h2>');
    // 粗体 / 斜体
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    // 无序列表
    html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li class="dol-opt-li">$1</li>');
    html = html.replace(/(<li class="dol-opt-li">.*<\/li>(\n|.)*?)(?=(<h|<p|<pre|$))/g, '<ul class="dol-opt-ul">$1</ul>');
    // 换行
    html = html.replace(/\n\n+/g, '<br><br>');
    html = html.replace(/\n/g, '<br>');

    return html;
};

/* =========================================================================
 * 1. 通用模块 (General)
 * ========================================================================= */
window.initGeneral = function() {
    const gui = window.dolOptGetGui();

    // 重新载入按钮
    const btnRestart = document.getElementById('btnRestart');
    if (btnRestart) {
        btnRestart.onclick = () => {
            window.dolOptShowToast('🔄 正在重新载入游戏...', 'warning');
            setTimeout(() => {
                location.reload();
            }, 500);
        };
    }

    // 安全模式切换
    const safeModeSection = document.getElementById('safeModeSection');
    const toggleSafeMode = document.getElementById('toggleSafeMode');
    if (safeModeSection && toggleSafeMode && gui && gui.modLoadSwitch) {
        const isSafe = gui.modLoadSwitch.isSafeModeOn();
        toggleSafeMode.checked = isSafe;
        if (isSafe) {
            safeModeSection.classList.add('active-safe');
        } else {
            safeModeSection.classList.remove('active-safe');
        }

        toggleSafeMode.onchange = async () => {
            try {
                if (toggleSafeMode.checked) {
                    safeModeSection.classList.add('active-safe');
                    await gui.modLoadSwitch.enableSafeMode();
                    window.dolOptShowToast('🛡️ 安全模式已开启（刷新后仅加载签名模组）', 'success');
                } else {
                    safeModeSection.classList.remove('active-safe');
                    await gui.modLoadSwitch.disableSafeMode();
                    window.dolOptShowToast('🔓 安全模式已关闭（刷新后允许所有模组）', 'warning');
                }
            } catch (err) {
                console.error('[DolOptimization] 切换安全模式失败', err);
                window.dolOptShowToast('切换安全模式失败: ' + err.message, 'warning');
            }
        };
    }

    // 拖放及文件选择上传模组
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    if (dropZone && fileInput) {
        dropZone.ondragover = (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('drag-over');
        };
        dropZone.ondragleave = (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('drag-over');
        };
        dropZone.ondrop = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('drag-over');
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                fileInput.files = e.dataTransfer.files;
                await window.dolOptHandleAddMod(fileInput);
            }
        };
        dropZone.onclick = (e) => {
            if (e.target === fileInput) return;
            fileInput.click();
        };
        fileInput.onchange = async () => {
            await window.dolOptHandleAddMod(fileInput);
        };
    }

    // 加载环境统计信息
    window.dolOptUpdateGeneralInfo();
};

window.dolOptUpdateGeneralInfo = async function() {
    const gui = window.dolOptGetGui();
    const infoEl = document.getElementById('dolOptEnvInfo');
    if (!infoEl) return;

    try {
        const mlVersion = gui?.gModUtils?.version || window.modUtils?.version || '2.x';
        const allMods = gui?.gModUtils?.getModListNameNoAlias() || [];
        const sideLoadMods = gui ? await gui.listSideLoadModNameOnly() : [];
        const hiddenSideMods = gui ? await gui.listSideLoadHiddenModNameOnly() : [];

        infoEl.innerHTML = `
            <div class="dol-opt-stat-card">
                <span class="dol-opt-stat-num">${allMods.length}</span>
                <span class="dol-opt-stat-label">已加载模组</span>
            </div>
            <div class="dol-opt-stat-card">
                <span class="dol-opt-stat-num">${sideLoadMods.length}</span>
                <span class="dol-opt-stat-label">旁加载已启用</span>
            </div>
            <div class="dol-opt-stat-card">
                <span class="dol-opt-stat-num">${hiddenSideMods.length}</span>
                <span class="dol-opt-stat-label">旁加载已禁用</span>
            </div>
            <div class="dol-opt-stat-card">
                <span class="dol-opt-stat-num">${mlVersion}</span>
                <span class="dol-opt-stat-label">ModLoader 版本</span>
            </div>
        `;
    } catch (e) {
        console.error('[DolOptimization] 获取统计信息失败', e);
    }
};

window.dolOptHandleAddMod = async function(fileInput) {
    const gui = window.dolOptGetGui();
    if (!gui) {
        window.dolOptShowToast('❌ 未找到模组管理器实例', 'warning');
        return;
    }
    if (!fileInput.files || fileInput.files.length === 0) return;

    window.dolOptShowToast('⏳ 正在解析并导入模组文件...', 'warning');
    try {
        await gui.loadAndAddMod(fileInput);
        window.dolOptShowToast('✅ 模组导入成功！请点击【重新载入】以生效。', 'success');
        fileInput.value = '';
        window.dolOptUpdateGeneralInfo();
    } catch (e) {
        console.error('[DolOptimization] 添加模组失败', e);
        window.dolOptShowToast('❌ 添加模组失败: ' + (e.message || e), 'warning');
    }
};


/* =========================================================================
 * 2. 模组管理模块 (Mod Manager)
 * ========================================================================= */
window.initModManage = async function() {
    const container = document.getElementById('dolOptModManageContainer');
    if (!container) return;

    const gui = window.dolOptGetGui();
    if (!gui) {
        container.innerHTML = '<div class="mod-empty">无法获取 ModLoader 实例，请按 Alt+M 打开原版管理界面。</div>';
        return;
    }

    container.innerHTML = '<div class="mod-empty">⏳ 正在读取模组列表...</div>';

    try {
        const sideEnabled = await gui.listSideLoadModNameOnly();
        const sideDisabled = await gui.listSideLoadHiddenModNameOnly();
        const allLoaded = gui.gModUtils.getModListNameNoAlias();

        // 区分内置模组与旁加载模组
        const sideSet = new Set([...sideEnabled, ...sideDisabled]);
        const builtInMods = allLoaded.filter(name => !sideSet.has(name));

        window._dolOptModState = {
            sideEnabled: [...sideEnabled],
            sideDisabled: [...sideDisabled],
            builtInMods: [...builtInMods]
        };

        await window.dolOptLoadBeautyState();
        window.dolOptRenderModManageUI();
    } catch (e) {
        console.error('[DolOptimization] 读取模组列表异常', e);
        container.innerHTML = `<div class="mod-empty">读取模组列表失败：${window.dolOptEscapeHtml(e.message)}</div>`;
    }
};

window.dolOptRenderModManageUI = function() {
    const container = document.getElementById('dolOptModManageContainer');
    if (!container || !window._dolOptModState) return;

    const sectionStates = new Map([...container.querySelectorAll('details[data-section]')].map(detail => [detail.dataset.section, detail.open]));
    const isSectionOpen = (name, defaultOpen = false) => sectionStates.has(name) ? sectionStates.get(name) : defaultOpen;
    const gui = window.dolOptGetGui();
    const { sideEnabled, sideDisabled, builtInMods } = window._dolOptModState;
    const beautyCount = (window._dolOptBeautyState?.enabledList.length || 0) + (window._dolOptBeautyState?.disabledList.length || 0);

    let html = '';

    // 提示条
    html += `
        <div class="dol-opt-hint-bar">
            💡 提示：智能整理会同时调整旁加载模组的加载顺序与美化包的覆盖顺序；仅采用 boot.json 中明确声明的依赖关系，无关项保持原顺序。
        </div>
    `;

    html += `
        <div class="dol-opt-group-header">
            <span>🧩 模组与美化顺序管理</span>
            <button id="dolOptSmartSortAllBtn" class="dol-opt-btn btn-success" type="button" title="根据明确依赖，同时整理旁加载模组的加载顺序和美化包的覆盖顺序" onclick="window.dolOptSmartSortAll()">🪄 智能整理模组与美化顺序</button>
        </div>
        <details class="dol-opt-collapsible-section" data-section="side"${isSectionOpen('side', true) ? ' open' : ''}>
            <summary class="dol-opt-section-summary">📦 旁加载模组 - 共 ${sideEnabled.length + sideDisabled.length} 个（点击展开/收起）</summary>
            <div class="dol-opt-section-content">
    `;

    // 分组 1: 旁加载模组（可排序、启用禁用、删除）
    if (sideEnabled.length === 0 && sideDisabled.length === 0) {
        html += '<div class="mod-empty">当前暂无旁加载模组，可在【通用】页面中添加 Zip 模组。</div>';
    } else {
        html += '<ul class="dol-opt-list">';
        // 渲染已启用
        sideEnabled.forEach((modName, index) => {
            const modInfo = gui.gModUtils.getMod(modName);
            const version = modInfo?.bootJson?.version || '';
            html += `
                <li class="dol-opt-item">
                    <span class="dol-opt-status-badge badge-enabled">已启用</span>
                    <div class="dol-opt-item-main">
                        <div class="dol-opt-item-title">${window.dolOptEscapeHtml(modName)}</div>
                        <div class="dol-opt-item-desc">${version ? 'v' + window.dolOptEscapeHtml(version) : ''} | 旁加载</div>
                    </div>
                    <div class="dol-opt-btn-group">
                        <button class="dol-opt-btn" title="上移（提高加载优先级）" onclick="window.dolOptMoveSideMod(${index}, -1)">▲</button>
                        <button class="dol-opt-btn" title="下移（降低加载优先级）" onclick="window.dolOptMoveSideMod(${index}, 1)">▼</button>
                        <button class="dol-opt-btn btn-warn" title="禁用该模组" onclick="window.dolOptToggleSideMod('${window.dolOptEscapeHtml(modName)}', false)">禁用</button>
                        <button class="dol-opt-btn btn-danger" title="永久删除该模组" onclick="window.dolOptDeleteSideMod('${window.dolOptEscapeHtml(modName)}')">🗑️</button>
                    </div>
                </li>
            `;
        });

        // 渲染已禁用
        sideDisabled.forEach((modName) => {
            html += `
                <li class="dol-opt-item item-disabled">
                    <span class="dol-opt-status-badge badge-disabled">已禁用</span>
                    <div class="dol-opt-item-main">
                        <div class="dol-opt-item-title">${window.dolOptEscapeHtml(modName)}</div>
                        <div class="dol-opt-item-desc">未参与加载 | 旁加载</div>
                    </div>
                    <div class="dol-opt-btn-group">
                        <button class="dol-opt-btn btn-success" title="启用该模组" onclick="window.dolOptToggleSideMod('${window.dolOptEscapeHtml(modName)}', true)">启用</button>
                        <button class="dol-opt-btn btn-danger" title="永久删除该模组" onclick="window.dolOptDeleteSideMod('${window.dolOptEscapeHtml(modName)}')">🗑️</button>
                    </div>
                </li>
            `;
        });
        html += '</ul>';
    }
    html += '</div></details>';

    // 分组 2: 美化图像包（来自旁加载模组，可独立控制覆盖顺序）
    html += `
        <details class="dol-opt-collapsible-section" data-section="beauty"${isSectionOpen('beauty') ? ' open' : ''}>
            <summary class="dol-opt-section-summary">🎨 美化图像包 - 共 ${beautyCount} 个（点击展开/收起）</summary>
            <div id="dolOptBeautyContainer" class="dol-opt-section-content"></div>
        </details>
    `;

    // 分组 3: 内置模组列表（只读展示）
    html += `
        <details class="dol-opt-collapsible-section" data-section="core"${isSectionOpen('core') ? ' open' : ''}>
            <summary class="dol-opt-section-summary">🔒 内置与核心模组 - 共 ${builtInMods.length} 个（点击展开/收起）</summary>
            <div class="dol-opt-section-content">
                <ul class="dol-opt-list">
    `;

    builtInMods.forEach(modName => {
        const modInfo = gui.gModUtils.getMod(modName);
        const version = modInfo?.bootJson?.version || '';
        html += `
            <li class="dol-opt-item item-readonly">
                <span class="dol-opt-status-badge badge-builtin">内置</span>
                <div class="dol-opt-item-main">
                    <div class="dol-opt-item-title">${window.dolOptEscapeHtml(modName)}</div>
                    <div class="dol-opt-item-desc">${version ? 'v' + window.dolOptEscapeHtml(version) : ''} | 系统组件</div>
                </div>
            </li>
        `;
    });
    html += '</ul></div></details>';

    container.innerHTML = html;
    window.dolOptRenderBeautyUI();
};

window.dolOptOfferReload = function(message) {
    if (!confirm(`${message}\n\n是否立即重新加载游戏？`)) return;
    window.dolOptShowToast('🔄 正在重新载入游戏...', 'warning');
    setTimeout(() => location.reload(), 300);
};

window.dolOptBuildSmartOrder = async function(nodes, gui, dependentsFirst = false) {
    const keys = nodes.map(node => node.key);
    const positions = new Map(keys.map((key, index) => [key, index]));
    const dependencies = new Map(keys.map(key => [key, new Set()]));
    const nodesByMod = new Map();
    nodes.forEach(node => {
        if (!node.modName) return;
        if (!nodesByMod.has(node.modName)) nodesByMod.set(node.modName, []);
        nodesByMod.get(node.modName).push(node);
    });

    const bootByMod = new Map();
    const aliases = [];
    nodesByMod.forEach((modNodes, modName) => {
        const boot = modNodes.find(node => node.boot)?.boot || gui?.gModUtils?.getMod(modName)?.bootJson || {};
        bootByMod.set(modName, boot);
        const nickNames = boot.nickName && typeof boot.nickName === 'object' ? Object.values(boot.nickName) : [];
        [modName, ...nickNames].filter(Boolean).forEach(alias => aliases.push([String(alias).trim().toLowerCase(), modName]));
    });

    const resolveModName = value => aliases.find(([alias]) => alias === String(value || '').trim().toLowerCase())?.[1];
    const relations = new Set();
    const addModDependency = (modName, dependencyName) => {
        if (!dependencyName || dependencyName === modName || !nodesByMod.has(dependencyName)) return;
        const relation = `${modName}\u0000${dependencyName}`;
        if (relations.has(relation)) return;
        relations.add(relation);
        nodesByMod.get(modName).forEach(node => nodesByMod.get(dependencyName).forEach(required => {
            if (dependentsFirst) dependencies.get(required.key).add(node.key);
            else dependencies.get(node.key).add(required.key);
        }));
    };

    nodesByMod.forEach((_, modName) => {
        const boot = bootByMod.get(modName);
        [...(boot.dependenceInfo || []), ...(boot.addonPlugin || [])].forEach(item => addModDependency(modName, resolveModName(item.modName)));
    });

    const followers = new Map(keys.map(key => [key, []]));
    const indegree = new Map(keys.map(key => [key, dependencies.get(key).size]));
    dependencies.forEach((required, key) => required.forEach(requiredKey => followers.get(requiredKey).push(key)));
    const ready = keys.filter(key => indegree.get(key) === 0);
    const sortedKeys = [];
    while (ready.length) {
        ready.sort((a, b) => positions.get(a) - positions.get(b));
        const key = ready.shift();
        sortedKeys.push(key);
        followers.get(key).forEach(follower => {
            indegree.set(follower, indegree.get(follower) - 1);
            if (indegree.get(follower) === 0) ready.push(follower);
        });
    }
    return { sortedKeys, relationCount: relations.size, cycle: sortedKeys.length !== keys.length };
};

window.dolOptSmartSortAll = async function() {
    const modState = window._dolOptModState;
    const beautyState = window._dolOptBeautyState;
    const gui = window.dolOptGetGui();
    if (!modState || !gui) {
        window.dolOptShowToast('无法读取模组列表', 'warning');
        return;
    }

    const button = document.getElementById('dolOptSmartSortAllBtn');
    if (button) { button.disabled = true; button.textContent = '⏳ 分析中...'; }
    try {
        const changes = [];
        const notes = [];
        let modPlan;
        let beautyPlan;

        if (modState.sideEnabled.length >= 2) {
            const before = [...modState.sideEnabled];
            const result = await window.dolOptBuildSmartOrder(before.map(name => ({ key: name, modName: name })), gui);
            const moved = result.cycle ? 0 : result.sortedKeys.filter((name, index) => name !== before[index]).length;
            if (result.cycle) notes.push('旁加载模组存在循环依赖，已保留原顺序');
            else if (!result.relationCount) notes.push(`${before.length} 个旁加载模组中未发现明确依赖`);
            else if (!moved) notes.push(`${before.length} 个旁加载模组中识别到 ${result.relationCount} 条明确依赖，当前顺序已符合`);
            else modPlan = { before, after: result.sortedKeys, moved, relations: result.relationCount };
        }

        if (beautyState?.enabledList.length >= 2) {
            const before = [...beautyState.enabledList];
            const result = await window.dolOptBuildSmartOrder(before.map(item => ({
                key: item.type,
                modName: item.modRef?.name,
                boot: item.modRef?.bootJson
            })), gui, true);
            const moved = result.cycle ? 0 : result.sortedKeys.filter((type, index) => type !== before[index].type).length;
            if (result.cycle) notes.push('美化包存在循环依赖，已保留原顺序');
            else if (!result.relationCount) notes.push(`${before.length} 个美化包中未发现明确依赖`);
            else if (!moved) notes.push(`${before.length} 个美化包中识别到 ${result.relationCount} 条明确依赖，当前顺序已符合`);
            else {
                const itemByType = new Map(before.map(item => [item.type, item]));
                beautyPlan = { before, after: result.sortedKeys.map(type => itemByType.get(type)), moved, relations: result.relationCount };
            }
        }

        if (modPlan) {
            modState.sideEnabled = modPlan.after;
            if (await window.dolOptSaveModManageState(false)) changes.push(`旁加载模组调整 ${modPlan.moved} 项`);
            else modState.sideEnabled = modPlan.before;
        }
        if (beautyPlan) {
            beautyState.enabledList = beautyPlan.after;
            if (await window.dolOptSaveBeautyState(false)) changes.push(`美化包调整 ${beautyPlan.moved} 项`);
            else beautyState.enabledList = beautyPlan.before;
        }

        window.dolOptRenderModManageUI();
        if (!changes.length) {
            window.dolOptShowToast(notes.join('；') || '当前没有足够的已启用项目可供整理', 'success');
            return;
        }
        const message = `智能整理完成：${changes.join('；')}。`;
        window.dolOptShowToast(`🪄 ${message}`, 'success');
        window.dolOptOfferReload(message);
    } catch (e) {
        console.error('[DolOptimization] 智能排序失败', e);
        window.dolOptShowToast('智能排序失败: ' + (e.message || e), 'warning');
    } finally {
        if (button?.isConnected) { button.disabled = false; button.textContent = '🪄 智能整理模组与美化顺序'; }
    }
};

// 旁加载模组移动
window.dolOptMoveSideMod = async function(index, delta) {
    const state = window._dolOptModState;
    if (!state) return;
    const targetIndex = index + delta;
    if (targetIndex < 0 || targetIndex >= state.sideEnabled.length) return;

    const temp = state.sideEnabled[index];
    state.sideEnabled[index] = state.sideEnabled[targetIndex];
    state.sideEnabled[targetIndex] = temp;

    await window.dolOptSaveModManageState();
    window.dolOptRenderModManageUI();
};

// 旁加载模组启用/禁用切换
window.dolOptToggleSideMod = async function(modName, enable) {
    const state = window._dolOptModState;
    if (!state) return;

    if (enable) {
        state.sideDisabled = state.sideDisabled.filter(name => name !== modName);
        if (!state.sideEnabled.includes(modName)) {
            state.sideEnabled.push(modName);
        }
    } else {
        state.sideEnabled = state.sideEnabled.filter(name => name !== modName);
        if (!state.sideDisabled.includes(modName)) {
            state.sideDisabled.push(modName);
        }
    }

    await window.dolOptSaveModManageState();
    window.dolOptRenderModManageUI();
};

// 删除旁加载模组
window.dolOptDeleteSideMod = async function(modName) {
    if (!confirm(`⚠️ 确定要删除旁加载模组【${modName}】吗？\n删除后该模组将从浏览器存储中彻底移除。`)) return;

    const gui = window.dolOptGetGui();
    if (!gui) return;

    try {
        await gui.gModUtils.getModLoadController().removeModIndexDB(modName);
        window._dolOptModState.sideEnabled = window._dolOptModState.sideEnabled.filter(n => n !== modName);
        window._dolOptModState.sideDisabled = window._dolOptModState.sideDisabled.filter(n => n !== modName);
        await window.dolOptSaveModManageState();
        window.dolOptShowToast(`🗑️ 已删除模组【${modName}】`, 'warning');
        window.dolOptRenderModManageUI();
    } catch (e) {
        console.error('[DolOptimization] 删除模组失败', e);
        window.dolOptShowToast('删除模组失败: ' + e.message, 'warning');
    }
};

// 保存模组管理状态
window.dolOptSaveModManageState = async function(showSuccess = true) {
    const gui = window.dolOptGetGui();
    if (!gui || !window._dolOptModState) return false;

    try {
        const { sideEnabled, sideDisabled } = window._dolOptModState;
        await gui.gModUtils.getModLoadController().overwriteModIndexDBModList(sideEnabled);
        await gui.gModUtils.getModLoadController().overwriteModIndexDBHiddenModList(sideDisabled);
        if (showSuccess) window.dolOptShowToast('💾 模组配置已更新，重新载入后生效', 'success');
        return true;
    } catch (e) {
        console.error('[DolOptimization] 保存模组配置异常', e);
        window.dolOptShowToast('保存配置失败: ' + e.message, 'warning');
        return false;
    }
};


/* =========================================================================
 * 3. 美化管理模块 (Beauty Selector Addon)
 * ========================================================================= */
window.dolOptLoadBeautyState = async function() {
    const bAddon = window.addonBeautySelectorAddon;
    if (!bAddon) {
        window._dolOptBeautyState = null;
        return false;
    }

    try {
        const allList = bAddon.getTypeOrder() || [];
        const enabledList = bAddon.typeOrderUsed || [];

        // 构建启用与禁用项
        const enabledTypes = new Set(enabledList.map(item => item.type));
        const disabledList = allList.filter(item => !enabledTypes.has(item.type));

        window._dolOptBeautyState = {
            enabledList: [...enabledList],
            disabledList: [...disabledList],
            allMap: new Map(allList.map(item => [item.type, item]))
        };

        return true;
    } catch (e) {
        console.error('[DolOptimization] 初始化美化管理失败', e);
        window._dolOptBeautyState = null;
        return false;
    }
};

window.dolOptRenderBeautyUI = function() {
    const container = document.getElementById('dolOptBeautyContainer');
    if (!container) return;
    if (!window._dolOptBeautyState) {
        container.innerHTML = '<div class="mod-empty">⚠️ 未检测到 BeautySelectorAddon，暂时无法管理美化图像包。</div>';
        return;
    }

    const { enabledList, disabledList } = window._dolOptBeautyState;

    let html = `
        <div class="dol-opt-hint-bar">
            🎨 提示：上方图像覆盖优先级高于下方。智能排序会将依赖方放在基础包之前，无关项保持原序。
        </div>
    `;

    // 已启用列表
    html += `
        <div class="dol-opt-group-header">
            <span>✨ 已启用的美化图像包 (${enabledList.length}) - 覆盖优先级从高到低</span>
        </div>
    `;

    if (enabledList.length === 0) {
        html += '<div class="mod-empty">当前未启用任何美化包。</div>';
    } else {
        html += '<ul class="dol-opt-list">';
        enabledList.forEach((item, index) => {
            const modName = item.modRef?.name || '未知模组';
            html += `
                <li class="dol-opt-item">
                    <span class="dol-opt-order-badge">#${index + 1}</span>
                    <div class="dol-opt-item-main">
                        <div class="dol-opt-item-title">${window.dolOptEscapeHtml(item.type)}</div>
                        <div class="dol-opt-item-desc">来自模组：[${window.dolOptEscapeHtml(modName)}]</div>
                    </div>
                    <div class="dol-opt-btn-group">
                        <button class="dol-opt-btn" title="上移（优先级更高）" onclick="window.dolOptMoveBeauty(${index}, -1)">▲</button>
                        <button class="dol-opt-btn" title="下移（优先级更低）" onclick="window.dolOptMoveBeauty(${index}, 1)">▼</button>
                        <button class="dol-opt-btn btn-warn" title="禁用该美化包" onclick="window.dolOptToggleBeauty('${window.dolOptEscapeHtml(item.type)}', false)">禁用</button>
                    </div>
                </li>
            `;
        });
        html += '</ul>';
    }

    // 已禁用列表
    html += `
        <div class="dol-opt-group-header" style="margin-top: 24px;">
            <span>💤 已禁用的美化图像包 (${disabledList.length})</span>
        </div>
    `;

    if (disabledList.length === 0) {
        html += '<div class="mod-empty">没有被禁用的美化包。</div>';
    } else {
        html += '<ul class="dol-opt-list">';
        disabledList.forEach(item => {
            const modName = item.modRef?.name || '未知模组';
            html += `
                <li class="dol-opt-item item-disabled">
                    <span class="dol-opt-status-badge badge-disabled">已停用</span>
                    <div class="dol-opt-item-main">
                        <div class="dol-opt-item-title">${window.dolOptEscapeHtml(item.type)}</div>
                        <div class="dol-opt-item-desc">来自模组：[${window.dolOptEscapeHtml(modName)}]</div>
                    </div>
                    <div class="dol-opt-btn-group">
                        <button class="dol-opt-btn btn-success" title="启用该美化包" onclick="window.dolOptToggleBeauty('${window.dolOptEscapeHtml(item.type)}', true)">启用</button>
                    </div>
                </li>
            `;
        });
        html += '</ul>';
    }

    container.innerHTML = html;
};

// 美化项排序移动
window.dolOptMoveBeauty = async function(index, delta) {
    const state = window._dolOptBeautyState;
    if (!state) return;
    const targetIndex = index + delta;
    if (targetIndex < 0 || targetIndex >= state.enabledList.length) return;

    const temp = state.enabledList[index];
    state.enabledList[index] = state.enabledList[targetIndex];
    state.enabledList[targetIndex] = temp;

    await window.dolOptSaveBeautyState();
    window.dolOptRenderBeautyUI();
};

// 美化项启用/禁用
window.dolOptToggleBeauty = async function(typeKey, enable) {
    const state = window._dolOptBeautyState;
    if (!state) return;

    const targetItem = state.allMap.get(typeKey);
    if (!targetItem) return;

    if (enable) {
        state.disabledList = state.disabledList.filter(item => item.type !== typeKey);
        if (!state.enabledList.some(item => item.type === typeKey)) {
            state.enabledList.push(targetItem);
        }
    } else {
        state.enabledList = state.enabledList.filter(item => item.type !== typeKey);
        if (!state.disabledList.some(item => item.type === typeKey)) {
            state.disabledList.push(targetItem);
        }
    }

    await window.dolOptSaveBeautyState();
    window.dolOptRenderBeautyUI();
};

// 保存美化排序与设置
window.dolOptSaveBeautyState = async function(showSuccess = true) {
    const bAddon = window.addonBeautySelectorAddon;
    const state = window._dolOptBeautyState;
    if (!bAddon || !state) return false;

    try {
        const typeOrder = state.enabledList.map(item => item.type);
        bAddon.typeOrderUsed = [...state.enabledList];
        await bAddon.saveOrder(typeOrder);
        if (showSuccess) window.dolOptShowToast('🎨 美化包排序已保存（重新载入后完全生效）', 'success');
        return true;
    } catch (e) {
        console.error('[DolOptimization] 保存美化配置失败', e);
        window.dolOptShowToast('保存美化配置失败: ' + e.message, 'warning');
        return false;
    }
};


/* =========================================================================
 * 4. Mod ReadMe 文档浏览器 (ReadMe Viewer)
 * ========================================================================= */
window.initModReadMe = function() {
    const container = document.getElementById('dolOptReadmeContainer');
    if (!container) return;

    const gui = window.dolOptGetGui();
    if (!gui) {
        container.innerHTML = '<div class="mod-empty">无法获取 ModLoader 实例。</div>';
        return;
    }

    const allMods = gui.gModUtils.getModListNameNoAlias() || [];
    window._dolOptReadmeMods = allMods;
    window._dolOptSelectedMod = allMods[0] || null;

    container.innerHTML = `
        <div class="dol-opt-readme-layout">
            <div class="dol-opt-readme-sidebar">
                <input type="text" id="dolOptReadmeSearch" class="dol-opt-search-input" placeholder="🔍 搜索模组..." />
                <ul id="dolOptReadmeModList" class="dol-opt-readme-list"></ul>
            </div>
            <div class="dol-opt-readme-content">
                <div id="dolOptReadmeBody" class="dol-opt-readme-body">
                    <div class="mod-empty">请从左侧选择要查看说明的模组</div>
                </div>
            </div>
        </div>
    `;

    const searchInput = document.getElementById('dolOptReadmeSearch');
    if (searchInput) {
        searchInput.oninput = () => {
            window.dolOptFilterReadmeList(searchInput.value.trim());
        };
    }

    window.dolOptFilterReadmeList('');
    if (window._dolOptSelectedMod) {
        window.dolOptLoadReadme(window._dolOptSelectedMod);
    }
};

window.dolOptFilterReadmeList = function(keyword) {
    const listEl = document.getElementById('dolOptReadmeModList');
    if (!listEl || !window._dolOptReadmeMods) return;

    const filtered = window._dolOptReadmeMods.filter(name => {
        if (!keyword) return true;
        return name.toLowerCase().includes(keyword.toLowerCase());
    });

    if (filtered.length === 0) {
        listEl.innerHTML = '<li class="mod-empty">无匹配模组</li>';
        return;
    }

    listEl.innerHTML = filtered.map(name => {
        const isSelected = name === window._dolOptSelectedMod;
        return `
            <li class="dol-opt-readme-mod-item ${isSelected ? 'active' : ''}" onclick="window.dolOptSelectReadmeMod('${window.dolOptEscapeHtml(name)}')">
                <span>📄</span>
                <span class="mod-name" title="${window.dolOptEscapeHtml(name)}">${window.dolOptEscapeHtml(name)}</span>
            </li>
        `;
    }).join('');
};

window.dolOptSelectReadmeMod = function(modName) {
    window._dolOptSelectedMod = modName;
    const searchInput = document.getElementById('dolOptReadmeSearch');
    window.dolOptFilterReadmeList(searchInput ? searchInput.value.trim() : '');
    window.dolOptLoadReadme(modName);
};

window.dolOptLoadReadme = async function(modName) {
    const bodyEl = document.getElementById('dolOptReadmeBody');
    if (!bodyEl) return;

    const gui = window.dolOptGetGui();
    bodyEl.innerHTML = '<div class="mod-empty">⏳ 正在读取文档...</div>';

    try {
        let readme = null;
        if (gui && typeof gui.getModTReadMe === 'function') {
            readme = await gui.getModTReadMe(modName);
        }

        const modInfo = gui?.gModUtils?.getMod(modName);
        const boot = modInfo?.bootJson || {};

        let contentHtml = `
            <div class="dol-opt-readme-header">
                <h2>${window.dolOptEscapeHtml(modName)}</h2>
                <div class="dol-opt-readme-meta">
                    <span>版本: <strong>${window.dolOptEscapeHtml(boot.version || '未知')}</strong></span>
                    ${boot.author ? `<span>作者: <strong>${window.dolOptEscapeHtml(boot.author)}</strong></span>` : ''}
                </div>
            </div>
        `;

        if (readme && readme.trim()) {
            contentHtml += `<div class="dol-opt-markdown-view">${window.dolOptRenderMarkdown(readme)}</div>`;
        } else {
            // 没有 ReadMe 时展示元数据 boot.json
            contentHtml += `
                <div class="dol-opt-meta-view">
                    <p style="color: var(--text-muted); font-style: italic;">该模组未提供 README.md 文档，以下为 boot.json 配置信息：</p>
                    <div class="dol-opt-meta-grid">
                        <div class="meta-item">
                            <span class="meta-key">模组名称</span>
                            <span class="meta-val">${window.dolOptEscapeHtml(boot.name || modName)}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-key">版本号</span>
                            <span class="meta-val">${window.dolOptEscapeHtml(boot.version || '未知')}</span>
                        </div>
                        ${boot.dependenceInfo && boot.dependenceInfo.length ? `
                            <div class="meta-item full-width">
                                <span class="meta-key">依赖项</span>
                                <span class="meta-val">
                                    ${boot.dependenceInfo.map(d => `<span class="dep-tag">${window.dolOptEscapeHtml(d.modName)} (${window.dolOptEscapeHtml(d.version)})</span>`).join(' ')}
                                </span>
                            </div>
                        ` : ''}
                        ${boot.addonPlugin && boot.addonPlugin.length ? `
                            <div class="meta-item full-width">
                                <span class="meta-key">插件扩展 (AddonPlugin)</span>
                                <span class="meta-val">
                                    ${boot.addonPlugin.map(a => `<span class="dep-tag">${window.dolOptEscapeHtml(a.modName)} / ${window.dolOptEscapeHtml(a.addonName)}</span>`).join(' ')}
                                </span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        bodyEl.innerHTML = contentHtml;
    } catch (e) {
        console.error('[DolOptimization] 读取 ReadMe 失败', e);
        bodyEl.innerHTML = `<div class="mod-empty">读取文档失败：${window.dolOptEscapeHtml(e.message)}</div>`;
    }
};

window.dolOptFindTextOffsets = function(text, query) {
    const source = String(text || '').toLocaleLowerCase();
    const needle = String(query || '').trim().toLocaleLowerCase();
    if (!needle) return [];

    const offsets = [];
    let index = 0;
    while ((index = source.indexOf(needle, index)) !== -1) {
        offsets.push(index);
        index += needle.length;
    }
    return offsets;
};

window.dolOptMoveLogMatch = function(delta = 0) {
    const matches = window._dolOptLogMatches || [];
    const status = document.getElementById('dolOptLogSearchStatus');
    if (!matches.length) {
        if (status) status.textContent = '0/0';
        return;
    }

    window._dolOptLogMatchIndex = ((window._dolOptLogMatchIndex || 0) + delta + matches.length) % matches.length;
    matches.forEach((match, index) => match.classList.toggle('active', index === window._dolOptLogMatchIndex));
    matches[window._dolOptLogMatchIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (status) status.textContent = `${window._dolOptLogMatchIndex + 1}/${matches.length}`;
};

window.dolOptSearchLoadLog = function(query) {
    const log = document.getElementById('dolOptLogContent');
    if (!log) return;
    if (window._dolOptLogOriginalHtml === undefined) window._dolOptLogOriginalHtml = log.innerHTML;
    log.innerHTML = window._dolOptLogOriginalHtml;

    const needle = String(query || '').trim();
    const matches = [];
    if (needle) {
        const walker = document.createTreeWalker(log, 4);
        const textNodes = [];
        while (walker.nextNode()) textNodes.push(walker.currentNode);
        textNodes.forEach(node => {
            const offsets = window.dolOptFindTextOffsets(node.data, needle);
            if (!offsets.length) return;

            const fragment = document.createDocumentFragment();
            let cursor = 0;
            offsets.forEach(offset => {
                fragment.append(document.createTextNode(node.data.slice(cursor, offset)));
                const mark = document.createElement('mark');
                mark.className = 'dol-opt-log-match';
                mark.textContent = node.data.slice(offset, offset + needle.length);
                fragment.append(mark);
                matches.push(mark);
                cursor = offset + needle.length;
            });
            fragment.append(document.createTextNode(node.data.slice(cursor)));
            node.parentNode.replaceChild(fragment, node);
        });
    }

    window._dolOptLogMatches = matches;
    window._dolOptLogMatchIndex = 0;
    window.dolOptMoveLogMatch();
};

window.dolOptSetLogSearch = function(query) {
    const input = document.getElementById('dolOptLogSearch');
    if (input) input.value = query;
    window.dolOptSearchLoadLog(query);
};

window.dolOptInitLogTools = function() {
    const log = document.getElementById('dolOptLogContent');
    const input = document.getElementById('dolOptLogSearch');
    if (!log || !input) return;

    window._dolOptLogOriginalHtml = log.innerHTML;
    window._dolOptLogMatches = [];
    window._dolOptLogMatchIndex = 0;
    input.oninput = () => window.dolOptSearchLoadLog(input.value);
    input.onkeydown = event => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        window.dolOptMoveLogMatch(event.shiftKey ? -1 : 1);
    };

    const text = log.textContent || '';
    const errorCount = window.dolOptFindTextOffsets(text, '[[logError]]').length;
    const warningCount = window.dolOptFindTextOffsets(text, '[[logWarning]]').length;
    const errorButton = document.getElementById('dolOptLogErrors');
    const warningButton = document.getElementById('dolOptLogWarnings');
    if (errorButton) {
        errorButton.textContent = `❌ 错误 ${errorCount}`;
        errorButton.disabled = errorCount === 0;
    }
    if (warningButton) {
        warningButton.textContent = `⚠️ 警告 ${warningCount}`;
        warningButton.disabled = warningCount === 0;
    }
};

window.dolOptCopyLoadLog = async function() {
    const log = document.getElementById('dolOptLogContent');
    const text = (log?.innerText || log?.textContent || '').trim();
    if (!text) {
        window.dolOptShowToast('暂无可复制的加载日志', 'warning');
        return;
    }

    let copied = false;
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            copied = true;
        }
    } catch (_) {}

    if (!copied) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        copied = document.execCommand('copy');
        textarea.remove();
    }

    window.dolOptShowToast(copied ? '📋 加载日志已复制' : '复制日志失败，请手动选择日志文本', copied ? 'success' : 'warning');
};
