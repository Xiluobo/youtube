(function() {
    const log = (message) => {
        console.group('YouTube 自定义');
        console.log(message);
        console.groupEnd();
    };

    // PIP 和后台播放
    const enablePIP = () => {
        const video = document.querySelector('video');
        if (video) {
            video.addEventListener('play', () => {
                if (document.pictureInPictureEnabled && !document.pictureInPictureElement) {
                    video.requestPictureInPicture().catch(error => log('PIP 请求失败: ' + error));
                }
            });
            // 自动后台播放
            video.addEventListener('pause', () => {
                setTimeout(() => video.play(), 100); // 使得视频可以在后台继续播放
            });
        }
    };
    enablePIP();

    // 移除底部上传按钮
    const removeUploadButton = () => {
        const uploadButton = document.querySelector('ytd-upload-button-renderer');
        if (uploadButton) {
            uploadButton.remove();
            log('上传按钮已删除');
        }
    };
    const observer = new MutationObserver(() => removeUploadButton());
    observer.observe(document.body, { childList: true, subtree: true });

    // 移除 Shorts "+" 按钮
    const removeShortsPlusButton = () => {
        const shortsPlusButton = document.querySelector('ytd-button-renderer');
        if (shortsPlusButton && shortsPlusButton.innerText.includes('+')) {
            shortsPlusButton.remove();
            log('Shorts "+" 按钮已删除');
        }
    };
    const shortsObserver = new MutationObserver(() => removeShortsPlusButton());
    shortsObserver.observe(document.body, { childList: true, subtree: true });

    // 拦截广告请求
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function() {
        if (arguments[1] && arguments[1].includes('ad')) {
            log('广告请求被拦截: ' + arguments[1]);
            return;
        }
        originalOpen.apply(this, arguments);
    };

    // 拦截和修改广告响应
    const originalSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function() {
        this.addEventListener('readystatechange', function() {
            if (this.readyState === 4 && this.responseURL.includes('youtubei.googleapis.com')) {
                log('YouTube 响应被拦截和修改');
                const response = JSON.parse(this.responseText);
                delete response.adPlacements;  // 删除广告插入点
                Object.defineProperty(this, 'responseText', { value: JSON.stringify(response) });
            }
        });
        originalSend.apply(this, arguments);
    };

    // 自动翻译中文字幕
    const autoTranslateSubtitles = () => {
        const subtitleButton = document.querySelector('.ytp-subtitles-button');
        if (subtitleButton) {
            subtitleButton.click();
            const autoTranslateOption = document.querySelector('.ytp-menuitem[aria-label="Auto-translate"]');
            if (autoTranslateOption) {
                autoTranslateOption.click();
                const chineseOption = Array.from(document.querySelectorAll('.ytp-menuitem'))
                    .find(item => item.innerText.includes('Chinese (Simplified)') || item.innerText.includes('简体中文'));
                if (chineseOption) {
                    chineseOption.click();
                    log('自动翻译为简体中文已启用');
                }
            }
        }
    };
    // 自动翻译字幕检查，每 2 秒检查一次
    const subtitleObserver = new MutationObserver(autoTranslateSubtitles);
    subtitleObserver.observe(document.body, { childList: true, subtree: true });
    setInterval(autoTranslateSubtitles, 2000);  // 双保险，每 2 秒检查一次字幕状态
})();
