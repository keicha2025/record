import { API } from './api.js';
import { auth } from './firebase-config.js';

// --- Console Logger Helper ---
const log = (msg, type = 'info') => {
    const el = document.getElementById('consoleOutput');
    const color = type === 'error' ? 'text-red-400' : (type === 'success' ? 'text-blue-400' : 'text-green-400');
    const div = document.createElement('div');
    div.className = `${color} mb-1`;
    div.innerText = `> ${msg}`;
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
    console.log(`[Migration] ${msg}`);
};

// --- DOM Elements ---
const jsonInput = document.getElementById('jsonInput');
const migrateBtn = document.getElementById('migrateBtn');
const loginBtn = document.getElementById('loginBtn');
const authStatus = document.getElementById('authStatus');

// --- State ---
let currentUser = null;

// --- ID Mapping Helpers ---
// Map old static IDs to new ones if needed, or keep them if they are unique enough.
// The old text based IDs (e.g. 'cat_001') seem consistent with current defaults.
// We will try to map by Name if ID doesn't match, or fallback to default.

const CATEGORY_MAP = {
    'cat_001': 'cat_001', // 外食
    'cat_002': 'cat_002', // 交通
    'cat_003': 'cat_003', // 日常
    'cat_004': 'cat_004', // 繳費
    'cat_005': 'cat_005', // 學習
    'cat_006': 'cat_006', // 娛樂
    'cat_007': 'cat_007', // 購物
    'cat_008': 'cat_008', // 其他(支出)
    'cat_009': 'cat_009', // 獎學金
    'cat_010': 'cat_010', // 其他(收入)
};

const PAYMENT_MAP = {
    'pm_001': 'pm_001', // 刷卡
    'pm_002': 'pm_002', // 現金
    'pm_003': 'pm_003', // 電支
    'pm_004': 'pm_004', // 轉帳
};

// --- Parsers ---

/**
 * Parses "2026/02/07 15:46 UTC+8" to { spendDate: "2026-02-07T15:46", utc: "+08:00" }
 */
