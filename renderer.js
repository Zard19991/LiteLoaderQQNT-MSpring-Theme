const plugin_path = LiteLoader.plugins["mspring_theme"].path.plugin;

function log(...args) {
    console.log(`[MSpring Theme]`, ...args);
    mspring_theme.logToMain(...args);
}

function observeElement(selector, callback, callbackEnable = true, interval = 100) {
    const timer = setInterval(function () {
        const element = document.querySelector(selector);
        if (element) {
            if (callbackEnable) {
                callback();
                log("已检测到", selector);
            }
            clearInterval(timer);
        }
    }, interval);
}

function insertHeti(before) {
    // 在页面header插入heti的css和js
    const hetiLinkElement = document.createElement("link");
    hetiLinkElement.rel = "stylesheet";
    hetiLinkElement.href = `local:///${plugin_path}/src/heti-m.css`;
    document.head.appendChild(hetiLinkElement);

    const hetiScriptElement = document.createElement("script");
    hetiScriptElement.src = `local:///${plugin_path}/src/heti-addon.min.js`;
    document.head.appendChild(hetiScriptElement);

    const hetiSpacingElementScriptElement = document.createElement("script");
    hetiSpacingElementScriptElement.textContent = `
            function hetiSpacingElement(element) {
                let heti = new Heti();
                heti.spacingElement(element);
            }
        `;
    document.head.appendChild(hetiSpacingElementScriptElement);

    // 页面变化时，遍历class中包含text-normal的所有元素，如果class不包含heti的就加入heti的class
    // 加入heti的class调用上面的函数
    const observer = new MutationObserver((mutationsList) => {
        for (let mutation of mutationsList) {
            if (mutation.type === "childList") {
                const messageContentElements = document.querySelectorAll(before + ".text-normal");
                messageContentElements.forEach(element => {
                    if (!element.classList.contains("heti")) {
                        element.classList.add("heti");
                        hetiSpacingElement(element);
                    }
                });
            }
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

try {


    // 页面加载完成时触发
    const element = document.createElement("style");
    document.head.appendChild(element);

    mspring_theme.updateStyle((event, message) => {
        element.textContent = message;
    });

    mspring_theme.rendererReady();

    // 判断操作系统类型
    var osType = "";
    if (LiteLoader.os.platform === "win32") {
        osType = "windows";
    } else if (LiteLoader.os.platform === "linux") {
        osType = "linux";
    } else if (LiteLoader.os.platform === "darwin") {
        osType = "mac";
    }
    document.documentElement.classList.add(osType);

    // 判断插件background_plugin是否存在且启用
    if (LiteLoader.plugins.background_plugin && !LiteLoader.plugins.background_plugin.disabled) {
        log("[检测]", "已启用背景插件");
        document.documentElement.classList.add(`mspring_background_plugin_enabled`);
    }

    // 判断插件lite_tools是否存在且启用
    if (LiteLoader.plugins.lite_tools && !LiteLoader.plugins.lite_tools.disabled) {
        log("[检测]", "已启用轻量工具箱");
        const ltOptions = await lite_tools.getOptions();
        if (ltOptions.background.enabled) {
            log("[检测]", "已启用轻量工具箱-自定义背景");
            document.documentElement.classList.add(`mspring_lite_tool_background_enabled`);
        }
    }

    // 判断是否开启heti
    const settings = await mspring_theme.getSettings();
    if (settings.heti) {
        log("[设置]", "开启赫蹏");
        try {
            observeElement('#ml-root .ml-list', function () { insertHeti(".ml-list ") });
        } catch (error) {
            log("[错误]", "赫蹏加载出错", error);
        }
    }

} catch (error) {
    log("[渲染进程错误]", error);
}


// 打开设置界面时触发
export const onSettingWindowCreated = async view => {
    log("[设置]", "打开设置界面");
    try {
        const html_file_path = `local:///${plugin_path}/src/settings.html`;

        view.innerHTML = await (await fetch(html_file_path)).text();

        document.querySelectorAll(".nav-item.liteloader").forEach((node) => {
            if (node.textContent === "MSpring Theme") {
                node.querySelector(".q-icon").innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M247.693-147.694q-34.328 0-67.894-15.077-33.565-15.076-55.95-40.306 22.923-6.539 43.384-27.808 20.461-21.27 20.461-56.808 0-41.922 29.038-70.96 29.038-29.038 70.961-29.038 41.922 0 70.96 29.038 29.038 29.038 29.038 70.96 0 57.75-41.124 98.874-41.125 41.125-98.874 41.125Zm0-59.999q33 0 56.5-23.5t23.5-56.5q0-17-11.5-28.5t-28.5-11.5q-17 0-28.5 11.5t-11.5 28.5q0 23-5.5 42t-14.5 36q5 2 10 2h10Zm212.306-162.308L370.77-459.23l342.614-342.614q11-11 27.5-11.5t28.5 11.5l33.23 33.229q12 12 12 28t-12 28L459.999-370.001Zm-172.306 82.308Z"/></svg>`;
                // console.log(node.querySelector(".q-icon"))
            }
        });

        // 获取设置
        const settings = await mspring_theme.getSettings();
        const themeColor = settings.themeColor;

        // 给pick-color(input)设置默认颜色
        const pickColor = view.querySelector(".pick-color");
        pickColor.value = themeColor;

        // 给pick-color(input)添加事件监听
        pickColor.addEventListener("change", (event) => {
            // 修改settings的themeColor值
            settings.themeColor = event.target.value;
            // 将修改后的settings保存到settings.json
            mspring_theme.setSettings(settings);
        });

        // 背景颜色透明
        const backgroundOpacity = settings.backgroundOpacity;
        // 给pick-opacity(input)设置默认值
        const pickOpacity = view.querySelector(".pick-opacity");
        pickOpacity.value = backgroundOpacity;
        // 给pick-opacity(input)添加事件监听 
        pickOpacity.addEventListener("change", (event) => {
            // 修改settings的backgroundOpacity值 
            settings.backgroundOpacity = event.target.value;
            // 将修改后的settings保存到settings.json 
            mspring_theme.setSettings(settings);
        });

        // 选择id为heti的q-switch
        const hetiSwitch = view.querySelector("#heti");
        if (settings.heti) {
            hetiSwitch.setAttribute("is-active", "");
        }
        // 给hetiSwitch添加点击监听
        hetiSwitch.addEventListener("click", (event) => {
            const isActive = event.currentTarget.hasAttribute("is-active");

            if (isActive) {
                event.currentTarget.removeAttribute("is-active")
                // 修改settings的heti值为false
                settings.heti = false;
            } else {
                event.currentTarget.setAttribute("is-active", "");
                // 修改settings的heti值为true
                settings.heti = true;
            }

            // 将修改后的settings保存到settings.json
            mspring_theme.setSettings(settings);
        });
    } catch (error) {
        log("[设置页面错误]", error);
    }
}