window.DolOptimization = {};

// === 注入 =====================================
$(document).on(":passagerender", function (ev) {DolOptimization.onPassageRender(ev)});
DolOptimization.onPassageRender = function (ev) {
    // 隐藏右上角黑块箭头的开关 「離地三尺一條河」
    if (DolOptimization.cv("HideUiBarToggle")) {$("#ui-bar-toggle").hide()} else {$("#ui-bar-toggle").show()};
};

DolOptimization.cv = function(value, default_ = true) {
    V.DolOptimization = V.DolOptimization || {}
    V.DolOptimization.Settings = V.DolOptimization.Settings || {}
    V.DolOptimization.Settings[value] = V.DolOptimization.Settings[value] ?? default_
    return V.DolOptimization.Settings[value]
}