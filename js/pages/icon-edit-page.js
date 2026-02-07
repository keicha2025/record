
export const IconEditPage = {
    template: `
    <section class="animate-in fade-in pb-20">
        <div class="bg-white p-6 rounded-[2.5rem] muji-shadow border border-gray-50 flex flex-col min-h-[60vh] relative mt-2">
            
            <!-- Header (Match edit-page) -->
            <div class="flex justify-between items-center px-1 border-b border-gray-50 pb-5 shrink-0">
                <span class="text-[10px] text-gray-400 uppercase tracking-[0.3em] font-medium">選取圖示</span>
                <button @click="$emit('cancel')" class="text-[10px] text-gray-300 uppercase tracking-widest hover:text-gray-500 transition-colors">取消</button>
            </div>

            <!-- Content Area -->
            <div class="flex-1 flex flex-col pt-6 min-h-0">
                <!-- Current Selection & Name Edit -->
                <div v-if="context" class="mb-4 px-2 shrink-0">
                    <div class="flex items-center space-x-4 bg-gray-50 p-4 rounded-[2rem] border border-gray-100/50">
                        <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#4A4A4A] shadow-sm">
                            <span class="material-symbols-rounded text-2xl">{{ selectedIcon || 'help' }}</span>
                        </div>
                        <div class="flex flex-col flex-1">
                            <span class="text-[10px] text-gray-400 uppercase tracking-widest font-medium">名稱</span>
                            <input type="text" v-model="localName" class="text-sm font-bold text-gray-700 bg-transparent outline-none w-full border-b border-transparent focus:border-gray-200 transition-colors py-0.5" placeholder="輸入名稱">
                        </div>
                    </div>
                </div>

                <!-- Icon Groups Scrollable Area -->
                <div class="flex-1 overflow-y-auto subtle-scrollbar overscroll-contain px-1 max-h-[220px]">
                    <div v-for="(group, name) in iconGroups" :key="name" class="mb-8 last:mb-0">
                        <h4 class="text-[9px] text-gray-300 font-medium mb-4 uppercase tracking-[0.2em] px-1">{{ name }}</h4>
                        <div class="grid grid-cols-4 gap-3">
                            <button v-for="icon in group" :key="icon" 
                                @click="selectIcon(icon)"
                                :class="selectedIcon === icon ? 'bg-[#4A4A4A] text-white shadow-lg scale-105' : 'bg-gray-50 text-gray-400'"
                                class="aspect-square rounded-2xl flex items-center justify-center hover:bg-[#4A4A4A] hover:text-white active:scale-95 transition-all">
                                <span class="material-symbols-rounded text-xl">{{ icon }}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Bottom Action -->
            <div class="pt-6 shrink-0">
                <button @click="confirm" class="w-full bg-[#4A4A4A] text-white py-5 rounded-2xl text-[10px] font-medium tracking-[0.4em] uppercase shadow-lg active:scale-95 transition-all">
                    儲存
                </button>
            </div>
        </div>
    </section>
    `,
    props: ['context'], // context: { type: 'category'|'payment', index: number, name: string, icon: string }
    data() {
        return {
            selectedIcon: this.context?.icon || '',
            localName: this.context?.name || '',
            iconGroups: {
                'General': ['home', 'star', 'favorite', 'verified', 'person', 'settings', 'search', 'info', 'check_circle', 'warning'],
                'Food & Drink': ['restaurant', 'lunch_dining', 'local_cafe', 'fastfood', 'local_bar', 'ramen_dining', 'bakery_dining', 'icecream', 'liquor', 'coffee'],
                'Transport': ['directions_bus', 'train', 'flight', 'directions_car', 'local_taxi', 'directions_bike', 'directions_boat', 'subway', 'tram', 'commute'],
                'Shopping': ['shopping_cart', 'shopping_bag', 'store', 'local_mall', 'credit_card', 'receipt', 'card_giftcard', 'checkroom', 'watch', 'diamond'],
                'Entertainment': ['movie', 'stadium', 'sports_esports', 'music_note', 'local_activity', 'fitness_center', 'casino', 'pool', 'travel_explore', 'palette'],
                'Life & Services': ['school', 'work', 'medical_services', 'local_hospital', 'pets', 'child_care', 'cleaning_services', 'build', 'wifi', 'local_laundry_service'],
                'Finance': ['payments', 'account_balance', 'attach_money', 'savings', 'currency_exchange', 'trending_up', 'pie_chart', 'wallet', 'qr_code'],
                'Income': ['monetization_on', 'paid', 'savings', 'add_card', 'currency_yen']
            }
        };
    },
    methods: {
        selectIcon(icon) {
            this.selectedIcon = icon;
        },
        confirm() {
            this.$emit('select', {
                icon: this.selectedIcon,
                name: this.localName
            });
        }
    },
    watch: {
        context: {
            handler(newVal) {
                if (newVal) {
                    this.selectedIcon = newVal.icon;
                    this.localName = newVal.name;
                }
            },
            deep: true,
            immediate: true
        }
    }
};
