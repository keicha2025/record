
import { CONFIG } from './config.js';
import { API } from './api.js';

// Components
import { HistoryPage } from './pages/history-page.js';
import { StatsPage } from './pages/stats-page.js';
import { ViewSettingsPage } from './pages/view-settings-page.js';
import { ViewDashboard } from './pages/view-dashboard.js';
import { ProjectDetailPage } from './pages/project-detail-page.js';
import { ViewEditPage } from './pages/view-edit-page.js';

import { SystemModal } from './components/system-modal.js';
import { AppHeader } from './components/app-header.js';
import { ViewerFooter } from './components/viewer-footer.js';

const { createApp, ref, onMounted, computed, provide } = window.Vue;

createApp({
    components: {
        'history-page': HistoryPage,
        'stats-page': StatsPage,
        'settings-page': ViewSettingsPage,
        'view-dashboard': ViewDashboard,
        'project-detail-page': ProjectDetailPage,
        'edit-page': ViewEditPage,
        'system-modal': SystemModal,
        'app-header': AppHeader,
        'viewer-footer': ViewerFooter
    },
    setup() {
        const appMode = ref('VIEWER'); // Fixed mode
        const currentTab = ref('overview');
        const loading = ref(false);

        // Data State
        const categories = ref([]);
        const friends = ref([]);
        const paymentMethods = ref([]);
        const projects = ref([]);
        const transactions = ref([]);
        const fxRate = ref(0.22);
        const stats = ref({ monthlyLifeTotal: 0, allOneTimeTotal: 0, debtTotal: 0, totalInvestment: 0 });

        // Currency Management
        const params = new URLSearchParams(window.location.search);
        const urlCurrency = params.get('currency');
        const baseCurrency = ref(urlCurrency === 'TWD' ? 'TWD' : 'JPY');
        const toggleBaseCurrency = () => { baseCurrency.value = baseCurrency.value === 'JPY' ? 'TWD' : 'JPY'; };
        provide('baseCurrency', baseCurrency);
        provide('toggleBaseCurrency', toggleBaseCurrency);

        const hasMultipleCurrencies = computed(() => {
            if (!transactions.value || transactions.value.length === 0) return false;
            const currencies = new Set(transactions.value.map(t => t.originalCurrency || (t.amountTWD ? 'TWD' : 'JPY')));
            return currencies.has('JPY') && currencies.has('TWD');
        });

        // Filter & Form State
        const historyFilter = ref({ mode: 'all', categoryId: null, friendName: null, currency: null, keyword: '' });
        const editForm = ref(null);
        const selectedProject = ref(null);

        // --- Dialog System (Simplified for View) ---
        const modalState = ref({
            visible: false,
            config: { type: 'info', title: '', message: '', confirmText: 'OK', showCancel: false },
            resolve: null
        });

        const dialog = {
            alert: (message, type = 'info') => {
                return new Promise(resolve => {
                    modalState.value.config = { type, title: '提示', message, confirmText: 'OK', showCancel: false };
                    modalState.value.resolve = resolve;
                    modalState.value.visible = true;
                });
            },
            confirm: () => Promise.resolve(false) // Viewer can't confirm dangerous actions
        };
        provide('dialog', dialog);

        const handleModalConfirm = () => {
            modalState.value.visible = false;
            if (modalState.value.resolve) modalState.value.resolve(true);
        };
        const handleModalCancel = () => { modalState.value.visible = false; };


        // --- Data Loading ---
        const loadData = async () => {
            loading.value = true;
            try {
                // Fetch from API (Backend handles masking)
                // We pass an empty token or a specific viewer token if needed. Here we assume public access or tokenless logic.
                const data = await API.fetchInitialData('');

                categories.value = data.categories || [];
                friends.value = data.friends || [];
                paymentMethods.value = data.paymentMethods || [];
                projects.value = data.projects || [];
                transactions.value = data.transactions || [];

                // [Smart Currency Detection] Detect base from latest transaction
                if (transactions.value.length > 0) {
                    const latest = transactions.value[0];
                    const detected = latest.originalCurrency || latest.currency || 'JPY';
                    if (detected === 'TWD' || detected === 'JPY') {
                        baseCurrency.value = detected;
                        console.log("[Smart Currency] Auto-detected from latest transaction:", detected);
                    }
                }

                if (data.stats) stats.value = data.stats;

                // Debug Config
                console.log("[ViewApp] Loaded Config:", data.config);

                if (data.config && data.config.fx_rate) {
                    const rate = parseFloat(data.config.fx_rate);
                    if (!isNaN(rate)) {
                        fxRate.value = rate;
                        console.log("[ViewApp] FX Rate Updated:", fxRate.value);
                    }
                } else {
                    console.warn("[ViewApp] No fx_rate found in config", data.config);
                }

            } catch (e) {
                console.error(e);
                dialog.alert("無法載入資料，請稍後再試。");
            } finally {
                loading.value = false;
            }
        };

        // --- Computed Properties ---
        const filteredTransactions = computed(() => {
            let list = transactions.value;
            const filter = historyFilter.value;

            // Mode Filtering
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

            // Other filters
            if (filter.categoryId) list = list.filter(t => t.categoryId === filter.categoryId);
            if (filter.friendName) {
                // Friend names are already anonymized by backend ("友1")
                list = list.filter(t =>
                    (t.friendName && t.friendName === filter.friendName) ||
                    (t.payer && t.payer === filter.friendName)
                );
            }
            if (filter.currency) list = list.filter(t => t.originalCurrency === filter.currency);

            // Keyword Search (Enhanced with Project Support)
            if (filter.keyword) {
                const k = filter.keyword.toLowerCase();

                // Find matching projects
                const matchingProjectIds = projects.value
                    .filter(p => p.name.toLowerCase().includes(k) || p.id.toLowerCase() === k)
                    .map(p => p.id);

                list = list.filter(t =>
                    (t.name && String(t.name).toLowerCase().includes(k)) ||
                    (t.note && String(t.note).toLowerCase().includes(k)) ||
                    (t.projectId && matchingProjectIds.includes(t.projectId)) ||
                    (t.projectId && String(t.projectId).toLowerCase() === k)
                );
            }
            return list;
        });

        const handleViewHistory = (keyword) => {
            historyFilter.value = { mode: 'all', categoryId: null, friendName: null, currency: null, keyword: keyword };
            currentTab.value = 'history';
        };

        // --- Event Handlers ---
        const handleEditItem = (item) => {
            // Open Edit Page in Read-Only Mode
            // We just populate the form; EditPage checks appMode for UI
            const formattedDate = item.spendDate ? item.spendDate.replace(/\//g, "-").replace(" ", "T") : '';
            editForm.value = JSON.parse(JSON.stringify({
                ...item,
                spendDate: formattedDate,
                amount: (item.originalCurrency === 'TWD' ? item.amountTWD : item.amountJPY),
                currency: item.originalCurrency || 'JPY'
            }));
            currentTab.value = 'edit';
        };

        const handleDrillDown = (categoryId) => {
            historyFilter.value = { mode: 'all', categoryId: categoryId, friendName: null, currency: null, keyword: '' };
            currentTab.value = 'history';
        };

        onMounted(loadData);

        return {
            appMode, currentTab, loading,
            categories, friends, paymentMethods, projects, transactions,
            filteredTransactions, historyFilter, editForm, stats, fxRate, selectedProject,
            modalState, handleModalConfirm, handleModalCancel,
            baseCurrency, toggleBaseCurrency, hasMultipleCurrencies,

            formatNumber: (n) => new Intl.NumberFormat().format(Math.round(n || 0)),

            handleEditItem,
            handleDrillDown,
            handleViewFriend: (n) => { historyFilter.value = { mode: 'all', categoryId: null, friendName: n, currency: null, keyword: '' }; currentTab.value = 'history'; },
            handleViewProject: (p) => { selectedProject.value = p; currentTab.value = 'project-detail'; },
            handleViewHistory
        };
    }
}).mount('#app');
