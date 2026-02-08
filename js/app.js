import { CONFIG } from './config.js?v=1.3';
import { API, DEFAULTS } from './api.js';
import { GoogleSheetsService } from './services/google-sheets-service.js';
import { AddPage } from './pages/add-page.js';
import { EditPage } from './pages/edit-page.js';
import { HistoryPage } from './pages/history-page.js';
import { StatsPage } from './pages/stats-page.js';
import { SettingsPage } from './pages/settings-page.js';
import { OverviewPage } from "./pages/overview-page.js";
import { ProjectDetailPage } from './pages/project-detail-page.js';
import { ImportPage } from './pages/import-page.js';

import { ViewDashboard } from './pages/view-dashboard.js';
import { SystemModal } from './components/system-modal.js';
import { AppHeader } from './components/app-header.js';
import { AppFooter } from './components/app-footer.js';
import { IconEditPage } from './pages/icon-edit-page.js';
import { IconPicker } from './components/icon-picker.js';
import { AppSelect } from './components/app-select.js';

const { createApp, ref, onMounted, computed, provide, watch } = window.Vue;

createApp({
    components: {
        'overview-page': OverviewPage,
        'add-page': AddPage,
        'edit-page': EditPage,
        'history-page': HistoryPage,
        'stats-page': StatsPage,
        'settings-page': SettingsPage,
        'import-page': ImportPage,
        'project-detail-page': ProjectDetailPage,
        'view-dashboard': ViewDashboard,
        'system-modal': SystemModal,
        'app-header': AppHeader,
        'app-footer': AppFooter,
        'icon-picker': IconPicker,
        'icon-edit-page': IconEditPage,
        'app-select': AppSelect
    },
    setup() {
        const getLocalISOString = () => {
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            return now.toISOString().slice(0, 16);
        };
        const currentTab = ref('add');
        const loading = ref(false);
        const currentUser = ref(null); // Firebase User

        // Scroll to top on tab change
        watch(currentTab, () => {
            window.scrollTo({ top: 0, behavior: 'instant' });
        });

        const categories = ref([]);
        const friends = ref([]);
        const paymentMethods = ref([]);
        const projects = ref([]);
        const transactions = ref([]);
        const fxRate = ref(CONFIG.TWD_FIXED_RATE);
        const stats = ref({ monthlyLifeTotal: 0, allOneTimeTotal: 0, debtTotal: 0, totalInvestment: 0 });
        const historyFilter = ref({ mode: 'all', categoryId: null, friendName: null, currency: null, keyword: '' });

        // Load Guest Config
        const savedGuestConfig = JSON.parse(localStorage.getItem('guest_config') || '{}');
        const systemConfig = ref({
            user_name: savedGuestConfig.user_name || '',
            fx_rate: savedGuestConfig.fx_rate || 0.22,
            import_default: savedGuestConfig.import_default || false
        });

        const editForm = ref(null);
        const selectedProject = ref(null);
        const iconEditContext = ref(null);
        const isSettingsDirty = ref(false);

        // --- Global Dialog System ---
        const modalState = ref({
            visible: false,
            config: {
                type: 'info',
                title: '',
                message: '',
                confirmText: '確認',
                secondaryText: '',
                showCancel: false,
                data: null
            },
            resolve: null
        });

        const dialog = {
            alert: (message, type = 'error', title = '') => {
                return new Promise(resolve => {
                    modalState.value.config = {
                        type,
                        title: title || (type === 'error' ? '錯誤' : '提示'),
                        message,
                        confirmText: '確認',
                        secondaryText: '',
                        showCancel: false
                    };
                    modalState.value.resolve = resolve;
                    modalState.value.visible = true;
                });
            },
            confirm: (message, options = {}) => {
                return new Promise(resolve => {
                    modalState.value.config = {
                        type: 'confirm',
                        title: options.title || '確認',
                        message,
                        confirmText: options.confirmText || '確定',
                        secondaryText: options.secondaryText || '取消',
                        showCancel: true
                    };
                    modalState.value.resolve = resolve;
                    modalState.value.visible = true;
                });
            },
            showTransactionSuccess: (item, onSecondaryAction, options = {}) => {
                modalState.value.config = {
                    type: 'transaction_success',
                    title: options.title || '已新增',
                    message: '',
                    confirmText: options.confirmText || '確認',
                    secondaryText: options.secondaryText || '看明細',
                    showCancel: false,
                    data: item,
                    onSecondary: onSecondaryAction
                };
                modalState.value.resolve = options.onConfirm ? options.onConfirm : () => { };
                modalState.value.visible = true;
            }
        };
        provide('dialog', dialog);

        // Global Currency State
        const params = new URLSearchParams(window.location.search);
        const urlCurrency = params.get('currency');
        const baseCurrency = ref(urlCurrency === 'TWD' ? 'TWD' : 'JPY');
        const toggleBaseCurrency = () => { baseCurrency.value = baseCurrency.value === 'JPY' ? 'TWD' : 'JPY'; };
        provide('baseCurrency', baseCurrency);
        provide('toggleBaseCurrency', toggleBaseCurrency);

        const handleModalConfirm = () => {
            modalState.value.visible = false;
            if (modalState.value.resolve) modalState.value.resolve(true);
        };

        const handleModalCancel = () => {
            modalState.value.visible = false;
            if (modalState.value.config.onSecondary) modalState.value.config.onSecondary();
            if (modalState.value.resolve) modalState.value.resolve(false);
        };

        const form = ref({
            type: '支出', currency: 'JPY', amount: '', spendDate: getLocalISOString(),
            categoryId: 'cat_001', name: '', note: '', paymentMethod: '',
            isOneTime: false, isSplit: false, friendName: '', personalShare: 0, payer: '我', isAlreadyPaid: false,
            projectId: '',
            action: 'add'
        });

        // Update payer when user_name loads
        /* 
           [UX CHANGE] Payer always defaults to '我' (Me). 
           Disabled auto-override by systemConfig.user_name to ensure consistent pre-selection.
        */
        // watch(() => systemConfig.value.user_name, (newName) => {
        //     if (newName && (form.value.payer === '我' || !form.value.payer)) {
        //         form.value.payer = newName;
        //     }
        // });

        const syncStatus = ref('idle');

        // Determine App Mode
        const appMode = computed(() => {
            if (currentUser.value) return 'ADMIN';
            if (window.location.href.includes('view') || window.location.search.includes('mode=view')) return 'VIEWER';
            return 'GUEST';
        });

        const filteredTransactions = computed(() => {
            let list = transactions.value;
            const filter = historyFilter.value;

            if (filter.mode === 'monthly') {
                const now = new Date();
                list = list.filter(t => new Date(t.spendDate).getMonth() === now.getMonth() && new Date(t.spendDate).getFullYear() === now.getFullYear() && !t.isOneTime);
            } else if (filter.mode === 'onetime') {
                list = list.filter(t => t.isOneTime);
            } else if (filter.mode === 'debt') {
                list = list.filter(t => t.debtAmount !== 0 || t.type === '收款');
            } else if (filter.mode === 'general') {
                list = list.filter(t => !t.projectId);
            } else if (filter.mode === 'project') {
                list = list.filter(t => !!t.projectId);
            }

            if (filter.categoryId) list = list.filter(t => t.categoryId === filter.categoryId);
            if (filter.friendName) {
                list = list.filter(t =>
                    (t.friendName && t.friendName.includes(filter.friendName)) ||
                    (t.payer && t.payer === filter.friendName)
                );
            }
            if (filter.currency) list = list.filter(t => t.originalCurrency === filter.currency);

            if (filter.keyword) {
                const k = filter.keyword.toLowerCase();
                const matchingProjectIds = projects.value
                    .filter(p => p.name.toLowerCase().includes(k) || p.id.toLowerCase() === k)
                    .map(p => p.id);

                list = list.filter(t => {
                    const cat = categories.value.find(c => c.id === t.categoryId);
                    const catName = cat ? cat.name.toLowerCase() : '';
                    const pm = paymentMethods.value.find(p => p.id === t.paymentMethod);
                    const pmName = pm ? pm.name.toLowerCase() : (t.paymentMethod || '').toLowerCase();

                    return (
                        (t.name && String(t.name).toLowerCase().includes(k)) ||
                        (t.note && String(t.note).toLowerCase().includes(k)) ||
                        (t.friendName && String(t.friendName).toLowerCase().includes(k)) ||
                        catName.includes(k) ||
                        pmName.includes(k) ||
                        (t.projectId && matchingProjectIds.includes(t.projectId)) ||
                        (t.projectId && String(t.projectId).toLowerCase() === k)
                    );
                });
            }
            return list;
        });

        const handleViewHistory = (keyword) => {
            historyFilter.value = { mode: 'all', categoryId: null, friendName: null, currency: null, keyword: keyword };
            currentTab.value = 'history';
        };

        const loadData = async (isSilent = false) => {
            if (!isSilent) loading.value = true;
            try {
                if (appMode.value === 'GUEST') {
                    // Guest Mode Logic (LocalStorage Only)
                    const localData = localStorage.getItem('guest_data');
                    let localTransactions = [];
                    if (localData) {
                        try {
                            const parsed = JSON.parse(localData);
                            localTransactions = parsed.transactions || [];
                        } catch (e) { console.error("Guest data parse error", e); }
                    }

                    // Fallback Defaults
                    const savedCats = localStorage.getItem('guest_categories');
                    const savedPMs = localStorage.getItem('guest_payments');

                    if (savedCats) {
                        categories.value = JSON.parse(savedCats);
                    } else if (categories.value.length === 0) {
                        categories.value = [...DEFAULTS.categories];
                    }

                    if (savedPMs) {
                        paymentMethods.value = JSON.parse(savedPMs);
                    } else if (paymentMethods.value.length === 0) {
                        paymentMethods.value = [...DEFAULTS.paymentMethods];
                    }

                    transactions.value = localTransactions;
                    // Recalc Stats
                    let total = 0;
                    transactions.value.forEach(t => {
                        if (!t.isOneTime && t.type === '支出') {
                            // Dynamic Conversion for Guest (Default rate)
                            const rate = systemConfig.value.fx_rate || 0.22;
                            const amt = parseFloat(t.amount || (t.originalCurrency === 'JPY' ? t.amountJPY : t.amountTWD));
                            if (t.originalCurrency === 'TWD') total += amt / rate;
                            else total += amt;
                        }
                    });
                    stats.value = { monthlyLifeTotal: total, allOneTimeTotal: 0, debtTotal: 0, totalInvestment: 0 };
                    return;
                }

                // ADMIN / VIEWER (Firestore)
                let data; // Declare variable
                if (appMode.value === 'VIEWER') {
                    const params = new URLSearchParams(window.location.search);
                    const sharedId = params.get('id');
                    if (!sharedId) throw new Error("Missing Shared ID");
                    data = await API.fetchSharedData(sharedId);
                } else {
                    data = await API.fetchInitialData();
                }

                categories.value = data.categories || [];
                friends.value = data.friends || [];
                paymentMethods.value = data.paymentMethods || [];
                projects.value = data.projects || [];
                transactions.value = data.transactions || [];

                if (data.stats) stats.value = data.stats;

                // Merge Remote Config
                if (data.config) {
                    systemConfig.value = { ...data.config }; // Remote config overrides local for logged-in user
                    if (data.config.fx_rate) fxRate.value = parseFloat(data.config.fx_rate);
                }

                if (appMode.value === 'VIEWER') currentTab.value = 'overview';

                // Recalc Stats (Dynamic Conversion)
                let lifeTotal = 0;
                let oneTimeTotal = 0;
                const rate = fxRate.value || 0.22;

                transactions.value.forEach(t => {
                    if (t.type === '支出') {
                        // Use raw amount if available, else fallback to legacy JPY/TWD fields
                        const rawAmt = t.amount !== undefined ? Number(t.amount) : (t.originalCurrency === 'TWD' ? Number(t.amountTWD) : Number(t.amountJPY));
                        const isTWD = t.originalCurrency === 'TWD';

                        // Convert to JPY for stats base
                        const amountInJPY = isTWD ? rawAmt / rate : rawAmt;

                        if (t.isOneTime) oneTimeTotal += amountInJPY;
                        else lifeTotal += amountInJPY;
                    }
                });
                stats.value.monthlyLifeTotal = lifeTotal;
                stats.value.allOneTimeTotal = oneTimeTotal;

            } catch (err) {
                console.error("Load Data Error", err);
                if (!isSilent) dialog.alert("資料載入失敗: " + err.message);
            } finally {
                if (!isSilent) loading.value = false;
            }
        };

        const handleSubmit = async (targetForm) => {
            if (appMode.value === 'VIEWER') return;
            if (loading.value) return; // Prevent double submit

            const dataToSave = targetForm || form.value;
            if (!dataToSave.amount || !dataToSave.name) return;

            // Optimistic UI: Don't lock UI, but prevent double submit logic if needed
            // loading.value = true; // [UX] optimistic: do not show loading

            try {
                // Prepare Payload
                const now = new Date();
                let utcOffset = '';
                if (dataToSave.action === 'edit' && dataToSave.utc) {
                    utcOffset = dataToSave.utc;
                } else {
                    const tzo = now.getTimezoneOffset();
                    const sign = tzo <= 0 ? '+' : '-';
                    const h = Math.abs(Math.floor(tzo / 60)).toString().padStart(2, '0');
                    const m = Math.abs(tzo % 60).toString().padStart(2, '0');
                    utcOffset = `${sign}${h}:${m}`;
                }

                const payload = {
                    ...dataToSave,
                    amount: Number(dataToSave.amount), // Store Raw Amount
                    currency: dataToSave.currency,
                    originalCurrency: dataToSave.currency,
                    id: dataToSave.id || "tx_" + now.getTime(),
                    entryDate: dataToSave.action === 'edit' ? (dataToSave.entryDate || now.toISOString()) : now.toISOString(),
                    spendDate: dataToSave.spendDate,
                    utc: utcOffset
                };

                // OPTIMISTIC UPDATE
                if (dataToSave.action === 'edit') {
                    const idx = transactions.value.findIndex(t => t.id === payload.id);
                    if (idx !== -1) transactions.value[idx] = { ...payload };
                } else {
                    transactions.value.unshift({ ...payload });
                }

                // [UX] IMMEDIATE FEEDBACK
                const goHistory = () => { currentTab.value = 'history'; resetForm(); };

                if (dataToSave.action === 'edit') {
                    dialog.showTransactionSuccess({ ...dataToSave }, () => loadData(true), {
                        title: '已更新',
                        confirmText: '返回明細',
                        secondaryText: '重新整理', // Keep this option in case user wants to force sync check
                        onConfirm: goHistory
                    });
                } else {
                    // For Add, we can just reset and notify
                    dialog.showTransactionSuccess({ ...dataToSave }, goHistory, {
                        title: '已新增',
                        confirmText: '確認',
                        secondaryText: '看明細'
                    });
                    resetForm();
                }

                // BACKGROUND SYNC
                (async () => {
                    try {
                        if (appMode.value === 'ADMIN') {
                            await API.saveTransaction(payload);
                            console.log("[Background Sync] Save success", payload.id);
                        } else if (appMode.value === 'GUEST') {
                            const localOnly = transactions.value.filter(t => !t.isRemote);
                            localStorage.setItem('guest_data', JSON.stringify({ transactions: localOnly }));
                        }
                    } catch (bgError) {
                        console.error("[Background Sync] Failed", bgError);
                        // Optional: Show a toaster or notification if critical
                        // dialog.alert("背景同步失敗，請檢查網路連線"); 
                    }
                })();

            } catch (e) {
                console.error("Save Error", e);
                dialog.alert("儲存錯誤: " + e.message);
                // Revert optimistic update if needed?
            } finally {
                loading.value = false; // Unlock
            }
        };

        const handleTabChange = async (newTab) => {
            if (isSettingsDirty.value) {
                if (await dialog.confirm("您有未儲存的修改，確定要離開嗎？")) {
                    isSettingsDirty.value = false;
                    currentTab.value = newTab;
                }
            } else {
                currentTab.value = newTab;
            }
        };

        const handleDelete = async (row) => {
            if (appMode.value === 'VIEWER') return;
            // NOTE: row is legacy, we need ID.
            // Old data might not have ID? We should have migrated or handle gracefully.
            // Assumption: transactions loaded from Firestore HAVE IDs.
            // Guest data might use row? 
            // Only Firestore data has ID guaranteed.

            // Let's find the ID.
            let idToDelete = null;
            let item = null;

            // Try matching by row or id
            if (typeof row === 'string' && row.startsWith('tx_')) {
                idToDelete = row; // passed ID directly
                item = transactions.value.find(t => t.id === row);
            } else {
                item = transactions.value.find(t => t.row === row);
                if (item) idToDelete = item.id;
            }

            if (appMode.value === 'GUEST') {
                if (!confirm("體驗模式：確定刪除？")) return;
                if (item) {
                    transactions.value = transactions.value.filter(t => t !== item);
                    const localOnly = transactions.value.filter(t => !t.isRemote);
                    localStorage.setItem('guest_data', JSON.stringify({ transactions: localOnly }));
                    dialog.showTransactionSuccess(item, () => { currentTab.value = 'history'; editForm.value = null; }, {
                        title: '已刪除', confirmText: '返回明細', secondaryText: ''
                    });
                }
                return;
            }

            if (!await dialog.confirm("確定要永久刪除此筆資料嗎？")) return;

            // Optimistic Delete
            if (item) {
                transactions.value = transactions.value.filter(t => t.id !== item.id);
            }

            // [UX] IMMEDIATE FEEDBACK
            const goHistory = () => { currentTab.value = 'history'; editForm.value = null; };
            if (item) {
                dialog.showTransactionSuccess(item, goHistory, {
                    title: '已刪除',
                    confirmText: '返回明細',
                    secondaryText: '',
                    onConfirm: goHistory
                });
            }

            // BACKGROUND SYNC
            if (appMode.value === 'ADMIN' && idToDelete) {
                (async () => {
                    try {
                        await API.saveTransaction({ action: 'delete', id: idToDelete });
                        console.log("[Background Sync] Delete success", idToDelete);
                    } catch (e) {
                        console.error("[Background Sync] Delete failed", e);
                        // dialog.alert("刪除失敗"); // Optional
                    }
                })();
            } else if (!idToDelete) {
                // Keep this check for sanity, though inconsistent with optimistic if we don't alert
                console.warn("無法刪除：找不到 ID");
            }

            if (item) {
                const goHistory = () => { currentTab.value = 'history'; editForm.value = null; };
                dialog.showTransactionSuccess(item, goHistory, {
                    title: '已刪除',
                    confirmText: '返回明細',
                    secondaryText: '',
                    onConfirm: goHistory
                });
            }
        };

        const resetForm = () => {
            const defaultPayer = '我'; // UX: Always default to '我'
            form.value = {
                type: '支出', currency: 'JPY', amount: '', spendDate: getLocalISOString(),
                categoryId: 'cat_001', name: '', note: '', paymentMethod: '',
                isSplit: false, friendName: '', personalShare: 0, payer: defaultPayer, isAlreadyPaid: false,
                projectId: '',
                action: 'add'
            };
            editForm.value = null;
        };

        const handleEditItem = (item) => {
            const formattedDate = item.spendDate ? item.spendDate.replace(/\//g, "-").replace(" ", "T") : getLocalISOString();
            const hasSplit = item.friendName && item.friendName.trim() !== "";
            editForm.value = JSON.parse(JSON.stringify({
                ...item,
                spendDate: formattedDate,
                amount: item.amount !== undefined ? item.amount : (item.originalCurrency === 'TWD' ? item.amountTWD : item.amountJPY),
                currency: item.currency || item.originalCurrency || (item.amountTWD ? 'TWD' : 'JPY'),
                action: 'edit',
                isSplit: hasSplit,
                projectId: item.projectId || ''
            }));
            currentTab.value = 'edit';
        };

        const getTabIcon = (t) => {
            const icons = { overview: 'dashboard', history: 'list_alt', add: 'add', stats: 'bar_chart', settings: 'settings', 'project-detail': 'flight_takeoff' };
            return icons[t] || 'help';
        };

        // SETUP AUTH LISTENER
        onMounted(() => {
            // Wait for Auth init
            API.onAuthStateChanged((user) => {
                const prevUser = currentUser.value;
                currentUser.value = user;

                // If user changed (e.g. login or logout), reload data
                // Also first load
                loadData();
            });
        });

        // Expose for Debugging
        window.DEBUG_APP = {
            transactions,
            paymentMethods,
            systemConfig,
            appMode,
            localData: () => JSON.parse(localStorage.getItem('guest_data')),
            clear: () => { localStorage.removeItem('guest_data'); window.location.reload(); }
        };

        const handleUpdateUserData = async (data, silent = false) => {
            if (appMode.value === 'GUEST') {
                if (data.categories) localStorage.setItem('guest_categories', JSON.stringify(data.categories));
                if (data.paymentMethods) localStorage.setItem('guest_payments', JSON.stringify(data.paymentMethods));
                if (data.friends) localStorage.setItem('guest_friends', JSON.stringify(data.friends));
                await loadData();
                return;
            }
            if (appMode.value !== 'ADMIN') return;
            if (!silent) loading.value = true;
            try {
                await API.updateUserData(data);
                await loadData();
            } finally {
                if (!silent) loading.value = false;
            }
        };

        const handleAddFriendToList = async (n) => {
            if (!friends.value.includes(n)) {
                friends.value.push(n);
                // Silent update in background
                handleUpdateUserData({ friends: friends.value }, true);
            }
        };

        return {
            currentTab, handleTabChange, loading, categories, friends, paymentMethods, projects, transactions, filteredTransactions, historyFilter, form, editForm, stats, systemConfig, fxRate, selectedProject, isSettingsDirty,
            appMode, syncStatus, currentUser,
            handleSubmit, handleDelete, handleEditItem,
            formatNumber: (n) => new Intl.NumberFormat().format(Math.round(n || 0)),
            getTabIcon,
            toggleCurrency: () => form.value.currency = (form.value.currency === 'JPY' ? 'TWD' : 'JPY'),
            handleAddFriendToList,
            resetForm,
            handleDrillDown: (id) => { historyFilter.value = { mode: 'all', categoryId: id, friendName: null, currency: null, keyword: '' }; currentTab.value = 'history'; },

            modalState, handleModalConfirm, handleModalCancel,
            baseCurrency, toggleBaseCurrency,

            handleUpdateConfig: async (c) => {
                if (appMode.value === 'GUEST') {
                    systemConfig.value = { ...systemConfig.value, ...c };
                    localStorage.setItem('guest_config', JSON.stringify(systemConfig.value));
                    await loadData();
                    dialog.alert("設定已更新 (Guest)", 'success');
                    return;
                }
                if (appMode.value !== 'ADMIN') return dialog.alert("權限不足", 'error');
                loading.value = true;
                await API.saveTransaction({ action: 'updateConfig', ...c });
                await loadData();
            },
            handleUpdateUserData,
            handleViewFriend: (n) => { historyFilter.value = { mode: 'all', categoryId: null, friendName: n, currency: null, keyword: '' }; currentTab.value = 'history'; },
            handleViewProject: (p) => { selectedProject.value = p; currentTab.value = 'project-detail'; },
            handleViewHistory,
            handleUpdateProject: async () => { await loadData(); },

            iconEditContext,
            handleOpenIconEdit: (ctx) => {
                iconEditContext.value = ctx;
                currentTab.value = 'icon-edit';
            },
            handleClearAccountData: async () => {
                loading.value = true;
                try {
                    await API.clearAccountData();
                    await API.logout();
                    // Force full reload to clean all states
                    window.location.href = window.location.origin + window.location.pathname;
                } catch (e) {
                    console.error(e);
                    dialog.alert("刪除失敗，請稍後再試");
                } finally {
                    loading.value = false;
                }
            },
            handleSelectIcon: ({ icon, name }) => {
                if (!iconEditContext.value) return;
                const { type, id } = iconEditContext.value;

                // Update root state
                if (type === 'category') {
                    const cat = categories.value.find(c => c.id === id);
                    if (cat) {
                        cat.icon = icon;
                        cat.name = name;
                    }
                } else if (type === 'payment') {
                    const pm = paymentMethods.value.find(p => p.id === id);
                    if (pm) {
                        pm.icon = icon;
                        pm.name = name;
                    }
                }

                currentTab.value = 'settings';
                // Trigger a refresh of settings-page if it's watching id? 
                // Actually, settings-page will react if it uses these props.
            },

            // NEW: Auth Methods
            handleGoogleLogin: async () => {
                try {
                    await API.login();
                    // AuthStateChanged will handle reload
                    dialog.alert("登入成功", "success");
                } catch (e) {
                    dialog.alert("登入失敗: " + e.message);
                }
            },
            handleLogout: async () => {
                if (await dialog.confirm("確定要登出嗎？")) {
                    await API.logout();
                }
            },

            clearGuestData: async () => {
                if (await dialog.confirm("確定要清除所有訪客資料嗎？", "清除資料")) {
                    localStorage.removeItem('guest_data');
                    window.location.reload();
                }
            },
            retrySync: () => { }, // No-op now
            handleCreateProject: async (input) => {
                if (appMode.value !== 'ADMIN') return dialog.alert("權限不足");
                if (!input) return;

                let name = '';
                let startDate = getLocalISOString().split('T')[0];
                let endDate = getLocalISOString().split('T')[0];

                if (typeof input === 'object') {
                    name = input.name;
                    startDate = input.startDate || startDate;
                    endDate = input.endDate || endDate;
                } else {
                    name = input;
                }

                if (!name) return;
                if (!name) return;
                // Silent update
                try {
                    await API.saveTransaction({
                        action: 'updateProject',
                        name: name,
                        startDate: startDate,
                        endDate: endDate
                    });
                    await loadData();
                    // dialog.alert("Project Created!", 'success'); // Silent, don't alert
                } catch (e) {
                    dialog.alert("Error creating project: " + e, 'error');
                }
            }
        };

        const autoBackupIfNeeded = async () => {
            if (currentUser.value?.uid && systemConfig.value.auto_backup) {
                const today = new Date().toISOString().slice(0, 10);
                const lastBackup = localStorage.getItem('last_backup_date');
                if (lastBackup === today) return;

                // Removed hour check to ensure backup runs on first visit of the day
                // if (currentHour < 23 && lastBackup) return;

                try {
                    const token = API.getGoogleToken();
                    // Auto-backup should verify token validity or try to refresh silently?
                    // if (!token) ... we can try requestIncrementalScope but that might pop up.
                    // If no token, we can't backup silently.
                    if (!token) return;

                    const data = {
                        transactions: transactions.value,
                        categories: categories.value,
                        paymentMethods: paymentMethods.value,
                        projects: projects.value,
                        friends: friends.value,
                        config: systemConfig.value
                    };

                    await GoogleSheetsService.backupFullData(data, token, API.requestIncrementalScope);
                    localStorage.setItem('last_backup_date', today);
                    console.log("Auto-backup completed.");
                } catch (e) {
                    console.error("Auto-backup failed", e);
                }
            }
        };

        onMounted(() => {
            setTimeout(autoBackupIfNeeded, 5000);
        });

        return methods;
    }
}).mount('#app');
