// ==UserScript==
// @name         掘金自动抽奖(静默跳转)
// @namespace    https://juejin.cn
// @version      1.2
// @description  自动跳转至抽奖页，仅当“单抽”为免费时点击，避免消耗矿石，每日一次，带完整日志用于调试（静默跳转 + 免费判断 + 详细日志）
// @author       Huathy
// @match        https://juejin.cn/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const LOTTERY_PAGE_URL = 'https://juejin.cn/user/center/lottery?from=lucky_lottery_menu_bar';
    const STORAGE_KEY = 'juejin_auto_lottery_done';
    const BUTTON_SELECTOR = '#turntable-item-0';

    function getToday() {
        return new Date().toISOString().split('T')[0];
    }

    function isLotteryPage() {
        const result = window.location.pathname === '/user/center/lottery';
        console.log('[掘金抽奖] 当前页面是否为抽奖页:', result, '| path:', window.location.pathname);
        return result;
    }

    function hasDoneToday() {
        const stored = localStorage.getItem(STORAGE_KEY);
        const today = getToday();
        const done = stored === today;
        console.log(`[掘金抽奖] 本地记录状态: stored=${stored}, today=${today}, 已完成今日任务=${done}`);
        return done;
    }

    function markDone() {
        const today = getToday();
        localStorage.setItem(STORAGE_KEY, today);
        console.log(`[掘金抽奖] 已标记今日任务完成: ${today}`);
    }

    // 在抽奖页面：等待按钮出现，判断是否免费，再决定是否点击
    function autoClickIfFree() {
        console.log('[掘金抽奖] 进入 autoClickIfFree 函数');
        if (hasDoneToday()) {
            console.log('[掘金抽奖] 今日已执行过，退出 autoClickIfFree');
            return;
        }

        let retryCount = 0;
        const maxRetries = 5;

        const tryClick = () => {
            console.log(`[掘金抽奖] 尝试查找抽奖按钮 (第 ${retryCount + 1} 次)`);
            const btn = document.querySelector(BUTTON_SELECTOR);
            if (!btn) {
                console.log('[掘金抽奖] 未找到 #turntable-item-0 按钮');
                if (retryCount < maxRetries) {
                    retryCount++;
                    console.log(`[掘金抽奖] 将在 800ms 后重试...`);
                    setTimeout(tryClick, 800);
                } else {
                    console.warn('[掘金抽奖] 达到最大重试次数，放弃查找按钮');
                }
                return;
            }

            console.log('[掘金抽奖] 找到抽奖按钮，开始检查矿石消耗');
            const costElement = btn.querySelector('.text');
            const costText = costElement ? costElement.textContent.trim() : '';
            console.log(`[掘金抽奖] 按钮内 .text 内容: "${costText}"`);

            if (costText === '200') {
                console.log('[掘金抽奖] 检测到需 200 矿石 → 今日免费机会已用完，跳过点击');
                markDone(); // 避免后续重复尝试
                return;
            }

            console.log(`[掘金抽奖] 矿石消耗非 200，视为免费或未知状态`);
            if (btn.disabled) {
                console.log('[掘金抽奖] 按钮当前处于 disabled 状态');
                if (retryCount < maxRetries) {
                    retryCount++;
                    console.log('[掘金抽奖] 按钮禁用，将在 800ms 后重试...');
                    setTimeout(tryClick, 800);
                } else {
                    console.warn('[掘金抽奖] 按钮始终禁用，放弃点击');
                }
                return;
            }

            console.log('[掘金抽奖] 按钮可用，执行点击操作！');
            btn.click();
            markDone();
        };

        console.log('[掘金抽奖] 设置 1200ms 延迟后开始尝试点击');
        setTimeout(tryClick, 1200);
    }

    // 不在抽奖页：跳转过去（仅首次）
    function redirectToLotteryPage() {
        console.log('[掘金抽奖] 进入 redirectToLotteryPage 函数');
        if (hasDoneToday()) {
            console.log('[掘金抽奖] 今日已标记完成，跳过跳转');
            return;
        }

        console.log('[掘金抽奖] 准备跳转到抽奖页面，并提前标记今日任务为已完成');
        markDone(); // 防止刷新当前页反复跳转
        window.location.href = LOTTERY_PAGE_URL;
    }

    // === 主流程 ===
    console.log('========== [掘金自动抽奖脚本启动] ==========');
    console.log('[掘金抽奖] 当前完整 URL:', window.location.href);

    if (isLotteryPage()) {
        console.log('[掘金抽奖] 当前已在抽奖页面，调用 autoClickIfFree');
        autoClickIfFree();
    } else {
        console.log('[掘金抽奖] 当前不在抽奖页面，准备跳转');
        // 可选：只在首页触发（取消注释下一行即可）
        // if (window.location.pathname === '/') {
        redirectToLotteryPage();
        // } else {
        //     console.log('[掘金抽奖] 非首页，跳过跳转（如需限制请取消注释）');
        // }
    }
})();