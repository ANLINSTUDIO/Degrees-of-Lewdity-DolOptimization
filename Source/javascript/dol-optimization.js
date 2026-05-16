window.DolOptimization = {};

DolOptimization.STORAGE_KEY = 'opt';


// === 注入 =====================================
$(document).on(":passagerender", function (ev) {DolOptimization.onPassageRender(ev)});
DolOptimization.onPassageRender = function (ev) {
    if (!V.options) return;
    V.options.DolOptimization = V.options.DolOptimization || {};
    DolOptimization.rv(true);

    const toggles = $("#ui-bar-toggle");
    if (toggles.length > 0) {
        switch (DolOptimization.data.UiBarToggle) {
            // 将“打开/关闭导航栏”的黑块箭头修改为回溯 「◆冬至蝉鸣◆」
            case "back":
                if (!document.querySelector("#ui-bar-toggle.opt")) {
                    const toggleBackword = toggles[0].cloneNode(true);
                    toggleBackword.className = "opt";
                    toggleBackword.title = "回溯";
                    toggleBackword.style.display = "";
                    toggleBackword.addEventListener("click", function(event) {
                        Engine.backward();
                    });
                    toggles.parent().append(toggleBackword);
                }
                toggles.hide();
                break;
            // 隐藏右上角黑块箭头的开关 「離地三尺一條河」
            case "hide":
                toggles.hide();
                document.querySelector("#ui-bar-toggle.opt")?.remove();
                break;
            default:
                toggles.show();
                document.querySelector("#ui-bar-toggle.opt")?.remove();
                break;
        }
    }

    // 自定义字体 「尼落·忍者」
    DolOptimization.loadSavedFont();

    if (V.passage != "Start") {
        // 【1.0.3】衣柜容量自定义 大大大衣柜升级
        if (V.options.DolOptimization.LargerWardrobe !== undefined) {
            if (V.options.DolOptimization.LargerWardrobe) {
                if (V.options.DolOptimization.LargerWardrobeValue) {
                    V.wardrobe.space = V.options.DolOptimization.LargerWardrobeValue;
                }
                if (V.wardrobe.space === undefined) {
                    Furniture.wardrobeUpdate();
                }
            } else {
                Furniture.wardrobeUpdate();
                delete V.options.DolOptimization.LargerWardrobe;
            }
        } else if (V.options.DolOptimization.LargerWardrobeExpandedValue) {
            Furniture.wardrobeUpdate();
            V.wardrobe.space += V.options.DolOptimization.LargerWardrobeExpandedValue;
        }
    };

    // 【1.0.5】叠加服装部件
    V.wornStacking = V.wornStacking || {};

    // 保存
    DolOptimization.saveSettings();
};
$(document).on("mousedown", function(event) {
    if (event.button === 1) {
        event.preventDefault();  // 防止触发浏览器历史导航
        event.stopPropagation(); // 防止事件冒泡
        $("#ui-bar").toggleClass("stowed")
    }
});
// === 原版函数注入 ==============================
dayPassed = new Proxy(dayPassed, {
    apply: function(target, thisArg, argumentsList) {
        DolOptimization.dayPassed()
        return target.apply(thisArg, argumentsList);
    }
});
DolOptimization.dayPassed = function() {
    if (!V.player.vaginaExist || V.player.virginity.vaginal !== true) delete V.hymenreconstructioncount;
    if (V.hymenreconstructioncount) V.hymenreconstructioncount--;
    if (V.hymenreconstructioncount <= 0) delete V.hymenreconstructioncount;
}

