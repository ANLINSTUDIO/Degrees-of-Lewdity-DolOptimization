(() => {
    DolOptimization.loadData = function(value) {
        /* 从 DolOptimization.data 读取数据，写入 V.options.opt，也是对变量进行初始化和默认值设置 */
        value("UiBarToggle", "default");
        // 【1.0.8】初始化园艺大师变量
        value("ShowWaterState", true);
        value("ShowProcess", true);
        // 【1.1.1】初始化叠加服装变量
        value("WornStacking", true);
        value("WornStackingTraits", true);
        value("WornStackingWarmth", true);
        // 【1.1.1】初始化快速继续选项（默认开、离底 30%、关键词用 opt-vars.js 默认表）
        value("NextButton", true);
        value("NextButtonBottom", 30);
        value("NextButtonRules", null);
    }

    DolOptimization.onPassageRender = function (ev) {
        if (!V.options) return;
        V.options.DolOptimization ??= {};  // V.options.DolOptimization 是跟随存档的，而 V.options.opt 是一个与本地data共享的对象，用于快速处理data的数据，并在刷新页面时重新写入data。
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
        DolOptimization.loadSavedFont?.apply()

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

            // 【1.1.1】初始化棒棒糖美化选项
            // if (V.options.DolOptimization.LollipopStyle === undefined) V.options.DolOptimization.LollipopStyle = "";
            // if (V.options.DolOptimization.LollipopX === undefined) V.options.DolOptimization.LollipopX = 0;
            // if (V.options.DolOptimization.LollipopY === undefined) V.options.DolOptimization.LollipopY = 0;
        };

        // 【1.0.5】叠加服装部件
        V.wornStacking ??= {};
        
        // 【1.0.9】遇欲便利店
        V.needmeet_romance ??= 0;

        // 【1.1.1】补全缺失的 #next 底部按钮
        setTimeout(DolOptimization.ensureNextButton);

        // 【1.1.1】棒棒糖：手动取下或到期时在此处兜底清理（不流逝时间的脱衣动作走这里）
        // DolOptimization.lollipopValidate();

        // 【1.1.1】属性叠加：把叠加衣物的属性并进主衣物（原版直接读 V.worn，故需在每个段落前刷新）
        DolOptimization.wornStackingApplyStats?.();

        // 保存
        DolOptimization.saveSettings();
    };
    DolOptimization.of$tendingDay = function() {
        // 【1.0.7】自动灌溉
        for (const [location, plots] of Object.entries(V.plots ?? {})) {
            plots.forEach(plot => window.DolOptimization?.autoIrrigator(location, plot));
        }
    }
    DolOptimization.of$minutePassed = function(minutes) {
        // 【1.1.1】棒棒糖：Time.pass 是全部时间流逝的唯一入口，按实际流逝分钟结算效果
        // window.DolOptimization?.lollipopTick(minutes);
    };
    DolOptimization.of$hourPassed = function(hours) {
        // 【1.0.6】生发喷雾：每小时 +0.05 发质
        V.hairtexture = Math.clamp((V.hairtexture || 50) + 0.05 * hours, 0, 100);
    };
    DolOptimization.of$dayPassed = function() {
        if (!V.player.vaginaExist || V.player.virginity.vaginal !== true) delete V.hymenreconstructioncount;
        if (V.hymenreconstructioncount) V.hymenreconstructioncount--;
        if (V.hymenreconstructioncount <= 0) delete V.hymenreconstructioncount;
    }



    // 【注入】 ====================================
    $(document).on(":passageinit", function () {DolOptimization.wornStackingApplyStats?.()});   // 【1.1.1】属性叠加：段落正文求值前刷新（正文里的宏会直接读 V.worn）
    $(document).on(":passagerender", function (ev) {DolOptimization.onPassageRender(ev)});
    $(document).on("mousedown", function(event) {
        if (event.button === 1) {
            event.preventDefault();  // 防止触发浏览器历史导航
            event.stopPropagation(); // 防止事件冒泡
            $("#ui-bar").toggleClass("stowed")
        }
    });
    $(document).on(":oncloseoverlay", function (e, overlay) {
        console.log("oncloseoverlay, ", overlay)
        if (overlay === "options") {
            DolOptimization.rv(true);
            DolOptimization.saveSettings();
        }
    });
    // 【工具】注入游戏函数，在调用原函数后再执行指定的功能。
    DolOptimization.onFunction = function(originalFn, afterFn) {
        return new Proxy(originalFn, {
            apply: function(target, thisArg, argumentsList) {
                // const result = target.apply(thisArg, argumentsList);
                afterFn(...argumentsList);
                return target.apply(thisArg, argumentsList);
            }
        });
    };
    // 【工具】注入游戏宏，在调用原宏后再执行指定的功能。
    DolOptimization.onMacro = function(macroName, afterFn) {
        let originalMacro = Macro.get(macroName);
        if (originalMacro) {
            let oldHandler = originalMacro.handler;
            Macro.delete(macroName);
            Macro.add(macroName, {
                handler: function () {
                    oldHandler.apply(this, arguments);
                    afterFn.apply(this, arguments);
                }
            });
        }
    };
})();