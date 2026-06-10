<template>
    <section class="border border-neutral-darkest bg-neutral-lightest">
        <div>

            <!-- bars -->
            <div class="relative h-1.5 w-full bg-warm-neutral-200">

                <div class="absolute left-0 top-0 z-20 h-1.5 w-full bg-warm-neutral-200">
                    &nbsp;
                </div>

               
                <div class="absolute left-0 top-0 z-30 h-1.5 bg-trust-blue-darkest"
                    :style="`width: ${(count_active / tot) * 100}%`">
                    &nbsp;
                </div>

                 <div class="absolute left-0 top-0 z-40 h-1.5 bg-community-pink-dark"
                    :style="`width: ${(count_selected / tot) * 100}%`">
                    &nbsp;
                </div>

            </div>

            <!-- title count and caret -->
            <div class="flex items-center justify-between px-3 pb-1.5 pt-2">
                <div class="flex min-w-0 items-center gap-1.5">
                    <p class="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-darkest">{{ title }}</p>
                    <slot name="help" />
                </div>

                <div class="flex shrink-0 items-center gap-1">
                    <p class="font-mono text-2xs text-neutral-dark">{{ count_active }} / {{ tot }}</p>
                    <Icon 
                        name="mdi:caret-down"
                        size="1.25em"
                        class="cursor-pointer text-neutral-darkest"
                        :class="isOpen ? 'rotate-180 transform transition-transform duration-200' : 'rotate-0 transform transition-transform duration-200'"
                        @click="toggleOpen"
                    />
                </div>       

            </div>
        
        </div>

        <article 
            v-if="isOpen"
            class="border-t border-neutral-lighter p-3 font-mono text-xs"
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
        defaultOpen?: boolean;
    }>(), {
        count_active: 0,
        count_selected: 0,
        defaultOpen: false,
    });

    const isOpen = ref(props.defaultOpen);

    const toggleOpen = () => {
        isOpen.value = !isOpen.value;
    }


</script>

<style scoped> 

</style>