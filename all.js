// ==UserScript==
// @name         掘金智能助手（签到 + 抽奖 · 无 localStorage 修改）
// @namespace    https://juejin.cn
// @version      1.0
// @description  完全保留原始签到与抽奖脚本的 localStorage 行为，仅合并执行
// @author       Huathy
// @match        https://juejin.cn/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    // =============== 🟢 原始签到脚本（未改动） ===============
    const STORAGE_KEY_CHECKIN = 'juejin_checkin_status';

    function getToday() {
        return new Date().toISOString().split('T')[0];
    }

    function getStoredStatus() {
        const stored = localStorage.getItem(STORAGE_KEY_CHECKIN);
        console.log(`[掘金签到] 从 localStorage 读取状态: ${stored}`);
        return stored;
    }

    function saveStatus(status) {
        localStorage.setItem(STORAGE_KEY_CHECKIN, status);
        console.log(`[掘金签到] 已保存状态到 localStorage: ${status}`);
    }

    async function performCheckIn() {
        console.log('📡 [掘金签到] 开始执行签到请求...');
        alert('正在尝试掘金签到，请稍候...');

        try {
            console.log('[掘金签到] 准备发起 fetch 请求到签到接口');
            const response = await fetch('https://api.juejin.cn/growth_api/v1/check_in', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Referer': 'https://juejin.cn/',
                    'Origin': 'https://juejin.cn'
                },
                body: JSON.stringify({}),
                credentials: 'include'
            });

            console.log(`[掘金签到] 收到响应，HTTP 状态码: ${response.status}`);
            const data = await response.json();
            console.log('[掘金签到] 响应 JSON 内容:', data);

            if (data.err_no === 0) {
                console.log('✅ [掘金签到] err_no=0，签到成功！');
                saveStatus(getToday());
                alert('🎉 掘金签到成功！');
            } else if (data.err_no === 1003 || data.err_no === 15001) {
                console.log(`ℹ️ [掘金签到] 检测到今日已签到，err_no=${data.err_no}`);
                saveStatus(getToday());
                alert('ℹ️ 今天已经签到过了。');
            } else {
                console.warn('⚠️ [掘金签到] 非预期错误码:', data.err_no, '| 消息:', data.err_msg);
                saveStatus('0');
                alert('❌ 签到失败！\n错误码: ' + data.err_no + '\n消息: ' + (data.err_msg || '未知错误'));
            }
        } catch (error) {
            console.error('💥 [掘金签到] fetch 请求抛出异常:', error);
            saveStatus('0');
            alert('💥 签到请求异常！请打开控制台查看错误。');
        }
    }

    // 执行签到主逻辑（完全按原脚本）
    {
        console.log('========== [掘金签到脚本启动] ==========');
        console.log('[掘金签到] 当前完整 URL:', window.location.href);

        const today = getToday();
        const stored = getStoredStatus();

        console.log(`[掘金签到] 今日日期: ${today}`);

        if (stored === today) {
            console.log('✅ [掘金签到] 本地记录显示今日已签到，跳过请求。');
        } else {
            console.log('[掘金签到] 本地无今日签到记录，开始执行签到...');
            performCheckIn();
        }
    }

    // =============== 🔵 原始抽奖脚本（未改动） ===============
    const LOTTERY_PAGE_URL = 'https://juejin.cn/user/center/lottery?from=lucky_lottery_menu_bar';
    const STORAGE_KEY_LOTTERY = 'juejin_auto_lottery_done';
    const BUTTON_SELECTOR = '#turntable-item-0';

    function isLotteryPage() {
        const result = window.location.pathname === '/user/center/lottery';
        console.log('[掘金抽奖] 当前页面是否为抽奖页:', result, '| path:', window.location.pathname);
        return result;
    }

    function hasDoneToday() {
        const stored = localStorage.getItem(STORAGE_KEY_LOTTERY);
        const today = getToday();
        const done = stored === today;
        console.log(`[掘金抽奖] 本地记录状态: stored=${stored}, today=${today}, 已完成今日任务=${done}`);
        return done;
    }

    function markDone() {
        const today = getToday();
        localStorage.setItem(STORAGE_KEY_LOTTERY, today);
        console.log(`[掘金抽奖] 已标记今日任务完成: ${today}`);
    }

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
                console.log('[掘金抽奖] 检测到需 200 矿石 → 今日免费机会已用，跳过点击');
                markDone(); // 视为“已完成”（避免反复尝试）
                return;
            }

            console.log(`[掘金抽奖] 矿石消耗非 200，视为免费或未知状态`);
            if (!btn.disabled) {
                console.log('[掘金抽奖] 检测为免费抽奖，正在点击...');
                btn.click();
                markDone();
            } else {
                if (retryCount < maxRetries) {
                    retryCount++;
                    console.log('[掘金抽奖] 按钮禁用，将在 800ms 后重试...');
                    setTimeout(tryClick, 800);
                }
            }
        };

        setTimeout(tryClick, 1200);
    }

    function redirectToLotteryPage() {
        if (hasDoneToday()) return;

        console.log('[掘金抽奖] 跳转到抽奖页面...');
        markDone(); // 提前标记，防止刷新当前页重复跳转
        window.location.href = LOTTERY_PAGE_URL;
    }

    // 执行抽奖主逻辑（完全按原脚本）
    {
        console.log('========== [掘金自动抽奖脚本启动] ==========');
        console.log('[掘金抽奖] 当前完整 URL:', window.location.href);

        if (isLotteryPage()) {
            autoClickIfFree();
        } else {
            // 可选：只在首页触发（取消注释下一行即可）
            // if (window.location.pathname === '/') {
            redirectToLotteryPage();
            // }
        }
    }
})();