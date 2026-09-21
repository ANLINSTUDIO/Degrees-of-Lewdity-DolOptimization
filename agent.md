# 原版优化 (Dol-Optimization) 智能体协作开发指南 (agent.md)

本文件适用于本项目全生命周期的功能迭代、样式优化、缺陷修复、测试打包与文档维护。后续所有接手本项目的 Agent 必须在开展工作前仔细阅读并无条件遵循本指南中的原则与规约，确保项目架构质量、原生体验与工作流的一致性。

---

## 一、 项目边界与事实来源

1. **模组基本信息**：
   - 模组全称：原版优化 (Dol-Optimization)
   - 适用平台：Degrees of Lewdity (DoL) 游戏本体，依托 ModLoader 2.x 运行时与 TweeReplacer 补丁架构。
   - 源码核心目录：`src/`（内含 `boot.json`、`javascript/`、`stylesheet/`、`twee/`、`img/`、`guide/` 等）。
2. **唯一事实来源 (Single Source of Truth)**：
   - **版本号基准**：以 `src/boot.json` 的 `"version"` 字段为唯一权威基准，严禁随意降级或生成已被废弃的历史手误版本（例如已明确废止的 0.9.1）。
   - **对外更新日志**：以项目根目录 `CHANGELOG.md` 以及 Word 文档 `原版优化 更新内容文档.docx` 为准。
   - **发布产物与存放目录（红线规约）**：
     - 本模组打包生成的所有安装包，**必须且仅允许存放于以下两个目录**：
       1. 游戏实时调试生效路径：同级 `../MOD/Dol-Optimization-v<version>.zip`；
       2. 项目发布归档路径：`release/Dol-Optimization-v<version>.zip`；
     - **严禁在根目录或其他任何文件夹遗留或生成 `.zip` 安装包**；每次打包完成后根目录必须保持干净，绝不允许残留任何散落的包体。

---

## 二、 全局开发原则与红线约束

1. **全局语言规范**：
   - 所有对话交互、任务规划、执行总结、代码注释及界面呈现，**必须统一使用规范简体中文**。
   - 专有名词保留行业标准或通用对照（如 Flex、requestAnimationFrame、ModLoader 等）。
2. **严格禁止 Emoji 表情符号（0 Emoji 红线）**：
   - 界面所有标签、按钮、日志信息、提示框、代码注释及文档中，**严禁使用任何 Emoji 表情符号**（如火箭、星星、包裹、扳手等图形符号）。
   - 每次提交或打包前，必须执行 Python Unicode 扫描，确保核心修改文件中 Emoji 计数严格为 0（除游戏原版数据中自带的男性与女性性别符号外）。
3. **DoL 原生暗黑风格与视觉梯队**：
   - 严格遵循 Degrees of Lewdity 原生暗黑文字冒险质感，复用游戏原生 CSS 灰阶变量（`--000` 到 `--900`）与原生调色体系（`.gold`、`.red`、`.green`、`.grey`、`.purple`）。
   - 杜绝使用高饱和刺眼背景、外挂 UI 框架或花哨突兀的动画，保持克制、沉稳与原生契合。
4. **全面淘汰浏览器原生弹窗**：
   - 严禁在任何交互逻辑中调用浏览器原生白底 `confirm()` 或 `alert()`。
   - 所有确认提示、模组删除、错误警告必须统一调用本项目封装的游戏原生暗黑模态对话框 `window.dolOptConfirm` 与 `window.dolOptAlert`。
5. **移动端与窄屏设备第一优先适配原则**：
   - 必须充分考虑手机端浏览器、竖屏折叠屏与窄屏窗口玩家的使用体验。
   - 所有的布局、交互控件、操作按钮、弹窗遮罩与滚动列表，必须原生支持触控手势，且在窄屏（如屏幕宽度 <= 768px 或小至 360px）下绝不能出现内容挤压变形、文字生硬截断、按钮被压缩成空块或被底部状态栏遮挡的现象。

