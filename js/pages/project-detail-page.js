import { API } from '../api.js';

export const ProjectDetailPage = {
    template: `
    <section class="animate-in fade-in pb-20">
        <!-- Main Content Card -->
        <div class="bg-white p-6 rounded-[2.5rem] muji-shadow border border-gray-50 flex flex-col min-h-[60vh] relative mt-2">
            
            <!-- Navigation & Controls -->
            <div class="flex items-center justify-between pb-2 shrink-0">
                <button @click="$emit('back')" class="text-gray-400 hover:text-gray-600 transition-colors flex items-center space-x-1">
                    <span class="material-symbols-rounded text-xl">arrow_back</span>
                    <span class="text-[10px] tracking-widest uppercase">BACK</span>
                </button>
                <div class="flex items-center space-x-4">
                    <button v-if="!isEditing" @click="isEditing = true" class="text-gray-400 hover:text-gray-600 transition-colors">
                        <span class="material-symbols-rounded text-lg">edit</span>
                    </button>
                </div>
            </div>

            <!-- Read Only View (Centered Content) -->
            <div v-if="!isEditing" class="flex-1 flex flex-col justify-center space-y-8">
                <!-- ... content ... -->
                <div class="text-center space-y-3">
                    <span :class="project.status === 'Active' ? 'bg-[#4A4A4A] text-white' : 'bg-gray-200 text-gray-500'" 
                          class="text-[10px] px-3 py-1 rounded-full inline-block tracking-widest uppercase">
                          {{ getStatusLabel(project.status) }}
                    </span>
                    <h2 class="text-2xl font-light text-gray-800 tracking-wide">{{ project.name }}</h2>
                    <p class="text-[11px] text-gray-400 tracking-wider font-light">{{ project.startDate }} ~ {{ project.endDate }}</p>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-2 gap-4 bg-gray-50 p-6 rounded-3xl relative">
                     <div class="text-center">
                         <p class="text-[9px] text-gray-400 uppercase tracking-widest mb-1 font-medium">總花費</p>
                         <p class="text-xl font-light text-gray-700">{{ getCurrencySymbol }}{{ formatNumber(stats.total) }}</p>
                     </div>
                     <div class="text-center border-l border-gray-200">
                         <p class="text-[9px] text-gray-400 uppercase tracking-widest mb-1 font-medium">平均日花費</p>
                         <p class="text-xl font-light text-gray-700">{{ getCurrencySymbol }}{{ formatNumber(stats.daily) }}</p>
                     </div>
                </div>

                <!-- View Details Action -->
                <button @click="$emit('view-history', project.id)" class="w-full bg-gray-50 text-gray-400 py-4 rounded-2xl text-[10px] tracking-widest uppercase hover:bg-gray-100 hover:text-gray-600 transition-colors font-medium">
                    查看明細
                </button>
            </div>

            <!-- Edit View -->
            <div v-else class="space-y-6 pt-2">
                <div class="space-y-2">
                    <label class="text-[10px] text-gray-400 uppercase tracking-widest font-medium ml-2">計畫名稱</label>
                    <input type="text" v-model="editForm.name" class="w-full bg-gray-50 px-5 py-4 rounded-2xl text-sm outline-none text-gray-700 placeholder-gray-300 transition-all focus:bg-white focus:shadow-sm border border-transparent focus:border-gray-100">
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-2">
                        <label class="text-[10px] text-gray-400 uppercase tracking-widest font-medium ml-2">開始日期</label>
                        <input type="date" v-model="editForm.startDate" class="w-full bg-gray-50 px-4 py-3 rounded-2xl text-xs outline-none text-gray-600">
                    </div>
                    <div class="space-y-2">
                        <label class="text-[10px] text-gray-400 uppercase tracking-widest font-medium ml-2">結束日期</label>
                        <input type="date" v-model="editForm.endDate" class="w-full bg-gray-50 px-4 py-3 rounded-2xl text-xs outline-none text-gray-600">
                    </div>
                </div>

                <div class="space-y-2">
                     <label class="text-[10px] text-gray-400 uppercase tracking-widest font-medium ml-2">狀態</label>
                     <div class="grid grid-cols-2 gap-2">
                        <button v-for="status in ['Active', 'Archived']" :key="status"
                                @click="editForm.status = status"
                                :class="editForm.status === status ? 'bg-[#4A4A4A] text-white shadow-md' : 'bg-gray-50 text-gray-400'"
                                class="py-3 rounded-xl text-[10px] transition-all font-medium">
                            {{ getStatusLabel(status) }}
                        </button>
                     </div>
                </div>
                
                <div class="space-y-4 pt-6">
                    <button @click="saveProject" :disabled="saving" class="w-full bg-[#4A4A4A] text-white py-4 rounded-2xl text-[10px] font-medium tracking-[0.3em] uppercase active:scale-95 transition-all">
                {{ saving ? 'Saving...' : '更新紀錄' }}
            </button> <button @click="isEditing = false" class="w-full py-2 text-[10px] text-gray-400 tracking-widest uppercase hover:text-gray-600">取消編輯</button>
                </div>
            </div>
        </div>
    </section>
    `,
    props: ['project', 'transactions', 'fxRate'],
    inject: ['dialog'],
    setup() {
        const { inject, computed } = window.Vue;
        const baseCurrency = inject('baseCurrency');
        const getCurrencySymbol = computed(() => baseCurrency.value === 'JPY' ? '¥' : '$');
        return { baseCurrency, getCurrencySymbol };
    },
    data() {
        return {
            isEditing: false,
            editForm: {},
            saving: false
        };
    },
    computed: {
        stats() {
            if (!this.project || !this.transactions) return { total: 0, daily: 0 };

            // Filter transactions for this project
            const txs = this.transactions.filter(t => t.projectId === this.project.id && t.type === '支出');
            const rate = Number(this.fxRate || 0.22);
            const targetCurr = this.baseCurrency;

            let total = 0;
            txs.forEach(t => {
                const currency = t.originalCurrency || t.currency || 'JPY';
                const amt = t.amount !== undefined ? Number(t.amount) : (currency === 'TWD' ? Number(t.amountTWD) : Number(t.amountJPY));

                if (targetCurr === 'JPY') {
                    total += (currency === 'TWD') ? amt / rate : amt;
                } else {
                    total += (currency === 'JPY') ? amt * rate : amt;
                }
            });

            // Use date range for daily avg
            const start = new Date(this.project.startDate);
            const end = new Date(this.project.endDate);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            return {
                total: total,
                daily: diffDays > 0 ? total / diffDays : 0
            };
        }
    },
    watch: {
        project: {
            handler(newVal) {
                if (newVal) this.editForm = { ...newVal };
            },
            immediate: true
        }
    },
    methods: {
        formatNumber(num) { return new Intl.NumberFormat().format(Math.round(num || 0)); },
        getStatusLabel(status) {
            const map = { 'Active': '進行中', 'Archived': '已封存' };
            return map[status] || status;
        },
        async saveProject() {
            this.saving = true;
            try {
                await API.saveTransaction({
                    action: 'updateProject',
                    id: this.editForm.id,
                    name: this.editForm.name,
                    startDate: this.editForm.startDate,
                    endDate: this.editForm.endDate,
                    status: this.editForm.status
                });
                // Emit update to parent to refresh listing and current project view
                this.$emit('update-project', this.editForm);
                this.isEditing = false;
                this.dialog.alert("已儲存變更", 'success');
            } catch (e) {
                this.dialog.alert("儲存失敗: " + e.toString());
            } finally {
                this.saving = false;
            }
        }
    }
};
