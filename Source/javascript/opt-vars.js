(() => {
    // === 常量 =====================================
    DolOptimization.STORAGE_KEY = 'opt';
    // 【1.1.1】底部按钮补全默认关键词：按数组顺序对链接文本（trim 后）做 includes 匹配，命中第一个即生成镜像底部按钮；
    // 玩家可在选项【内容设置>快速继续】里自定义关键词与顺序（存 V.options.opt.NextButtonRules）
    DolOptimization.nextButtonRules = ["大厅", "继续", "离开", "出去", "返回", "关上衣柜", "拒绝", "专注课程", "去上", "加入"];
})();