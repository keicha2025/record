import { API } from '../api.js';

export const ImportPage = {
    template: `
    <section class="animate-in fade-in pb-20">
        <div class="bg-white p-6 rounded-[2.5rem] muji-shadow border border-gray-50 flex flex-col min-h-[60vh] relative mt-2">
            
            <!-- Header -->
            <div class="flex items-center justify-between pb-6 shrink-0">
                <button @click="$emit('back')" class="text-gray-400 hover:text-gray-600 transition-colors flex items-center space-x-1">
                    <span class="material-symbols-rounded text-xl">arrow_back</span>
                    <span class="text-[10px] tracking-widest uppercase">BACK</span>
                </button>
                <h1 class="text-base font-medium text-gray-700 tracking-wide">匯入資料</h1>
                <div class="w-10"></div> <!-- Spacer -->
            </div>

            <!-- Content -->
            <div class="flex-1 space-y-6">
                
                <!-- Warning -->
                <div class="bg-gray-50 border border-gray-100 p-4 rounded-xl">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <span class="material-symbols-rounded text-gray-400">info</span>
                        </div>
                        <div class="ml-3">
                            <p class="text-xs text-gray-500 leading-relaxed">
                                注意：匯入過程將會<strong>覆蓋或合併</strong>現有資料。建議在匯入前先進行備份。
                            </p>
                        </div>
                    </div>
                </div>

                <!-- File Input -->
                <div class="space-y-2">
                    <label class="block text-[10px] text-gray-400 uppercase tracking-widest font-medium ml-2">選擇備份檔案 (.json)</label>
                    <div class="mt-1 flex justify-center px-6 pt-8 pb-8 border-2 border-gray-100 border-dashed rounded-2xl hover:border-gray-300 transition-colors cursor-pointer group"
                         @click="$refs.fileInput.click()"
                         @dragover.prevent @drop.prevent="handleDrop">
                        <div class="space-y-2 text-center">
                            <span class="material-symbols-rounded text-gray-300 text-4xl group-hover:text-gray-400 transition-colors">upload_file</span>
                            <div class="flex flex-col text-sm text-gray-500">
                                <span class="font-medium text-gray-600">點擊上傳</span>
                                <span class="text-xs text-gray-400 mt-1">或拖放檔案至此</span>
                            </div>
                        </div>
                        <input ref="fileInput" type="file" class="hidden" accept=".json" @change="handleFileSelect">
                    </div>
                </div>

                <!-- Preview / Confirmation -->
                <div v-if="parsedData" class="space-y-4 pt-2 animate-in fade-in slide-in-from-bottom-2">
                    <h3 class="text-[10px] text-gray-400 uppercase tracking-widest font-medium ml-2">檔案預覽</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-gray-50 p-4 rounded-2xl border border-gray-50">
                            <div class="text-[10px] text-gray-400 mb-1">交易紀錄</div>
                            <div class="text-xl font-light text-gray-700">{{ (parsedData.transactions || []).length }} <span class="text-xs">筆</span></div>
                        </div>
                        <div class="bg-gray-50 p-4 rounded-2xl border border-gray-50">
                            <div class="text-[10px] text-gray-400 mb-1">專案</div>
                            <div class="text-xl font-light text-gray-700">{{ (parsedData.projects || []).length }} <span class="text-xs">個</span></div>
                        </div>
                    </div>
                    
                    <div class="pt-4 space-y-3">
                        <button @click="confirmImport" :disabled="importing" 
                            class="w-full bg-[#4A4A4A] text-white py-4 rounded-2xl text-[10px] font-medium tracking-[0.3em] uppercase shadow-lg shadow-gray-200 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
                            <span v-if="importing" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            <span v-else>確認匯入</span>
                        </button>
                        <button @click="parsedData = null" :disabled="importing" class="w-full py-2 text-[10px] text-gray-400 tracking-widest uppercase hover:text-gray-600 transition-colors">
                            取消重選
                        </button>
                    </div>
                </div>

                <!-- Console / Progress Log -->
                <div v-if="logs.length > 0" class="bg-gray-50 rounded-xl p-4 border border-gray-100 font-mono text-[10px] text-gray-500 max-h-48 overflow-y-auto space-y-1">
                    <div v-for="(log, i) in logs" :key="i" class="flex items-start">
                        <span class="mr-2 text-gray-300">></span>
                        <span>{{ log }}</span>
                    </div>
                </div>
            </div>
        </div>
    </section>
    `,
    emits: ['back', 'refresh-data'],
    data() {
        return {
            parsedData: null,
            importing: false,
            logs: []
        };
    },
    inject: ['dialog'],
    methods: {
        log(msg) {
            this.logs.push(msg);
            // Auto scroll to bottom
            this.$nextTick(() => {
                const container = this.$el.querySelector('.font-mono');
                if (container) container.scrollTop = container.scrollHeight;
            });
        },
        handleFileSelect(event) {
            const file = event.target.files[0];
            if (file) this.processFile(file);
        },
        handleDrop(event) {
            const file = event.dataTransfer.files[0];
            if (file) this.processFile(file);
        },
        processFile(file) {
            if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
                return this.dialog.alert('請上傳 JSON 格式檔案');
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const json = JSON.parse(e.target.result);
                    // Basic validation
                    if (!json.transactions && !json.projects && !json.categories) {
                        throw new Error("無效的備份檔案格式 (缺少必要欄位)");
                    }
                    this.parsedData = json;
                    this.log(`檔案解析成功: ${file.name}`);
                    this.log(`包含 ${json.transactions?.length || 0} 筆交易, ${json.projects?.length || 0} 個專案`);
                } catch (err) {
                    console.error(err);
                    this.dialog.alert('檔案解析失敗: ' + err.message);
                }
            };
            reader.readAsText(file);
        },
        async confirmImport() {
            if (!this.parsedData) return;

            if (!await this.dialog.confirm("確定要匯入此資料嗎？\n這將會覆蓋資料庫中的相同項目。", "開始匯入")) return;

            this.importing = true;
            this.log("開始匯入...");

            try {
                const result = await API.importData(this.parsedData, (msg) => this.log(msg));
                this.log("匯入完成！");
                await this.dialog.alert(`匯入成功！\n新增/更新了 ${result.count} 筆資料。`);

                // Refresh App Data
                window.location.reload();
            } catch (e) {
                console.error(e);
                this.log("錯誤: " + e.message);
                this.dialog.alert("匯入失敗: " + e.message);
            } finally {
                this.importing = false;
            }
        }
    }
};
