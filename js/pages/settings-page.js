import { CONFIG } from '../config.js';
import { API } from '../api.js';
import { GoogleSheetsService } from '../services/google-sheets-service.js';
// IconPicker removed as it's now a standalone page IconEditPage

export const SettingsPage = {
    template: `
    <section class="space-y-4 py-4 animate-in fade-in pb-24">
        <!-- 0. 基本設定卡片 -->
        <div class="bg-white p-6 rounded-[2rem] muji-shadow border border-gray-50 space-y-6">
            <h3 class="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-medium px-2">System Config</h3>
            
            <div class="space-y-4">
                <!-- 1. 使用者名稱 -->
                <div class="flex items-center justify-between px-2">
                    <span class="text-xs text-gray-500">使用者名稱</span>
                    <input type="text" v-model="localConfig.user_name" @change="debouncedUpdate" class="text-right text-xs bg-gray-50 px-3 py-2 rounded-xl outline-none w-32 placeholder-gray-300">
                </div>

                <!-- 2. 當前匯率 -->
                <div class="flex items-center justify-between px-2">
                    <span class="text-xs text-gray-500">當前匯率 (1 JPY = ? TWD)</span>
                    <input type="number" v-model="localConfig.fx_rate" step="0.001" @change="debouncedUpdate" class="text-right text-xs bg-gray-50 px-3 py-2 rounded-xl outline-none w-32">
                </div>


            </div>

            <!-- 更新按鈕 -->
            <button @click="saveSettings" :disabled="saving" class="w-full bg-[#4A4A4A] text-white py-4 rounded-2xl text-[10px] font-medium tracking-[0.3em] uppercase active:scale-95 transition-all">
                {{ saving ? 'Saving...' : '更新設定' }}
            </button>

             <!-- 清除訪客資料 -->
             <div v-if="appMode === 'GUEST'" class="pt-2 border-t border-gray-100">
                <button @click="$emit('clear-guest-data')" class="w-full text-red-400 text-[10px] tracking-widest py-2 rounded-lg transition-colors">
                    清除訪客資料
                </button>
            </div>
        </div>

        <!-- NEW: 類別管理 -->
        <!-- 支出類別管理 -->
        <div class="bg-white p-6 rounded-[2rem] muji-shadow border border-gray-50 space-y-4">
            <h3 class="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-medium px-2 flex justify-between items-center">
                <span>支出類別</span>
                <div class="flex items-center space-x-3">
                    <template v-if="isCategoryModeEdit">
                        <button @click="addCategory('支出')" class="text-gray-400 hover:text-gray-600">
                            <span class="material-symbols-rounded text-lg">add</span>
                        </button>
                        <button @click="cancelCategoryEdit" class="text-gray-300 hover:text-gray-500">
                            <span class="material-symbols-rounded text-lg">close</span>
                        </button>
                        <button @click="saveCategoryEdit" class="text-gray-300 hover:text-slate-600 transition-colors">
                            <span class="material-symbols-rounded text-lg">check_circle</span>
                        </button>
                    </template>
                    <button v-else @click="toggleCategoryEdit" class="text-gray-400 hover:text-gray-600 transition-colors">
                        <span class="material-symbols-rounded text-lg">edit</span>
                    </button>
                </div>
            </h3>
            <div class="space-y-3">
                <template v-if="isCategoryModeEdit">
                    <div v-for="(cat, idx) in expenseCategories" :key="'edit-cat-exp-'+cat.id" class="flex items-center space-x-4 bg-gray-50 p-2 rounded-xl">
                        <div class="flex flex-col space-y-0.5 px-1">
                            <button @click="moveItem('categories', cat.id, -1)" class="text-gray-300 hover:text-gray-500 text-[10px]" :disabled="idx===0">▲</button>
                            <button @click="moveItem('categories', cat.id, 1)" class="text-gray-300 hover:text-gray-500 text-[10px]" :disabled="idx===expenseCategories.length-1">▼</button>
                        </div>
                        <button @click="openIconPicker('category', cat.id)" class="w-10 h-10 aspect-square bg-white rounded-xl flex items-center justify-center text-gray-400 shadow-sm border border-gray-100 flex-shrink-0">
                             <span class="material-symbols-rounded text-xl">{{ cat.icon }}</span>
                        </button>
                        <input type="text" v-model="cat.name" class="bg-transparent text-xs font-medium text-gray-700 w-full outline-none">
                        <button @click="deleteItem('categories', cat.id)" class="text-gray-300 hover:text-slate-600 px-2 transition-colors">
                            <span class="material-symbols-rounded text-sm">remove_circle</span>
                        </button>
                    </div>
                </template>
                <template v-else>
                    <div class="grid grid-cols-5 gap-2 px-2">
                        <div v-for="cat in expenseCategories" :key="'view-cat-exp-'+cat.id" class="flex flex-col items-center p-2 rounded-xl bg-gray-50">
                             <span class="material-symbols-rounded text-lg text-gray-400 mb-1">{{ cat.icon }}</span>
                             <span class="text-[9px] text-gray-500 truncate w-full text-center">{{ cat.name }}</span>
                        </div>
                    </div>
                </template>
            </div>
        </div>

        <!-- 收入類別管理 -->
        <div class="bg-white p-6 rounded-[2rem] muji-shadow border border-gray-50 space-y-4">
            <h3 class="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-medium px-2 flex justify-between items-center">
                <span>收入類別</span>
                <div class="flex items-center space-x-3">
                    <template v-if="isCategoryModeEdit">
                        <button @click="addCategory('收入')" class="text-gray-400 hover:text-gray-600">
                            <span class="material-symbols-rounded text-lg">add</span>
                        </button>
                        <button @click="cancelCategoryEdit" class="text-gray-300 hover:text-gray-500">
                            <span class="material-symbols-rounded text-lg">close</span>
                        </button>
                        <button @click="saveCategoryEdit" class="text-gray-300 hover:text-slate-600 transition-colors">
                            <span class="material-symbols-rounded text-lg">check_circle</span>
                        </button>
                    </template>
                    <button v-else @click="toggleCategoryEdit" class="text-gray-400 hover:text-gray-600 transition-colors">
                        <span class="material-symbols-rounded text-lg">edit</span>
                    </button>
                </div>
            </h3>
            <div class="space-y-3">
                <template v-if="isCategoryModeEdit">
                    <div v-for="(cat, idx) in incomeCategories" :key="'edit-cat-inc-'+cat.id" class="flex items-center space-x-4 bg-gray-50 p-2 rounded-xl">
                        <div class="flex flex-col space-y-0.5 px-1">
                            <button @click="moveItem('categories', cat.id, -1)" class="text-gray-300 hover:text-gray-500 text-[10px]" :disabled="idx===0">▲</button>
                            <button @click="moveItem('categories', cat.id, 1)" class="text-gray-300 hover:text-gray-500 text-[10px]" :disabled="idx===incomeCategories.length-1">▼</button>
                        </div>
                        <button @click="openIconPicker('category', cat.id)" class="w-10 h-10 aspect-square bg-white rounded-xl flex items-center justify-center text-gray-400 shadow-sm border border-gray-100 flex-shrink-0">
                             <span class="material-symbols-rounded text-xl">{{ cat.icon }}</span>
                        </button>
                        <input type="text" v-model="cat.name" class="bg-transparent text-xs font-medium text-gray-700 w-full outline-none">
                        <button @click="deleteItem('categories', cat.id)" class="text-gray-300 hover:text-slate-600 px-2 transition-colors">
                            <span class="material-symbols-rounded text-sm">remove_circle</span>
                        </button>
                    </div>
                </template>
                <template v-else>
                    <div class="grid grid-cols-5 gap-2 px-2">
                        <div v-for="cat in incomeCategories" :key="'view-cat-inc-'+cat.id" class="flex flex-col items-center p-2 rounded-xl bg-gray-50">
                             <span class="material-symbols-rounded text-lg text-gray-400 mb-1">{{ cat.icon }}</span>
                             <span class="text-[9px] text-gray-500 truncate w-full text-center">{{ cat.name }}</span>
                        </div>
                    </div>
                </template>
            </div>
        </div>

        <!-- 支付方式管理 -->
        <div class="bg-white p-6 rounded-[2rem] muji-shadow border border-gray-50 space-y-4">
             <h3 class="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-medium px-2 flex justify-between items-center">
                <span>支付方式管理</span>
                <div class="flex items-center space-x-3">
                    <template v-if="isPaymentModeEdit">
                        <button @click="addPaymentMethod" class="text-gray-400 hover:text-gray-600">
                            <span class="material-symbols-rounded text-lg">add</span>
                        </button>
                        <button @click="cancelPaymentEdit" class="text-gray-300 hover:text-gray-500">
                            <span class="material-symbols-rounded text-lg">close</span>
                        </button>
                        <button @click="savePaymentEdit" class="text-gray-300 hover:text-slate-600 transition-colors">
                            <span class="material-symbols-rounded text-lg">check_circle</span>
                        </button>
                    </template>
                    <button v-else @click="togglePaymentEdit" class="text-gray-400 hover:text-gray-600 transition-colors">
                        <span class="material-symbols-rounded text-lg">edit</span>
                    </button>
                </div>
            </h3>
             <div class="space-y-3">
                <!-- 編輯模式 -->
                <template v-if="isPaymentModeEdit">
                    <div v-for="(pm, idx) in localPaymentMethods" :key="'edit-pm-'+pm.id" class="flex items-center space-x-4 bg-gray-50 p-2 rounded-xl">
                        <div class="flex flex-col space-y-0.5 px-1">
                             <button @click="moveItem('paymentMethods', pm.id, -1)" class="text-gray-300 hover:text-gray-500 text-[10px]" :disabled="idx===0">▲</button>
                             <button @click="moveItem('paymentMethods', pm.id, 1)" class="text-gray-300 hover:text-gray-500 text-[10px]" :disabled="idx===localPaymentMethods.length-1">▼</button>
                        </div>
                        <!-- Icon -->
                        <button @click="openIconPicker('payment', pm.id)" class="w-10 h-10 aspect-square bg-white rounded-xl flex items-center justify-center text-gray-400 shadow-sm border border-gray-100 flex-shrink-0">
                             <span class="material-symbols-rounded text-xl">{{ pm.icon || 'payments' }}</span>
                        </button>
                        <input type="text" v-model="pm.name" class="bg-transparent text-xs font-medium text-gray-700 w-full outline-none">
                        <button @click="deleteItem('paymentMethods', pm.id)" class="text-gray-300 hover:text-slate-600 px-2 transition-colors">
                            <span class="material-symbols-rounded text-sm">remove_circle</span>
                        </button>
                    </div>
                </template>
                <!-- 預覽模式 -->
                <template v-else>
                    <div class="grid grid-cols-2 gap-2 px-2">
                         <div v-for="pm in sortedPaymentMethods" :key="'view-pm-'+pm.id" class="flex items-center space-x-3 p-3 rounded-xl bg-gray-50">
                             <span class="material-symbols-rounded text-base text-gray-400">{{ pm.icon || 'payments' }}</span>
                             <span class="text-xs text-gray-600 font-medium">{{ pm.name }}</span>
                         </div>
                    </div>
                </template>
            </div>
        </div>


        <!-- 1. 旅行計畫 (Projects) -->
        <div class="bg-white p-6 rounded-[2rem] muji-shadow border border-gray-50 space-y-4">
            <h3 class="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-medium px-2 flex justify-between items-center">
                <span>旅行計畫</span>
                <button @click="isAddingProject = !isAddingProject" class="text-gray-400 hover:text-gray-600 transition-colors">
                    <span class="material-symbols-rounded text-lg">{{ isAddingProject ? 'remove' : 'add' }}</span>
                </button>
            </h3>
            
            <!-- 新增專案表單 -->
            <div v-if="isAddingProject" class="bg-gray-50 p-4 rounded-xl space-y-3 animate-in slide-in-from-top-2">
                <input type="text" v-model="newProject.name" placeholder="計畫名稱 (例如: 京都之旅)" class="w-full bg-white px-3 py-2 rounded-lg text-xs outline-none">
                <div class="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                    <input type="date" v-model="newProject.startDate" class="bg-white px-3 py-2 rounded-lg text-xs outline-none text-gray-500 w-full">
                    <span class="text-gray-300">~</span>
                    <input type="date" v-model="newProject.endDate" class="bg-white px-3 py-2 rounded-lg text-xs outline-none text-gray-500 w-full">
                </div>
                <button @click="createProject" :disabled="projectSaving" class="w-full bg-gray-800 text-white py-2 rounded-lg text-[10px] tracking-widest uppercase">
                    {{ projectSaving ? '新增中...' : '新增計畫' }}
                </button>
            </div>

            <div class="space-y-3">
                 <div v-if="!projects || projects.length === 0" class="text-xs text-gray-300 px-2">無專案</div>
                 <div v-for="p in projects" :key="p.id" 
                      @click="$emit('view-project', p)"
                      class="flex justify-between items-center p-3 bg-gray-50 rounded-xl active:bg-gray-100 transition-colors cursor-pointer">
                    <div class="flex flex-col">
                        <span class="text-xs font-medium text-gray-700">{{ typeof p.name === 'object' ? p.name.name : p.name }}</span>
                        <span class="text-[9px] text-gray-400">{{ p.startDate }} ~ {{ p.endDate }}</span>
                    </div>
                    <span :class="p.status === 'Active' ? 'bg-[#4A4A4A] text-white' : 'bg-gray-200 text-gray-500'" class="text-[9px] px-2 py-1 rounded-full">{{ getStatusLabel(p.status) }}</span>
                 </div>
            </div>
        </div>

        <!-- 2. 朋友名單管理 -->
        <div class="bg-white p-6 rounded-[2rem] muji-shadow border border-gray-50 space-y-4">
            <h3 class="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-medium px-2">Friends List</h3>
            <div class="grid grid-cols-1 divide-y divide-gray-50">
                <div v-for="f in friends" :key="f" @click="$emit('view-friend', f)" 
                     class="py-4 flex justify-between items-center active:bg-gray-50 transition-colors px-2 cursor-pointer">
                    <div class="flex items-center space-x-3">
                        <div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <span class="material-symbols-rounded text-gray-400 text-sm">person</span>
                        </div>
                        <span class="text-xs text-gray-600 font-medium">{{ f }}</span>
                    </div>
                    <span class="material-symbols-rounded text-gray-200 text-sm">arrow_forward_ios</span>
                </div>
            </div>
        </div>

             <!-- 4. Account & Sync -->
             <div class="bg-white p-6 rounded-[2rem] muji-shadow border border-gray-50 space-y-4">
                  <h3 class="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-medium px-2">Account</h3>
                  
                  <!-- ADMIN MODE (Logged In) -->
                  <div v-if="appMode === 'ADMIN'" class="space-y-4">
                      <div class="flex items-center space-x-3 px-2">
                          <div class="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                              <img v-if="config.photoURL" :src="config.photoURL" class="w-full h-full object-cover">
                              <span v-else class="material-symbols-rounded text-gray-400 p-2">person</span>
                          </div>
                          <div class="flex flex-col justify-center">
                              <span class="text-xs font-medium text-gray-700">{{ currentUser?.email }}</span>
                              <span class="text-[9px] text-gray-400">已登入 Google 帳號</span>
                          </div>
                      </div>
 
                      <!-- GOOGLE SERVICES (New) -->
                      <div class="bg-gray-50 p-4 rounded-xl space-y-4">
                          <div class="flex items-center space-x-2 px-1">
                             <span class="material-symbols-rounded text-base text-gray-400">cloud_sync</span>
                             <span class="text-xs text-gray-600 font-medium">Google Spreadsheet Services</span>
                          </div>
                          
                          <p class="text-[10px] text-gray-400 px-1 pb-2">
                              將儲存於 Google 雲端硬碟「日日記」資料夾
                          </p>
                          <div class="grid grid-cols-2 gap-3">
                              <button @click="handleBackup" :disabled="backingUp" class="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-gray-100 active:scale-95 transition-all disabled:opacity-50 hover:bg-gray-50">
                                  <span v-if="backingUp" class="w-4 h-4 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin"></span>
                                  <span v-else class="material-symbols-rounded text-xl text-gray-400">cloud_sync</span>
                                  <span class="text-[10px] text-gray-500 mt-2 font-medium tracking-wide">備份</span>
                              </button>
                              <button @click="handleExport" :disabled="exporting" class="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-gray-100 active:scale-95 transition-all disabled:opacity-50 hover:bg-gray-50">
                                  <span v-if="exporting" class="w-4 h-4 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin"></span>
                                  <span v-else class="material-symbols-rounded text-xl text-gray-400">ios_share</span>
                                  <span class="text-[10px] text-gray-500 mt-2 font-medium tracking-wide">匯出</span>
                              </button>
                          </div>                <div class="flex items-center justify-between px-1">
                              <div class="flex flex-col">
                                  <span class="text-[10px] text-gray-600 font-medium tracking-wide">每日自動備份</span>
                                  <span class="text-[8px] text-gray-300"></span>
                              </div>
                              <label class="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" v-model="localConfig.auto_backup" @change="debouncedUpdate" class="sr-only peer">
                                  <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4A4A4A]"></div>
                              </label>
                          </div>
                      </div>
 
                      <!-- SHARED LINK MANAGEMENT -->
                      <div class="bg-gray-50 p-4 rounded-xl relative">
                          <div class="flex items-center justify-between">
                              <div class="space-y-0.5">
                                  <span class="text-xs text-gray-600 font-medium block">公開分享連結管理</span>
                                  <p class="text-[9px] text-gray-400">建立多個分享連結，並可設定不同的分享範圍與權限。</p>
                              </div>
                              <button @click="$emit('manage-shared-links')" class="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm border border-gray-100 active:scale-95 transition-all text-gray-500 hover:text-gray-700 mt-1">
                                  <span class="material-symbols-rounded text-sm">edit</span>
                              </button>
                          </div>
                      </div>

                 <button @click="$emit('view-import')" class="w-full border border-gray-200 text-gray-500 py-3 rounded-xl text-xs font-medium active:bg-gray-50">
                     匯入資料
                 </button>
                 <button @click="$emit('logout')" class="w-full border border-gray-200 text-gray-500 py-3 rounded-xl text-xs font-medium active:bg-gray-50">
                     登出 Google 帳號
                 </button>
                 <button @click="confirmDeleteData" class="w-full py-2 text-[10px] text-gray-300 tracking-widest uppercase hover:text-gray-500 transition-colors">
                     刪除記帳資料
                 </button>
                 <button @click="$emit('delete-account')" class="w-full py-2 text-[10px] text-gray-300 tracking-widest uppercase hover:text-gray-500 transition-colors">
                     註銷帳戶
                 </button>
             </div>

             <!-- GUEST MODE -->
             <div v-else-if="appMode === 'GUEST'" class="space-y-4">
                 <p class="text-[10px] text-gray-400 px-2 leading-relaxed">
                    登入 Google 帳號以開啟雲端同步、多裝置存取與分享功能。
                 </p>
                 <button @click="$emit('login')" class="w-full border border-gray-200 text-gray-600 py-3 rounded-xl flex items-center justify-center space-x-2 active:scale-95 transition-transform hover:bg-gray-50">
                     <svg class="w-4 h-4 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                     </svg>
                     <span class="text-xs font-medium tracking-wide">使用 Google 帳號登入</span>
                 </button>
             </div>
             <!-- VIEWER MODE -->
             <div v-else class="space-y-3">
                 <div class="text-[10px] text-gray-400 px-2">閱覽模式 (唯讀)</div>
             </div>
        </div>
        
        <!-- Icon Picker Modal Removed -->
    </section>
    `,
    props: ['config', 'friends', 'projects', 'transactions', 'appMode', 'currentUser', 'categories', 'paymentMethods'],
    emits: ['update-config', 'update-user-data', 'view-project', 'view-friend', 'login', 'logout', 'clear-guest-data', 'create-project', 'open-icon-edit', 'clear-account-data', 'view-import', 'delete-account', 'manage-shared-links'],
    data() {
        return {
            localConfig: { user_name: '', fx_rate: 0.22 },
            saving: false,
            sheetUrl: CONFIG.SPREADSHEET_URL,
            isAddingProject: false,
            projectSaving: false,
            newProject: { name: '', startDate: '', endDate: '' },
            selectedProject: null,
            isSharedLinkEnabled: false,
            sharedLink: '',
            copied: false,

            // Customization Data
            isCategoryModeEdit: false,
            localCategories: [],
            isPaymentModeEdit: false,
            localPaymentMethods: [],
            debouncedTimeout: null,
            exporting: false,
            backingUp: false
        };
    },
    computed: {
        expenseCategories() {
            const list = this.isCategoryModeEdit ? this.localCategories : (this.categories || []);
            return list
                .filter(c => c.type === '支出')
                .sort((a, b) => (a.order || 99) - (b.order || 99));
        },
        incomeCategories() {
            const list = this.isCategoryModeEdit ? this.localCategories : (this.categories || []);
            return list
                .filter(c => c.type === '收入')
                .sort((a, b) => (a.order || 99) - (b.order || 99));
        },
        sortedPaymentMethods() {
            const list = this.isPaymentModeEdit ? this.localPaymentMethods : (this.paymentMethods || []);
            return [...list].sort((a, b) => (a.order || 99) - (b.order || 99));
        },
        isSettingsDirty() {
            // Check if any of the local lists differ from props
            const catDirty = JSON.stringify(this.localCategories) !== JSON.stringify(this.categories);
            const pmDirty = JSON.stringify(this.localPaymentMethods) !== JSON.stringify(this.paymentMethods);
            return (this.isCategoryModeEdit && catDirty) || (this.isPaymentModeEdit && pmDirty);
        }
    },
    watch: {
        isSettingsDirty(val) {
            this.$emit('update:dirty', val);
        },
        config: {
            handler(newVal) {
                if (newVal) {
                    this.localConfig = { ...newVal };
                    if (newVal.sharedId) {
                        this.isSharedLinkEnabled = true;
                        this.sharedLink = window.location.origin + window.location.pathname + '?mode=view&id=' + newVal.sharedId;
                    } else {
                        this.isSharedLinkEnabled = false;
                        this.sharedLink = '';
                    }
                }
            },
            immediate: true,
            deep: true
        },
        // categories watch removed as we use computed expenseCategories/incomeCategories
        paymentMethods: {
            handler(val) {
                if (!this.isPaymentModeEdit) {
                    this.localPaymentMethods = JSON.parse(JSON.stringify(val || [])).sort((a, b) => (a.order || 99) - (b.order || 99));
                }
            },
            immediate: true,
            deep: true
        }
    },
    methods: {
        async saveSettings() {
            this.saving = true;
            try {
                this.$emit('update-config', this.localConfig);
            } finally {
                this.saving = false;
            }
        },
        async createProject() {
            if (!this.newProject.name) return this.dialog.alert("Please enter a name");
            this.projectSaving = true;
            try {
                // ... same old logic, using emit
                await this.$emit('create-project', this.newProject);
                this.isAddingProject = false;
                this.newProject = { name: '', startDate: '', endDate: '' };
            } catch (e) {
                // error handled
            } finally {
                this.projectSaving = false;
            }
        },
        async toggleShare() {
            if (this.isSharedLinkEnabled) {
                // Enable
                try {
                    const id = await API.updateSharedLink(true);
                    this.sharedLink = window.location.origin + window.location.pathname + '?mode=view&id=' + id;
                    // update local config to reflect change
                    this.localConfig.sharedId = id;
                } catch (e) {
                    console.error(e);
                    this.dialog.alert("開啟失敗: " + e.message);
                    this.isSharedLinkEnabled = false;
                }
            } else {
                // Disable
                if (await this.dialog.confirm("確定要關閉分享嗎？舊的連結將失效。")) {
                    await API.updateSharedLink(false);
                    this.sharedLink = '';
                    this.localConfig.sharedId = null;
                } else {
                    this.isSharedLinkEnabled = true; // revert
                }
            }
        },
        copyLink() {
            navigator.clipboard.writeText(this.sharedLink);
            this.copied = true;
            setTimeout(() => this.copied = false, 2000);
        },

        // --- Customization Logic ---
        toggleCategoryEdit() {
            if (!this.isCategoryModeEdit) {
                this.localCategories = JSON.parse(JSON.stringify(this.categories || []));
                this.isCategoryModeEdit = true;
            }
        },
        saveCategoryEdit() {
            // Re-assign order purely based on visual index
            const updated = JSON.parse(JSON.stringify(this.localCategories));
            const expense = updated.filter(c => c.type === '支出').sort((a, b) => (a.order || 99) - (b.order || 99));
            const income = updated.filter(c => c.type === '收入').sort((a, b) => (a.order || 99) - (b.order || 99));

            expense.forEach((c, i) => { const item = updated.find(orig => orig.id === c.id); if (item) item.order = i + 1; });
            income.forEach((c, i) => { const item = updated.find(orig => orig.id === c.id); if (item) item.order = i + 100; });

            this.$emit('update-user-data', { categories: updated });
            this.isCategoryModeEdit = false;
        },
        cancelCategoryEdit() {
            this.isCategoryModeEdit = false;
            this.localCategories = [];
        },

        togglePaymentEdit() {
            if (!this.isPaymentModeEdit) {
                this.localPaymentMethods = JSON.parse(JSON.stringify(this.paymentMethods || [])).sort((a, b) => (a.order || 99) - (b.order || 99));
                this.isPaymentModeEdit = true;
            }
        },
        savePaymentEdit() {
            this.localPaymentMethods.forEach((p, i) => p.order = i + 1);
            this.$emit('update-user-data', { paymentMethods: this.localPaymentMethods });
            this.isPaymentModeEdit = false;
        },
        cancelPaymentEdit() {
            this.isPaymentModeEdit = false;
            this.localPaymentMethods = [];
        },

        debouncedUpdate() {
            if (this.debouncedTimeout) clearTimeout(this.debouncedTimeout);
            this.debouncedTimeout = setTimeout(() => {
                this.$emit('update-config', this.localConfig);
            }, 1000); // Auto-save after 1s of no typing
        },
        // saveCustomData Removed as we now use Save buttons

        moveItem(type, id, direction) {
            const list = type === 'paymentMethods' ? this.localPaymentMethods : this.localCategories;
            const idx = list.findIndex(item => item.id === id);
            if (idx === -1) return;

            if (type === 'paymentMethods') {
                if (idx + direction < 0 || idx + direction >= list.length) return;
                const temp = list[idx];
                list[idx] = list[idx + direction];
                list[idx + direction] = temp;
                // Reactive update for array swap
                list.splice(idx, 1, list[idx]);
            } else {
                const item = list[idx];
                const typeItems = list.filter(c => c.type === item.type).sort((a, b) => (a.order || 99) - (b.order || 99));
                const typeIdx = typeItems.findIndex(c => c.id === id);

                if (typeIdx + direction < 0 || typeIdx + direction >= typeItems.length) return;

                const targetId = typeItems[typeIdx + direction].id;
                const targetGlobalIdx = list.findIndex(c => c.id === targetId);

                // Swap orders
                const tempOrder = list[idx].order;
                list[idx].order = list[targetGlobalIdx].order;
                list[targetGlobalIdx].order = tempOrder;
            }
        },
        async deleteItem(type, id) {
            if (!await this.dialog.confirm("確定刪除此項目？")) return;
            const list = type === 'categories' ? this.localCategories : this.localPaymentMethods;
            const idx = list.findIndex(item => item.id === id);
            if (idx !== -1) list.splice(idx, 1);
        },
        addCategory(type = '支出') {
            const id = 'cat_' + Date.now();
            this.localCategories.push({
                id: id,
                name: '新類別',
                icon: type === '支出' ? 'star' : 'payments',
                type: type,
                order: 999
            });
            this.openIconPicker('category', id);
        },
        addPaymentMethod() {
            const id = 'pm_' + Date.now();
            this.localPaymentMethods.push({
                id: id,
                name: '新支付',
                icon: 'payments',
                order: 999
            });
            this.openIconPicker('payment', id);
        },
        openIconPicker(type, id) {
            const list = type === 'category' ? this.localCategories : this.localPaymentMethods;
            const item = list.find(it => it.id === id);
            if (!item) return;

            this.$emit('open-icon-edit', {
                type,
                id: id,
                name: item.name,
                icon: item.icon || 'payments'
            });
        },

        formatNumber(num) { return new Intl.NumberFormat().format(Math.round(num || 0)); },
        getStatusLabel(status) {
            const map = { 'Active': '進行中', 'Archived': '已封存', 'Planned': '計劃中' };
            return map[status] || status;
        },
        async confirmDeleteData() {
            if (await this.dialog.confirm("確定要刪除所有記帳資料嗎？\n此動作將清空雲端與本地的所有紀錄，且無法復原。", { confirmText: '確定刪除', cancelText: '取消' })) {
                this.$emit('clear-account-data');
            }
        },
        async handleExport() {
            if (this.exporting) return;
            this.exporting = true;
            try {
                let token = API.getGoogleToken();
                // Initial check: if no token, request one.
                if (!token) token = await API.requestIncrementalScope();
                if (!token) throw new Error("尚未獲得授權");

                const data = {
                    transactions: this.transactions,
                    categories: this.categories,
                    paymentMethods: this.paymentMethods,
                    projects: this.projects,
                    friends: this.friends,
                    config: this.config
                };

                // Pass token AND the retry callback (API.requestIncrementalScope)
                const result = await GoogleSheetsService.exportReadableSheet(data, token, API.requestIncrementalScope);

                this.dialog.alert(`匯出成功！\n檔案已儲存於「${result.folder}」資料夾。`, { title: '匯出完成' });
                window.open(result.url, '_blank');
            } catch (e) {
                console.error(e);
                this.dialog.alert("匯出失敗: " + e.message);
            } finally {
                this.exporting = false;
            }
        },
        async handleBackup() {
            if (this.backingUp) return;
            this.backingUp = true;
            try {
                let token = API.getGoogleToken();
                if (!token) token = await API.requestIncrementalScope();
                if (!token) throw new Error("尚未獲得授權");

                const data = {
                    transactions: this.transactions,
                    categories: this.categories,
                    paymentMethods: this.paymentMethods,
                    projects: this.projects,
                    friends: this.friends,
                    config: this.config
                };

                // Pass token AND retry callback
                const result = await GoogleSheetsService.backupFullData(data, token, API.requestIncrementalScope);

                this.dialog.alert(`備份成功！\n檔案：${result.file}\n已儲存於「${result.folder}」資料夾。`, { title: '備份完成' });
            } catch (e) {
                console.error(e);
                this.dialog.alert("備份失敗: " + e.message);
            } finally {
                this.backingUp = false;
            }
        }
    },
    inject: ['dialog'],
    mounted() {
        this.localConfig = { ...this.config };
    }
};
