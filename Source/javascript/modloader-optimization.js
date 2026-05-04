// 在Story JavaScript中定义全局变量和辅助函数
window.modLoaderGuiInstance = window.modLoaderGui;

// 辅助函数：获取模组列表数据
window.getModData = async function() {
    const gui = window.modLoaderGuiInstance;
    if (!gui) return null;
    
    const loadedMods = gui.getModListString();
    const sideLoadMods = await gui.listSideLoadMod2();
    const allMods = gui.gModUtils.getModListName();
    const beautyAddons = await window.getBeautyAddons();
    
    return {
        loadedMods,
        sideLoadMods,
        allMods,
        beautyAddons,
        safeMode: gui.modLoadSwitch?.isSafeModeOn() || false
    };
};

// 获取美化管理器模组列表
window.getBeautyAddons = async function() {
    const gui = window.modLoaderGuiInstance;
    if (!gui || !gui.gModUtils) return [];
    
    // 获取所有模组，筛选出与美化相关的
    const allMods = gui.gModUtils.getModListName();
    const beautyRelated = [];
    
    for (const modName of allMods) {
        const mod = gui.gModUtils.getMod(modName);
        if (mod && (modName.includes('Beauty') || modName.includes('美') || 
            mod.bootJson?.id?.includes('beauty') || mod.mod?.type === 'beauty')) {
            beautyRelated.push({
                name: modName,
                version: mod.bootJson?.version || '?',
                enabled: true, // 需要从实际状态获取
                order: beautyRelated.length
            });
        }
    }
    
    return beautyRelated;
};

// 重新加载页面
window.reloadPage = function() {
    location.reload();
};

// 安全模式切换
window.toggleSafeMode = async function() {
    const gui = window.modLoaderGuiInstance;
    if (gui && gui.modLoadSwitch) {
        if (gui.modLoadSwitch.isSafeModeOn()) {
            await gui.modLoadSwitch.disableSafeMode();
        } else {
            await gui.modLoadSwitch.enableSafeMode();
        }
        return gui.modLoadSwitch.isSafeModeOn();
    }
    return false;
};

// 获取ReadMe内容
window.getReadMe = async function(modName) {
    const gui = window.modLoaderGuiInstance;
    if (!gui) return '# 无法获取ReadMe\n\n模组管理器实例未找到';
    
    try {
        const content = await gui.getModTReadMe(modName);
        return content || '# 无ReadMe文件\n\n该模组没有提供ReadMe文档。';
    } catch(e) {
        return `# 读取失败\n\n无法读取ReadMe文件：\n\`\`\`\n${e.message}\n\`\`\``;
    }
};

// 获取模组列表用于选择
window.getModListForSelect = function() {
    const gui = window.modLoaderGuiInstance;
    if (!gui) return [];
    return gui.gModUtils.getModListName();
};

// 添加模组（文件上传）
window.addModFromFile = function(fileInput) {
    Wikifier.wikifyEval("<<replace #customOverlayContent>><<modloadermodmanage>><</replace>><<run _tab.setActive(1)>>")
    return new Promise(async (resolve, reject) => {
        const gui = window.modLoaderGuiInstance;
        if (!gui) {
            reject('模组管理器实例未找到');
            return;
        }
        
        try {
            const result = await gui.loadAndAddMod(fileInput);
            resolve(result);
        } catch(e) {
            reject(e.message);
        }
    });
};

// 移除模组
window.removeMod = async function(modName) {
    const gui = window.modLoaderGuiInstance;
    if (!gui) return false;
    
    try {
        await gui.gModUtils.getModLoadController().removeModIndexDB(modName);
        return true;
    } catch(e) {
        console.error('移除失败', e);
        return false;
    }
};

