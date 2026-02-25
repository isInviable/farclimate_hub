<template>
    <section class="shadow-lg">
        <div class="bg-white  rounded-md ">

            <!-- bars -->
            <div class="h-1.5 bg-gray-200 relative w-full">

                <div class="bg-gray-300 absolute top-0 left-0 z-20 h-1.5 w-full"
                    >
                    &nbsp;
                </div>

               
                <div class="bg-[#1E63A2] absolute top-0 left-0 z-30 h-1.5"
                    :style="`width: ${(count_active / tot) * 100}%`">
                    &nbsp;
                </div>

                 <div class="bg-red-700 absolute top-0 left-0 z-40 h-1.5"
                    :style="`width: ${(count_selected / tot) * 100}%`">
                    &nbsp;
                </div>

            </div>

            <!-- title count and caret -->
            <div class="pt-2 pb-1 px-2 text-sm/6 flex justify-between items-center ">
                <p class="font-bold uppercase">{{ title }}</p>

                <div class="flex items-center gap-1">
                    <p><small>{{count_active}} / {{ tot }}</small></p>
                    <Icon 
                        name="mdi:caret-down"
                        style="color: black"
                        size="1.5em"
                        class="cursor-pointer"
                        :class="isOpen ? 'rotate-180 transform transition-transform duration-200' : 'rotate-0 transform transition-transform duration-200'"
                        @click="toggleOpen"
                    />
                </div>       

            </div>
        
        </div>

        <article 
            v-if="isOpen"
            class="p-2 bg-white text-sm"
        >
            <slot name="content">
                <p>Panel content here</p>
            </slot>
        </article>


    </section>
   
    
</template>

<script lang="ts" setup>

    const props = withDefaults(defineProps<{
        title: string;
        tot: number;
        count_active: number;
        count_selected?: number;
    }>(), {
        count_active: 0,
        count_selected: 0
    });

    const isOpen = ref(false);

    const toggleOpen = () => {
        isOpen.value = !isOpen.value;
    }


</script>

<style scoped> 

</style>