---

## 三、 核心技术架构与交互规约

### 1. ModLoader 运行时与存储持久化
- **IndexDB 模组列表重写**：
  在 ModLoader 架构中，重写 IndexDB 旁加载模组的接口（`overwriteModIndexDBModList` / `overwriteModIndexDBHiddenModList`）归属于 `ModLoadController`，**绝不是** `ModLoaderGui` 的实例方法。
  - 获取控制器实例请使用 `window.dolOptGetController()`，已内置对 `window.modModLoadController`、`modSC2DataManager.getModLoadController()` 与 `gui.modModLoadController` 的多层寻址。
  - 持久化更新请统一调用 `await window.dolOptSaveIndexDBModList(enabledList, disabledList)`。
- **空指针与可选链保护**：
  读取模组元数据时，必须采用安全链式调用 `gui?.gModUtils?.getMod ? gui.gModUtils.getMod(modName) : null`，杜绝环境缺少工具库时引发 TypeError。

### 2. 拖拽排序与视口自动滚动引擎
- **统一拖拽驱动**：通过 `dolOptBindDragSort(ulElement, listType)` 统一接管，桌面端基于 HTML5 Drag & Drop，移动端基于 `.dol-opt-drag-handle` 触控事件。
- **边缘平滑自动滚动 (Auto-scroll)**：
  - 感应阈值设定为 `70px`，靠近边缘按距离动态缓动（2px ~ 16px/帧）。
  - 必须由 `requestAnimationFrame` 驱动，指针静止悬停在边缘时依然平滑滚动；在 `drop`、`dragend`、`touchend`、`touchcancel` 时必须彻底清理 RAF 句柄。
  - 智能解析最近的可滚动祖先容器（如 `#customOverlayContent`），极限时联动全局窗口。

### 3. 模组导入智能分流引擎
- **入口**：模组管理顶部常驻【导入模组】主按钮，支持单选或批量 Zip 文件导入。
- **单模组导入**：包含 ReadMe 时平滑跳转至【模组说明】页签；无 ReadMe 时停留在【模组管理】界面并带有金色呼吸高亮脉冲。
- **批量模组导入**：坚决不切走页面打断用户，在【模组管理】界面集中保持批量金色呼吸高亮，并弹出友好的汇总统计 Toast。

### 4. 游戏原生暗黑模态框规范 (`dolOptConfirm` / `dolOptAlert`)
- **视觉规格**：
  - 遮罩层：75% 纯黑背景 + `backdrop-filter: blur(2px)`，层级固定 `z-index: 100000`。
  - 弹窗主体：`var(--850)` 深灰黑底色 + `var(--600)` 边框 + `0 10px 30px rgba(0,0,0,0.85)` 阴影 + 入场微缩放动画。
  - 标题栏：常规操作使用 `.gold`，危险操作（删除模组）使用 `.red`。
  - 按钮体系：主操作金框高亮，危险操作红框暗红底，取消操作低调灰阶。
- **键盘操作支持**：自动聚焦主按钮，支持 `Enter` 键确认、`Escape` 键取消，点击遮罩外部区域安全退出。

### 5. 移动端与窄屏设备专属适配规范
- **触控面积与手势友好**：
  - 所有操作按钮（上移、下移、启用/禁用、删除等）移动端最小触控高度不得低于 32px，保持方正或舒适等分比例。
  - 拖拽手柄必须支持 Touch 触控事件（`touchstart` / `touchmove` / `touchend` / `touchcancel`），确保单指滑动也能流畅排序与边缘自动滚屏。
- **Flex 容器防挤压与防变形**：
  - 在操作栏或多按钮区域，必须对控制按钮应用 `flex-shrink: 0` 或 `flex: 1 1 0` 并设置 `min-width: 0`，覆盖游戏原版全局 CSS 可能造成的恶意压缩，严防【▲】【▼】消失或【禁用】文字被挤没。
