import { SearchBar } from '../components/search-bar.js';

export const HistoryPage = {
    components: { SearchBar },
    template: `
    <section class="space-y-4 py-4 animate-in fade-in pb-24 min-h-[60dvh]">
        <!-- 搜尋與篩選列 Component -->
        <search-bar v-model="localFilter"></search-bar>

        <!-- 分組顯示列表 -->
        <div v-if="groupedTransactions.length === 0" class="text-center py-20">
            <span class="text-xs text-gray-300">沒有符合的紀錄</span>
        </div>

        <div v-else v-for="(group, dateKey) in groupedTransactions" :key="dateKey" class="space-y-3">
             <div class="py-2 mb-2">
                 <span class="text-[10px] font-medium text-gray-400 bg-[#F7F7F7] px-2 py-1 rounded-full ml-4 shadow-sm">{{ formatMonth(group.month) }}</span>
             </div>
             
             <div v-for="item in group.items" :key="item.id" 
                  @click="$emit('edit-item', item)"
                  class="bg-white p-5 rounded-[1.8rem] muji-shadow flex justify-between items-center active:scale-[0.98] transition-transform">
                <div class="flex items-center space-x-4">
                    <div class="w-11 h-11 bg-gray-50 rounded-full flex items-center justify-center">
                        <span class="material-symbols-rounded text-gray-400 text-xl">{{ getIcon(item.categoryId) }}</span>
                    </div>
                    <div class="flex flex-col min-w-0 flex-1 pr-2">
                        <span class="text-sm font-medium text-gray-700 truncate block">{{ item.name }}</span>
                        <div class="flex flex-wrap items-center gap-x-2 mt-0.5 text-[9px]">
                            <span class="text-gray-300 whitespace-nowrap flex items-center gap-1">
                                {{ item.spendDate.split('T')[0] }} · 
                                <span class="material-symbols-rounded text-[10px]">{{ getPaymentIcon(item.paymentMethod) }}</span>
                                {{ getPaymentName(item.paymentMethod) }}
                            </span>
                            <span v-if="item.payer !== '我' && item.type === '支出'" class="bg-gray-100 text-gray-500 px-1.5 rounded whitespace-nowrap">{{ item.payer }} 付款</span>
                            <span v-if="item.type === '收款'" class="bg-gray-100 text-gray-400 px-1.5 rounded whitespace-nowrap">{{ item.friendName }} 還款</span>
                            <span v-if="item.projectId" class="text-gray-300 truncate max-w-[80px]">{{ getProjectName(item.projectId) }}</span>
                        </div>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-sm font-medium" :class="getSignClass(item.type)">
                        {{ getSign(item.type) }} {{ getCurrencySymbol }} {{ formatNumber(getConvertedDisplayAmount(item)) }}
                    </p>
                    <div v-if="item.debtAmount !== 0" class="text-[8px] mt-0.5 font-medium" :class="item.debtAmount > 0 ? 'text-gray-400' : 'text-red-300'">
                        {{ item.debtAmount > 0 ? '債權 +' : '債務 ' }} {{ getCurrencySymbol }} {{ formatNumber(getConvertedDebtAmount(item)) }}
                    </div>
                </div>
            </div>
        </div>
    </section>
    `,
    props: ['transactions', 'categories', 'paymentMethods', 'projects', 'fxRate'],
    setup() {
        const { inject, computed } = window.Vue;
        const baseCurrency = inject('baseCurrency');
        const getCurrencySymbol = computed(() => baseCurrency.value === 'JPY' ? '¥' : '$');
        return { baseCurrency, getCurrencySymbol };
    },
    data() {
        return {
            localFilter: { keyword: '', mode: 'all' }
        };
    },
    computed: {
        groupedTransactions() {
            const groups = {};
            this.transactions.forEach(t => {
                const date = t.spendDate || '';
                const monthKey = date.slice(0, 7);
                if (!groups[monthKey]) groups[monthKey] = [];
                groups[monthKey].push(t);
            });
            return Object.keys(groups).sort((a, b) => b.localeCompare(a)).map(key => ({
                month: key,
                items: groups[key].sort((a, b) => b.spendDate.localeCompare(a.spendDate))
            }));
        }
    },
    watch: {
        localFilter: {
            handler(newVal) {
                this.$emit('update-filter', newVal);
            },
            deep: true
        }
    },
    methods: {
        getPaymentName(id) { const pm = this.paymentMethods.find(p => p.id === id); return pm ? pm.name : id; },
        getPaymentIcon(id) { const pm = this.paymentMethods.find(p => p.id === id); return pm ? (pm.icon || 'payments') : 'payments'; },
        getProjectName(id) {
            if (!this.projects) return '';
            const p = this.projects.find(proj => proj.id === id);
            return p ? p.name : '';
        },
        getIcon(id) {
            const cat = this.categories.find(c => c.id === id);
            return cat ? cat.icon : 'payments';
        },
        formatNumber(num) { return new Intl.NumberFormat().format(Math.round(num || 0)); },
        getSign(type) { return type === '支出' ? '-' : '+'; },
        getSignClass(type) { return type === '支出' ? 'text-gray-600' : 'text-gray-400'; },
        formatMonth(ym) {
            if (!ym) return '未知日期';
            const parts = ym.split('-');
            return parts[0] + '年' + parts[1] + '月';
        },
        getConvertedDisplayAmount(item) {
            let val = 0;
            const currency = item.originalCurrency || (item.currency) || 'JPY';
            if (item.type === '收款') {
                val = (item.amount !== undefined && item.amount !== null) ? Number(item.amount) : (currency === 'TWD' ? Number(item.amountTWD) : Number(item.amountJPY));
            } else {
                val = Number(item.personalShare || 0);
            }
            return this.convertValue(val, currency);
        },
        getConvertedDebtAmount(item) {
            const currency = item.originalCurrency || (item.currency) || 'JPY';
            const val = Math.abs(item.debtAmount || 0);
            return this.convertValue(val, currency);
        },
        convertValue(val, fromCurr) {
            const rate = Number(this.fxRate || 0.22);
            const target = this.baseCurrency;
            if (target === fromCurr) return val;
            if (target === 'JPY') return val / rate;
            return val * rate;
        }
    }
};