// 模组工具
DolOptimization = { ...DolOptimization, 
    cv: function(value, default_ = false) {
        let _value = DolOptimization.data[value] ?? default_
        if (V.options.opt) {
            _value = V.options.opt[value] ?? _value
        }
        return _value
    },
    nv: function(value, default_ = false) {
        V.options.opt[value] = DolOptimization.cv(value, default_);
    },
    dv: function(value, default_ = false) {
        DolOptimization.data[value] = DolOptimization.cv(value, default_);
    },
    rv: function(indata = false) {
        let func;
        if (indata) {
            func = DolOptimization.dv;
        } else {
            V.options.opt = {};
            func = DolOptimization.nv;
        }

        func("UiBarToggle", "default");
    },
    loadSettings: function() {
        try {
            const saved = localStorage.getItem(DolOptimization.STORAGE_KEY);
            DolOptimization.data = saved ? JSON.parse(saved) : {};
        } catch (e) {
            console.warn('[Optimization] 读取 localstorage 失败', e);
        }
    },
    saveSettings: function() {
        try {
            const data = JSON.stringify(DolOptimization.data);
            localStorage.setItem(DolOptimization.STORAGE_KEY, data);
        } catch (e) {
            console.warn('[Optimization] 保存 localstorage 失败', e);
        }
    },
    applySettings: function(reload=false) {
        DolOptimization.onPassageRender();
        if (reload) {
            Engine.play(V.passage)
        }
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
            AsAPI.log("原版优化", `已应用字体: ${fontData.fileName}`);
        } catch (error) {
            AsAPI.error("原版优化", `字体加载失败: ${error}`);
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
            AsAPI.log("原版优化", `字体已保存到全局（IndexedDB）`);
        } else {
            // 存档字体保持不变
            V.options.DolOptimization.OptimizationCustomFont = fontData;
            await this.removeFontFromIndexedDB();
            AsAPI.log("原版优化", `字体已保存到存档`);
        }
    },
    
    // 修改 loadSavedFont 方法
    loadSavedFont: async function() {
        // 优先检查存档中的字体
        const savedFont = V?.options?.DolOptimization?.OptimizationCustomFont;
        
        if (savedFont && savedFont.data) {
            AsAPI.log("原版优化", '发现存档字体，正在加载...');
            const success = await this.applyFontFromData(savedFont);
            if (success) {
                AsAPI.log("原版优化", '已加载存档字体:'+savedFont.fileName);
                this.updateFontDisplayName(savedFont.fileName);
                if (V.options.DolOptimization?.OptimizationCustomFontGlobal) await DolOptimization.saveCustomFonts(savedFont);  // 点击了应用到全局但是没有选择字体
                return true;
            } else {
               AsAPI.error("原版优化", '存档字体已损坏，自动清除');
                this.unsetCustomFont();
            }
        }
        
        // 如果没有存档字体，检查 IndexedDB
        const globalFont = await this.loadFontFromIndexedDB();
        
        if (globalFont && globalFont.data) {
            const success = await this.applyFontFromData(globalFont);
            if (success) {
                if (V.options.DolOptimization) {
                    V.options.DolOptimization.OptimizationCustomFontGlobal = true;
                }
                AsAPI.log("原版优化", '已加载全局字体:', globalFont.fileName);
                this.updateFontDisplayName(globalFont.fileName);
                return true;
            } else {
                AsAPI.error("原版优化", '全局字体已损坏，自动清除');
                await this.removeFontFromIndexedDB();
            }
        }
        
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
        
        AsAPI.log("原版优化", '字体设置已清除');
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

// 【1.0.3】衣柜容量自定义
DolOptimization = { ...DolOptimization, 
    largerWardrobe: function(target) {
        V.options.DolOptimization.LargerWardrobeValue = parseInt(target.value) || 1;
    }
}

// 【1.0.5】叠加服装部件
DolOptimization = { ...DolOptimization, 
    wornStackingCompile: function(options) {
        // 1. 调用原版编译，得到所有标准图层
        const layerSpecs = DolOptimization.originalCompile.call(this, options);
        if (options.lights || !V.wornStacking) return layerSpecs;
        if (options.root == "img/sex/") return layerSpecs;
        if (!V.options.DolOptimization.WornStacking) {
            DolOptimization.wornStackingRemoveAll(); 
            return layerSpecs
        };

        const result = [...layerSpecs];

        // 2. 遍历 V.wornStacking 的每个槽位
        for (const [slot, items] of Object.entries(V.wornStacking)) {
            if (!Array.isArray(items) || items.length === 0) continue;

            // 找到原版列表中该槽位的主图层（名称就是 slot，例如 "head"）
            const templateLayer = layerSpecs.find(l => l.name === slot);
            if (!templateLayer) continue;

            // 对于该槽位的配件图层（如 "head_acc"）
            const templateAccLayer = layerSpecs.find(l => l.name === slot + '_acc');

            items.forEach((item, index) => {
                // ---------- 主图层处理 ----------
                // 深拷贝模板图层，保留所有辅助属性
                const newLayer = DolOptimization.deepCopyLayer(templateLayer);
                newLayer.name = `${slot}_stack_${item.variable || index}`;
                newLayer.z = (templateLayer.z || 0) + (index + 1) * 0.01;
                newLayer.show = true;

                // 准备格式化后的衣物数据，并临时替换 options.worn[slot]
                const wornEntry = getClothingOptionsItem(slot, item);
                const originalWorn = options.worn[slot];
                options.worn[slot] = wornEntry[slot];
                const baseLayer = this.layers[slot];

                // 生成正确的 filters 数组（调用原图层 filtersfn）
                if (baseLayer && baseLayer.filtersfn) {
                    newLayer.filters = baseLayer.filtersfn(options);
                }

                // 生成正确的 worn 对象
                if (baseLayer && baseLayer.wornfn) {
                    newLayer.worn = baseLayer.wornfn(options);
                }

                // 为这个叠加物品生成颜色 filter，并合并到图层上
                const filterKey = `worn_${slot}`;
                const originalFilter = options.filters[filterKey];
                setClothingFilter(options, slot, options.worn[slot], options.worn[slot].setup, '', 'colour_sidebar', 'colour');
                const colourFilter = options.filters[filterKey];
                if (colourFilter && colourFilter.blend) {
                    Renderer.mergeLayerData(newLayer, colourFilter, true);
                }

                // 生成图片路径（使用原图层的 srcfn）
                // 注意：srcfn 在模板图层上可能已不存在，但我们可以从模型定义中取
                if (baseLayer && baseLayer.srcfn) {
                    newLayer.src = baseLayer.srcfn(options);
                }

                // 恢复原值
                options.worn[slot] = originalWorn;
                options.filters[filterKey] = originalFilter;

                result.push(newLayer);

                // ---------- 配件图层处理（如果存在）----------
                if (templateAccLayer && item.accessory_colour) {
                    const newAccLayer = DolOptimization.deepCopyLayer(templateAccLayer);
                    newAccLayer.name = `${slot}_stack_${item.variable}_acc`;
                    newAccLayer.z = (templateAccLayer.z || newLayer.z) + 0.005;
                    newAccLayer.show = true;

                    // 再次临时替换 worn（因为配件图层可能也读 worn[slot]）
                    options.worn[slot] = wornEntry[slot];

                    const accBaseLayer = this.layers[slot + '_acc'];
                    if (accBaseLayer && accBaseLayer.filtersfn) {
                        newAccLayer.filters = accBaseLayer.filtersfn(options);
                    }
                    if (accBaseLayer && accBaseLayer.wornfn) {
                        newAccLayer.worn = accBaseLayer.wornfn(options);
                    }

                    // 生成配件颜色 filter
                    const accFilterKey = `worn_${slot}_acc`;
                    const originalAccFilter = options.filters[accFilterKey];
                    setClothingFilter(options, slot, options.worn[slot], options.worn[slot].setup, '_acc', 'accessory_colour_sidebar', 'accColour');
                    const accFilter = options.filters[accFilterKey];
                    if (accFilter && accFilter.blend) {
                        Renderer.mergeLayerData(newAccLayer, accFilter, true);
                    }
                    
                    if (accBaseLayer && accBaseLayer.srcfn) {
                        newAccLayer.src = accBaseLayer.srcfn(options);
                    }

                    // 恢复
                    options.worn[slot] = originalWorn;
                    options.filters[accFilterKey] = originalAccFilter;

                    result.push(newAccLayer);
                }
            });
        }

        return result;
    },
    // wornStackingCompile: function(options) {
    //     // 1. 调用原版编译，得到所有标准图层
    //     const layerSpecs = DolOptimization.originalCompile.call(this, options);
    //     if (options.lights || !V.wornStacking) return layerSpecs;

    //     const result = layerSpecs.concat();
    //     console.log(result);
        
    //     const oriOptions = T.modeloptions

    //     // 2. 遍历 V.wornStacking 的每个槽位
    //     for (const [slot, items] of Object.entries(V.wornStacking)) {
    //         if (!Array.isArray(items) || items.length === 0) continue;
            
    //         const originalWorn = V.worn[slot];
    //         items.forEach((item, index) => {
    //             V.worn[slot] = item;
    //             const modeloptions = DolOptimization.deepCopyLayer(T.modeloptions);
    //             Object.assign(modeloptions, getClothingOptions());
    //             const newlayerSpecs = DolOptimization.originalCompile.call(this, modeloptions);
    //             const newLayer = newlayerSpecs.find(l => l.name === slot);
    //             newLayer.z = (newLayer.z || 0) + (index + 1) * 0.01;

    //             result.push(newLayer);

    //             console.log(slot, item, newLayer, result.filter(l => l.name === slot), newlayerSpecs);
    //         });
    //         V.worn[slot] = originalWorn;
    //     }

    //     return result;
    // },
    // 辅助函数：安全地深拷贝图层（保留所有属性，不丢失数组/对象）
    deepCopyLayer: function(layer) {
        // 使用 jQuery 的深拷贝，如果可用；否则用 JSON 转换（会丢失函数，但此处图层里已没有必须的函数）
        if (typeof jQuery !== 'undefined') {
            return jQuery.extend(true, {}, layer);
        }
        return JSON.parse(JSON.stringify(layer));
    },
    wornStackingRemove: function(item_index) {
        const index = V.wornStacking[T.wardrobe_list].findIndex(i => i.index == item_index);
        if (index > -1) {
            V.wardrobe[T.wardrobe_list].push(V.wornStacking[T.wardrobe_list][index]);
            V.wornStacking[T.wardrobe_list].splice(index, 1);
        }
    },
    wornStackingRemoveAll: function() {
        if (!V.wornStacking) return;
        for (const [slot, items] of Object.entries(V.wornStacking)) {
            items.forEach((item, index) => {
                V.wardrobe[slot].push(item);
            });
        }
        V.wornStacking = {};
    },
    getStackingOutfit: function() {
        const stacking = {}
        for (const [slot, items] of Object.entries(V.wornStacking)) {
            if (!Array.isArray(items) || items.length === 0) continue;
            stacking[slot] = []
            items.forEach((item, index) => {
                stacking[slot].push(item.name)
            })
        }
        return stacking
    }
};
(function() {
    DolOptimization.originalCompile = CanvasModel.prototype.compile;
    CanvasModel.prototype.compile = DolOptimization.wornStackingCompile;
})();




// // 【1.0.3】全屏 「尼落·忍者」
// DolOptimization = { ...DolOptimization,
//     toggleFullScreen: function () {
//         if (!document.fullscreenElement) {
//             // 进入全屏
//             const elem = document.documentElement; // 整个页面
//             if (elem.requestFullscreen) {
//                 elem.requestFullscreen();
//             } else if (elem.webkitRequestFullscreen) { /* Safari 旧版 */
//                 elem.webkitRequestFullscreen();
//             } else if (elem.msRequestFullscreen) { /* IE/Edge */
//                 elem.msRequestFullscreen();
//             }
//         } else {
//             // 退出全屏
//             if (document.exitFullscreen) {
//                 document.exitFullscreen();
//             } else if (document.webkitExitFullscreen) {
//                 document.webkitExitFullscreen();
//             } else if (document.msExitFullscreen) {
//                 document.msExitFullscreen();
//             }
//         }
//     }
// };


DolOptimization.loadSettings();