const parseDateString = (dateStr) => {
    try {
        // Expected format: YYYY/MM/DD HH:mm UTC+X
        // Split by space
        const parts = dateStr.split(' ');
        if (parts.length < 3) return { spendDate: new Date().toISOString().slice(0, 16), utc: '+08:00' };

        const datePart = parts[0].replace(/\//g, '-'); // 2026-02-07
        const timePart = parts[1]; // 15:46
        const boxPart = parts.slice(2).join(''); // UTC+8 or UTC+08:00

        // Parse UTC offset
        // Extract +8, -5, +08:00
        let utc = '+08:00'; // Default
        const match = boxPart.match(/UTC([+-]\d+)(?::(\d+))?/);
        if (match) {
            const sign = match[1].slice(0, 1);
            let num = parseInt(match[1].slice(1));
            const hours = num.toString().padStart(2, '0');
            const mins = match[2] ? match[2].padEnd(2, '0') : '00';
            utc = `${sign}${hours}:${mins}`;
        }

        return {
            spendDate: `${datePart}T${timePart}`,
            utc: utc
        };
    } catch (e) {
        log(`Date Parse Error: ${dateStr}`, 'error');
        return { spendDate: new Date().toISOString().slice(0, 16), utc: '+08:00' };
    }
};

const transformTransaction = (oldTx) => {
    // Mapping
    // "ID": "tx_..." -> id
    // "Spend Date": "..." -> spendDate, utc
    // "Type": "支出"/"收入" -> type: "expense"/"income"
    // "Amount": 100 -> amount
    // "Note": "..." -> note
    // "Category ID" -> categoryId
    // "Payment Method" -> paymentMethodId
    // "Project ID" -> projectId
    // "Payer" -> payer (if "我" -> "me"?) -> current logic uses strings like "我" or friend names. 
    // "Payer" in old json seems to be Name. In new app it is 'payer' field.

    const dateObj = parseDateString(oldTx['Spend Date']);

    return {
        id: oldTx.ID || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        spendDate: dateObj.spendDate,
        utc: dateObj.utc,
        type: oldTx.Type === '支出' ? 'expense' : 'income',
        amount: Number(oldTx.Amount) || 0,
        note: oldTx.Note || '',
        categoryId: CATEGORY_MAP[oldTx['Category ID']] || 'cat_008', // Fallback to Other
        paymentMethodId: PAYMENT_MAP[oldTx['Payment Method']] || 'pm_002', // Fallback to Cash
        projectId: oldTx['Project ID'] || '',
        payer: oldTx.Payer || '我',
        // New fields that might be missing
        isOneTime: oldTx['Is One-time'] ?? false,
        isSplit: oldTx['Is Split'] ?? false,
        personalShare: Number(oldTx['Personal Share']) || 0,
        currency: oldTx['params.currency'] || 'TWD',
        debt: Number(oldTx['Debt Amount']) || 0
    };
};

const transformProject = (oldPrj) => {
    // "ID": "trip_001"
    // "Name": "..."
    // "StartDate": ISO
    // "EndDate": ISO
    // "Status": "Active"

    return {
        id: oldPrj.ID,
        name: oldPrj.Name,
        startDate: oldPrj.StartDate.split('T')[0], // Extract YYYY-MM-DD
        endDate: oldPrj.EndDate.split('T')[0],
        status: oldPrj.Status || 'Active'
    };
};

// --- Execution Logic ---

const handleMigrate = async () => {
    const rawInput = jsonInput.value.trim();
    if (!rawInput) return log("請先貼入 JSON 資料。", 'error');

    let data;
    try {
        data = JSON.parse(rawInput);
    } catch (e) {
        return log("JSON 格式錯誤，請檢查是否有贅字或引號不對。", 'error');
    }

    migrateBtn.disabled = true;
    log("開始執行直接匯入程序 (Direct Import Mode)...", 'info');

    try {
        // 1. 處理數據 (支援新版小寫 Key 與 舊版大寫 Key)
        const transactions = data.transactions || (Array.isArray(data.Transactions) ? data.Transactions : (data.Transactions ? [data.Transactions] : []));
        const projects = data.projects || (Array.isArray(data.Projects) ? data.Projects : (data.Projects ? [data.Projects] : []));
        const friends = data.friends || [];

        // 偵測是否需要轉換 (如果 key 是 ID 或是 Spend Date 這種大寫空格開頭的，可能還是舊版)
        // 但用戶說已經轉換好了，所以我們這裡做一個簡單判斷或直接信任輸入。
        // 我們優先信任小寫 key (new format)。

        log(`讀取到交易紀錄: ${transactions.length} 筆`);
        log(`讀取到專案數量: ${projects.length} 個`);
        log(`讀取到朋友數量: ${friends.length} 位`);

        if (transactions.length === 0 && projects.length === 0 && friends.length === 0) {
            throw new Error("找不到有效的交易、專案或朋友資料。請確認 JSON 結構（例如包含 transactions 或 projects 陣列）。");
        }

        // 2. 寫入使用者 Profile (朋友與專案)
        if (projects.length > 0 || friends.length > 0) {
            log("正在同步使用者配置資料 (Profile)...");
            const initialData = await API.fetchInitialData();

            // 合併朋友名單
            const existingFriends = initialData.friends || [];
            const mergedFriends = [...new Set([...existingFriends, ...friends])];

            // 合併專案 (若 ID 相同則以匯入的為主)
            const existingProjects = initialData.projects || [];
            const projectMap = new Map();
            existingProjects.forEach(p => projectMap.set(p.id, p));

            projects.forEach(p => {
                // 自動校正專案欄位 (大寫轉小寫)
                const proj = {
                    id: p.id || p.ID,
                    name: p.name || p.Name,
                    startDate: (p.startDate || p.StartDate || "").split('T')[0],
                    endDate: (p.endDate || p.EndDate || "").split('T')[0],
                    status: p.status || p.Status || "Active"
                };
                if (proj.id) projectMap.set(proj.id, proj);
            });
            const mergedProjects = Array.from(projectMap.values());

            await API.updateUserData({
                friends: mergedFriends,
                projects: mergedProjects
            });
            log("使用者配置資料更新完成。");
        }

        // 3. 儲存交易紀錄
        if (transactions.length > 0) {
            log("正在將交易紀錄存入 Firestore...");
            let count = 0;
            for (const tx of transactions) {
                // 自動校正並轉換所有可能的欄位名稱
                const payload = { ...tx };

                // --- 1. 基礎映射 (Spreadsheet Headers -> App Keys) ---
                const mapping = {
                    'ID': 'id',
                    'Name': 'name',
                    'Type': 'type',
                    'Amount': 'amount',
                    'Note': 'note',
                    'Payer': 'payer',
                    'Spend Date': 'spendDate',
                    'Category ID': 'categoryId',
                    'Payment Method': 'paymentMethod',
                    'Personal Share': 'personalShare',
                    'Debt Amount': 'debtAmount',
                    'Friend Name': 'friendName',
                    'Is One-time': 'isOneTime',
                    'Is Split': 'isSplit',
                    'Project ID': 'projectId',
                    'params.currency': 'currency'
                };

                for (let [oldKey, newKey] of Object.entries(mapping)) {
                    if (payload[oldKey] !== undefined && payload[newKey] === undefined) {
                        payload[newKey] = payload[oldKey];
                    }
                }

                // --- 2. 核心邏輯轉換 ---

                // A. 修正 ID
                if (!payload.id) payload.id = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

                // B. 修正交易類型 (支出/收入 -> expense/income)
                if (payload.type === '支出') payload.type = 'expense';
                if (payload.type === '收入') payload.type = 'income';

                // C. 日期與時區處理
                if (payload.spendDate) {
                    // 處理 ISO 格式 (2026-01-29T10:15:00.000Z -> 2026-01-29T10:15)
                    let cleanDate = payload.spendDate.replace('.000Z', '').replace('Z', '');
                    if (cleanDate.includes('.')) cleanDate = cleanDate.split('.')[0];
                    if (cleanDate.includes(':')) {
                        const parts = cleanDate.split(':');
                        const timeParts = parts[1] || '00';
                        payload.spendDate = parts[0] + ':' + timeParts.substring(0, 2);
                    } else {
                        payload.spendDate = cleanDate;
                    }
                } else {
                    payload.spendDate = new Date().toISOString().slice(0, 16);
                }

                if (!payload.utc) payload.utc = '+08:00'; // 預設台灣時區

                // D. 數值轉換
                payload.amount = Number(payload.amount) || 0;
                payload.personalShare = Number(payload.personalShare) || 0;
                payload.debtAmount = Number(payload.debtAmount) || 0;
                // 支援多種債務欄位名
                if (payload.debt !== undefined) payload.debtAmount = Number(payload.debt);

                // E. 布林值轉換
                if (typeof payload.isOneTime === 'string') payload.isOneTime = payload.isOneTime === 'TRUE' || payload.isOneTime === 'true';
                if (typeof payload.isSplit === 'string') payload.isSplit = payload.isSplit === 'TRUE' || payload.isSplit === 'true' || payload.isSplit !== '';

                // --- 3. 乾淨匯入 (只儲存系統需要的欄位，移除舊註記) ---
                const cleanTx = {
                    id: payload.id,
                    name: payload.name || "未命名項目",
                    amount: Number(payload.amount) || 0,
                    spendDate: payload.spendDate, // ISO 格式由上方邏輯統一處理
                    utc: payload.utc || "+08:00",
                    // 修正：前端傳入的是中文 "支出"/"收入"，這裡需對齊
                    type: (payload.type === 'expense' || payload.type === '支出') ? '支出' : '收入',
                    currency: payload.currency || 'TWD', // 優先使用輸入的幣別，預設 TWD
                    categoryId: payload.categoryId || 'cat_008',
                    paymentMethod: payload.paymentMethod || payload.paymentMethodId || 'pm_002',
                    note: payload.note || '',
                    projectId: payload.projectId || '',
                    payer: payload.payer || '我',
                    friendName: payload.friendName || '',
                    isOneTime: !!payload.isOneTime,
                    isSplit: !!payload.isSplit,
                    personalShare: Number(payload.personalShare) || 0,
                    debtAmount: Number(payload.debtAmount) || 0
                };

                await API.saveTransaction(cleanTx);
                count++;
                if (count % 10 === 0) log(`已儲存 ${count}/${transactions.length}...`);
            }
            log(`交易紀錄全數儲存成功 (共 ${count} 筆)。`);
        }

        log("資料遷移程序執行完畢！", 'success');
        alert("資料匯入成功！請重新整理主程式頁面。");

    } catch (e) {
        log(`匯入失敗: ${e.message}`, 'error');
        console.error(e);
    } finally {
        migrateBtn.disabled = false;
    }
};


// --- Auth Logic ---
API.onAuthStateChanged((user) => {
    currentUser = user;
    if (user) {
        authStatus.innerHTML = `<span class="text-green-600 font-bold">✓ 已登入: ${user.email}</span>`;
        loginBtn.classList.add('hidden');
        migrateBtn.disabled = false;
        log("Authenticated.");
    } else {
        authStatus.innerHTML = `<span class="text-gray-500">未登入</span>`;
        loginBtn.classList.remove('hidden');
        migrateBtn.disabled = true;
        log("Waiting for login...");
    }
});

loginBtn.addEventListener('click', async () => {
    try {
        await API.login();
    } catch (e) {
        log(`Login Failed: ${e.message}`, 'error');
    }
});

migrateBtn.addEventListener('click', handleMigrate);
