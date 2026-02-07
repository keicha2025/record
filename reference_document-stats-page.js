import { Theme } from '../theme.js';
import { AppSelect } from '../components/app-select.js';

export const StatsPage = {
    components: {
        'app-select': AppSelect
    },
    template: `
    <section class="space-y-6 py-4 animate-in fade-in pb-10">
        <!-- 1. 模式切換與統計總額 -->
        <div class="bg-white p-6 rounded-[2rem] muji-shadow border border-gray-50 space-y-6">
            <!-- 1. 頂部控制列 (Reordered) -->
            <div class="flex bg-gray-50 rounded-xl p-1 mb-2">
                 <button @click="filterMode = 'normal'" :class="filterMode === 'normal' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'" class="flex-1 py-2 text-[10px] tracking-widest rounded-lg transition-all font-medium">一般模式</button>
                 <button @click="filterMode = 'project'" :class="filterMode === 'project' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'" class="flex-1 py-2 text-[10px] tracking-widest rounded-lg transition-all font-medium">專案分析</button>
            </div>

            <!-- 時間切換 (只在一般模式顯示) -->
            <div v-show="filterMode === 'normal'" class="flex bg-gray-50 rounded-xl p-1 mb-2">
                <button @click="dateMode = 'month'" :class="dateMode === 'month' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'" class="flex-1 py-1.5 text-[10px] tracking-widest rounded-lg transition-all font-medium">按月</button>
                <button @click="dateMode = 'range'" :class="dateMode === 'range' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'" class="flex-1 py-1.5 text-[10px] tracking-widest rounded-lg transition-all font-medium">自訂</button>
                <button @click="dateMode = 'all'" :class="dateMode === 'all' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'" class="flex-1 py-1.5 text-[10px] tracking-widest rounded-lg transition-all font-medium">所有</button>
            </div>

                <!-- 一般模式下的日期選擇與過濾 -->
                <div v-show="filterMode === 'normal'" class="flex flex-col space-y-2">
                   <input v-if="dateMode === 'month'" type="month" v-model="selectedMonth" class="text-xs bg-gray-50 px-3 h-9 rounded-xl outline-none text-gray-600 border border-transparent focus:bg-white focus:border-gray-200 transition-all">
                   <div v-else-if="dateMode === 'range'" class="grid grid-cols-2 gap-3">
                       <input type="date" v-model="startDate" class="text-xs bg-gray-50 px-3 h-9 rounded-xl outline-none text-gray-600 border border-transparent focus:bg-white focus:border-gray-200 transition-all">
                       <input type="date" v-model="endDate" class="text-xs bg-gray-50 px-3 h-9 rounded-xl outline-none text-gray-600 border border-transparent focus:bg-white focus:border-gray-200 transition-all">
                   </div>
                   
                   <!-- 過濾選項區塊 -->
                   <div class="flex flex-wrap items-center gap-x-4 gap-y-2 px-1 pt-1">
                       <!-- 個人份額切換 -->
                       <div class="flex items-center space-x-2">
                           <div @click="isMyShareOnly = !isMyShareOnly" class="w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer" :class="isMyShareOnly ? 'bg-gray-700 border-gray-700' : 'bg-white border-gray-300'">
                               <span v-if="isMyShareOnly" class="material-symbols-rounded text-white text-[10px]">check</span>
                           </div>
                           <span @click="isMyShareOnly = !isMyShareOnly" class="text-[10px] text-gray-400 cursor-pointer">僅顯示個人份額</span>
                       </div>

                       <!-- 排除專案選項 -->
                       <div class="flex items-center space-x-2">
                           <div @click="excludeProjects = !excludeProjects" class="w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer" :class="excludeProjects ? 'bg-gray-700 border-gray-700' : 'bg-white border-gray-300'">
                               <span v-if="excludeProjects" class="material-symbols-rounded text-white text-[10px]">check</span>
                           </div>
                           <span @click="excludeProjects = !excludeProjects" class="text-[10px] text-gray-400 cursor-pointer">不包含專案/旅行花費</span>
                       </div>
                   </div>
                </div>

                <!-- 專案模式下的專案選擇 -->
                 <div v-show="filterMode === 'project'" class="w-full pt-1 space-y-4">
                    <app-select v-model="selectedProjectId" :options="projectSelectOptions"></app-select>

                    <!-- 個人份額切換 (專案模式) -->
                    <div class="flex items-center space-x-2 px-1">
                        <div @click="isMyShareOnly = !isMyShareOnly" class="w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer" :class="isMyShareOnly ? 'bg-gray-700 border-gray-700' : 'bg-white border-gray-300'">
                            <span v-if="isMyShareOnly" class="material-symbols-rounded text-white text-[10px]">check</span>
                        </div>
                        <span @click="isMyShareOnly = !isMyShareOnly" class="text-[10px] text-gray-400 cursor-pointer">僅顯示個人份額</span>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-2 divide-x divide-gray-50 pt-2 px-2">
                <div>
                    <p class="text-[9px] text-gray-300 uppercase tracking-tighter mb-1">Total ({{ baseCurrency }})</p>
                    <p class="text-xl font-light text-gray-700">{{ getCurrencySymbol }} {{ formatNumber(totalPeriodAmount) }}</p>
                </div>
                <div class="px-4">
                    <p class="text-[9px] text-gray-300 uppercase tracking-tighter mb-1">Daily Avg</p>
                    <p class="text-xl font-light text-gray-700">{{ getCurrencySymbol }} {{ formatNumber(dailyAverage) }}</p>
                </div>
            </div>
        </div>

        <!-- 2. 圖表區域 -->
        <div @click="resetChartSelection" class="bg-white p-8 rounded-[2rem] muji-shadow border border-gray-50 cursor-pointer">
            <h3 class="text-[10px] text-gray-400 uppercase tracking-widest font-medium mb-8 text-center">Category Distribution</h3>
            <div class="relative w-full aspect-square max-w-[260px] mx-auto">
                <canvas ref="categoryChart"></canvas>
            </div>
        </div>

        <!-- 3. 支付方式 -->
        <div class="bg-white p-6 rounded-[2rem] muji-shadow border border-gray-50 space-y-5">
            <h3 class="text-[10px] text-gray-400 uppercase tracking-widest font-medium px-2">Payment Breakdown</h3>
            <div class="space-y-4">
                <div v-for="(val, method) in paymentStats" :key="method" class="space-y-1.5 px-2">
                    <div class="flex justify-between items-baseline">
                        <span class="text-[10px] text-gray-500">{{ getPaymentName(method) }}</span>
                        <div class="flex space-x-2 items-baseline">
                            <span class="text-xs font-medium text-gray-700">{{ getCurrencySymbol }} {{ formatNumber(val) }}</span>
                            <span class="text-[9px] text-gray-300">{{ getIntPercentage(val, totalPeriodAmount) }}%</span>
                        </div>
                    </div>
                    <div class="w-full bg-gray-50 h-1 rounded-full overflow-hidden">
                        <div class="bg-gray-300 h-full transition-all duration-1000" :style="{ width: getIntPercentage(val, totalPeriodAmount) + '%' }"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 4. 分類列表 -->
        <div class="space-y-3">
            <h3 class="text-[10px] text-gray-400 uppercase tracking-widest font-medium px-4">Categories</h3>
            <div v-for="cat in sortedCategoryData" :key="cat.id" 
                 @click.stop="$emit('drill-down', cat.id)" 
                 class="bg-white p-5 rounded-3xl muji-shadow flex justify-between items-center active:scale-[0.98] transition-transform">
                <div class="flex items-center space-x-4">
                    <div class="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
                        <span class="material-symbols-rounded text-gray-400 text-xl">{{ cat.icon }}</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-xs font-medium text-gray-700">{{ cat.name }}</span>
                        <span class="text-[9px] text-gray-300">{{ cat.count }}筆資料</span>
                    </div>
                </div>
                <div class="flex items-baseline space-x-2 text-right">
                    <span class="text-sm font-medium text-gray-700">{{ getCurrencySymbol }} {{ formatNumber(cat.total) }}</span>
                    <span class="text-[10px] text-gray-300">{{ getIntPercentage(cat.total, totalPeriodAmount) }}%</span>
                </div>
            </div>
        </div>
    </section>
    `,
    props: ['transactions', 'categories', 'fxRate', 'paymentMethods', 'projects', 'displayCurrency'],
    data() {
        const now = new Date();
        return {
            dateMode: 'month',
            selectedMonth: now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0'),
            startDate: now.toISOString().slice(0, 10),
            endDate: now.toISOString().slice(0, 10),
            baseCurrency: this.displayCurrency || 'JPY',
            isMyShareOnly: true,
            chartInstance: null,
            centerAmount: 0,
            centerLabel: 'TOTAL',
            filterMode: 'normal', // normal, project
            selectedProjectId: '',
            excludeProjects: false
        };
    },
    computed: {
        getCurrencySymbol() { return this.baseCurrency === 'JPY' ? '¥' : '$'; },
        activeProjects() { return (this.projects || []).filter(p => true); }, // 顯示所有專案供分析
        projectSelectOptions() {
            const options = [
                { label: '未選取專案 (合併統計)', value: '' }
            ];
            this.activeProjects.forEach(p => {
                options.push({
                    label: `${p.name} (${this.getStatusLabel(p.status)})`,
                    value: p.id
                });
            });
            return options;
        },
        filteredList() {
            return this.transactions.filter(t => {
                if (t.type !== '支出') return false;

                if (this.filterMode === 'project') {
                    if (!this.selectedProjectId) {
                        return !!t.projectId; // 只回傳有 projectId 的
                    }
                    return t.projectId === this.selectedProjectId;
                } else {
                    const tDate = t.spendDate.split(' ')[0].replace(/\//g, '-');
                    let timeMatch = true;
                    if (this.dateMode === 'month') timeMatch = tDate.startsWith(this.selectedMonth);
                    else if (this.dateMode === 'range') timeMatch = (tDate >= this.startDate && tDate <= this.endDate);
                    else if (this.dateMode === 'all') timeMatch = true;

                    if (!timeMatch) return false;

                    // 排除專案支出
                    if (this.excludeProjects && t.projectId) return false;

                    return true;
                }
            });
        },
        processedList() {
            return this.filteredList.map(t => {
                const amtJPY = Number(t.amountJPY || 0);
                const amtTWD = Number(t.amountTWD || 0);
                const personal = Number(t.personalShare || 0);
                const originalCurr = t.originalCurrency || 'JPY';
                const rate = Number(this.fxRate);

                let finalVal = 0;

                if (this.isMyShareOnly || t.payer !== '我') {
                    if (originalCurr === this.baseCurrency) {
                        finalVal = personal;
                    } else if (this.baseCurrency === 'JPY') {
                        finalVal = personal / rate;
                    } else {
                        finalVal = personal * rate;
                    }
                } else {
                    if (this.baseCurrency === 'JPY') {
                        finalVal = amtJPY;
                    } else {
                        finalVal = amtTWD;
                    }
                }

                return { ...t, convertedAmount: finalVal };
            });
        },
        totalPeriodAmount() { return this.processedList.reduce((acc, cur) => acc + cur.convertedAmount, 0); },
        dailyAverage() {
            if (this.processedList.length === 0) return 0;
            let days = 1;
            if (this.dateMode === 'month') {
                const parts = this.selectedMonth.split('-');
                const now = new Date();
                const isCurrent = (now.getFullYear() === parseInt(parts[0]) && (now.getMonth() + 1) === parseInt(parts[1]));
                days = isCurrent ? now.getDate() : new Date(parts[0], parts[1], 0).getDate();
            } else if (this.dateMode === 'range') {
                const diff = new Date(this.endDate) - new Date(this.startDate);
                days = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
            } else if (this.dateMode === 'all') {
                const dates = this.processedList.map(t => new Date(t.spendDate.split(' ')[0].replace(/\//g, '-')));
                if (dates.length > 0) {
                    const minDate = new Date(Math.min(...dates));
                    const maxDate = new Date(Math.max(...dates));
                    const diff = maxDate - minDate;
                    days = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
                }
            }
            return this.totalPeriodAmount / days;
        },
        paymentStats() {
            const stats = {};
            // 初始化動態支付方式
            if (this.paymentMethods) {
                this.paymentMethods.forEach(pm => stats[pm.id] = 0);
            }
            // 累加
            this.processedList.forEach(t => {
                if (t.paymentMethod) {
                    if (stats[t.paymentMethod] === undefined) stats[t.paymentMethod] = 0;
                    stats[t.paymentMethod] += t.convertedAmount;
                }
            });
            return stats;
        },
        sortedCategoryData() {
            const map = {};
            this.processedList.forEach(t => {
                if (!map[t.categoryId]) {
                    const cat = this.categories.find(c => c.id === t.categoryId);
                    map[t.categoryId] = { id: t.categoryId, name: cat ? cat.name : '其他', icon: cat ? cat.icon : 'sell', total: 0, count: 0 };
                }
                map[t.categoryId].total += t.convertedAmount;
                map[t.categoryId].count++;
            });
            return Object.values(map).sort((a, b) => b.total - a.total);
        }
    },
    methods: {
        getPaymentName(id) { const pm = this.paymentMethods.find(p => p.id === id); return pm ? pm.name : id; },
        getStatusLabel(status) {
            const map = { 'Active': '進行中', 'Archived': '已封存' };
            return map[status] || status;
        },
        formatNumber(num) { return new Intl.NumberFormat().format(Math.round(num || 0)); },
        getIntPercentage(val, total) { return total > 0 ? Math.round((val / total) * 100) : 0; },
        resetChartSelection() { this.centerLabel = 'TOTAL'; this.updateCenterFromVisible(this.chartInstance); },
        updateCenterFromVisible(chart) {
            if (!chart) return;
            const datasets = chart.data.datasets[0];
            let visibleTotal = 0;
            datasets.data.forEach((val, index) => { if (chart.getDataVisibility(index)) visibleTotal += val; });
            this.centerAmount = visibleTotal;
        },
        renderChart() {
            const ctx = this.$refs.categoryChart?.getContext('2d');
            if (!ctx) return;
            if (this.chartInstance) this.chartInstance.destroy();
            const data = this.sortedCategoryData;
            this.centerAmount = this.totalPeriodAmount;
            this.centerLabel = 'TOTAL';
            this.chartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: data.map(d => d.name),
                    datasets: [{
                        data: data.map(d => d.total),
                        backgroundColor: Theme.colors.chart,
                        borderWidth: 0, hoverOffset: 15
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false, cutout: '80%',
                    plugins: {
                        legend: {
                            position: 'bottom', labels: { boxWidth: 12, padding: 20, font: { size: 10, weight: '300' } },
                            onClick: (e, legendItem, legend) => {
                                legend.chart.toggleDataVisibility(legendItem.index);
                                legend.chart.update();
                                this.resetChartSelection();
                            }
                        }, tooltip: { enabled: false }
                    },
                    onClick: (evt, elements) => {
                        if (elements.length > 0) {
                            if (evt.native) evt.native.stopPropagation();
                            const idx = elements[0].index;
                            this.centerAmount = data[idx].total;
                            this.centerLabel = data[idx].name;
                        } else { this.resetChartSelection(); }
                    }
                },
                plugins: [{
                    id: 'centerText',
                    beforeDraw: (chart) => {
                        const { ctx } = chart; const meta = chart.getDatasetMeta(0);
                        if (!meta.data[0]) return;
                        const x = meta.data[0].x; const y = meta.data[0].y;
                        ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                        ctx.font = '300 10px Noto Sans TC'; ctx.fillStyle = Theme.colors.textSecondary;
                        ctx.fillText(this.centerLabel, x, y - 12);
                        ctx.font = '400 18px Noto Sans TC'; ctx.fillStyle = Theme.colors.primary;
                        ctx.fillText(this.getCurrencySymbol + ' ' + this.formatNumber(this.centerAmount), x, y + 8);
                        ctx.restore();
                    }
                }]
            });
        }
    },
    mounted() { this.$nextTick(() => this.renderChart()); },
    watch: {
        displayCurrency(newVal) { this.baseCurrency = newVal; },
        baseCurrency() { this.$nextTick(() => this.renderChart()); },
        isMyShareOnly() { this.$nextTick(() => this.renderChart()); },
        dateMode() { this.$nextTick(() => this.renderChart()); },
        selectedMonth() { this.$nextTick(() => this.renderChart()); },
        startDate() { this.$nextTick(() => this.renderChart()); },
        endDate() { this.$nextTick(() => this.renderChart()); },
        filterMode() { this.$nextTick(() => this.renderChart()); },
        excludeProjects() { this.$nextTick(() => this.renderChart()); },
        selectedProjectId() { this.$nextTick(() => this.renderChart()); },
        transactions: { handler() { this.$nextTick(() => this.renderChart()); }, deep: true }
    }
};
