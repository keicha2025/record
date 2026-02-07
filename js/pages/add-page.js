import { API } from '../api.js'; // Ensure API is imported if needed, or rely on emit
export const AddPage = {
    template: `
    <section class="space-y-6 py-4 animate-in fade-in">
        <div class="bg-white p-6 rounded-[2.5rem] muji-shadow space-y-6">
            <!-- 1. 類型切換 -->
            <div class="flex bg-gray-100 rounded-xl p-1 relative">
                <button v-for="t in ['支出', '收入', '收款']" :key="t"
                        @click.stop="form.type = t" 
                        :class="form.type === t ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'" 
                        class="flex-1 py-2 text-[10px] tracking-widest rounded-lg transition-all z-10 font-medium">{{ t }}</button>
            </div>

            <!-- 2. 金額 -->
            <div class="text-center py-6 border-b border-gray-50">
                <div class="flex items-center justify-center space-x-3">
                    <span @click.stop="$emit('toggle-currency')" class="text-xs font-medium text-gray-300 border border-gray-100 px-3 py-1 rounded-full cursor-pointer">{{ form.currency }}</span>
                    <input type="number" v-model="form.amount" class="text-5xl font-light w-48 text-center bg-transparent outline-none" placeholder="0" inputmode="decimal">
                </div>
            </div>

            <div class="space-y-5">
                <!-- 3. 付款者選擇 (支出) -->
                <div v-if="form.type === '支出'" class="space-y-2">
                    <label class="text-[10px] text-gray-400 uppercase tracking-widest px-2 font-medium">付款人</label>
                    <div class="flex flex-wrap gap-2 px-2">
                        <button @click="form.payer = '我'" :class="form.payer === '我' ? 'bg-[#4A4A4A] text-white' : 'bg-gray-50 text-gray-400'" class="px-4 py-1.5 rounded-full text-[10px]">我</button>
                        <button v-for="f in friends" :key="'p-'+f" @click="form.payer = f" :class="form.payer === f ? 'bg-[#4A4A4A] text-white' : 'bg-gray-50 text-gray-400'" class="px-4 py-1.5 rounded-full text-[10px]">{{ f }}</button>
                        <button @click="triggerAddFriend('payer')" class="px-3 py-1.5 rounded-full bg-gray-100 text-gray-400 text-[10px]">+</button>
                    </div>
                    <!-- 本區塊新增輸入框 -->
                    <div v-if="isAddingFriend && addFriendTarget === 'payer'" class="mx-2 bg-gray-50 p-3 rounded-2xl flex items-center space-x-2 mt-2">
                        <input type="text" v-model="newFriendName" placeholder="新付款人名字" class="flex-grow bg-white p-2 rounded-xl text-xs outline-none">
                        <button @click="confirmAddFriend" class="bg-[#4A4A4A] text-white px-4 py-2 rounded-xl text-[10px]">OK</button>
                    </div>
                </div>

                <!-- 4. 收款對象選擇 (收款) -->
                <div v-if="form.type === '收款'" class="space-y-2">
                    <label class="text-[10px] text-gray-400 uppercase tracking-widest px-2 font-medium">收款對象</label>
                    <div class="flex flex-wrap gap-2 px-2">
                        <button v-for="f in friends" :key="'r-'+f" @click="form.friendName = f" :class="form.friendName === f ? 'bg-[#4A4A4A] text-white' : 'bg-gray-50 text-gray-400'" class="px-4 py-1.5 rounded-full text-[10px]">{{ f }}</button>
                        <button @click="triggerAddFriend('friendName')" class="px-3 py-1.5 rounded-full bg-gray-100 text-gray-400 text-[10px]">+</button>
                    </div>
                    <!-- 本區塊新增輸入框 -->
                    <div v-if="isAddingFriend && addFriendTarget === 'friendName'" class="mx-2 bg-gray-50 p-3 rounded-2xl flex items-center space-x-2 mt-2">
                        <input type="text" v-model="newFriendName" placeholder="新收款人名字" class="flex-grow bg-white p-2 rounded-xl text-xs outline-none">
                        <button @click="confirmAddFriend" class="bg-[#4A4A4A] text-white px-4 py-2 rounded-xl text-[10px]">OK</button>
                    </div>
                </div>

                <!-- 5. 基礎日期、分類、名稱 -->
                <label class="flex items-center justify-between px-2 cursor-pointer active:bg-gray-50 rounded-xl p-2 transition-colors">
                    <span class="text-[10px] text-gray-400 uppercase tracking-widest">Date</span>
                    <input type="datetime-local" v-model="form.spendDate" class="text-sm bg-transparent outline-none text-right cursor-pointer">
                </label>

                <div v-if="form.type !== '收款'" class="grid grid-cols-4 gap-4 py-2">
                    <div v-for="cat in filteredCategories" :key="cat.id" @click.stop="form.categoryId = cat.id" :class="form.categoryId === cat.id ? 'bg-[#4A4A4A] text-white shadow-lg' : 'bg-gray-50 text-gray-300'" class="flex flex-col items-center p-3 rounded-2xl transition-all">
                        <span class="material-symbols-rounded text-xl">{{ cat.icon }}</span>
                        <span class="text-[9px] mt-1 font-medium">{{ cat.name }}</span>
                    </div>
                </div>

                <input type="text" v-model="form.name" placeholder="項目名稱" class="w-full text-sm py-4 border-b border-gray-50 outline-none">

                <div class="space-y-2">
                    <label class="text-[10px] text-gray-400 uppercase tracking-widest px-2 font-medium">支付方式</label>
                    <div class="flex space-x-2 overflow-x-auto no-scrollbar py-2 px-2">
                        <button v-for="pm in paymentMethods" :key="pm.id" @click.stop="form.paymentMethod = pm.id"
                                :class="pm.id === form.paymentMethod ? 'bg-[#4A4A4A] text-white shadow-md' : 'bg-gray-50 text-gray-400'"
                                class="whitespace-nowrap px-4 py-2 rounded-2xl flex items-center space-x-2 transition-all border border-transparent">
                             <span class="material-symbols-rounded text-base">{{ pm.icon || 'payments' }}</span>
                             <span class="text-[10px] whitespace-nowrap">{{ pm.name }}</span>
                        </button>
                    </div>
                </div>

                <textarea v-model="form.note" placeholder="備註..." class="w-full text-sm p-4 bg-gray-50 rounded-2xl outline-none h-20 resize-none"></textarea>

                <!-- 6. 分帳功能 (支出) -->
                <div v-if="form.type === '支出'" class="pt-4 border-t border-gray-50 space-y-4">
                    <div class="flex items-center justify-between" @click.stop="form.isSplit = !form.isSplit">
                        <span class="text-xs text-gray-400 font-light">幫朋友代墊 / 需分帳</span>
                        <div class="w-10 h-5 rounded-full relative transition-colors" :class="form.isSplit ? 'bg-gray-400' : 'bg-gray-200'">
                            <div class="absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform" :class="{'translate-x-5': form.isSplit}"></div>
                        </div>
                    </div>

                    <div v-if="form.isSplit" class="bg-gray-50 p-6 rounded-3xl space-y-6">
                        <div class="flex flex-wrap gap-2">
                            <button v-for="f in friends" :key="'s-'+f" @click="toggleFriendInSplit(f)" :class="selectedFriends.includes(f) ? 'bg-[#4A4A4A] text-white' : 'bg-white text-gray-400 border border-gray-100'" class="px-4 py-1.5 rounded-full text-[10px]">{{ f }}</button>
                            <button @click="triggerAddFriend('split')" class="px-3 py-1.5 rounded-full bg-gray-200 text-gray-400 text-[10px]">+</button>
                        </div>
                        
                        <!-- 本區塊新增輸入框 -->
                        <div v-if="isAddingFriend && addFriendTarget === 'split'" class="mx-2 bg-white p-3 rounded-2xl flex items-center space-x-2 shadow-sm animate-in slide-in-from-top-1">
                            <input type="text" v-model="newFriendName" placeholder="新分帳人名字" class="flex-grow bg-gray-50 p-2 rounded-xl text-xs outline-none">
                            <button @click="confirmAddFriend" class="bg-[#4A4A4A] text-white px-4 py-2 rounded-xl text-[10px]">OK</button>
                        </div>

                        <div class="flex bg-white rounded-lg p-1 text-[9px] uppercase tracking-widest">
                            <button @click="splitMode = 'auto'" :class="splitMode === 'auto' ? 'bg-gray-100 text-gray-800' : 'text-gray-300'" class="flex-1 py-1 rounded">自動平分</button>
                            <button @click="splitMode = 'manual'" :class="splitMode === 'manual' ? 'bg-gray-100 text-gray-800' : 'text-gray-300'" class="flex-1 py-1 rounded">手動份額</button>
                        </div>
                        <div class="flex justify-between items-center pt-3 border-t border-gray-100">
                            <span class="text-[10px] text-gray-500 uppercase">My Share</span>
                            <input v-if="splitMode === 'manual'" type="number" v-model="form.personalShare" class="text-right bg-white border border-gray-100 rounded-lg px-2 text-sm w-24">
                            <span v-else class="text-sm font-medium">¥ {{ formatNumber(autoShareValue) }}</span>
                        </div>
                        <div class="flex items-center justify-between border-t border-gray-100 pt-3">
                            <span class="text-[10px] text-gray-400">對方已當場付清 (不計入欠款)</span>
                            <input type="checkbox" v-model="form.isAlreadyPaid" class="accent-gray-600">
                        </div>
                    </div>
                </div>
            </div>

            <!-- 7. 旅行計畫模式 (取代原本的進階選項) -->
            <div class="pt-4 border-t border-gray-50 space-y-4">
                <div class="flex items-center justify-between">
                    <span class="text-xs text-gray-400 font-light">旅行計畫模式</span>
                    <!-- Toggle Switch -->
                    <div class="w-10 h-5 rounded-full relative transition-colors cursor-pointer" 
                         :class="form.projectId ? 'bg-[#4A4A4A]' : 'bg-gray-200'"
                         @click="toggleProjectMode">
                        <div class="absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform" 
                             :class="{'translate-x-5': form.projectId}"></div>
                    </div>
                </div>

                <div v-if="form.projectId || isProjectModeOpen" class="bg-gray-50 p-6 rounded-3xl space-y-4 animate-in slide-in-from-top-2">
                     <div class="flex flex-wrap gap-2">
                        <button v-for="p in activeProjects" :key="p.id" 
                                @click="form.projectId = p.id"
                                :class="form.projectId === p.id ? 'bg-[#4A4A4A] text-white' : 'bg-white text-gray-400 border border-gray-100'" 
                                class="px-4 py-1.5 rounded-full text-[10px]">{{ p.name }}</button>
                        <!-- Add Project Button -->
                        <button @click="isAddingNewProject = !isAddingNewProject" class="px-3 py-1.5 rounded-full bg-gray-200 text-gray-400 text-[10px]">+</button>
                     </div>

                     <!-- Quick Add Project Input -->
                     <div v-if="isAddingNewProject" class="mx-2 bg-white p-3 rounded-2xl flex items-center space-x-2 mt-2 shadow-sm">
                        <input type="text" v-model="newProjectName" placeholder="新旅行計畫" class="flex-grow bg-gray-50 p-2 rounded-xl text-xs outline-none">
                        <button @click="quickCreateProject" class="bg-[#4A4A4A] text-white px-4 py-2 rounded-xl text-[10px]">OK</button>
                     </div>
                </div>
            </div>

            <button @click.stop="prepareAndSubmit" :disabled="loading" class="w-full bg-[#4A4A4A] text-white py-5 rounded-2xl text-[10px] font-medium tracking-[0.4em] uppercase shadow-lg disabled:bg-gray-200">
                Confirm & Save
            </button>
        </div>
    </section>
    `,
    props: ['form', 'categories', 'friends', 'loading', 'paymentMethods', 'projects'],
    inject: ['dialog'],
    data() {
        return {
            isAddingFriend: false, addFriendTarget: '', newFriendName: '', selectedFriends: [], splitMode: 'auto',
            isProjectModeOpen: false, isAddingNewProject: false, newProjectName: ''
        };
    },
    computed: {
        filteredCategories() { return this.categories.filter(c => c.type === (this.form.type === '收款' ? '支出' : this.form.type)); },
        autoShareValue() {
            if (!this.form.amount) return 0;
            const totalPeople = (this.form.isSplit ? this.selectedFriends.length : 0) + 1;
            return Math.round(this.form.amount / totalPeople);
        },
        activeProjects() {
            // 只顯示 Active 的專案
            return (this.projects || []).filter(p => p.status !== 'Archived' && p.status !== 'archived');
        }
    },
    watch: {
        'form.spendDate': {
            handler(newVal) {
                if (!newVal) return;
                this.autoSelectProject(newVal);
            },
            immediate: true
        },
        'projects': {
            handler() {
                if (this.form.spendDate) this.autoSelectProject(this.form.spendDate);
            },
            deep: true
        }
    },
    methods: {
        toggleProjectMode() {
            if (this.form.projectId) {
                // Currently ON, turn OFF
                this.form.projectId = '';
                this.isProjectModeOpen = false;
            } else {
                // Currently OFF, turn ON
                this.isProjectModeOpen = true;
                // Auto-select the first active project if available, or just open the UI
                if (this.activeProjects.length > 0) {
                    this.form.projectId = this.activeProjects[0].id;
                }
            }
        },
        async quickCreateProject() {
            if (!this.newProjectName) return;
            // Emit a custom event or call API directly. 
            // Since we need to refresh the projects list, best to emit 'create-project' to parent or use API here.
            // Using API here to match logic in SettingsPage, but ideally should be emitted.
            // Let's emit to keep it clean, but since we are in AddPage, we might need to handle it in app.js.
            // Actually, let's just use API here for simplicity as requested by "Atomic Changes".
            // However, we need to update the `projects` prop.
            // For now, let's just alert user they need to refresh, or improved: emit 'refresh-data'


            // Let's stick to emitting an event to handle the API call in parent (App.js) which already has API access.
            this.$emit('create-project', this.newProjectName);
            this.newProjectName = '';
            this.isAddingNewProject = false;
        },

        autoSelectProject(dateStr) {
            // dateStr format: YYYY-MM-DDTHH:mm
            if (!dateStr || !this.projects) return;
            const date = dateStr.split('T')[0]; // Get YYYY-MM-DD

            // 尋找符合日期的專案
            const match = this.activeProjects.find(p => {
                if (!p.startDate || !p.endDate) return false;
                return date >= p.startDate && date <= p.endDate;
            });

            // 若找到且目前沒選 (或是自動模式)，則選取
            // 這裡採取稍微積極的策略：只要日期變動且符合專案，就切過去 (使用者隨時可切回無)
            if (match) {
                if (this.form.projectId !== match.id) {
                    this.form.projectId = match.id;
                    this.isProjectModeOpen = true; // Auto-open the UI
                }
            }
        },
        formatNumber(num) { return new Intl.NumberFormat().format(num); },

        triggerAddFriend(target) {
            // 如果點擊的是同一個 target，則切換開關；否則切換到新 target 並開啟
            if (this.addFriendTarget === target) {
                this.isAddingFriend = !this.isAddingFriend;
            } else {
                this.addFriendTarget = target;
                this.isAddingFriend = true;
            }
        },
        confirmAddFriend() {
            if (this.newFriendName) {
                this.$emit('add-friend-to-list', this.newFriendName);
                if (this.addFriendTarget === 'payer') this.form.payer = this.newFriendName;
                else if (this.addFriendTarget === 'friendName') this.form.friendName = this.newFriendName;
                else if (this.addFriendTarget === 'split') {
                    if (!this.selectedFriends.includes(this.newFriendName)) {
                        this.selectedFriends.push(this.newFriendName);
                    }
                }
                this.newFriendName = ''; this.isAddingFriend = false;
            }
        },
        toggleFriendInSplit(name) {
            const idx = this.selectedFriends.indexOf(name);
            if (idx > -1) this.selectedFriends.splice(idx, 1);
            else this.selectedFriends.push(name);
        },
        prepareAndSubmit() {
            // [新增] 資料檢查邏輯
            if (!this.form.amount || this.form.amount <= 0) { this.dialog.alert('請輸入有效的金額'); return; }
            if (!this.form.name) { this.dialog.alert('請輸入項目名稱'); return; }
            if (!this.form.paymentMethod) { this.dialog.alert('請選擇支付方式'); return; }
            if (this.form.type !== '收款' && !this.form.categoryId) { this.dialog.alert('請選擇分類'); return; }
            if (this.form.isSplit && this.selectedFriends.length === 0) { this.dialog.alert('已開啟分帳模式，請至少選擇一位朋友'); return; }

            const share = this.splitMode === 'auto' ? this.autoShareValue : this.form.personalShare;
            let debt = 0;
            if (this.form.type === '支出') {
                if (!this.form.isAlreadyPaid) {
                    debt = (this.form.payer === '我') ? (this.form.amount - share) : -share;
                }
                this.form.friendName = this.selectedFriends.join(', ');
            } else if (this.form.type === '收款') {
                debt = -this.form.amount;
                this.form.personalShare = 0;
            } else {
                debt = 0;
                this.form.personalShare = this.form.amount;
            }
            this.form.personalShare = (this.form.type === '支出') ? share : this.form.personalShare;
            this.form.debtAmount = debt;
            this.$emit('submit');
        }
    }
};
