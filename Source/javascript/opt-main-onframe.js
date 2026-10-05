(() => {
    // 【1.1.1】遇欲便利店
    DolOptimization.full = !!window.modUtils.getMod('maplebirch');
    if (!DolOptimization.full) {
        setTimeout(() => {
            const message = `原版优化从此版本开始部分依赖秋枫白桦框架，请确保安装其并将本模组置于框架下方。
                如果没有安装 maplebirch，部分功能不会失效，仅是NPC等功能无法正常使用；
                若你发现本模组的其他不依赖框架的功能失效，请尝试将本模组顺序提升。
            `;
            if (typeof window.dolOptAlert === 'function') window.dolOptAlert(message, '依赖提示');
            console.error("[原版优化] 需要秋枫白桦框架，请确保安装并将本模组置于框架下方");
        }, 100);
        return;
    }

    
    maplebirch.npc.add({
        nam: "Needmeet",
        gender: "m",
        title: "Fledgling",
        description: "Needmeet",
        teen: 1,
        insecurity: "ethics",
        type: "human",

        hairColour: "black",

        love: 0,
        dom: 0,
        lust: 0,
        
        init: 0,
    }, {
        loveInterest: () => V.needmeet_romance >= 80,
        romance: [
            () => V.needmeet_romance >= 80,
        ],

        love: { maxValue: 100 },
        loveAlias: () => {
            return V.needmeet_romance >= 50 ? ['Trust', '信赖'] : ['Affection', '好感'];
        },

        dom: {
            name: "害怕",
            maxValue: 100
        },
        lust: { maxValue: 100 }
    }, {
        "Needmeet": {
            CN: "遇欲",
            EN: "Needmeet"
        },
        "Fledgling": {
            CN: "雏鸟",
            EN: "Fledgling"
        }
    });
})();