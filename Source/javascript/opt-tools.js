(() => {
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
                if (V.options) {
                    V.options.opt = {};
                    func = DolOptimization.nv;
                }
            }

            if (func) {
                DolOptimization.loadData(func);
            }
        },
        loadSettings: function() {
            try {
                const saved = localStorage.getItem(DolOptimization.STORAGE_KEY);
                DolOptimization.data = saved ? JSON.parse(saved) : {};
            } catch (e) {
                asi.log("原版优化", '[Optimization] 读取 localstorage 失败', "gold", "yellow");
                DolOptimization.data = {};
            }
        },
        saveSettings: function() {
            try {
                const data = JSON.stringify(DolOptimization.data);
                localStorage.setItem(DolOptimization.STORAGE_KEY, data);
            } catch (e) {
                asi.log("原版优化", '[Optimization] 保存 localstorage 失败', "gold", "yellow");
            }
        },
        applySettings: function(reload=false) {
            DolOptimization.onPassageRender();
            if (reload) {
                Engine.play(V.passage)
            }
        },
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
            }, 10);
        },
    }

    DolOptimization.loadSettings();
})();