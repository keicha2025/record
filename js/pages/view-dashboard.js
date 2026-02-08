import { Theme } from '../theme.js';

export const ViewDashboard = {
    template: `
    <section class="space-y-6 py-4 animate-in fade-in pb-10">
        <!-- Block 1: Main Card (User Info + Nav) -->
        <div class="bg-white p-6 rounded-[2rem] muji-shadow border border-gray-50 space-y-6">
            <!-- User Name Header -->
            <div class="text-center space-y-1">
                <h1 class="text-xl font-light text-gray-700 tracking-widest">
                    {{ config.user_name || '使用者' }}
                </h1>
                <p v-if="dateRangeText" class="text-[10px] text-gray-400 tracking-wider font-english">
                    {{ dateRangeText }}
                </p>
            </div>

            <!-- Nav Buttons (Moved Inside) -->
            <div class="grid grid-cols-2 gap-4">
                <div @click="$emit('switch-tab', 'history')" class="bg-gray-50 p-4 rounded-2xl active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center space-y-2 h-28 border border-gray-100">
                    <span class="material-symbols-rounded text-gray-400 text-2xl">list_alt</span>
                    <span class="text-sm text-gray-600 font-medium tracking-widest">交易明細</span>
                </div>
                <div @click="$emit('switch-tab', 'stats')" class="bg-gray-50 p-4 rounded-2xl active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center space-y-2 h-28 border border-gray-100">
                    <span class="material-symbols-rounded text-gray-400 text-2xl">pie_chart</span>
                    <span class="text-sm text-gray-600 font-medium tracking-widest">統計分析</span>
                </div>
            </div>
        </div>
        
        <!-- Block 2: CTA to Guest Mode -->
        <div @click="enterGuestMode" class="bg-white p-6 rounded-[2rem] muji-shadow border border-gray-50 active:scale-95 transition-all cursor-pointer flex items-center justify-between">
            <p class="text-sm text-gray-700 font-medium tracking-widest">打造你的專屬帳本</p>
            <span class="material-symbols-rounded text-gray-300">arrow_forward</span>
        </div>

        <!-- Block 3: Collection Section -->
        <div v-if="shouldShowCollection" class="space-y-4 pt-2">
            <h2 class="text-[10px] text-gray-300 font-medium tracking-[0.2em] ml-2 font-english">COLLECTION</h2>
            
            <div class="bg-white p-5 rounded-[2rem] muji-shadow border border-gray-50 space-y-3">
                <!-- FX Rate -->
                <div v-if="shouldShowFxRate" class="flex justify-between items-center border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                    <span class="text-xs text-gray-400 tracking-wider">匯率設定 (JPY/TWD)</span>
                    <span class="text-sm font-light text-gray-600 tracking-wider font-english">{{ Number(config.fx_rate || 0.22) }}</span>
                </div>

                <!-- Friends -->
                <div v-if="friends && friends.length > 0" class="space-y-2 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                    <p class="text-[10px] text-gray-300 uppercase tracking-widest">往來對象</p>
                    <div class="flex flex-wrap gap-2">
                        <span v-for="friend in friends" :key="friend" 
                              class="px-3 py-1 bg-gray-50 text-gray-500 rounded-full text-[10px] tracking-wider border border-gray-100">
                            {{ friend }}
                        </span>
                    </div>
                </div>

                <!-- Projects -->
                <div v-if="projects && projects.length > 0" class="space-y-2 last:border-0 last:pb-0">
                    <p class="text-[10px] text-gray-300 uppercase tracking-widest">記帳專案</p>
                    <div class="space-y-2">
                        <div v-for="proj in projects" :key="proj.id" class="flex justify-between items-center bg-gray-50 rounded-xl p-3 border border-gray-100">
                            <span class="text-xs text-gray-600 tracking-wider">{{ proj.name }}</span>
                            <span class="text-[10px] text-gray-400" v-if="proj.status === 'Archived'">已封存</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    `,
    props: ['transactions', 'stats', 'friends', 'projects', 'config', 'hasMultipleCurrencies'],
    computed: {
        shouldShowFxRate() {
            // Show if multiple currencies exist OR if rate is weird (not 1 and not default 0.22 if we cared, but mostly just if relevant)
            // Implementation Plan said: "if multiple currencies OR fxRate != default"
            // Let's assume default is 0.22. But users might have different defaults.
            // Check if hasMultipleCurrencies is true.
            if (this.hasMultipleCurrencies) return true;

            // Or if rate is significantly different from a "standard" that implies it matters?
            // Actually, if there is only one currency (e.g. TWD), FX rate is irrelevant for display usually, UNLESS they have mixed legacy data.
            // User requirement: "如貨幣資料都相同（例如他的資料都是TWD）就不顯示" -> implies strict check on data.
            // So hasMultipleCurrencies is the main switch.
            if (this.hasMultipleCurrencies) return true;
            return false;
        },
        shouldShowCollection() {
            return this.shouldShowFxRate || (this.friends && this.friends.length > 0) || (this.projects && this.projects.length > 0);
        },
        dateRangeText() {
            const scope = this.config.scope;
            const formatDate = (d) => d ? d.replace(/-/g, '/') : '';

            if (scope === 'range' && this.config.scopeValue) {
                return `${formatDate(this.config.scopeValue.start)} ~ ${formatDate(this.config.scopeValue.end)}`;
            }

            if (scope === 'project' && this.config.scopeValue) {
                const proj = this.projects.find(p => p.id === this.config.scopeValue);
                if (proj) {
                    return `${formatDate(proj.startDate)} ~ ${formatDate(proj.endDate)}`;
                }
                return '';
            }

            if (scope === 'all') {
                if (!this.transactions || this.transactions.length === 0) return '';
                // Find min and max spendDate
                // spendDate is YYYY-MM-DD or YYYY-MM-DDTHH:mm...
                const dates = this.transactions.map(t => t.spendDate.split('T')[0]).sort();
                return `${formatDate(dates[0])} ~ ${formatDate(dates[dates.length - 1])}`;
            }

            return '';
        }
    },
    methods: {
        enterGuestMode() { window.location.href = 'index.html'; }
    }
};
