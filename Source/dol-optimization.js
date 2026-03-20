window.DolOptimization = {};

// === 注入 =====================================
$(document).on(":passagerender", function (ev) {DolOptimization.onPassageRender(ev)});
DolOptimization.onPassageRender = function (ev) {
    V.DolOptimization = V.DolOptimization || {}
    V.DolOptimization.Settings = V.DolOptimization.Settings || {}

    // 隐藏右上角黑块箭头的开关 「離地三尺一條河」
    if (DolOptimization.cv("HideUiBarToggle")) {$("#ui-bar-toggle").hide()} else {$("#ui-bar-toggle").show()};
    DolOptimization.loadSavedFont();
};

DolOptimization.cv = function(value, default_ = false) {
    V.DolOptimization.Settings[value] = V.DolOptimization.Settings[value] ?? default_
    return V.DolOptimization.Settings[value]
}

DolOptimization.loadCustomFont = async function() {
    const fileInput = document.getElementById('custom-font');
    const file = fileInput.files[0];
    T.optionsRefresh  = true;
    
    if (!file) {
        return;
    }

    try {
        // 读取文件为 ArrayBuffer
        const fontBuffer = await file.arrayBuffer();
        
        // 创建 FontFace 对象
        const fontFace = new FontFace("OptimizationCustomFont", fontBuffer);
        
        // 加载字体
        await fontFace.load();
        
        // 添加到文档中
        document.fonts.add(fontFace);
        
        // 设置全局 font-family
        document.documentElement.style.fontFamily = `OptimizationCustomFont, sans-serif`;
        const base64Data = await this.fileToBase64Data(file);
        V.DolOptimization.Settings.OptimizationCustomFont = {
            name: "OptimizationCustomFont",
            data: base64Data,        // 纯Base64数据
            fileName: file.name,
        };
        if (document.querySelector("#custom-font-text")) {document.querySelector("#custom-font-text").innerText = V.DolOptimization?.Settings?.OptimizationCustomFont?.fileName ?? "自定义字体";}
        
        console.log('字体应用成功！');
    } catch (error) {
        console.error('字体加载失败:', error);
        if (error.message === "Invalid font data in ArrayBuffer.") {
            alert(`字体加载失败: 字体不支持，请尝试换一个字体`);
        } else {
            alert(`字体加载失败，错误: ${error}`);
        }
    }
}
DolOptimization.fileToBase64Data = function(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64Full = reader.result;
            // 去掉 "data:application/octet-stream;base64," 之类的前缀
            const base64Data = base64Full.split(',')[1];
            resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
DolOptimization.unsetCustomFont = function() {
    document.documentElement.style.fontFamily = ``;
    if (V?.DolOptimization?.Settings?.OptimizationCustomFont) {
        delete V.DolOptimization.Settings.OptimizationCustomFont;
    }
    console.log('字体设置已清除');
    if (document.querySelector("#custom-font-text")) {document.querySelector("#custom-font-text").innerText = V.DolOptimization?.Settings?.OptimizationCustomFont?.fileName ?? "自定义字体";}
}
DolOptimization.loadSavedFont = async function() {
    // 检查是否有保存的字体
    const savedFont = V?.DolOptimization?.Settings?.OptimizationCustomFont;
    if (!savedFont) {
        console.log('没有已保存的字体');
        document.documentElement.style.fontFamily = "";
        return false;
    }
    
    try {
        // 将Base64转换为ArrayBuffer
        const fontBuffer = this.base64ToArrayBuffer(savedFont.data);
        
        // 创建并加载字体
        const fontFace = new FontFace("OptimizationCustomFont", fontBuffer);
        await fontFace.load();
        
        // 添加到文档
        document.fonts.add(fontFace);
        
        // 应用字体
        document.documentElement.style.fontFamily = `OptimizationCustomFont, sans-serif`;
        
        console.log('已自动加载保存的字体:', savedFont.fileName);
        return true;
        
    } catch (error) {
        console.error('自动加载字体失败:', error);
        
        // 如果字体已损坏，自动清除
        if (error.message.includes("OTS parsing error") || 
            error.message.includes("Invalid font data")) {
            console.log('保存的字体已损坏，自动清除');
            this.unsetCustomFont();
        }
        
        return false;
    }
}
DolOptimization.base64ToArrayBuffer = function(base64) {
    // 解码Base64
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    return bytes.buffer;
}


DolOptimization.loadRemote = function() {
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
};