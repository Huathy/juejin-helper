// ==UserScript==
// @name         掘金智能签到（带状态记录）
// @namespace    https://juejin.cn
// @version      V20251126
// @description  刷新页面时自动签到，通过 localStorage 记录状态，避免重复请求
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
        return localStorage.getItem(STORAGE_KEY);
    }

    // 保存状态：成功存日期，失败存 "0"
    function saveStatus(status) {
        localStorage.setItem(STORAGE_KEY, status);
    }

    // 签到主函数
    async function performCheckIn() {
        console.log('📡 [掘金签到] 正在尝试签到...');
        alert('正在尝试掘金签到，请稍候...');
        try {
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

            const data = await response.json();

            // 成功或已签到（包括 err_no 1003 和 15001）
            if (data.err_no === 0) {
                saveStatus(getToday());
                console.log('✅ [掘金签到] 成功！', data);
                alert('🎉 掘金签到成功！');
            } else if (data.err_no === 1003 || data.err_no === 15001) {
                // 1003: 已签到（旧版）
                // 15001: 您今日已完成签到，请勿重复签到（新版）
                saveStatus(getToday());
                console.log('ℹ️ [掘金签到] 今日已签到（err_no: ' + data.err_no + ')', data);
                alert('ℹ️ 今天已经签到过了。');
            } else {
                // 其他错误（如未登录、网络问题等）
                saveStatus('0');
                console.warn('⚠️ [掘金签到] 失败:', data);
                alert('❌ 签到失败！\n错误码: ' + data.err_no + '\n消息: ' + (data.err_msg || '未知错误'));
            }
        } catch (error) {
            // 网络或 JS 错误
            saveStatus('0');
            console.error('💥 [掘金签到] 请求异常:', error);
            alert('💥 签到请求异常！请打开控制台查看错误。');
        }
    }

    // 主逻辑
    const today = getToday();
    const stored = getStoredStatus();

    console.log(`[掘金签到] 今日: ${today}, 已存状态:`, stored);

    if (stored === today) {
        console.log('✅ [掘金签到] 本地记录显示今日已签到，跳过请求。');
        // 可选：也可以提示用户（默认静默）
        // alert('ℹ️ 今日已签到（根据本地记录）。');
    } else {
        performCheckIn();
    }
})();