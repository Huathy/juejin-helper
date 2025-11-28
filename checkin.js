// ==UserScript==
// @name         掘金智能签到（带状态记录 + 详细日志）
// @namespace    https://juejin.cn
// @version      1.2
// @description  刷新页面时自动签到，通过 localStorage 记录状态，避免重复请求，含完整日志用于调试
// @author       Huathy
// @match        https://juejin.cn/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const STORAGE_KEY = 'juejin_checkin_status';

    // 获取 YYYY-MM-DD 格式的当前日期
    function getToday() {
        return new Date().toISOString().split('T')[0];
    }

    // 获取存储的状态
    function getStoredStatus() {
        const stored = localStorage.getItem(STORAGE_KEY);
        console.log(`[掘金签到] 从 localStorage 读取状态: ${stored}`);
        return stored;
    }

    // 保存状态：成功存日期，失败存 "0"
    function saveStatus(status) {
        localStorage.setItem(STORAGE_KEY, status);
        console.log(`[掘金签到] 已保存状态到 localStorage: ${status}`);
    }

    // 签到主函数
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

            // 成功签到
            if (data.err_no === 0) {
                console.log('✅ [掘金签到] err_no=0，签到成功！');
                saveStatus(getToday());
                alert('🎉 掘金签到成功！');
            }
            // 已签到（旧版或新版）
            else if (data.err_no === 1003 || data.err_no === 15001) {
                console.log(`ℹ️ [掘金签到] 检测到今日已签到，err_no=${data.err_no}`);
                saveStatus(getToday());
                alert('ℹ️ 今天已经签到过了。');
            }
            // 其他错误（如未登录、风控等）
            else {
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

    // === 主逻辑 ===
    console.log('========== [掘金签到脚本启动] ==========');
    console.log('[掘金签到] 当前完整 URL:', window.location.href);

    const today = getToday();
    const stored = getStoredStatus();

    console.log(`[掘金签到] 今日日期: ${today}`);

    if (stored === today) {
        console.log('✅ [掘金签到] 本地记录显示今日已签到，跳过请求。');
        // 可选提示（默认注释掉，保持静默）
        // alert('ℹ️ 今日已签到（根据本地记录）。');
    } else {
        console.log('[掘金签到] 本地无今日签到记录，开始执行签到...');
        performCheckIn();
    }
})();