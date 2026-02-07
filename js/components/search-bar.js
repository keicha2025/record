import { AppSelect } from './app-select.js';

export const SearchBar = {
    components: {
        'app-select': AppSelect
    },
    template: `
    <div class="sticky top-0 z-40 bg-[#FDFCFB]/95 backdrop-blur-sm py-2 -mx-4 px-4 border-b border-gray-50/50">
        <div class="flex space-x-2">
            <!-- Search Input -->
            <div class="flex-1 bg-white rounded-xl flex items-center px-3 h-9 shadow-sm border border-gray-50 transition-shadow focus-within:shadow-md">
                <span class="material-symbols-rounded text-gray-300 text-lg">search</span>
                <input 
                    type="text" 
                    :value="modelValue.keyword"
                    @input="$emit('update:modelValue', { ...modelValue, keyword: $event.target.value })"
                    placeholder="搜尋..." 
                    class="w-full text-xs ml-2 outline-none text-gray-600 placeholder-gray-300 bg-transparent"
                >
            </div>
            
            <!-- Type Filter -->
            <div class="w-24">
                <app-select 
                    :modelValue="modelValue.mode"
                    @update:modelValue="$emit('update:modelValue', { ...modelValue, mode: $event })"
                    :options="[
                        { label: '全部', value: 'all' },
                        { label: '一般', value: 'general' },
                        { label: '專案', value: 'project' }
                    ]"
                ></app-select>
            </div>
        </div>
    </div>
    `,
    props: ['modelValue'],
    emits: ['update:modelValue']
};
