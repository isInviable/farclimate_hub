<template>
    <div 
        v-for="element in barsData"
        class="relative"
    >
        <!-- bar background -->
        <div 
            class="absolute top-0 left-0 h-full bg-teal-100" 
            :style="{ width: element.width }"
        ></div>
                                        
        <!-- content -->
        <div class="relative top-0 left-0 flex justify-between items-center min-h-8 border-b border-stone-100 px-4 bg-transparent z-50  ">
            <Icon 
                :name="element.icon" style="color: #000" size="1.25rem" />
            <p class="grow text-sm pl-4">{{ element.label }}</p>
            <p class="text-right text-xs pr-2 font-mono">{{ element.count }}</p>
        </div>

    </div>
</template>

<script setup>



    const props = defineProps({
        elements: {
            type: Array,
            default: () => [
                {label: 'Agriculture', slug:'Agriculture', icon: 'mdi:tractor-variant', count: 20 },
                {label: 'fishery', slug:'fishery', icon: 'ph:fish-simple-bold', count: 30},
                {label: 'forestry', slug:'forestry', icon: 'ri:tree-line', count: 10},
            ]
        },
    })

    const getBarWidth = (count, totalCount) => {
        if (totalCount === 0) return '0%';
        return `${(count / totalCount) * 100}%`;
    }

    // compute the total of counts
    const totalCount = computed(() => {
        return props.elements.reduce((acc, element) => acc + parseInt(element.count), 0);
    })

    
    const barsData = computed(() => {
        return props.elements.map(element => {
            return {
                ...element,
                width: getBarWidth(parseInt(element.count), totalCount.value)
            }
        })
    })

    onMounted(() => {
        // This is where you can fetch data or perform any setup needed
        console.log('Dummy Bars component mounted');
        console.log(barsData.value);
        console.log('Total Count:', totalCount.value);
    })

</script>