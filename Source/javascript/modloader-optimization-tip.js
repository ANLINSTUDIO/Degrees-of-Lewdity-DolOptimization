// 【1.1.1】Mod管理器迁移至ModHub提示
DolOptimization = { ...DolOptimization,
    openModHubNotice: function() {
        SugarCube.Dialog.setup("Mod管理器");
        SugarCube.Dialog.wiki(`
            <div class="modloader-tip-letter">
                <p>亲爱的用户，您好。</p>
                <p>感谢您支持原版优化的Mod管理器。</p>
                <p>为了便于维护和更新，开发团队决定将Mod管理器单独作为一个模组【ModHub】，麻烦您移步至下载页面，安装最新版本的ModHub。</p>
                <p>原版优化仍然希望继续向您提供必要但微不足道的功能。</p>
                <p class="modloader-tip-sign">顺颂时祺<br>Needmeet</p>
            </div>
            <ul class="buttons modloader-tip-actions">
                <li><button id="modhub-goto" type="button" role="button" tabindex="0">转至Github</button></li>
                <li><button id="modhub-cancel" class="ui-close" type="button" role="button" tabindex="0">&nbsp;取消&nbsp;</button></li>
            </ul>
            <div class="fromopt-inline">【原版优化】 提供此界面 | 【Optimization】 Provide this passage</div>
        `);
        SugarCube.Dialog.open();

        $('#modhub-goto').one('click', () => {
            window.open("https://github.com/JohnLiao501/ModHub/releases", "_blank");
        });
        // 取消按钮由 ui-close 类自动关闭，点击 X 或按 ESC 亦同
    }
};
