import { CONFIG } from '../config.js';

export const EditPage = {
    template: `
    <section class="space-y-6 py-4 animate-in fade-in pb-24">
        <div class="bg-white p-6 rounded-[2.5rem] muji-shadow border border-gray-50 space-y-6">
            <!-- Header Controls Integrated in Card -->
            <div class="flex justify-between items-center px-1 border-b border-gray-50 pb-4">
                <span class="text-[10px] text-gray-400 uppercase tracking-[0.3em] font-medium">
                    {{ isReadOnly ? '查看紀錄' : '編輯' + form.type }}
                </span>
                <button @click="$emit('cancel')" class="text-[10px] text-gray-300 uppercase tracking-widest hover:text-gray-500 transition-colors">
                    {{ isReadOnly ? '關閉' : '取消' }}
                </button>
            </div>

            <!-- 1. 金額 -->
            <div class="text-center py-2">
                <p class="text-[10px] text-gray-300 mb-2">{{ form.type }}金額</p>
                <div v-if="isReadOnly" class="text-5xl font-light text-gray-700">
                    <span class="text-xl mr-1">{{ form.currency === 'TWD' ? '$' : '¥' }}</span>{{ formatNumber(form.amount) }}
                </div>
                <div v-else class="flex items-center justify-center space-x-3">
                    <span class="text-xs font-medium text-gray-300">{{ form.currency }}</span>
                    <input type="number" v-model="form.amount" class="text-5xl font-light w-48 text-center bg-transparent outline-none">
                </div>
            </div>

            <div class="space-y-5">
                <!-- 2. 付款/收款對象 -->
                <div class="space-y-2 px-2">
                    <label class="text-[10px] text-gray-400 uppercase tracking-widest font-medium">
                        {{ form.type === '收款' ? '收款對象' : '付款人' }}
                    </label>
                    <div v-if="isReadOnly" class="text-sm text-gray-600">
                        {{ form.type === '收款' ? form.friendName : form.payer }}
                    </div>
                    <!-- 編輯模式：同步新增頁面的加好友功能 -->
                    <div v-else>
                         <div class="flex flex-wrap gap-2">
                            <template v-if="form.type === '收款'">
                                <button v-for="f in friends" :key="'e-r-'+f" @click="form.friendName = f" :class="form.friendName === f ? 'bg-[#4A4A4A] text-white' : 'bg-gray-50 text-gray-400'" class="px-4 py-1.5 rounded-full text-[10px] transition-all">{{ f }}</button>
                                <button @click="triggerAddFriend('friendName')" class="px-3 py-1.5 rounded-full bg-gray-100 text-gray-400 text-[10px]">+</button>
                            </template>
                            <template v-else>
                                <button @click="form.payer = '我'" :class="form.payer === '我' ? 'bg-[#4A4A4A] text-white' : 'bg-gray-50 text-gray-400'" class="px-4 py-1.5 rounded-full text-[10px]">我</button>
                                <button v-for="f in friends" :key="'e-p-'+f" @click="form.payer = f" :class="form.payer === f ? 'bg-[#4A4A4A] text-white' : 'bg-gray-50 text-gray-400'" class="px-4 py-1.5 rounded-full text-[10px]">{{ f }}</button>
                                <button @click="triggerAddFriend('payer')" class="px-3 py-1.5 rounded-full bg-gray-100 text-gray-400 text-[10px]">+</button>
                            </template>
                        </div>
                        <!-- 新增好友輸入框 -->
                        <div v-if="isAddingFriend && (addFriendTarget === 'payer' || addFriendTarget === 'friendName')" class="mt-2 bg-gray-50 p-3 rounded-2xl flex items-center space-x-2">
                            <input type="text" v-model="newFriendName" :placeholder="addFriendTarget==='payer'?'新付款人':'新收款人'" class="flex-grow bg-white p-2 rounded-xl text-xs outline-none">
                            <button @click="confirmAddFriend" class="bg-[#4A4A4A] text-white px-4 py-2 rounded-xl text-[10px]">OK</button>
                        </div>
                    </div>
                </div>

                <!-- 3. 日期 -->
                <div class="flex items-center justify-between px-2 py-2 border-b border-gray-50">
                    <span class="text-[10px] text-gray-400 uppercase tracking-widest">消費日期</span>
                    <div v-if="isReadOnly" class="text-sm text-gray-600">{{ formatDateWithTimezone(form.spendDate, form.utc) }}</div>
                    <input v-else type="datetime-local" v-model="form.spendDate" class="text-sm bg-transparent outline-none text-right cursor-pointer">
                </div>

                <!-- 4. [補回] 分類 -->
                <div v-if="form.type !== '收款'" class="space-y-2 px-2">
                    <label class="text-[10px] text-gray-400 uppercase tracking-widest font-medium">分類</label>
                    <div v-if="isReadOnly" class="flex items-center space-x-2 text-sm text-gray-600">
                        <span class="material-symbols-rounded text-base text-gray-400">{{ getCategoryIcon(form.categoryId) }}</span>
                        <span>{{ getCategoryName(form.categoryId) }}</span>
                    </div>
                    <div v-else class="grid grid-cols-4 gap-4 py-2">
                        <div v-for="cat in filteredCategories" :key="cat.id" @click.stop="form.categoryId = cat.id" :class="form.categoryId === cat.id ? 'bg-[#4A4A4A] text-white shadow-lg' : 'bg-gray-50 text-gray-300'" class="flex flex-col items-center p-3 rounded-2xl transition-all">
                            <span class="material-symbols-rounded text-xl">{{ cat.icon }}</span>
                            <span class="text-[9px] mt-1">{{ cat.name }}</span>
                        </div>
                    </div>
                </div>

                <div class="px-2 space-y-4">
                    <div class="space-y-1">
                        <label class="text-[10px] text-gray-400 uppercase font-medium">項目名稱</label>
                        <div v-if="isReadOnly" class="text-sm text-gray-600">{{ form.name }}</div>
                        <input v-else type="text" v-model="form.name" class="w-full text-sm py-2 border-b border-gray-50 outline-none">
                    </div>
                    
                    <!-- 5. [補回] 支付方式 -->
                    <div class="space-y-1">
                        <label class="text-[10px] text-gray-400 uppercase font-medium">支付方式</label>
                        <div v-if="isReadOnly" class="text-sm text-gray-600">{{ getPaymentName(form.paymentMethod) }}</div>
                        <div v-else class="flex space-x-2 overflow-x-auto no-scrollbar py-2">
                            <button v-for="pm in paymentMethods" :key="pm.id" @click.stop="form.paymentMethod = pm.id"
                                    :class="pm.id === form.paymentMethod ? 'bg-[#4A4A4A] text-white shadow-md' : 'bg-gray-50 text-gray-400'"
                                    class="whitespace-nowrap px-4 py-2 rounded-2xl flex items-center space-x-2 transition-all border border-transparent">
                                 <span class="material-symbols-rounded text-base">{{ pm.icon || 'payments' }}</span>
                                 <span class="text-[10px] whitespace-nowrap">{{ pm.name }}</span>
                            </button>
                        </div>
                    </div>

                    <div class="space-y-1">
                        <label class="text-[10px] text-gray-400 uppercase font-medium">備註</label>
                        <div v-if="isReadOnly" class="text-xs text-gray-400 whitespace-pre-wrap">{{ form.note || '無備註' }}</div>
                        <textarea v-else v-model="form.note" class="w-full text-sm p-4 bg-gray-50 rounded-2xl outline-none h-20 resize-none"></textarea>
                    </div>
                </div>

                <!-- 6. 分帳 (同步新增頁面進階功能) -->
                <div v-if="form.type === '支出'" class="pt-4 border-t border-gray-50 space-y-4">
                    <div class="flex items-center justify-between px-2">
                        <span class="text-xs text-gray-400">幫朋友代墊 / 需分帳</span>
                        <div v-if="!isReadOnly" class="w-10 h-5 rounded-full relative transition-colors" :class="form.isSplit ? 'bg-gray-400' : 'bg-gray-200'" @click="form.isSplit = !form.isSplit">
                            <div class="absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform" :class="{'translate-x-5': form.isSplit}"></div>
                        </div>
                        <div v-else class="text-xs text-gray-500">{{ form.isSplit ? '有' : '無' }}</div>
                    </div>
                    <div v-if="form.isSplit" class="bg-gray-50 p-6 rounded-3xl space-y-6 mx-2">
                        <div v-if="!isReadOnly">
                             <div class="flex flex-wrap gap-2">
                                <button v-for="f in friends" :key="'e-s-'+f" @click="toggleFriendInSplit(f)" :class="selectedFriends.includes(f) ? 'bg-[#4A4A4A] text-white' : 'bg-white text-gray-400'" class="px-4 py-1.5 rounded-full text-[10px]">{{ f }}</button>
                                <button @click="triggerAddFriend('split')" class="px-3 py-1.5 rounded-full bg-gray-200 text-gray-400 text-[10px]">+</button>
                             </div>
                             <!-- 新增好友輸入框 -->
                             <div v-if="isAddingFriend && addFriendTarget === 'split'" class="mt-2 bg-white p-3 rounded-2xl flex items-center space-x-2 shadow-sm">
                                <input type="text" v-model="newFriendName" placeholder="新分帳人" class="flex-grow bg-gray-50 p-2 rounded-xl text-xs outline-none">
                                <button @click="confirmAddFriend" class="bg-[#4A4A4A] text-white px-4 py-2 rounded-xl text-[10px]">OK</button>
                             </div>

                             <div class="flex bg-white rounded-lg p-1 text-[9px] uppercase tracking-widest mt-4">
                                <button @click="splitMode = 'auto'" :class="splitMode === 'auto' ? 'bg-gray-100 text-gray-800' : 'text-gray-300'" class="flex-1 py-1 rounded">自動平分</button>
                                <button @click="splitMode = 'manual'" :class="splitMode === 'manual' ? 'bg-gray-100 text-gray-800' : 'text-gray-300'" class="flex-1 py-1 rounded">手動份額</button>
                            </div>
                        </div>
                        <div v-else class="text-xs text-gray-600">{{ form.friendName }}</div>
                        
                        <div class="flex justify-between items-center pt-2 border-t border-gray-100">
                            <span class="text-[10px] text-gray-400">我的份額</span>
                            <div v-if="!isReadOnly && splitMode === 'manual'">
                                <input type="number" v-model="form.personalShare" class="text-right bg-white border border-gray-100 rounded-lg px-2 text-sm w-24">
                            </div>
                            <span v-else class="text-sm font-medium">¥ {{ formatNumber(splitMode === 'auto' ? autoShareValue : form.personalShare) }}</span>
                        </div>
                        <div class="flex items-center justify-between border-t border-gray-100 pt-3">
                            <span class="text-[10px] text-gray-400">對方已當場付清</span>
                            <input v-if="!isReadOnly" type="checkbox" v-model="form.isAlreadyPaid" class="accent-gray-600">
                            <div v-else class="text-[10px] text-gray-500">{{ form.isAlreadyPaid ? '是' : '否' }}</div>
                        </div>
                    </div>
                </div>

                <!-- 7. 旅行計畫模式 -->
                <div v-if="!isReadOnly" class="pt-4 border-t border-gray-50 space-y-4 px-2">
                    <div class="flex items-center justify-between">
                        <span class="text-xs text-gray-400 font-light">旅行計畫模式</span>
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
                            <button @click="isAddingNewProject = !isAddingNewProject" class="px-3 py-1.5 rounded-full bg-gray-200 text-gray-400 text-[10px]">+</button>
                         </div>
                         <div v-if="isAddingNewProject" class="mx-2 bg-white p-3 rounded-2xl flex items-center space-x-2 mt-2 shadow-sm">
                            <input type="text" v-model="newProjectName" placeholder="新旅行計畫" class="flex-grow bg-gray-50 p-2 rounded-xl text-xs outline-none">
                            <button @click="quickCreateProject" class="bg-[#4A4A4A] text-white px-4 py-2 rounded-xl text-[10px]">OK</button>
                         </div>
                    </div>
                </div>
                <div v-else-if="currentProjectName" class="px-2 pt-2 border-t border-gray-50">
                    <span class="text-[10px] text-gray-400 uppercase tracking-widest block mb-1">旅行計畫</span>
                    <span class="bg-[#4A4A4A] text-white px-4 py-1.5 rounded-full text-[10px] inline-block">{{ currentProjectName }}</span>
                </div>
            </div>

            <!-- 7. 按鈕 -->
            <div class="space-y-4 pt-6">
                <button v-if="isReadOnly" @click="isReadOnly = false" class="w-full bg-[#4A4A4A] text-white py-5 rounded-2xl text-[10px] font-medium tracking-[0.4em] uppercase shadow-lg">開始編輯</button>
                <template v-else>
                    <button @click="prepareAndSubmit" :disabled="loading" class="w-full bg-[#4A4A4A] text-white py-5 rounded-2xl text-[10px] font-medium tracking-[0.4em] uppercase shadow-lg active:scale-95 transition-all">更新紀錄</button>
                    <button @click="$emit('delete-item', form.row)" :disabled="loading" class="w-full text-red-300 py-2 text-[10px] font-medium tracking-[0.4em] uppercase">刪除此筆資料</button>
                </template>
            </div>
        </div>
    </section>
    `,
    props: ['form', 'categories', 'friends', 'loading', 'paymentMethods', 'projects'],
    data() {
        return {
            selectedFriends: [],
            isReadOnly: true,
            isProjectModeOpen: false,
            isAddingNewProject: false,
            newProjectName: '',
            // New Sync Data
            isAddingFriend: false,
            addFriendTarget: '',
            newFriendName: '',
            splitMode: 'auto'
        };
    },
    computed: {
        filteredCategories() { return this.categories.filter(c => c.type === (this.form.type === '收款' ? '支出' : this.form.type)); },
        autoShareValue() {
            const totalPeople = (this.selectedFriends ? this.selectedFriends.length : 0) + 1;
            return Math.round(this.form.amount / totalPeople);
        },
        activeProjects() {
            const currentId = this.form.projectId;
            return (this.projects || []).filter(p =>
                (p.status !== 'Archived' && p.status !== 'archived') || p.id === currentId
            );
        },
        currentProjectName() {
            if (!this.form.projectId) return null;
            const p = (this.projects || []).find(pr => pr.id === this.form.projectId);
            return p ? p.name : this.form.projectId;
        }
    },
    methods: {
        toggleProjectMode() {
            if (this.form.projectId) {
                this.form.projectId = '';
                this.isProjectModeOpen = false;
            } else {
                this.isProjectModeOpen = true;
                if (this.activeProjects.length > 0 && !this.form.projectId) {
                    this.form.projectId = this.activeProjects[0].id;
                }
            }
        },
        async quickCreateProject() {
            if (!this.newProjectName) return;
            this.$emit('create-project', this.newProjectName);
            this.newProjectName = '';
            this.isAddingNewProject = false;
        },
        formatNumber(num) { return new Intl.NumberFormat().format(Math.round(num || 0)); },
        getCategoryName(id) { return this.categories.find(c => c.id === id)?.name || '未分類'; },
        getCategoryIcon(id) { return this.categories.find(c => c.id === id)?.icon || 'sell'; },
        getPaymentName(id) { const pm = this.paymentMethods.find(p => p.id === id); return pm ? pm.name : id; },

        toggleFriendInSplit(name) {
            const idx = this.selectedFriends.indexOf(name);
            if (idx > -1) this.selectedFriends.splice(idx, 1);
            else this.selectedFriends.push(name);
        },

        // Sync Methods from Add Page
        triggerAddFriend(target) {
            if (this.addFriendTarget === target) {
                this.isAddingFriend = !this.isAddingFriend;
            } else {
                this.addFriendTarget = target;
                this.isAddingFriend = true;
            }
        },
        confirmAddFriend() {
            // Note: In EditPage, we might not have direct access to emit 'add-friend-to-list' payload format exactly like AddPage unless handled by parent
            // But 'friends' prop is reactive. The AddPage emits 'add-friend-to-list' (name).
            // We should do the same.
            if (this.newFriendName) {
                // Since this component might not have the listener wired up in Index.html for 'add-friend-to-list' (Wait, let's check index.html)
                // Index.html: <edit-page ... @create-project>... NO @add-friend-to-list!
                // We need to fix Index.html too if we strictly want this to work.
                // But for now, let's emit it and assume I will fix index.html in next step.
                this.$emit('add-friend-to-list', this.newFriendName); // Need to wire this in index.html!

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

        prepareAndSubmit() {
            // Use manual share if mode is manual, otherwise auto
            const share = this.splitMode === 'auto' ? this.autoShareValue : this.form.personalShare;
            let debt = 0;
            if (this.form.type === '支出') {
                if (!this.form.isAlreadyPaid) {
                    debt = (this.form.payer === '我') ? (this.form.amount - share) : -share;
                }
                this.form.friendName = this.selectedFriends.join(', ');
            } else if (this.form.type === '收款') {
                debt = -this.form.amount;
                this.form.payer = this.form.friendName;
            } else {
                // 一般支出
                this.form.personalShare = this.form.amount;
            }

            this.form.personalShare = (this.form.type === '支出') ? share : this.form.personalShare;
            this.form.debtAmount = debt;
            this.$emit('submit');
        },
        formatDateWithTimezone(dateStr, utc) {
            if (!dateStr) return '';
            // Example: 2026-02-07T16:30 -> 2026.02.07 16:30
            const formatted = dateStr.replace('T', ' ').replace(/-/g, '.');
            // If utc exists (e.g. +08:00), append (GMT+0800)
            if (utc) {
                const zone = utc.replace(':', '');
                return `${formatted} (GMT${zone})`;
            }
            return formatted;
        }
    },
    watch: {
        'form.row': {
            handler() {
                this.isReadOnly = true;
                if (this.form.friendName) this.selectedFriends = this.form.friendName.split(', ').filter(Boolean);
                this.isProjectModeOpen = !!this.form.projectId;

                // Detection Logic for Split Mode
                if (this.form.isSplit) {
                    // Check if current personalShare ~ autoShare
                    // Allow small tolerance for rounding? AddPage uses Math.round.
                    const totalPeople = (this.selectedFriends.length) + 1;
                    const auto = Math.round(this.form.amount / totalPeople);
                    // If stored personalShare implies manual override (significantly different)
                    if (Math.abs(this.form.personalShare - auto) > 1) {
                        this.splitMode = 'manual';
                    } else {
                        this.splitMode = 'auto';
                    }
                } else {
                    this.splitMode = 'auto';
                }
            },
            immediate: true
        }
    }
};