window.initGeneral = function() {
    const gui = window.modLoaderGuiInstance;

    // 重新载入
    const btnRestart = document.getElementById('btnRestart');
    btnRestart.addEventListener('click', () => {
        window.reloadPage()
    });

    // 安全模式
    const safeModeSection = document.getElementById('safeModeSection');
    const toggleSafeMode = safeModeSection.querySelector('#toggleSafeMode');
    if (gui && gui.modLoadSwitch) {
        if (gui.modLoadSwitch.isSafeModeOn()) {
            safeModeSection.classList.add('active-safe');
            toggleSafeMode.checked = true;
        } else {
            safeModeSection.classList.remove('active-safe');
        }
    }
    toggleSafeMode.addEventListener('change', async () => {
        if (toggleSafeMode.checked) {
            safeModeSection.classList.add('active-safe');
            await gui.modLoadSwitch.enableSafeMode();
        } else {
            safeModeSection.classList.remove('active-safe');
            await gui.modLoadSwitch.disableSafeMode();
        }
    });

    // 添加模组
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    // ===== 拖放事件 =====
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('drag-over');
    });
    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');
        const files = Array.from(e.dataTransfer.files);
        fileInput.files = e.dataTransfer.files; // 将文件赋值给input
        window.addModFromFile(fileInput)
    });
    // ===== 点击选择文件 =====
    dropZone.addEventListener('click', (e) => {
        // 如果点击的是input本身，不做额外处理
        if (e.target === fileInput) return;
        fileInput.click();
    });
    fileInput.addEventListener('change', () => {
        window.addModFromFile(fileInput)
    });
}