- **自适应横向与纵向布局**：
  - 顶部 Tab 栏在移动端必须支持横向平滑触摸滚动（`-webkit-overflow-scrolling: touch; scrollbar-width: none;`），自适应不同设备屏宽，标签文字紧凑排布杜绝生硬断字。
  - 日志工具栏在窄屏下必须采用结构化两行排布（第一行输入框与搜索匹配计数徽章居中对齐，第二行控制按钮均分整行），最大化留出可视阅读区。
- **底部安全边距 (Safe Area) 防遮挡**：
  - 模组管理器与各类弹出层容器底部，必须显式保留至少 `60px` 的底部安全外边距或内边距（如 `.dol-opt-container` 或滚动末尾），确保页面滑动至最底端时，所有操作按钮完全脱离游戏底层原生悬浮状态栏、版本号文字以及移动端系统手势条的遮挡。
- **模态对话框窄屏自适应**：
  - `dol-opt-modal-dialog` 宽度必须采用自适应流式设定（如 `width: 100%; max-width: 440px;`），在窄屏下留出 16px 边距，按钮排列在空间不足时支持弹性伸缩。

### 6. 网站与 Mod 数据接口同步规范
- **统一索引入口**：模组市场版本数据以 Cloudflare Worker 的 `release-index.json` 为在线事实来源，网站与 `src/javascript/dol-mod-market.js` 必须消费同一份索引结构。
- **变更必须同步审查**：凡修改网站的索引字段、地址、身份映射或版本判定逻辑，必须在同一任务中同步检查并调整 Mod 端解析与测试；不得只更新网站而遗留 Mod 端失配。
- **离线回退链路**：Mod 必须保留“Cloudflare 统一索引 -> 浏览器最后成功缓存 -> Wiki 直连 -> 内置别名映射”的容错顺序，任何网站故障或国内网络波动均不得阻断模组市场打开。
- **契约测试**：每次网站索引结构调整后，必须在 `src/test-smart-sort.js` 中更新统一索引契约测试，覆盖版本号、仓库地址、身份别名与分类字段。

---

## 四、 自动化测试与验证门槛

在对任何代码或配置做出更改后，必须依次完成以下自动化验证：

1. **单元测试验证**：
   - 命令：`node src/test-smart-sort.js`
   - 校验范围：智能依赖排序、拖拽重排逻辑、单/多模组导入分流、ModLoadController 持久化、模组禁用/启用切换、模组删除、原生模态框状态判定、`boot.json` 版本号匹配。
   - 门槛：**100% 全部通过**。
2. **0 Emoji 字符集扫描**：
   - 运行 Python 脚本对改动文件进行 Unicode 扫描，确保 `(0x1F300 <= cp <= 0x1FAFF)` 与常用图形符号区间字符数为 0。
3. **真实性验证**：
   - 严禁臆测未经验证的功能已经生效，每次输出前确认产物已落盘。
4. **网站测试验证**：
   - 只要改动 `dolmod-site/`、在线索引、身份目录或 Worker 接口，必须在 `dolmod-site/` 中执行 `npm test`。
   - 发布前必须执行 `npm run build`，并确认 `dist/index.html`、`dist/mod-identities.json` 与 `dist/server/index.js` 等部署产物完整。

---

## 五、 版本升级与打包发布流程

当需要发布新版本（例如升级版本号）或生成调试包时，严格遵循以下标准作业程序：

1. **版本号递增（若发布新版）**：
   - 修改 `src/boot.json` 中的 `"version"` 字段。
   - 同步更新 `src/test-smart-sort.js` 中的版本号断言。
2. **自动化打包与双目录归档（仅限 release 与 MOD，严禁放别处）**：
   - 执行根目录打包脚本：`python pack.py`。
   - 脚本自动压缩 `src/` 目录中的全部条目，直接输出至项目发布归档目录 `release/Dol-Optimization-v<version>.zip`。
   - 保持 Zip 根目录扁平规范（`boot.json` 直接位于根目录，包含 `javascript/`、`stylesheet/`、`twee/`、`img/`、`guide/` 等全部必需文件与目录条目）。
   - 自动校验包体完整性（Zip 内部测试、清单比对、正斜杠路径验证等）。
