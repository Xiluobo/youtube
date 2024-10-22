(function() {
    const log = (message) => {
        console.group('YouTube Customization');
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
                console.error('Error removing element:', error);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        const intervalId = setInterval(() => {
            try {
                removeElement(selector, conditionFn, logMessage);
            } catch (error) {
                console.error('Error removing element:', error);
            }
        }, 1000); // 每 1 秒检查一次

        window.addEventListener('unload', () => {
            observer.disconnect();
            clearInterval(intervalId);
        });
    };

    // 移除底部上传按钮
    const removeUploadButton = () => removeElement('ytd-upload-button-renderer', () => true, '上传按钮已删除');
    observeAndRemove('ytd-upload-button-renderer', () => true, '上传按钮已删除');
    
    // 其他代码保持不变
    // 移除 Shorts "+" 按钮
    observeAndRemove('ytd-button-renderer', (btn) => btn.innerText.includes('+'), 'Shorts "+" 按钮已删除');

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
})();
