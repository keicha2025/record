import { AppSelect } from '../components/app-select.js';

export const EditSharedLinksPage = {
    components: {
        'app-select': AppSelect
    },
    template: `
    <section class="space-y-4 py-4 animate-in fade-in pb-24">
        <!-- Main Form Card with Integrated Header -->
        <div class="bg-white p-6 rounded-[2rem] muji-shadow border border-gray-50 space-y-6">
            
            <!-- Integrated Header -->
            <div class="flex items-center justify-between pb-2 border-b border-gray-50">
                <h2 class="text-sm font-medium text-gray-700">{{ isNew ? '新增分享連結' : '編輯分享連結' }}</h2>
                <button @click="$emit('back')" class="text-xs text-gray-400 font-medium tracking-widest hover:text-gray-600 transition-colors">
                    取消
                </button>
            </div>
            
            <!-- 1. 分享名稱 -->
            <div class="space-y-2">
                <label class="text-[10px] text-gray-400 uppercase tracking-widest px-1">分享名稱</label>
                <input type="text" v-model="form.name" placeholder="例如：Jing 的記帳本" 
                       class="w-full bg-gray-50 px-4 py-3 rounded-xl text-sm text-gray-700 outline-none placeholder-gray-300 focus:bg-white focus:ring-2 focus:ring-gray-100 transition-all">
                <p class="text-[9px] text-gray-300 px-1">此名稱將顯示於閱覽模式的標題，取代預設的使用者名稱。</p>
            </div>

            <!-- 2. 分享範圍 (Scope) -->
            <div class="space-y-2">
                <label class="text-[10px] text-gray-400 uppercase tracking-widest px-1">分享範圍</label>
                <app-select v-model="form.scope" :options="scopeOptions" placeholder="請選擇分享範圍"></app-select>
            </div>

            <!-- Scope Details -->
            <div v-if="form.scope === 'range'" class="space-y-2 animate-in fade-in">
                <label class="text-[10px] text-gray-400 uppercase tracking-widest px-1">日期區間</label>
                <div class="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                    <input type="date" v-model="form.scopeValue.start" class="bg-gray-50 px-3 py-2 rounded-xl text-xs outline-none text-gray-600 w-full focus:bg-white focus:ring-2 focus:ring-gray-100 transition-all">
                    <span class="text-gray-300">~</span>
                    <input type="date" v-model="form.scopeValue.end" class="bg-gray-50 px-3 py-2 rounded-xl text-xs outline-none text-gray-600 w-full focus:bg-white focus:ring-2 focus:ring-gray-100 transition-all">
                </div>
            </div>

            <div v-if="form.scope === 'project'" class="space-y-2 animate-in fade-in">
                <label class="text-[10px] text-gray-400 uppercase tracking-widest px-1">選擇專案</label>
                <app-select v-model="form.scopeValue" :options="projectOptions" placeholder="請選擇專案"></app-select>
            </div>

            <!-- 3. 第二層篩選 (Filter) -->
            <div v-if="form.scope !== 'project'" class="space-y-2 pt-2 border-t border-gray-50 animate-in fade-in">
                <div class="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer" @click="form.excludeProjectExpenses = !form.excludeProjectExpenses">
                    <span class="text-xs text-gray-600">排除所有專案花費</span>
                    <!-- Custom Checkbox (Stats Page Style) -->
                    <div class="w-4 h-4 rounded border flex items-center justify-center transition-colors shadow-sm"
                         :class="form.excludeProjectExpenses ? 'bg-gray-700 border-gray-700' : 'bg-white border-gray-300'">
                        <span v-if="form.excludeProjectExpenses" class="material-symbols-rounded text-white text-[10px]">check</span>
                    </div>
                </div>
                <p class="text-[9px] text-gray-300 px-2">勾選後，任何已關聯專案的交易將不會顯示。</p>
            </div>

            <!-- 4. 隱私設定 (Privacy) -->
            <div class="space-y-2 pt-2 border-t border-gray-50">
                 <label class="text-[10px] text-gray-400 uppercase tracking-widest px-1">隱私保護</label>
                 
                 <div class="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer" @click="form.hideFriendNames = !form.hideFriendNames">
                    <span class="text-xs text-gray-600">隱藏朋友名稱 (顯示為 "友")</span>
                    <div class="w-4 h-4 rounded border flex items-center justify-center transition-colors shadow-sm"
                         :class="form.hideFriendNames ? 'bg-gray-700 border-gray-700' : 'bg-white border-gray-300'">
                        <span v-if="form.hideFriendNames" class="material-symbols-rounded text-white text-[10px]">check</span>
                    </div>
                </div>
                
                <div v-if="(form.scope === 'all' || form.scope === 'range' || (form.scope === 'project' && form.hideProjectNames !== undefined)) && !form.excludeProjectExpenses" 
                     class="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer" 
                     @click="form.hideProjectNames = !form.hideProjectNames">
                    <span class="text-xs text-gray-600">隱藏專案名稱 (顯示為 "專案 代號")</span>
                    <div class="w-4 h-4 rounded border flex items-center justify-center transition-colors shadow-sm"
                         :class="form.hideProjectNames ? 'bg-gray-700 border-gray-700' : 'bg-white border-gray-300'">
                        <span v-if="form.hideProjectNames" class="material-symbols-rounded text-white text-[10px]">check</span>
                    </div>
                </div>
            </div>

            <!-- Existing Link Info -->
            <div v-if="!isNew && linkId" class="pt-4 border-t border-gray-50 space-y-3">
                 <p class="text-[10px] text-gray-400 uppercase tracking-widest px-1">連結網址</p>
                 <div class="flex items-center space-x-2 bg-gray-50 px-3 py-3 rounded-xl border border-gray-100">
                     <input type="text" readonly :value="fullLink" class="w-full text-[10px] text-gray-500 outline-none bg-transparent">
                     <button @click="copyLink" class="text-gray-400 hover:text-gray-600">
                         <span class="material-symbols-rounded text-sm">{{ copied ? 'check' : 'content_copy' }}</span>
                     </button>
                </div>
            </div>

            <!-- Actions -->
            <div class="pt-4 space-y-3">
                <button @click="save" :disabled="saving" class="w-full bg-[#4A4A4A] text-white py-4 rounded-2xl text-[10px] font-medium tracking-[0.3em] uppercase active:scale-95 transition-all shadow-md hover:shadow-lg disabled:opacity-50">
                    {{ saving ? '儲存中...' : '儲存設定' }}
                </button>
                
                <button v-if="!isNew" @click="closeLink" class="w-full py-2 text-[10px] text-gray-300 tracking-widest uppercase hover:text-gray-500 transition-colors">
                    關閉此連結
                </button>
            </div>
        </div>
    </section>
    `,
    props: ['linkData', 'projects', 'defaultUserName', 'currentUser'],
    emits: ['back', 'saved', 'deleted'],
    inject: ['dialog'],
    data() {
        return {
            isNew: true,
            linkId: null,
            form: {
                name: '',
                scope: 'all',
                scopeValue: null,
                excludeProjectExpenses: false,
                hideFriendNames: false,
                hideProjectNames: false
            },
            saving: false,
            copied: false
        };
    },
    computed: {
        fullLink() {
            if (!this.linkId) return '';
            const uidParam = this.currentUser ? `&uid=${this.currentUser.uid}` : '';
            return window.location.origin + window.location.pathname + '?mode=view' + uidParam + '&id=' + this.linkId;
        },
        scopeOptions() {
            return [
                { label: '所有紀錄', value: 'all' },
                { label: '指定日期區間', value: 'range' },
                { label: '指定專案', value: 'project' }
            ];
        },
        projectOptions() {
            if (!this.projects) return [];
            return this.projects.map(p => ({
                label: typeof p.name === 'object' ? p.name.name : p.name,
                value: p.id
            }));
        }
    },
    watch: {
        'form.scope'(val) {
            if (val === 'range') {
                if (!this.form.scopeValue || this.form.scopeValue.start === undefined) {
                    this.form.scopeValue = { start: '', end: '' };
                }
            } else if (val === 'project') {
                if (typeof this.form.scopeValue !== 'string') {
                    this.form.scopeValue = (this.projects && this.projects.length > 0) ? this.projects[0].id : '';
                }
            } else {
                this.form.scopeValue = null;
            }
        }
    },
    async mounted() {
        if (this.linkData) {
            this.isNew = false;
            this.linkId = this.linkData.id;
            this.form = JSON.parse(JSON.stringify(this.linkData));
            if (this.form.scope === 'range' && !this.form.scopeValue) this.form.scopeValue = { start: '', end: '' };
        } else {
            this.isNew = true;
            this.form.name = (this.defaultUserName || '使用者') + ' 的生活筆記';
        }
    },
    methods: {
        async save() {
            if (this.form.scope === 'project' && !this.form.scopeValue) {
                this.dialog.alert("請選擇一個專案");
                return;
            }
            if (this.form.scope === 'range' && (!this.form.scopeValue.start || !this.form.scopeValue.end)) {
                this.dialog.alert("請設定完整的日期區間");
                return;
            }

            this.saving = true;
            try {
                const { API } = await import('../api.js');
                if (this.isNew) {
                    await API.createSharedLink(this.form);
                } else {
                    await API.updateSharedLink(this.linkId, this.form);
                }
                this.$emit('saved');
            } catch (e) {
                console.error(e);
                this.dialog.alert("儲存失敗: " + e.message);
            } finally {
                this.saving = false;
            }
        },
        async closeLink() {
            if (!await this.dialog.confirm("確定要關閉此連結嗎？\n此連結將立即失效，無法復原。", { confirmText: '確定關閉' })) return;
            try {
                const { API } = await import('../api.js');
                await API.deleteSharedLink(this.linkId);
                this.$emit('deleted');
            } catch (e) {
                console.error(e);
                this.dialog.alert("刪除失敗");
            }
        },
        copyLink() {
            navigator.clipboard.writeText(this.fullLink);
            this.copied = true;
            setTimeout(() => this.copied = false, 2000);
        }
    }
};
