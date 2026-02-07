export const AppHeader = {
    props: ['appMode', 'syncStatus', 'currentTab', 'historyFilter'],
    setup() {
        const baseCurrency = window.Vue.inject('baseCurrency');
        const toggleBaseCurrency = window.Vue.inject('toggleBaseCurrency');
        return { baseCurrency, toggleBaseCurrency };
    },
    template: `
    <header class="w-full max-w-md mx-auto px-4 pt-6 pb-2 flex justify-between items-end border-b border-gray-50/50">
        <h1 class="text-lg font-light tracking-[0.3em] text-gray-300 uppercase">Nichi-Nichi</h1>
        <div class="flex items-center space-x-2">
            <!-- Currency Toggle (Overview & Stats) -->
            <div v-if="['overview', 'stats'].includes(currentTab)" @click="toggleBaseCurrency" 
                 class="flex items-center justify-center space-x-1 bg-gray-100 px-3 py-1.5 rounded-full cursor-pointer transition-colors hover:bg-gray-200">
                <span class="text-[9px] font-bold text-gray-400">{{ baseCurrency }}</span>
                <span class="material-symbols-rounded text-[10px] text-gray-400">sync_alt</span>
            </div>

            <!-- Filter Clear Button -->
            <div v-if="currentTab === 'history'"
                 @click="$emit('clear-filter')"
                 class="flex items-center space-x-1 text-[9px] bg-gray-100 text-gray-400 px-3 py-1.5 rounded-full cursor-pointer transition-colors hover:bg-gray-200">
                <span class="material-symbols-rounded !text-xs">filter_list_off</span>
                <span>CLEAR</span>
            </div>

        </div>
    </header>
    `
};
