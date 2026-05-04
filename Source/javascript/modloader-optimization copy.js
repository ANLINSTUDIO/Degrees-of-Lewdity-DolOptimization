window.DolOptimization = {};


// 【1.0.3】美化Modloader
const banner = document.getElementById('startBannerModLoaderGui');
if (banner) {
    banner.addEventListener('click', async (e) => {
        new wikifier(document.body, "<<overlayReplace \"modloader\">>");
        e.stopImmediatePropagation(); // 阻止后续同类型事件执行
        e.preventDefault();
    }, true);
}


modUtils.version