window.initGeneralT = function() {
    // ===== DOM 引用 =====
    const btnRestart = document.getElementById('btnRestart');
    const restartHint = document.getElementById('restartHint');
    const toggleSafeMode = document.getElementById('toggleSafeMode');
    const safeModeSection = document.getElementById('safeModeSection');
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const modList = document.getElementById('modList');
    const toast = document.getElementById('toast');
    const modCountEl = document.getElementById('modCount');
    const fontStatusEl = document.getElementById('fontStatus');

    // ===== 状态 =====
    let modFiles = []; // { id, file, name, size }
    let safeModeEnabled = false;
    let restartCountdown = null;
    let restartTimer = null;

    // 从 localStorage 恢复安全模式状态
    try {
        const savedSafeMode = localStorage.getItem('DolOptimization_SafeMode');
        if (savedSafeMode === 'true') {
            safeModeEnabled = true;
            toggleSafeMode.checked = true;
            safeModeSection.classList.add('active-safe');
        }
    } catch (e) { /* ignore */ }

    // ===== Toast 提示 =====
    let toastTimeout;

    function showToast(message, type = '') {
        clearTimeout(toastTimeout);
        toast.textContent = message;
        toast.className = 'toast ' + type + ' show';
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 2200);
    }

    // ===== 重启按钮逻辑 =====
    function triggerRestart() {
        if (restartTimer) return; // 已在倒计时

        // 倒计时 3 秒
        let count = 3;
        restartHint.textContent = `⏳ 正在重启... ${count} 秒`;
        restartHint.classList.add('counting');
        btnRestart.disabled = true;
        btnRestart.style.opacity = '0.7';
        btnRestart.style.cursor = 'not-allowed';
        btnRestart.style.animation = 'none';
        btnRestart.style.boxShadow =
            '0 0 0 4px rgba(239,68,68,0.2), 0 2px 8px rgba(220,38,38,0.4), inset 0 1px 0 rgba(255,255,255,0.08)';

        restartTimer = setInterval(() => {
            count--;
            if (count <= 0) {
                clearInterval(restartTimer);
                restartTimer = null;
                restartHint.textContent = '✅ 重启完成（模拟）';
                restartHint.classList.remove('counting');
                restartHint.style.color = '#22c55e';
                btnRestart.disabled = false;
                btnRestart.style.opacity = '1';
                btnRestart.style.cursor = 'pointer';
                btnRestart.style.animation = 'pulse-warning 2.4s ease-in-out infinite';
                btnRestart.style.boxShadow = '';
                showToast('🔄 应用已重启（模拟）', 'success');

                // 模拟：重新加载模组列表
                loadModsFromStorage();
                updateModCount();
                updateFontStatus();

                setTimeout(() => {
                    restartHint.textContent = '⚠️ 此操作将重新加载所有模组';
                    restartHint.style.color = '';
                }, 2000);
            } else {
                restartHint.textContent = `⏳ 正在重启... ${count} 秒`;
            }
        }, 1000);

        showToast('⚠️ 正在重启应用...', 'warning');
    }

    btnRestart.addEventListener('click', () => {
        if (restartTimer) return;
        // 二次确认（可选，增强警告感）
        if (modFiles.length > 0) {
            const confirmed = confirm(
                '⚠️ 确定要重启吗？\n\n所有未保存的更改将会丢失。\n已添加的模组文件将保留在列表中。'
            );
            if (!confirmed) return;
        }
        triggerRestart();
    });

    // 键盘快捷键 Ctrl+Shift+R 触发重启
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'R') {
            e.preventDefault();
            if (!restartTimer) {
                triggerRestart();
            }
        }
    });

    // ===== 安全模式切换 =====
    toggleSafeMode.addEventListener('change', () => {
        safeModeEnabled = toggleSafeMode.checked;
        if (safeModeEnabled) {
            safeModeSection.classList.add('active-safe');
            showToast('🛡️ 安全模式已开启 — 仅加载已签名模组', 'success');
        } else {
            safeModeSection.classList.remove('active-safe');
            showToast('🔓 安全模式已关闭 — 允许加载所有模组', 'warning');
        }
        // 持久化到 localStorage
        try {
            localStorage.setItem('DolOptimization_SafeMode', safeModeEnabled);
        } catch (e) { /* ignore */ }
    });

    // ===== 模组文件管理 =====
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(2) + ' MB';
    }

    function addModFile(file) {
        // 检查重复
        const exists = modFiles.some(m => m.name === file.name && m.size === file.size);
        if (exists) {
            showToast(`⚠️ 文件 "${file.name}" 已存在`, 'warning');
            return;
        }

        const modEntry = {
            id: Date.now() + '_' + Math.random().toString(36).slice(2, 8),
            file: file,
            name: file.name,
            size: file.size,
        };
        modFiles.push(modEntry);
        renderModList();
        updateModCount();
        saveModsToStorage();
        showToast(`✅ 已添加: ${file.name}`, 'success');
    }

    function removeModFile(id) {
        const entry = modFiles.find(m => m.id === id);
        modFiles = modFiles.filter(m => m.id !== id);
        renderModList();
        updateModCount();
        saveModsToStorage();
        if (entry) {
            showToast(`🗑️ 已移除: ${entry.name}`, 'warning');
        }
    }

    function renderModList() {
        modList.innerHTML = '';
        if (modFiles.length === 0) {
            modList.innerHTML = '<li class="mod-empty">暂无模组，请拖放或点击上方区域添加</li>';
            return;
        }
        modFiles.forEach(mod => {
            const li = document.createElement('li');
            const ext = mod.name.split('.').pop()?.toLowerCase();
            let icon = '📄';
            if (ext === 'js') icon = '📜';
            else if (ext === 'zip') icon = '📦';
            else if (ext === 'json') icon = '📋';
            else if (ext === 'css') icon = '🎨';
            else if (ext === 'txt') icon = '📝';

            li.innerHTML = `
                    <span class="mod-file-icon">${icon}</span>
                    <span class="mod-file-name" title="${escapeHtml(mod.name)}">${escapeHtml(mod.name)}</span>
                    <span class="mod-file-size">${formatFileSize(mod.size)}</span>
                    <button class="mod-remove-btn" data-id="${mod.id}" aria-label="移除 ${escapeHtml(mod.name)}" title="移除模组">✕</button>
                `;
            modList.appendChild(li);

            // 绑定移除按钮
            const removeBtn = li.querySelector('.mod-remove-btn');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeModFile(mod.id);
            });
        });
    }

    function updateModCount() {
        const count = modFiles.length;
        modCountEl.textContent = `已加载 ${count} 个模组`;
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // 持久化模组列表到 localStorage（仅存元数据，实际 File 对象在页面刷新后会丢失，这里做模拟）
    function saveModsToStorage() {
        try {
            const meta = modFiles.map(m => ({ id: m.id, name: m.name, size: m.size }));
            localStorage.setItem('DolOptimization_ModList', JSON.stringify(meta));
        } catch (e) { /* ignore */ }
    }

    function loadModsFromStorage() {
        try {
            const raw = localStorage.getItem('DolOptimization_ModList');
            if (raw) {
                const meta = JSON.parse(raw);
                // 从元数据恢复（无法恢复真实 File 对象，创建占位对象）
                modFiles = meta.map(m => ({
                    id: m.id,
                    file: null,
                    name: m.name,
                    size: m.size,
                }));
            }
        } catch (e) {
            modFiles = [];
        }
        renderModList();
        updateModCount();
    }

    function updateFontStatus() {
        try {
            const fontName = localStorage.getItem('DolOptimization_FontName');
            const fontEnabled = localStorage.getItem('DolOptimization_FontEnabled');
            if (fontEnabled === 'true' && fontName) {
                fontStatusEl.textContent = `字体: ${fontName}`;
            } else {
                fontStatusEl.textContent = '字体: 默认';
            }
        } catch (e) {
            fontStatusEl.textContent = '字体: 默认';
        }
    }

    // ===== 拖放事件 =====
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');
        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;
        files.forEach(file => addModFile(file));
    });

    // ===== 点击选择文件 =====
    dropZone.addEventListener('click', (e) => {
        // 如果点击的是input本身，不做额外处理
        if (e.target === fileInput) return;
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        const files = Array.from(fileInput.files);
        if (files.length === 0) return;
        files.forEach(file => addModFile(file));
        fileInput.value = ''; // 清空以便重复选择同一文件
    });

    // 键盘可访问性：在drop-zone上按Enter/Space触发文件选择
    dropZone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInput.click();
        }
    });

    // ===== 粘贴文件支持 =====
    document.addEventListener('paste', (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        const files = [];
        for (const item of items) {
            if (item.kind === 'file') {
                files.push(item.getAsFile());
            }
        }
        if (files.length > 0) {
            e.preventDefault();
            files.forEach(file => addModFile(file));
            showToast(`📋 已从剪贴板添加 ${files.length} 个文件`, 'success');
        }
    });

    // ===== 初始化 =====
    function init() {
        loadModsFromStorage();
        updateModCount();
        updateFontStatus();
        renderModList();

        // 如果从URL参数中检测到安全模式，自动开启
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('safemode') === '1') {
            safeModeEnabled = true;
            toggleSafeMode.checked = true;
            safeModeSection.classList.add('active-safe');
            try {
                localStorage.setItem('DolOptimization_SafeMode', 'true');
            } catch (e) { /* ignore */ }
        }

        console.log('%c🛡️ DOL 优化设置面板已就绪 %c| %c安全模式: ' + (safeModeEnabled ? '开启' : '关闭') +
            ' | 模组数: ' + modFiles.length,
            'color:#a78bfa;font-weight:bold;', '', 'color:#22c55e;');
        console.log('%c💡 提示: 按 Ctrl+Shift+R 可快速触发重启', 'color:#fbbf24;');
    }

    init();

    // ===== 暴露 API（兼容原 DolOptimization 调用） =====
    window.DolOptimizationPanel = {
        addModFile,
        removeModFile,
        getModFiles: () => [...modFiles],
        isSafeMode: () => safeModeEnabled,
        triggerRestart,
        setSafeMode: (enabled) => {
            safeModeEnabled = !!enabled;
            toggleSafeMode.checked = safeModeEnabled;
            if (safeModeEnabled) {
                safeModeSection.classList.add('active-safe');
            } else {
                safeModeSection.classList.remove('active-safe');
            }
            try {
                localStorage.setItem('DolOptimization_SafeMode', safeModeEnabled);
            } catch (e) { /* ignore */ }
        },
        showToast,
        updateFontStatus,
    };
};