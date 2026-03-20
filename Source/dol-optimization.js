window.DolOptimization = {};

// === 注入 =====================================
$(document).on(":passagerender", function (ev) {DolOptimization.onPassageRender(ev)});
DolOptimization.onPassageRender = function (ev) {
    if (!V.options) return;
    V.options.DolOptimization = V.options.DolOptimization || {}

    // 隐藏右上角黑块箭头的开关 「離地三尺一條河」
    if (DolOptimization.cv("HideUiBarToggle")) {$("#ui-bar-toggle").hide()} else {$("#ui-bar-toggle").show()};

    // 自定义字体 「尼落·忍者」
    DolOptimization.loadSavedFont();
};

// 模组工具
DolOptimization = { ...DolOptimization, 
    cv: function(value, default_ = false) {
        V.options.DolOptimization[value] = V.options.DolOptimization[value] ?? default_
        return V.options.DolOptimization[value]
    },
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
    }
}

// 【1.0.1】【1.0.2】自定义字体 「尼落·忍者」
DolOptimization = { ...DolOptimization,
    FONT_NAME: "OptimizationCustomFont",
    DB_NAME: 'DolOptimizationDB',
    DB_VERSION: 1,
    Current_Font: null,
    
    // 初始化 IndexedDB
    initDB: function() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('fonts')) {
                    db.createObjectStore('fonts', { keyPath: 'name' });
                }
            };
        });
    },
    
    // 保存字体到 IndexedDB
    saveFontToIndexedDB: async function(fontData) {
        try {
            const db = await this.initDB();
            
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(['fonts'], 'readwrite');
                const store = transaction.objectStore('fonts');
                
                const saveData = {
                    name: fontData.name,
                    data: fontData.data,
                    fileName: fontData.fileName,
                    timestamp: Date.now()
                };
                
                const request = store.put(saveData);
                request.onsuccess = () => {
                    localStorage.setItem('DolOptimization_FontEnabled', 'true');
                    localStorage.setItem('DolOptimization_FontName', fontData.fileName);
                    resolve();
                };
                request.onerror = () => reject(request.error);
                
                transaction.oncomplete = () => {
                    db.close();
                };
            });
        } catch (error) {
            console.error('保存字体到 IndexedDB 失败:', error);
            throw error;
        }
    },
    
    // 从 IndexedDB 加载字体
    loadFontFromIndexedDB: async function() {
        try {
            const fontName = localStorage.getItem('DolOptimization_FontName');
            if (!fontName) return null;
            
            const db = await this.initDB();
            
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(['fonts'], 'readonly');
                const store = transaction.objectStore('fonts');
                const request = store.get(this.FONT_NAME);
                
                request.onsuccess = () => {
                    const result = request.result;
                    if (result && result.data) {
                        resolve({
                            name: result.name,
                            data: result.data,
                            fileName: result.fileName,
                            timestamp: result.timestamp
                        });
                    } else {
                        resolve(null);
                    }
                    db.close();
                };
                request.onerror = () => {
                    reject(request.error);
                    db.close();
                };
            });
        } catch (error) {
            console.error('从 IndexedDB 加载字体失败:', error);
            return null;
        }
    },
    
    // 从 IndexedDB 移除字体
    removeFontFromIndexedDB: async function() {
        try {
            const db = await this.initDB();
            
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(['fonts'], 'readwrite');
                const store = transaction.objectStore('fonts');
                const request = store.delete(this.FONT_NAME);
                
                request.onsuccess = () => {
                    localStorage.removeItem('DolOptimization_FontEnabled');
                    localStorage.removeItem('DolOptimization_FontName');
                    resolve();
                    db.close();
                };
                request.onerror = () => {
                    reject(request.error);
                    db.close();
                };
            });
        } catch (error) {
            console.error('从 IndexedDB 移除字体失败:', error);
        }
    },
    
    // 修改 loadCustomFont 方法中的保存逻辑
    loadCustomFont: async function() {
        const fileInput = document.getElementById('custom-font');
        const file = fileInput.files[0];
        
        if (!file) {
            return;
        }

        try {
            const fontBuffer = await file.arrayBuffer();
            const fontFace = new FontFace(this.FONT_NAME, fontBuffer);
            await fontFace.load();
            document.fonts.add(fontFace);
            document.documentElement.style.fontFamily = `${this.FONT_NAME}, sans-serif`;
            
            const base64Data = await this.fileToBase64Data(file);
            const fontData = {
                name: this.FONT_NAME,
                data: base64Data,
                fileName: file.name,
                timestamp: Date.now()
            };

            await this.saveCustomFonts(fontData);
            
            this.updateFontDisplayName(fontData.fileName);
            console.log('字体应用成功！');
        } catch (error) {
            console.error('字体加载失败:', error);
            this.handleFontLoadError(error);
        }
    },

    checkOptimizationCustomFontGlobal: async function(checked) {
        V.options.DolOptimization.OptimizationCustomFontGlobal = checked
        await this.saveCustomFonts();
    },

    saveCustomFonts: async function(fontData) {
        if (!fontData) {
            fontData = V.options.DolOptimization?.OptimizationCustomFont || await this.loadFontFromIndexedDB() || null;
        };
        if (!fontData) return;
        const isGlobal = V.passage === "Start" || (V.options.DolOptimization?.OptimizationCustomFontGlobal ?? false);
        if (isGlobal) {
            // 使用 IndexedDB 保存全局字体
            await this.saveFontToIndexedDB(fontData);
            if (V.options.DolOptimization?.OptimizationCustomFont) {
                delete V.options.DolOptimization.OptimizationCustomFont;
            }
            console.log('字体已保存到全局（IndexedDB）');
        } else {
            // 存档字体保持不变
            V.options.DolOptimization.OptimizationCustomFont = fontData;
            await this.removeFontFromIndexedDB();
            console.log('字体已保存到存档');
        }
    },
    
    // 修改 loadSavedFont 方法
    loadSavedFont: async function() {
        // 优先检查存档中的字体
        const savedFont = V?.options?.DolOptimization?.OptimizationCustomFont;
        
        if (savedFont && savedFont.data) {
            console.log('发现存档字体，正在加载...');
            const success = await this.applyFontFromData(savedFont);
            if (success) {
                console.log('已加载存档字体:', savedFont.fileName);
                this.updateFontDisplayName(savedFont.fileName);
                if (V.options.DolOptimization?.OptimizationCustomFontGlobal) await DolOptimization.saveCustomFonts(savedFont);  // 点击了应用到全局但是没有选择字体
                return true;
            } else {
                console.log('存档字体已损坏，自动清除');
                this.unsetCustomFont();
            }
        }
        
        // 如果没有存档字体，检查 IndexedDB
        const globalFont = await this.loadFontFromIndexedDB();
        
        if (globalFont && globalFont.data) {
            console.log('发现全局字体，正在加载...');
            const success = await this.applyFontFromData(globalFont);
            if (success) {
                if (V.options.DolOptimization) {
                    V.options.DolOptimization.OptimizationCustomFontGlobal = true;
                }
                console.log('已加载全局字体:', globalFont.fileName);
                this.updateFontDisplayName(globalFont.fileName);
                return true;
            } else {
                console.log('全局字体已损坏，自动清除');
                await this.removeFontFromIndexedDB();
            }
        }
        
        console.log('没有找到可用的字体');
        this.updateFontDisplayName(null);
        document.documentElement.style.fontFamily = "";
        return false;
    },
    
    // 修改 unsetCustomFont 方法
    unsetCustomFont: async function() {
        document.documentElement.style.fontFamily = "";
        
        if (V?.options?.DolOptimization?.OptimizationCustomFont) {
            delete V.options.DolOptimization.OptimizationCustomFont;
        }
        
        await this.removeFontFromIndexedDB();
        
        if (V.options.DolOptimization) {
            V.options.DolOptimization.OptimizationCustomFontGlobal = false;
        }
        
        console.log('字体设置已清除');
        this.updateFontDisplayName(null);
    },
    
    // 其他辅助方法
    fileToBase64Data: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64Full = reader.result;
                const base64Data = base64Full.split(',')[1];
                resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },
    
    base64ToArrayBuffer: function(base64) {
        try {
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes.buffer;
        } catch (error) {
            console.error('Base64 转换失败:', error);
            throw new Error('Invalid font data in ArrayBuffer.');
        }
    },
    
    applyFontFromData: async function(fontData) {
        if (!fontData || !fontData.data) return false;
        
        try {
            const fontBuffer = this.base64ToArrayBuffer(fontData.data);
            const fontFace = new FontFace(this.FONT_NAME, fontBuffer);
            await fontFace.load();
            document.fonts.add(fontFace);
            document.documentElement.style.fontFamily = `${this.FONT_NAME}, sans-serif`;
            return true;
        } catch (error) {
            console.error('加载字体数据失败:', error);
            this.handleFontLoadError(error);
            return false;
        }
    },
    
    handleFontLoadError: function(error) {
        if (error.message === "Invalid font data in ArrayBuffer.") {
            alert(`字体加载失败: 字体不支持，请尝试换一个字体`);
        } else if (error.message?.includes("OTS parsing error") || 
                   error.message?.includes("Unsupported table version")) {
            alert(`字体加载失败: 字体格式不受支持，请尝试换一个字体`);
        } else {
            alert(`字体加载失败，错误: ${error.message || error}`);
        }
    },
    
    updateFontDisplayName: function(fileName) {
        this.Current_Font = fileName;
        const displayElement = document.querySelector("#custom-font-text");
        if (displayElement) {
            displayElement.innerText = fileName || "自定义字体";
        }
    }
};
