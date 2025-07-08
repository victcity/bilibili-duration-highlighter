// ==UserScript==
// @name         Bilibili UP主主页视频时长高亮
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  在B站UP主主页，根据视频时长为视频卡片添加不同颜色的背景。
// @author       victcity
// @match        https://space.bilibili.com/*
// @match        https://space.bilibili.com/*/video*
// @match        https://space.bilibili.com/*/upload/video*
// @icon         https://www.bilibili.com/favicon.ico
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- 用户配置区域 ---
    // 你可以在这里修改时长阈值和对应的颜色
    // 规则：脚本会从上到下匹配，一旦满足条件就不再继续匹配。
    // 所以请将时长短的规则放在前面。
    // threshold: noun 门槛、起点、界限；此处以秒为单位区分视频长度
    // color: 使用 'rgba(r, g, b, a)' 格式，a 代表透明度 (0 to 1)。
    const CONFIG = {
        // 时长阈值和样式配置
        thresholds: [
            { threshold: 60, color: 'rgba(130, 215, 174, 0.3)', label: '1分钟内' }, // 0-1分钟
            { threshold: 180, color: 'rgba(139, 195, 74, 0.4)', label: '3分钟内' }, // 1-3分钟
            { threshold: 300, color: 'rgba(67, 160, 71, 0.5)', label: '5分钟内' }, // 3-5分钟
            { threshold: 600, color: 'rgba(33, 150, 243, 0.6)', label: '10分钟内' }, // 5-10分钟
            { threshold: 1800, color: 'rgba(255, 152, 0, 0.7)', label: '30分钟内' }, // 10-30分钟
            { threshold: 3600, color: 'rgba(244, 67, 54, 0.8)', label: '1小时内' }, // 30-60分钟
            { threshold: Infinity, color: 'rgba(156, 39, 176, 0.9)', label: '超长视频' } // 超过1小时
        ],
        // 是否在标签上显示文字提示 (例如 "10分钟内")
        showLabel: true,
        // 应用于时长标签的通用样式
        style: {
            color: 'white', // 文字颜色
            padding: '1px 6px', // 内边距
            borderRadius: '4px', // 圆角
            fontWeight: 'bold', // 字体加粗
            textAlign: 'center', // 文本居中
            display: 'inline-block', // 设置为行内块元素以应用样式
            transition: 'background-color 0.3s ease' // 添加一个平滑的过渡效果
        }
    };
    // --- 配置区域结束 ---


    /**
     * 将 "HH:MM:SS" 或 "MM:SS" 格式的时间字符串转换为总秒数
     * @param {string} timeStr - 时间字符串
     * @returns {number} - 总秒数
     */
    function parseDurationToSeconds(timeStr) {
        if (!timeStr || typeof timeStr !== 'string') {
            return 0;
        }
        const parts = timeStr.split(':').map(Number);
        let seconds = 0;
        if (parts.length === 3) { // HH:MM:SS
            seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (parts.length === 2) { // MM:SS
            seconds = parts[0] * 60 + parts[1];
        }
        return seconds;
    }

    /**
     * 主要处理函数，遍历所有视频卡片并应用高亮
     */
    function highlightVideoDurations() {
        // 选择所有尚未处理的视频卡片
        // B站有两种视频卡片class，都选择到
        const videoCards = document.querySelectorAll('.upload-video-card:not([data-duration-highlighted]), .video-card-body:not([data-duration-highlighted]), .items__item:not([data-duration-highlighted]), .video-list__item:not([data-duration-highlighted])');

        videoCards.forEach(card => {
            // 标记该卡片已被处理，防止重复操作
            card.setAttribute('data-duration-highlighted', 'true');

            // 寻找时长元素。 B站页面结构可能变化，这里使用更精确的选择器
            const durationSpan = card.querySelector('.bili-cover-card__stat:last-child > span, .duration');
            if (!durationSpan) {
                // 如果找不到时长元素，则跳过
                return;
            }

            // 有时候时长元素外部还有一个父元素，我们高亮父元素效果更好
            const durationContainer = durationSpan.parentElement;

            const durationText = durationSpan.textContent.trim();
            const totalSeconds = parseDurationToSeconds(durationText);

            if (totalSeconds > 0) {
                // 查找匹配的阈值
                const matchedRule = CONFIG.thresholds.find(rule => totalSeconds < rule.threshold);

                if (matchedRule) {
                    // 应用样式
                    durationContainer.style.backgroundColor = matchedRule.color;

                    // 应用通用样式
                    Object.assign(durationContainer.style, CONFIG.style);

                    // 如果配置了显示标签，则添加title提示
                    if (CONFIG.showLabel && matchedRule.label) {
                        durationContainer.title = `时长: ${durationText}\n分类: ${matchedRule.label}`;
                    }
                }
            }
        });
    }

    /**
     * 使用 MutationObserver 监视DOM变化 (例如，滚动页面加载更多视频)
     */
    function observeDOMChanges() {
        // 选择一个稳定的、包含所有视频列表的父容器
        // 'body' 是最稳妥的选择，因为它总是在那里
        const targetNode = document.body;

        if (!targetNode) {
            console.error('Bilibili Duration Highlighter: 无法找到目标节点进行监视。');
            return;
        }

        const observer = new MutationObserver((mutationsList, observer) => {
            // 每次DOM变化时，重新运行高亮函数
            // 函数内部有防止重复处理的逻辑，所以可以放心调用
            highlightVideoDurations();
        });

        // 配置观察器：监视子节点的变化
        const observerConfig = {
            childList: true, // 监视子节点的添加或删除
            subtree: true // 监视所有后代节点
        };

        // 启动观察器
        observer.observe(targetNode, observerConfig);

        // 页面初次加载时，先运行一次
        console.log('Bilibili 时长高亮脚本已启动。');
        highlightVideoDurations();
    }

    // 等待页面主要内容加载完毕后再执行脚本，以确保能找到视频列表容器
    // 有时B站页面加载较慢，设置一个延时启动
    setTimeout(observeDOMChanges, 1000);

})();