3. **同步至游戏目录与旧包清理**：
   - 脚本自动将新生成的包精确同步拷贝至 `c:/Users/JohnLiao/OneDrive/娱乐时间/其它/NSFW/游戏/DoL/MOD/Dol-Optimization-v<version>.zip` 并校验内容一致性。
   - 自动清理 `../MOD/` 与 `release/` 目录中的旧版 `Dol-Optimization-v*.zip` 压缩包，确保两个目录均只保留当前最新的单一版本包。
   - 自动扫描并清理项目根目录下可能遗留的任何 `.zip` 文件，确保产物绝不出现在 release 和 MOD 以外的任何地方。

### 网站与 Worker 部署（不得遗漏）

当本次交付修改了 `dolmod-site/`、在线索引、身份目录或 README 代理接口，并且用户要求发布或上线时，完成测试与构建后必须部署以下三个独立目标：

1. **Cloudflare Pages 主站**：
   - 在 `dolmod-site/` 中执行 `npx wrangler pages deploy dist --project-name dolmod-catalog-pages`。
   - `https://dolmod-catalog-pages.pages.dev` 是身份目录与 Sites 转发层使用的权威静态来源，修改 `dist/` 后不得只部署其他镜像而遗漏此处。
2. **Sites 镜像站**：
   - 依据 `dolmod-site/.openai/hosting.json` 中的既有 `project_id`，使用 Sites 托管流程发布当前已提交源码。
   - 必须复用现有站点，严禁创建重复站点或擅自改变访问范围。
3. **Cloudflare Release Worker**：
   - 在 `dolmod-site/` 中使用现有 `wrangler.jsonc` 执行 `npx wrangler deploy`。
   - 严禁把令牌、写入凭据或其他秘密写入仓库、远端地址、配置文件或交付说明。
3. **线上验收**：
   - Cloudflare Pages 主站与 Sites 镜像部署成功后分别确认正式 URL。
   - Worker 部署成功后检查 `/health` 与 `/release-index.json`；新增或修改接口时，还必须对对应线上接口执行最小真实请求。
   - 只有“模组安装包已生成并校验、Pages 主站已部署、Sites 镜像已部署、Worker 已部署、线上接口已验证”五项全部完成，才能对用户报告发布完成；任何一项未执行或失败都必须明确说明。

---

## 六、 更新日志维护规范

每次版本更新完成后，必须同步维护两处更新记录：

### 1. 项目根目录 `CHANGELOG.md`
- 采用 GitHub 标准 Markdown 格式，按版本由新到旧倒序追加。
- 涵盖：新功能、优化性更新、漏洞修复三大类目。

### 2. Word 格式文档 `原版优化 更新内容文档.docx`
- **插入位置**：使用 `python-docx`，将新版本内容插入在第一段标题（`Title`）之后、上一版本大标题（`Heading 1`）之前。
- **排版与样式规范**：
  - 版本总标题：样式为 `Heading 1`（如 `【1.0.9.2】拖拽排序、原生暗黑对话框与稳定性增强`）。
  - 发布时间：样式为 `Normal`（格式 `YYYY.MM.DD HH:mm`）。
  - **分类小标题居中规范**：
    `=== 新功能 ===`、`=== 优化性更新 ===`、`=== 漏洞修复 ===` **必须设置为居中排布**（`paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER`）。
  - 详细内容条目：样式为 `Normal`，且**必须添加 Word 原生项目符号**（`numPr`: `numId=10`, `ilvl=0`，即实心圆点列表），行文严谨、专业、详尽，与历史版本视觉样式保持完全一致。
  - 版本末尾留空：每个版本区块结束时保留 2 个空段落（`Normal`）与下一版本形成舒适留白。
