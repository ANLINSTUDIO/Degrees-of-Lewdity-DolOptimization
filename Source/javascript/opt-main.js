(() => {
    // 【1.0.1】【1.0.2】自定义字体 「尼落·忍者」
    DolOptimization = { ...DolOptimization,
        FONT_NAME: "OptimizationCustomFont",
        DB_NAME: 'DolOptimizationDB',
        DB_VERSION: 1,
        Current_Font: null,
        
        // 初始化 IndexedDB
        initDB: function() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(DolOptimization.DB_NAME, DolOptimization.DB_VERSION);
                
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
                const db = await DolOptimization.initDB();
                
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
                
                const db = await DolOptimization.initDB();
                
                return new Promise((resolve, reject) => {
                    const transaction = db.transaction(['fonts'], 'readonly');
                    const store = transaction.objectStore('fonts');
                    const request = store.get(DolOptimization.FONT_NAME);
                    
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
                const db = await DolOptimization.initDB();
                
                return new Promise((resolve, reject) => {
                    const transaction = db.transaction(['fonts'], 'readwrite');
                    const store = transaction.objectStore('fonts');
                    const request = store.delete(DolOptimization.FONT_NAME);
                    
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
                const fontFace = new FontFace(DolOptimization.FONT_NAME, fontBuffer);
                await fontFace.load();
                document.fonts.add(fontFace);
                document.documentElement.style.fontFamily = `${DolOptimization.FONT_NAME}, sans-serif`;
                
                const base64Data = await DolOptimization.fileToBase64Data(file);
                const fontData = {
                    name: DolOptimization.FONT_NAME,
                    data: base64Data,
                    fileName: file.name,
                    timestamp: Date.now()
                };

                await DolOptimization.saveCustomFonts(fontData);
                
                DolOptimization.updateFontDisplayName(fontData.fileName);
                AsAPI.log("原版优化", `已应用字体: ${fontData.fileName}`);
            } catch (error) {
                AsAPI.error("原版优化", `字体加载失败: ${error}`);
                DolOptimization.handleFontLoadError(error);
            }
        },

        checkOptimizationCustomFontGlobal: async function(checked) {
            V.options.DolOptimization.OptimizationCustomFontGlobal = checked
            await DolOptimization.saveCustomFonts();
        },

        saveCustomFonts: async function(fontData) {
            if (!fontData) {
                fontData = V.options.DolOptimization?.OptimizationCustomFont || await DolOptimization.loadFontFromIndexedDB() || null;
            };
            if (!fontData) return;
            const isGlobal = V.passage === "Start" || (V.options.DolOptimization?.OptimizationCustomFontGlobal ?? false);
            if (isGlobal) {
                // 使用 IndexedDB 保存全局字体
                await DolOptimization.saveFontToIndexedDB(fontData);
                if (V.options.DolOptimization?.OptimizationCustomFont) {
                    delete V.options.DolOptimization.OptimizationCustomFont;
                }
                AsAPI.log("原版优化", `字体已保存到全局（IndexedDB）`);
            } else {
                // 存档字体保持不变
                V.options.DolOptimization.OptimizationCustomFont = fontData;
                await DolOptimization.removeFontFromIndexedDB();
                AsAPI.log("原版优化", `字体已保存到存档`);
            }
        },
        
        // 修改 loadSavedFont 方法
        loadSavedFont: async function() {
            // 优先检查存档中的字体
            const savedFont = V?.options?.DolOptimization?.OptimizationCustomFont;
            
            if (savedFont && savedFont.data) {
                AsAPI.log("原版优化", '发现存档字体，正在加载...');
                const success = await DolOptimization.applyFontFromData(savedFont);
                if (success) {
                    AsAPI.log("原版优化", '已加载存档字体:'+savedFont.fileName);
                    DolOptimization.updateFontDisplayName(savedFont.fileName);
                    if (V.options.DolOptimization?.OptimizationCustomFontGlobal) await DolOptimization.saveCustomFonts(savedFont);  // 点击了应用到全局但是没有选择字体
                    return true;
                } else {
                AsAPI.error("原版优化", '存档字体已损坏，自动清除');
                    DolOptimization.unsetCustomFont();
                }
            }
            
            // 如果没有存档字体，检查 IndexedDB
            const globalFont = await DolOptimization.loadFontFromIndexedDB();
            
            if (globalFont && globalFont.data) {
                const success = await DolOptimization.applyFontFromData(globalFont);
                if (success) {
                    if (V.options.DolOptimization) {
                        V.options.DolOptimization.OptimizationCustomFontGlobal = true;
                    }
                    AsAPI.log("原版优化", '已加载全局字体:', globalFont.fileName);
                    DolOptimization.updateFontDisplayName(globalFont.fileName);
                    return true;
                } else {
                    AsAPI.error("原版优化", '全局字体已损坏，自动清除');
                    await DolOptimization.removeFontFromIndexedDB();
                }
            }
            
            DolOptimization.updateFontDisplayName(null);
            document.documentElement.style.fontFamily = "";
            return false;
        },
        
        // 修改 unsetCustomFont 方法
        unsetCustomFont: async function() {
            document.documentElement.style.fontFamily = "";
            
            if (V?.options?.DolOptimization?.OptimizationCustomFont) {
                delete V.options.DolOptimization.OptimizationCustomFont;
            }
            
            await DolOptimization.removeFontFromIndexedDB();
            
            if (V.options.DolOptimization) {
                V.options.DolOptimization.OptimizationCustomFontGlobal = false;
            }
            
            AsAPI.log("原版优化", '字体设置已清除');
            DolOptimization.updateFontDisplayName(null);
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
                const fontBuffer = DolOptimization.base64ToArrayBuffer(fontData.data);
                const fontFace = new FontFace(DolOptimization.FONT_NAME, fontBuffer);
                await fontFace.load();
                document.fonts.add(fontFace);
                document.documentElement.style.fontFamily = `${DolOptimization.FONT_NAME}, sans-serif`;
                return true;
            } catch (error) {
                console.error('加载字体数据失败:', error);
                DolOptimization.handleFontLoadError(error);
                return false;
            }
        },
        
        handleFontLoadError: function(error) {
            let msg = `字体加载失败，错误: ${error.message || error}`;
            if (error.message === "Invalid font data in ArrayBuffer.") {
                msg = `字体加载失败: 字体不支持，请尝试换一个字体`;
            } else if (error.message?.includes("OTS parsing error") ||
                    error.message?.includes("Unsupported table version")) {
                msg = `字体加载失败: 字体格式不受支持，请尝试换一个字体`;
            }

            if (typeof window.dolOptAlert === 'function') {
                window.dolOptAlert(msg, '字体设置提示');
            } else if (typeof window.dolOptShowToast === 'function') {
                window.dolOptShowToast(msg, 'warning');
            } else {
                console.warn('[DolOptimization]', msg);
            }
        },
        
        updateFontDisplayName: function(fileName) {
            DolOptimization.Current_Font = fileName;
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
        // 叠穿图层缓存：按 CanvasModel 实例保存上一轮生成的图层。
        // 不缓存最终画布，只复用原版 Renderer 写在 layer 上的 image/cachedImage 等运行时缓存。
        wornStackingLayerCaches: new WeakMap(),

        clearLayerRuntimeCache: function(layer) {
            delete layer.image;
            delete layer.imageSrc;
            delete layer.mask;
            delete layer.cachedMaskSrc;
            delete layer.cachedImage;
            delete layer.cachedProcessing;
        },

        restoreLayerRuntimeCache: function(layer, previousLayer) {
            // deepCopyLayer(templateLayer) 会把“当前正常穿着衣物”的缓存也复制进来；
            // 这些缓存不属于叠穿衣物，必须先清掉。
            DolOptimization.clearLayerRuntimeCache(layer);
            if (!previousLayer) return;

            // 把上一轮同一叠穿图层的 Renderer 缓存带到新 layer。
            // Renderer 自己仍会检查 imageSrc/src 与 cachedProcessing；状态改变时会自动 miss 并重算。
            for (const key of ['image', 'imageSrc', 'mask', 'cachedMaskSrc', 'cachedImage', 'cachedProcessing']) {
                if (Object.prototype.hasOwnProperty.call(previousLayer, key)) {
                    layer[key] = previousLayer[key];
                }
            }
        },

        getWornStackingLayerCacheKey: function(slot, item, sub, accessory) {
            // sub（模板图层名_叠穿序号）放进 key：顺序改变时宁可 cache miss，也不要错误复用另一件衣服的缓存；hands 等左右手图层也靠它区分。
            const identity = item?.index ?? item?.variable ?? item?.name ?? sub;
            return `${slot}|${sub}|${String(identity)}|${accessory ? 'acc' : 'main'}`;
        },

        wornStackingCompile: function(options) {
            // 1. 调用原版编译，得到所有标准图层
            const layerSpecs = DolOptimization.originalCompile.call(this, options);
            if (options.lights || !V.wornStacking) return layerSpecs;
            if (options.root == "img/sex/") return layerSpecs;
            if (!DolOptimization.data.WornStacking) {
                DolOptimization.wornStackingRemoveAll(); 
                return layerSpecs
            };

            const result = [...layerSpecs];
            const previousCache = DolOptimization.wornStackingLayerCaches.get(this) || new Map();
            const nextCache = new Map();

            // 2. 遍历 V.wornStacking 的每个槽位
            for (const [slot, items] of Object.entries(V.wornStacking)) {
                if (!Array.isArray(items) || items.length === 0) continue;

                // 原版每个穿着槽位的图层名都以槽位名开头（upper_main/upper_acc/upper_leftarm…、
                // under_upper 的主层就叫 under_upper、handheld_left…），据此自动取全该槽位的图层，
                // 主图/配件/左右袖/胸腹背/贴身一并覆盖，无需手写清单
                const slotLayerNames = Object.keys(this.layers)
                    .filter(name => name === slot || name.startsWith(slot + "_"));
                if (slotLayerNames.length === 0) continue;

                const originalWorn = options.worn[slot];
                items.forEach((item, index) => {
                    // 与原版一致：叠加衣物的 worn 数据用原版 getClothingOptionsItem 生成
                    options.worn[slot] = getClothingOptionsItem(slot, item)[slot];

                    // 按原版 processLayer 的顺序求值，生成一个叠加图层
                    for (const baseName of slotLayerNames) {
                        const baseLayer = this.layers[baseName];
                        // 原版先求 showfn：不该显示的部件（handheld 无左手图、armsleeves 无主图）直接跳过，避免请求不存在的图片
                        if (baseLayer.showfn && !baseLayer.showfn(options)) continue;

                        const newLayer = DolOptimization.deepCopyLayer(baseLayer);
                        newLayer.name = `${slot}_stack_${baseName}_${index}`;
                        newLayer.z = (baseLayer.z || 0) + (index + 1) * 0.01;
                        newLayer.show = true;
                        // 深拷贝自“正在正常穿着的衣物”，其 blend/brightness 已被原版烘焙成主衣物颜色；
                        // 先复位成构造时的原始快照，再按叠加衣物自己的颜色合并，否则无颜色时会串用主衣物颜色
                        for (const key of ["blend", "blendMode", "desaturate", "brightness", "contrast"]) {
                            newLayer[key] = baseLayer.defaultOptions[key];
                        }

                        if (baseLayer.filtersfn) newLayer.filters = baseLayer.filtersfn(options);
                        if (baseLayer.wornfn) newLayer.worn = baseLayer.wornfn(options);

                        // 原版 preprocess 会给每个穿着槽位生成主色与配件色两个 filter，叠加衣物照做
                        const filterKeys = [`worn_${slot}`, `worn_${slot}_acc`];
                        const originalFilters = filterKeys.map(key => options.filters[key]);
                        setClothingFilter(options, slot, options.worn[slot], options.worn[slot].setup, '', 'colour_sidebar', 'colour');
                        setClothingFilter(options, slot, options.worn[slot], options.worn[slot].setup, '_acc', 'accessory_colour_sidebar', 'accColour');
                        // 原版 processLayer：逐个取出 layer.filters 里的 filter 合并（blend 为空则跳过）
                        if (newLayer.filters) {
                            for (let filter of newLayer.filters) {
                                if (typeof filter !== "object") {
                                    filter = options.filters[filter];
                                    if (!filter) continue;
                                }
                                if (!filter.blend) continue;
                                Renderer.mergeLayerData(newLayer, filter, true);
                            }
                        }
                        filterKeys.forEach((key, i) => { options.filters[key] = originalFilters[i]; });

                        if (baseLayer.srcfn) newLayer.src = baseLayer.srcfn(options);

                        // 复用上一轮同一叠穿图层的原版 Renderer 缓存。
                        const cacheKey = DolOptimization.getWornStackingLayerCacheKey(slot, item, `${baseName}_${index}`, false);
                        DolOptimization.restoreLayerRuntimeCache(newLayer, previousCache.get(cacheKey));
                        nextCache.set(cacheKey, newLayer);
                        result.push(newLayer);
                    }

                    options.worn[slot] = originalWorn;
                });
            }

            // 只保留本轮仍存在的叠穿图层；脱下/换序后的旧缓存可被 GC 回收。
            DolOptimization.wornStackingLayerCaches.set(this, nextCache);
            return result;
        },
        deepCopyLayer: function(layer) {
            // 使用 jQuery 的深拷贝，如果可用；否则用 JSON 转换（会丢失函数，但此处图层里已没有必须的函数）
            if (typeof jQuery !== 'undefined') {
                return jQuery.extend(true, {}, layer);
            }
            return JSON.parse(JSON.stringify(layer));
        },
        wornStackingRemove: function(item_index, slot) {
            const list = V.wornStacking[slot];
            const index = list?.findIndex(i => i.index == item_index);
            if (index > -1) {
                V.wardrobe[slot].push(list[index]);
                list.splice(index, 1);
            }
        },
        // 【1.1.1】调整叠加层级：position 为该件在叠加列表中的位置，direction 为 -1 前移 / 1 后移；
        // 已在最前再前移则与主要装备互换（该件成为主要装备，原主要装备落到叠加列表首位）
        wornStackingMove: function(position, direction, slot) {
            const list = V.wornStacking[slot];
            if (!Array.isArray(list) || !list[position]) return;
            const target = position + direction;
            if (target < 0) {
                const worn = V.worn[slot];
                if (!worn || !(worn.index > 0)) return;   // 没有主要装备可换
                V.worn[slot] = list[position];
                list[position] = worn;
                return;
            }
            if (target >= list.length) return;
            [list[position], list[target]] = [list[target], list[position]];
        },
        wornStackingRemoveAll: function() {
            if (!validArray(V.wornStacking)) {
                console.log("全部叠加脱下", "[失效]", V.wornStacking);
                return
            };
            console.log("全部叠加脱下", V.wornStacking);
            for (const [slot, items] of Object.entries(V.wornStacking)) {
                items.forEach((item, index) => {
                    V.wardrobe[slot].push(item);
                });
            }
            V.wornStacking = {};
            DolOptimization.wornStackingApplyStats();
        },
        wornStackingStore: function(location) {
            if (location == "wardrobe" || Object.keys(V.wardrobes).includes(location) || !validArray(V.wornStacking)) {
                console.log("存储叠加数据", "[失效]", location, V.wornStacking);
                return
            };
            console.log("存储叠加数据", location, V.wornStacking);
            V.store.stacking ??= {};
            V.store.stacking[location] = V.wornStacking;
            V.wornStacking = {};
        },
        wornStackingRestore: function(location) {
            console.log("恢复叠加数据", V.store.stacking[location]);
            if (V.store.stacking && V.store.stacking[location]) {
                V.wornStacking = V.store.stacking[location];
                delete V.store.stacking[location];
            }
        },
        // 【1.1.1】属性叠加：把叠加衣物的属性并进原版主衣物对象，
        // 这样原版各处直接读 V.worn[slot].type / .reveal / .warmth 的判断都会一并生效
        wornStackingStattedSlots: new Set(),
        wornStackingApplyStats: function() {
            const opt = V.options?.DolOptimization;
            if (!opt) return;
            // 只处理有叠加衣物的槽位和上次改动过的槽位；每次都从原版 setup 数据重建，反复调用不会累加
            const slots = new Set(DolOptimization.wornStackingStattedSlots);
            Object.keys(V.wornStacking ?? {}).forEach(slot => slots.add(slot));
            for (const slot of slots) {
                const base = V.worn?.[slot];
                const setupItem = base && setup.clothes[slot]?.[clothesIndex(slot, base)];
                if (!setupItem) {
                    DolOptimization.wornStackingStattedSlots.delete(slot);
                    continue;
                }
                const items = V.wornStacking?.[slot];
                const stacked = Array.isArray(items)
                    ? items.map(item => setup.clothes[slot]?.[clothesIndex(slot, item)]).filter(Boolean)
                    : [];
                DolOptimization.wornStackingStattedSlots.add(slot);
                // 特质（type）与暴露度（reveal）：与主衣物一起生效
                base.type = opt.WornStackingTraits && stacked.length
                    ? [...setupItem.type, ...stacked.flatMap(s => s.type ?? [])]
                    : [...setupItem.type];
                base.reveal = opt.WornStackingTraits && stacked.length
                    ? Math.max(setupItem.reveal ?? 0, ...stacked.map(s => s.reveal ?? 0))
                    : setupItem.reveal;
                // 保暖叠加：原版 getWarmth() 就是把所有 V.worn 的 warmth 相加
                base.warmth = (setupItem.warmth || 0)
                    + (opt.WornStackingWarmth ? stacked.reduce((sum, s) => sum + (s.warmth || 0), 0) : 0);
            }
        },
        // 【1.1.1】原版部分文案「先判断 type 再报 worn 名称」（例：身份被口罩遮掩），
        // 叠加后 type 并进主装备、名称却仍取主装备 → 优先返回真正具备该特质的衣物名。
        // 输出自带磨损度前缀（复用原版 integrityWord，full 时为空串），供替换 <<faceintegrity>> $worn.face.name 的补丁使用
        stackedTraitName: function(slot, trait) {
            const fmt = item => (typeof integrityWord === "function" ? integrityWord(item, slot) : "") + (item.cn_name_cap ?? item.name);
            const worn = V.worn?.[slot];
            // 关键：wornStackingApplyStats 会把叠加衣物的 type 并进 V.worn，此处必须读 setup 原始数据判断，
            // 否则主装备（眼镜）会因为被并入了 mask 特质而被误判成口罩
            const baseItem = worn && setup.clothes[slot]?.[clothesIndex(slot, worn)];
            if (baseItem?.type?.includes?.(trait)) return fmt(worn);
            const items = V.wornStacking?.[slot];
            if (Array.isArray(items)) {
                for (let i = items.length - 1; i >= 0; i--) {
                    if (setup.clothes[slot]?.[clothesIndex(slot, items[i])]?.type?.includes?.(trait)) return fmt(items[i]);
                }
            }
            return worn ? fmt(worn) : "";
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
    

    // 【1.0.7】自动灌溉机
    DolOptimization = { ...DolOptimization,
        autoIrrigator: function(location, plot) {
            if (V.automaticirrigationmachines && V.automaticirrigationmachines[location]) {
                if (V.automaticirrigationmachines[location] > 0 && plot.stage != 0 && plot.stage != 5 && plot.water == 0) {
                    V.automaticirrigationmachines[location]--;
                    plot.water = 1;
                    return true;
                }
            }
            return false
        }
    };


    // 【1.0.8】存档优化
    DolOptimization = { ...DolOptimization,
        initsavetime: 300,
        initsave: async function() {
            DolOptimization.data.customdesc ??= {};
            const saveList = document.getElementById("saveList");
            if (saveList && idb) {
                const saveGroups = saveList.querySelectorAll(".saveGroup");
                for (const group of saveGroups) {
                    const saveId = parseInt(group.querySelector(".saveId")?.innerText);
                    let saveItem = null
                    if (saveId) saveItem = await idb.getItem(saveId);
                    if (saveItem) {
                        console.log(`[DolOptimization-initsave] Loaded: saveId=${saveId}`, saveItem);
                        const title = group.querySelector(".saveDetails > span");
                        if (title) {
                            title.className = "saveTitle";
                            const originalDescText = title.innerText;   // 保存原始文本
                            title.onclick = function(e) {
                                // 防止同一个标题被重复点击
                                if (title._editing) return;
                                title._editing = true;
                                
                                const originalText = title.innerText;   // 保存原始文本
                                const input = document.createElement("input");
                                input.type = "text";
                                input.placeholder = originalDescText;
                                input.value = title.innerText == originalDescText ? "" : title.innerText;
                                input.className = "saveTitleInput";

                                // 用 input 替换 span
                                title.replaceWith(input);
                                input.focus();

                                // 失去焦点时处理
                                input.addEventListener("blur", async () => {
                                    const newText = input.value.trim();

                                    // 如果内容改变，弹出确认对话框
                                    if (newText != (DolOptimization.data.customdesc[saveId]?.desc ?? "")) {
                                        const V_ = saveItem.data.delta[0].variables;

                                        // 对话框处理标志，确保只处理一次
                                        let dialogResolved = false;
                                        const resolveDialog = (save) => {
                                            if (dialogResolved) return;
                                            dialogResolved = true;

                                            if (save) {
                                                // 保存到 IndexedDB
                                                if (idb && saveId) {
                                                    try {
                                                        if (newText) {
                                                            DolOptimization.data.customdesc[saveId] = {
                                                                desc: newText,
                                                                timestamp: saveItem.data.delta[0].variables.timeStamp
                                                            };
                                                        } else {
                                                            delete DolOptimization.data.customdesc[saveId];
                                                        }
                                                        DolOptimization.saveSettings();
                                                    } catch (err) {
                                                        console.error("保存描述失败", err);
                                                    }
                                                }
                                                title.innerText = newText || originalDescText;   // 新描述为空则回退原始描述
                                            } else {
                                                title.innerText = originalText;                  // 放弃修改
                                            }

                                            // 恢复 span
                                            input.replaceWith(title);
                                            title._editing = false;
                                        };

                                        // 创建并显示自定义对话框
                                        SugarCube.Dialog.setup("修改存档描述");
                                        SugarCube.Dialog.wiki(`
                                            <div>你确定要修改存档描述吗？你正在修改 ID为<span class="gold">${V_.saveName}</span>[#${saveId}] 的存档自定义描述：</div>
                                            <div class="black">${originalDescText}</div>
                                            <div class="green">${newText || "删除自定义描述"}</div>
                                            <ul class="buttons">
                                                <li><button id="customdesc-ok" type="button" role="button" tabindex="0">确认</button></li>
                                                <li><button id="customdesc-cancel" class="ui-close">取消</button></li>
                                            </ul>
                                            <div class="fromopt-inline">【原版优化】 提供此界面 | 【Optimization】 Provide this passage</div>
                                        `);
                                        SugarCube.Dialog.open();

                                        // 绑定按钮事件
                                        $('#customdesc-ok').one('click', () => {
                                            resolveDialog(true);
                                            SugarCube.Dialog.close();
                                        });
                                        $('#customdesc-cancel').one('click', () => {
                                            resolveDialog(false);
                                            SugarCube.Dialog.close();
                                        });
                                        // 点击 X 或按 ESC 关闭时，视为取消
                                        $(document).one(':dialogclose', () => {
                                            resolveDialog(false);
                                        });
                                    } else {
                                        // 没有变化
                                        title.innerText = originalText;
                                        input.replaceWith(title);
                                        title._editing = false;
                                    }
                                }, { once: true });
                            };
                            const customdesc = DolOptimization.data.customdesc[saveId];
                            if (customdesc && customdesc.timestamp == saveItem.data.delta[0].variables.timeStamp) {
                                const customText = customdesc.desc;
                                if (customText && title.innerText !== customText) {
                                    DolOptimization.setTitleWithBlur(title, customText);
                                }
                            } else {
                                delete DolOptimization.data.customdesc[saveId];
                                DolOptimization.saveSettings();
                            }
                        }
                        const datestamp = group.querySelector(".datestamp");
                        if (datestamp) {
                            const V_ = saveItem.data.delta[0].variables
                            const timestamp = V_.startDate + V_.timeStamp;
                            const date = new DateTime(timestamp);
                            datestamp.innerHTML = `${datestamp.innerHTML} <span class="pink">(${date.year}/${date.month}/${date.day} ${("0" + getTimeString(date.hour, date.minute)).slice(-5)} ${date.weekDayName})</span>`;
                            if (datestamp._overflowObserver) {
                                datestamp._overflowObserver.disconnect();
                            }
                            const toggleShadow = () => {
                                const hasOverflow = datestamp.scrollWidth > datestamp.clientWidth;
                                datestamp.classList.toggle('has-overflow', hasOverflow);
                            };
                            const observer = new ResizeObserver(() => toggleShadow());
                            observer.observe(datestamp);
                            datestamp._overflowObserver = observer;
                            toggleShadow();
                        }
                    };
                };
            }
            const pageButtons = document.getElementById("pageNum")?.parentElement?.querySelectorAll("button");
            if (pageButtons && pageButtons.length >= 2) {
                pageButtons[0].addEventListener("click", () => {
                    setTimeout(() => window.DolOptimization?.initsave(), DolOptimization.initsavetime);
                });
                pageButtons[1].addEventListener("click", () => {
                    setTimeout(() => window.DolOptimization?.initsave(), DolOptimization.initsavetime);
                });
            };
        },
        setTitleWithBlur: function(title, newText) {
            // 如果正在动画中，先清理可能残留的监听器
            if (title._blurHandler) {
                title.removeEventListener('transitionend', title._blurHandler);
            }

            const handler = (e) => {
                if (e.propertyName === 'filter') {      // 只处理 filter 过渡结束
                    title.removeEventListener('transitionend', handler);
                    title._blurHandler = null;

                    // 模糊到顶点 → 替换文字
                    title.textContent = newText;        // 用 textContent 更轻量
                    // 移除模糊类 → 文字从模糊变清晰
                    title.classList.remove('blurred');
                }
            };

            title._blurHandler = handler;
            title.addEventListener('transitionend', handler);
            title.classList.add('blurred');            // 触发模糊动画
        }
    };


    // 【1.1.1】快速按钮
    DolOptimization = { ...DolOptimization,
        // 部分事件段只有内联的“继续/离开”等链接而没有标准底部按钮；
        // 按 DolOptimization.nextButtonRules 的顺序 includes 匹配，命中第一个就生成一个镜像按钮挂在 passage 末尾（统一套用 #next 样式壳 + opt-shine 扫光）
        ensureNextButton: function() {
            if (document.getElementById("next")) return;
            const opt = DolOptimization.data;
            if (opt && opt.NextButton === false) return;
            const passage = document.querySelector(".passage");
            if (!passage) return;
            const links = [...passage.querySelectorAll('a[role="link"]')];

            // 选项里可自定义关键词与顺序（行序=优先级），未设置时回退 opt-vars.js 的默认表；
            // 按关键词顺序逐个找第一个包含它的链接，保证靠前的关键词优先
            const rules = (Array.isArray(opt.NextButtonRules) && opt.NextButtonRules.length)
                ? opt.NextButtonRules
                : (DolOptimization.nextButtonRules ?? []);
            const source = rules
                .map(keyword => links.find(a => a.textContent.trim().includes(keyword)))
                .find(Boolean);
            const text = source
                ? source.textContent.trim().replace(/^\s*[（(][^（()）]*[)）]\s*/, "").replace(/\s*[（(]\d+:\d+[)）]\s*$/, "")
                : null;
            if (!text || !source) return;

            const wrap = document.createElement("div");
            wrap.id = "nextButton";
            const link = document.createElement("a");
            link.className = "opt-shine";
            link.setAttribute("role", "link");
            link.tabIndex = 0;
            link.textContent = text;
            link.addEventListener("click", (event) => {
                event.preventDefault();
                if (longPressed) return;   // 长按触发的松手不转发点击
                if (!document.body.contains(source)) {
                    wrap.remove();
                    DolOptimization.ensureNextButton();
                    let newbtn = document.getElementById("nextButton");
                    if (newbtn && newbtn.innerText === text) newbtn.firstChild.click();
                    return;
                }
                source.click();   // 转发给原文内的链接，复用其原有跳转/逻辑
            });
            link.addEventListener("keydown", (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    if (!document.body.contains(source)) {
                        wrap.remove();
                        DolOptimization.ensureNextButton();
                        let newbtn = document.getElementById("nextButton");
                        if (newbtn && newbtn.innerText === text) newbtn.firstChild.click();
                        return;
                    }
                    source.click();
                }
            });
            // 【1.1.1】长按 600ms 临时关闭：按钮右移淡出 + 提示，本次游玩期间不再生成（选项开关重新打开可恢复）
            let pressTimer = null, longPressed = false;
            link.addEventListener("pointerdown", () => {
                longPressed = false;
                pressTimer = setTimeout(() => {
                    longPressed = true;
                    wrap.classList.add("nextButton-hide");
                    setTimeout(() => wrap.remove(), 400);
                    DolOptimization.showToast("已临时关闭快速继续按钮");
                }, 600);
            });
            ["pointerup", "pointerleave", "pointercancel"].forEach(type =>
                link.addEventListener(type, () => clearTimeout(pressTimer)));
            wrap.appendChild(link);
            const close = document.createElement("div");
            close.id = "nextButtonClose";
            close.addEventListener("click", () => {
                wrap.classList.add("nextButton-hide");
                setTimeout(() => wrap.remove(), 400);
                DolOptimization.showToast("已临时关闭快速继续按钮");
            });
            const closediv = document.createElement("div");
            closediv.className = "customOverlayClose";
            close.appendChild(closediv);
            wrap.appendChild(close);
            // 选项可自定义按钮离底部的百分比高度，覆盖 CSS 默认值
            wrap.style.bottom = (opt.NextButtonBottom ?? 30) + "%";
            passage.appendChild(wrap);
        },
        // 【1.1.1】轻量提示条（自挂自删，1.6s 后淡出），不依赖 dolOptAlert 模态框
        showToast: function(msg) {
            document.getElementById("dolOptToast")?.remove();
            const toast = document.createElement("div");
            toast.id = "dolOptToast";
            toast.textContent = msg;
            document.body.appendChild(toast);
            setTimeout(() => toast.classList.add("out"), 1200);
            setTimeout(() => toast.remove(), 1600);
        },
        // 【1.1.1】快速继续设置：开关即时增删按钮
        nextButtonToggle: function(on) {
            V.options.opt.NextButton = !!on;
            document.getElementById("nextButton")?.remove();
            if (on) setTimeout(DolOptimization.ensureNextButton);
        },
        // 【1.1.1】快速继续设置：按钮离底部百分比（0-100），已生成的按钮立即挪位
        nextButtonBottom: function(target) {
            V.options.opt.NextButtonBottom = Math.min(Math.max(parseInt(target.value) || 30, 0), 100);
            document.getElementById("nextButton")?.style.setProperty("bottom", V.options.opt.NextButtonBottom + "%");
        },
        // 【1.1.1】快速继续设置：关键词文本框（每行一个，行序=优先级），保存后立即按新规则重建按钮
        nextButtonRulesEdit: function(target) {
            const rules = target.value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
            if (rules.length) V.options.opt.NextButtonRules = rules;
            document.getElementById("nextButton")?.remove();
            setTimeout(DolOptimization.ensureNextButton);
        }
    }


    // 【1.1.1】遇欲便利店
    // 柜台/货架/便利店外 三个陈列区的 tab 切换（容器每次渲染都会重建，故用 document 级委派只绑一次）
    $(document).on("click", ".csTab", function() {
        const $tab = $(this);
        const $tabs = $tab.parent().children();
        const i = $tab.index();                       // 按 DOM 索引定位纸片（页签的视觉次序由 CSS order 调整，不影响索引）
        if (i === $tabs.filter(".is-active").index()) return;
        DolOptimization._csTab = i;                   // 供买完后 passage 重渲染时按此渲染激活态
        $tabs.removeClass("is-active").eq(i).addClass("is-active");
        // data-cur 一改，三张纸片各自按空间模型落到新位置，动画天然按「从哪到哪」分化；旧纸片必须摘掉 is-active，否则它的商品列表会一直压在新列表上
        const $space = $tab.parent().next().children().attr("data-cur", i); // .csSpace：preserve-3d 空间容器，三张纸片的相机变换都看它的 data-cur
        $space.children().removeClass("is-active").eq(i).addClass("is-active");
    });
    // 展开槽位：{inner, outer, cols, rows, levels, levelStep}
    // inner/outer 是最内（最远）排与最外（最近）排的左右端点，中间列与中间排用双线性插值生成
    DolOptimization = { ...DolOptimization, 
        csGrid: function(g) {
            const mix = (a, b, t) => a + (b - a) * t;
            const pos = [], L = g.levels ?? 1, S = g.levelStep ?? [0, 0];
            // 绘制序：逐层、由内排向外排、每排由左向右（近排后画，盖住远排）
            for (let l = 0; l < L; l++) {
                for (let r = 0; r < g.rows; r++) {
                    for (let c = 0; c < g.cols; c++) {
                        const u = g.cols > 1 ? c / (g.cols - 1) : 0, v = g.rows > 1 ? r / (g.rows - 1) : 0;
                        pos.push([
                            mix(mix(g.inner[0][0], g.inner[1][0], u), mix(g.outer[0][0], g.outer[1][0], u), v) + l * S[0],
                            mix(mix(g.inner[0][1], g.inner[1][1], u), mix(g.outer[0][1], g.outer[1][1], u), v) + l * S[1],
                        ]);
                    }
                }
            }
            return pos;
        },
        // 按每日库存把商品分层绘制到单个 canvas
        // cfg = {base, cover, crop: [x, y], canvas: [宽, 高], grids: {槽位名: 槽位规则}, goods: {"商品名": {sprite, per, grid}}}
        conveniencestoreGoodsImage: function(cfg) {
            const dir = "img/ui/conveniencestore/";
            const names = Object.keys(cfg.goods);
            const load = src => new Promise(resolve => {
                const img = new Image();
                img.onload = img.onerror = () => resolve(img);
                img.src = dir + src;
            });
            Promise.all([load(cfg.base), load(cfg.cover)].concat(names.map(n => load(cfg.goods[n].sprite)))).then(imgs => setTimeout(() => {
                const canvas = document.getElementById("cs_" + cfg.base);
                if (!canvas) return;
                const ctx = canvas.getContext("2d");
                // 商品条目在本图之后才初始化，故延到此处才读库存
                const stock = V.daily.conveniencestoregoods ?? {};
                const x = cfg.crop[0], y = cfg.crop[1];
                ctx.drawImage(imgs[0], x, y);
                names.forEach((n, gi) => {
                    const good = cfg.goods[n];
                    const pos = DolOptimization.csGrid(cfg.grids[good.grid]);
                    // 每个精灵代表 per 点库存，超出的库存不显示，格子多于库存则留空
                    const show = Math.min(pos.length, Math.floor((stock[n] ?? Infinity) / good.per));
                    // 补货自外排向内、每排自右向左，与绘制序正好相反，故画末尾 show 个槽位
                    for (let k = pos.length - show; k < pos.length; k++) {
                        ctx.drawImage(imgs[gi + 2], pos[k][0] + x, pos[k][1] + y);
                    }
                });
                ctx.drawImage(imgs[1], x, y);
            }, 0));
        },
    };

    // 【1.1.1】棒棒糖：便利店柜台购买、2 小时内每分钟 -1 疼痛 -1 压力，到期或取下即消失
    // DolOptimization = { ...DolOptimization,
    //     lollipopBuy: function() {
    //         // 叠加是实验功能，买棒棒糖即代表要用到它，自动打开
    //         V.options.DolOptimization.WornStacking = true;
    //         const item = setup.clothes.face.find(x => x.variable === "lollipop");
    //         if (!item) return;
    //         // 面部空着直接穿，已有装备则进叠加层
    //         if (V.worn.face.variable !== "naked") {
    //             (V.wornStacking.face ??= []).push(clone(item));
    //         } else {
    //             V.worn.face = clone(item);
    //         }
    //         // 生效期 2 小时（时间戳毫秒），重复购买在剩余基础上顺延
    //         V.lollipopUntil = (V.lollipopUntil > V.timeStamp ? V.lollipopUntil : V.timeStamp) + 120 * 60000;
    //         Wikifier.wikifyEval("<<updatesidebardescription>>");
    //     },
    //     // 时间流逝结算（由 Time.pass 包装调用，minutes = 实际流逝的整分钟数）
    //     lollipopTick: function(minutes) {
    //         if (!V.lollipopUntil || minutes <= 0) return;
    //         V.pain = Math.max(0, V.pain - minutes);
    //         V.stress = Math.max(0, V.stress - minutes);
    //         if (V.timeStamp >= V.lollipopUntil) DolOptimization.lollipopRemove();
    //     },
    //     // 页面渲染时校验：被手动取下到衣柜、或已到期 → 立即消失
    //     lollipopValidate: function() {
    //         if (!V.lollipopUntil) return;
    //         const worn = V.worn.face?.variable === "lollipop"
    //             || (Array.isArray(V.wornStacking.face) && V.wornStacking.face.some(x => x.variable === "lollipop"));
    //         if (!worn || V.timeStamp >= V.lollipopUntil) DolOptimization.lollipopRemove();
    //     },
    //     lollipopRemove: function() {
    //         delete V.lollipopUntil;
    //         // 身上（正面 + 叠加层）与衣柜里的棒棒糖一并清除
    //         if (V.worn.face?.variable === "lollipop") V.worn.face = clone(setup.clothes.face[0]);   // face[0] 是 naked
    //         if (Array.isArray(V.wornStacking.face)) V.wornStacking.face = V.wornStacking.face.filter(x => x.variable !== "lollipop");
    //         if (Array.isArray(V.wardrobe.face)) V.wardrobe.face = V.wardrobe.face.filter(x => x.variable !== "lollipop");
    //         Wikifier.wikifyEval("<<updatesidebardescription>>");
    //     }
    // };


    // // 【1.1.1】棒棒糖美化：不同美化包（原版 / Goose）嘴部位置不同，按设置页选项换贴图并做 X/Y 像素偏移
    // DolOptimization = { ...DolOptimization,
    //     // 渲染器加载图片前调用：棒棒糖图返回改写信息，其它图片返回 null 原样放行
    //     lollipopTransform: function(src) {
    //         if (typeof src !== "string" || !src.includes("/face/lollipop/")) return null;
    //         const o = V.options.DolOptimization;
    //         const style = o.LollipopStyle ?? "";
    //         const dx = o.LollipopX ?? 0, dy = o.LollipopY ?? 0;
    //         if (!style && !dx && !dy) return null;
    //         return {
    //             src: style ? src.replace(/lollipop\/([^\/]+)\.png$/, `lollipop/$1${style}.png`) : src,
    //             dx, dy
    //         };
    //     },
    //     // 把加载好的棒棒糖图平移后画到同尺寸画布上（按 路径+偏移 缓存，避免每帧重画）
    //     lollipopShift: (function() {
    //         const cache = new Map();
    //         return function(image, t) {
    //             if (!t.dx && !t.dy) return image;
    //             const key = t.src + "|" + t.dx + "|" + t.dy;
    //             let canvas = cache.get(key);
    //             if (!canvas) {
    //                 canvas = document.createElement("canvas");
    //                 canvas.width = image.width; canvas.height = image.height;
    //                 canvas.getContext("2d").drawImage(image, t.dx, t.dy);
    //                 if (cache.size > 50) cache.clear();
    //                 cache.set(key, canvas);
    //             }
    //             return canvas;
    //         };
    //     })(),
    //     // 改完选项后清掉渲染器里的棒棒糖图缓存并重绘侧栏人物
    //     lollipopRefresh: function() {
    //         Object.keys(Renderer.ImageCaches ?? {}).forEach(k => {
    //             if (k.includes("/face/lollipop/")) {
    //                 delete Renderer.ImageCaches[k];
    //                 delete Renderer.ImageErrors[k];
    //             }
    //         });
    //         Wikifier.wikifyEval("<<updatesidebarimg>>");
    //     },
    //     // 设置页：切换美化类型（原版 ↔ Goose），返回新名称供按钮显示
    //     lollipopStyleNext: function() {
    //         V.options.DolOptimization.LollipopStyle = (V.options.DolOptimization.LollipopStyle ?? "") === "-goose" ? "" : "-goose";
    //         DolOptimization.lollipopRefresh();
    //         return (V.options.DolOptimization.LollipopStyle ?? "") === "-goose" ? "Goose" : "原版";
    //     },
    //     // 设置页：X/Y 偏移微调（±5px），返回新值供显示
    //     lollipopOffset: function(axis, delta) {
    //         const key = axis === "x" ? "LollipopX" : "LollipopY";
    //         V.options.DolOptimization[key] = Math.clamp((V.options.DolOptimization[key] ?? 0) + delta, -100, 100);
    //         DolOptimization.lollipopRefresh();
    //         return V.options.DolOptimization[key];
    //     }
    // };
    // // 渲染器图片加载钩子：棒棒糖图先按选项改写文件名，加载后平移像素再交回渲染器（渲染器缓存键仍用原路径，选项变更时由 lollipopRefresh 清除对应键）
    // Renderer.ImageLoader = (function(orig) {
    //     return {
    //         loadImage: function(src, layer, ok, err) {
    //             const t = DolOptimization?.lollipopTransform(src);
    //             if (!t) return orig.loadImage(src, layer, ok, err);
    //             orig.loadImage(t.src, layer, function(s, l, image) { ok(src, l, DolOptimization.lollipopShift(image, t)); }, function(s, l, e) { Renderer.ImageErrors[src] = true; err(s, l, e); });
    //         }
    //     };
    // })(Renderer.ImageLoader);
})();