export const SharedLinksPage = {
    template: `
    <section class="space-y-4 py-4 animate-in fade-in pb-24">
        <!-- Main Card with Integrated Header -->
        <div class="bg-white p-5 rounded-[2rem] muji-shadow border border-gray-50 space-y-4 min-h-[50vh] relative">
            
            <!-- Integrated Header -->
            <div class="flex items-center justify-between pb-2 border-b border-gray-50">
                <h2 class="text-xs font-medium text-gray-400 tracking-widest pl-2">公開分享連結管理</h2>
                <button @click="$emit('create-link')" class="w-8 h-8 flex items-center justify-center rounded-full active:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors">
                    <span class="material-symbols-rounded">add</span>
                </button>
            </div>

            <!-- Links List -->
            <div class="space-y-3">
                 <div v-if="loading" class="text-center py-10 text-gray-300 text-xs">載入中...</div>
                 <div v-else-if="links.length === 0" class="text-center py-10 text-gray-300 text-xs flex flex-col items-center space-y-2">
                    <span class="material-symbols-rounded text-3xl text-gray-200">link_off</span>
                    <span>尚無分享連結</span>
                 </div>
                 
                 <div v-for="link in links" :key="link.id" 
                      @click="$emit('edit-link', link)"
                      class="bg-gray-50 p-4 rounded-xl border border-gray-100 active:scale-95 transition-all cursor-pointer space-y-2 relative overflow-hidden group">
                    
                    <div class="flex justify-between items-center">
                        <div class="flex items-center space-x-3 w-full">
                            <!-- Link Icon with Copy Action -->
                            <button @click.stop="copyLink(link)" class="w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-400 hover:opacity-60 transition-opacity shadow-sm border border-gray-100 flex-shrink-0">
                                <span class="material-symbols-rounded text-sm">{{ link.copied ? 'check' : 'link' }}</span>
                            </button>

                            <div class="space-y-0.5 flex-1 min-w-0">
                                <div class="text-sm font-medium text-gray-700 truncate">{{ link.name || '未命名分享' }}</div>
                                <!-- Single Line Settings -->
                                <div class="text-[10px] text-gray-400 truncate">
                                    {{ getSettingsString(link) }}
                                </div>
                            </div>
                        </div>
                        <span class="material-symbols-rounded text-gray-300 pl-2">chevron_right</span>
                    </div>
                 </div>
            </div>
        </div>
    </section>
    `,
    props: ['currentUser'],
    emits: ['back', 'edit-link', 'create-link'],
    data() {
        return {
            loading: false,
            links: []
        };
    },
    async mounted() {
        this.loadLinks();
    },
    methods: {
        async loadLinks() {
            this.loading = true;
            try {
                const { API } = await import('../api.js');
                this.links = await API.getSharedLinks();
            } catch (e) {
                console.error(e);
            } finally {
                this.loading = false;
            }
        },
        getSettingsString(link) {
            const parts = [];

            // Scope
            if (link.scope === 'all') parts.push('全部紀錄');
            else if (link.scope === 'range') parts.push(`${link.scopeValue?.start} ~ ${link.scopeValue?.end}`);
            else if (link.scope === 'project') parts.push('僅限專案');

            // Filters
            if (link.excludeProjectExpenses) parts.push('排除專案花費');
            if (link.hideFriendNames) parts.push('隱藏朋友');
            if (link.hideProjectNames) parts.push('隱藏專案名');

            return parts.join(' · ');
        },
        copyLink(link) {
            const uidParam = this.currentUser ? `&uid=${this.currentUser.uid}` : '';
            const url = window.location.origin + window.location.pathname + '?mode=view' + uidParam + '&id=' + link.id;

            // Debug: Log the generated URL
            console.log("Generated Link:", url, "CurrentUser:", this.currentUser);
            // alert("Copied: " + url); // Temporary debug for user to see

            navigator.clipboard.writeText(url);

            // Local state mutation for visual feedback (simpler than making whole list reactive deep)
            link.copied = true;
            setTimeout(() => {
                link.copied = false;
            }, 2000);
        }
    }
};
