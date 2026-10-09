(() => {
    window.DolOptimization = {};

    /* AsAPI: Start @early inject */
    window.AsAPI = { ...window.AsAPI,  // early inject
        // 用于检查对象或数组是否有效
        isvalid: function(dict) {
            if (dict instanceof Object) {
                return dict && Object.keys(dict).length > 0
            } else {
                return dict && dict.length > 0
            }
        },
        // 用于在故事字幕中添加内容
        addStoryCaptionContent: function(content) {
            setTimeout(() => {
                const container = document.getElementById("storyCaptionContent");
                if (container) {
                    // 插入在第一个位置
                    const newCaption = document.createElement("div");
                    newCaption.innerHTML = content + "<br>";
                    container.insertAdjacentElement('afterbegin', newCaption);
                }
                document.getElementById("ui-bar").classList.remove("stowed");
            });
        },
        // 用于加载远程数据并显示在元素中
        loadRemote: function() {
            queueMicrotask(() => { 
                document.querySelectorAll('[data-remote]').forEach(async element => {
                    try {
                    const response = await fetch(element.dataset.remote, {
                        mode: 'cors',
                        credentials: 'omit'
                    });
                    const data = await response.json();
                    if (!data.error) {
                        let content = data.value;
                        if (element.dataset.replace === 'true') {
                        content = content.replaceAll('\n', '<br>');
                        }
                        element.innerHTML = content;
                    }
                    } catch (error) {
                    element.innerHTML = element.dataset.error || '加载失败';
                    }
                });
            });
        },
        // 将小时数转换为友好的时间文本
        getFriendlyTimeText: function(ageHours, cn = true) {
            const hours = Math.floor(ageHours);
            let friendlyTimeText = ""
            if (hours) {
                friendlyTimeText += `${hours}${cn? '小时': ':'}`;
            } else {
                if (!cn) friendlyTimeText += `0:`;
            }
            const minutes = Math.round((ageHours - hours) * 60);
            if (minutes) {
                if (cn) {friendlyTimeText += `${minutes}分钟`}
                else {friendlyTimeText += `${minutes}`.padStart(2, '0')};
            } else {
                if (!cn) friendlyTimeText += `00`;
            }
            return friendlyTimeText
        },
        // 颜色打印
        log: function(title, content, title_color = 'green', content_color = 'white', func = 'log') {
            let text = "";
            const styles = [];
            if (title) {
                text += `%c ${title} %c`;
                styles.push(`background: ${title_color}; color: black; padding: 2px 4px; border-radius: 3px;`);
            }
            if (content) {
                text += ` ${content}`;
                styles.push(`color: ${content_color};`);
            }
            console[func](text, ...styles);
        },
        // 警告
        warn: function(title, content, title_color = 'green') { this.log(title, content, title_color, 'yellow', "warn") },
        // 错误
        error: function(title, content, title_color = 'green') { this.log(title, content, title_color, 'red', "error") },
        // Debug
        debug: function(title, content, title_color = 'yellow') { if (AsAPI.debugon) this.log(title, content, title_color, 'gray', "warn") },
        debugon: false,
        // 当没有 event 时重新加载当前 passage
        reload: function() {
            if (!V.event) {
                SugarCube.Engine.play(V.passage);
                return true;
            }
            return false;
        },
    }
    Object.defineProperty(window, 'asi', { get() { return window.AsAPI; }, configurable: true });
    /* AsAPI: End @early inject */

    /**
     * 游戏原生暗黑风格确认模态框（替代浏览器原生突兀白底 confirm）
     * @param {Object|string} options 参数对象或提示文字
     * @returns {Promise<boolean>}
     */
    window.dolOptConfirm = function(options) {
        let title = '提示';
        let message = '';
        let confirmText = '确定';
        let cancelText = '取消';
        let isDanger = false;
        let selectOptions = [];
        let selectValue = '';
        let selectLabel = '请选择';
        let trustedMessageHtml = '';
        let dialogClass = '';
        let requireSelection = false;

        if (typeof options === 'string') {
            message = options;
        } else if (options && typeof options === 'object') {
            title = options.title || '提示';
            message = options.message || '';
            confirmText = options.confirmText || '确定';
            cancelText = options.cancelText !== undefined ? options.cancelText : '取消';
            isDanger = options.confirmType === 'danger';
            selectOptions = Array.isArray(options.selectOptions) ? options.selectOptions : [];
            selectValue = options.selectValue !== undefined ? String(options.selectValue) : (selectOptions[0]?.value || '');
            selectLabel = options.selectLabel || '请选择';
            trustedMessageHtml = typeof options.trustedMessageHtml === 'string' ? options.trustedMessageHtml : '';
            dialogClass = String(options.dialogClass || '').split(/\s+/).filter(name => /^[a-z0-9_-]+$/i.test(name)).join(' ');
            requireSelection = options.requireSelection === true;
        }

        // 针对非 DOM / Node 单元测试环境的安全回退
        if (typeof document === 'undefined' || !document.createElement || !document.body) {
            if (typeof confirm === 'function') {
                return Promise.resolve(confirm(message));
            }
            return Promise.resolve(true);
        }

        return new Promise((resolve) => {
            const old = document.getElementById('dolOptConfirmOverlay');
            if (old && typeof old.remove === 'function') old.remove();

            const overlay = document.createElement('div');
            overlay.id = 'dolOptConfirmOverlay';
            overlay.className = 'dol-opt-modal-backdrop';

            const dialog = document.createElement('div');
            dialog.className = `dol-opt-modal-dialog${dialogClass ? ` ${dialogClass}` : ''}`;
            dialog.setAttribute('role', 'dialog');
            dialog.setAttribute('aria-modal', 'true');

            const messageHtml = trustedMessageHtml || window.dolOptEscapeHtml(message).replace(/\n/g, '<br>');
            const selectHtml = selectOptions.length ? `
                <label class="dol-opt-modal-select-wrap">
                    <span>${window.dolOptEscapeHtml(selectLabel)}</span>
                    <select class="dol-opt-modal-select">
                        ${selectOptions.map(option => `<option value="${window.dolOptEscapeHtml(option.value)}" ${String(option.value) === selectValue ? 'selected' : ''} ${option.disabled ? 'disabled' : ''}>${window.dolOptEscapeHtml(option.label)}</option>`).join('')}
                    </select>
                </label>
            ` : '';

            dialog.innerHTML = `
                <div class="dol-opt-modal-header">
                    <span class="${isDanger ? 'red' : 'gold'} dol-opt-modal-title">${window.dolOptEscapeHtml(title)}</span>
                    <button type="button" class="dol-opt-modal-close" aria-label="关闭">&times;</button>
                </div>
                <div class="dol-opt-modal-body">
                    <div class="dol-opt-modal-message">${messageHtml}</div>
                    ${selectHtml}
                </div>
                <div class="dol-opt-modal-footer">
                    <button type="button" class="macro-button ${isDanger ? 'dol-opt-btn-danger' : 'dol-opt-btn-primary'} dol-opt-modal-btn-confirm">${window.dolOptEscapeHtml(confirmText)}</button>
                    ${cancelText ? `<button type="button" class="macro-button dol-opt-modal-btn-cancel">${window.dolOptEscapeHtml(cancelText)}</button>` : ''}
                </div>
            `;

            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            let resolved = false;
            const select = dialog.querySelector('.dol-opt-modal-select');
            const confirmBtn = dialog.querySelector('.dol-opt-modal-btn-confirm');
            const canConfirm = () => !requireSelection || Boolean(select?.value);
            const syncConfirmState = () => {
                if (confirmBtn) confirmBtn.disabled = !canConfirm();
            };
            const closeWith = (result) => {
                if (resolved) return;
                resolved = true;
                if (typeof document.removeEventListener === 'function') {
                    document.removeEventListener('keydown', handleKeydown);
                }
                overlay.classList.add('dol-opt-modal-closing');
                setTimeout(() => {
                    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                }, 180);
                resolve(result);
            };

            const handleKeydown = (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    closeWith(false);
                } else if (e.key === 'Enter' && canConfirm()) {
                    e.preventDefault();
                    closeWith(selectOptions.length ? select?.value : true);
                }
            };

            if (typeof document.addEventListener === 'function') {
                document.addEventListener('keydown', handleKeydown);
            }

            dialog.querySelector('.dol-opt-modal-close')?.addEventListener('click', () => closeWith(false));
            dialog.querySelector('.dol-opt-modal-btn-cancel')?.addEventListener('click', () => closeWith(false));
            dialog.querySelector('.dol-opt-modal-btn-confirm')?.addEventListener('click', () => {
                if (canConfirm()) closeWith(selectOptions.length ? select?.value : true);
            });
            select?.addEventListener('change', syncConfirmState);
            syncConfirmState();

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    closeWith(false);
                }
            });

            if (confirmBtn && typeof confirmBtn.focus === 'function') {
                confirmBtn.focus();
            }
        });
    };
    window.dolOptEscapeHtml = function(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };
    window.dolOptAlert = function(message, title = '提示') {
        return window.dolOptConfirm({
            title,
            message,
            confirmText: '确定',
            cancelText: ''
        });
    };


    // 创建等待用户响应的函数
    async function waitForUserResponse(alertConfig) {
        return new Promise((resolve) => {
            window.modSweetAlert2Mod.fire({
                ...alertConfig,
                willClose: () => {
                    resolve();
                }
            });
        });
    }
    window.modSC2DataManager.getAddonPluginManager().registerAddonPlugin(
        'optimization',
        'OptModalert',
        {
            async afterInjectEarlyLoad() {
                if (!window.modSC2DataManager.getModLoader().getModZip("maplebirch")) {
                    await waitForUserResponse({
						title: '需求秋枫白桦框架',
						html: `
                            <div style="text-align: start;">
                                原版优化从此版本开始部分依赖秋枫白桦框架，请确保安装其并将本模组置于框架下方。<br>
                                如果没有安装 maplebirch，部分功能不会失效，仅是NPC等功能无法正常使用；<br>
                                若你发现本模组的其他不依赖框架的功能失效，请尝试将本模组顺序提升。
                            </div>
						`,
                        showCancelButton: false,
                        confirmButtonColor: '#1ea44a',
                        confirmButtonText: '了解',
                    });
                }
            }
        },
    );
})();