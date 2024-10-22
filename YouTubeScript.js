(function(config) {
    const log = (message) => {
        console.group('YouTube 自定义');
        console.log(message);
        console.groupEnd();
    };

    const removeElement = (selector, conditionFn = () => true, logMessage = '') => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            if (conditionFn(element)) {
                element.remove();
                log(logMessage);
            }
        });
    };

    const observeAndRemove = (selector, conditionFn, logMessage) => {
        const observer = new MutationObserver(() => {
            try {
                removeElement(selector, conditionFn, logMessage);
            } catch (error) {
                console.error('移除元素时出错:', error);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        const intervalId = setInterval(() => {
            try {
                removeElement(selector, conditionFn, logMessage);
            } catch (error) {
                console.error('移除元素时出错:', error);
            }
        }, 1000);

        window.addEventListener('unload', () => {
            observer.disconnect();
            clearInterval(intervalId);
        });
    };

    if (config.blockUpload) {
        // 移除底部上传按钮
        const selectors = [
            'ytd-upload-button-renderer', 
            '#upload-button', 
            'button[aria-label="上传"]'
        ];

        selectors.forEach(selector => {
            observeAndRemove(selector, () => true, `上传按钮已删除，使用选择器: ${selector}`);
        });
    }

    if (config.blockImmersive) {
        // 移除 Shorts "+" 按钮
        observeAndRemove('ytd-button-renderer', (btn) => btn.innerText.includes('+'), 'Shorts "+" 按钮已删除');
    }

    // 拦截广告请求
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function() {
        if (arguments[1] && arguments[1].includes('ad')) {
            console.log('广告请求被拦截: ', arguments[1]);
            return;
        }
        originalOpen.apply(this, arguments);
    };

    // 拦截和修改广告响应
    const originalSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function() {
        this.addEventListener('readystatechange', function() {
            if (this.readyState === 4 && this.responseURL.includes('youtubei.googleapis.com')) {
                console.log('YouTube 响应被拦截和修改');
                const response = JSON.parse(this.responseText);
                // 修改响应，移除广告
                delete response.adPlacements;
                Object.defineProperty(this, 'responseText', { value: JSON.stringify(response) });
            }
        });
        originalSend.apply(this, arguments);
    };

    if (config.debug) {
        log('调试模式已启用');
    }
})({
    lyricLang: 'zh', // 将翻译语言设置为中文
    captionLang: 'zh', // 设置字幕语言为中文
    blockUpload: true, // 启用屏蔽上传按钮
    blockImmersive: true, // 启用屏蔽 Shorts "+" 按钮
    debug: true // 启用调试模式
});
