<script setup lang="ts">
const props = defineProps({
  type: {
    type: String,
    required: true,
    validator: (value: string) => ['Projects', 'Institutions', 'Products'].includes(value),
  },
  items: {
    type: Array,
    required: true,
  },
  formatter: {
    type: Function,
    default: (d: number) => new Intl.NumberFormat("en-US").format(d),
  },
});

const getItemTitle = (item: any) => {
  if (props.type === 'Projects') {
    return item.title || item.id;
  } else if (props.type === 'Institutions') {
    return item.legal_name || item.short_name || item.id;
  } else if (props.type === 'Products') {
    return item.title || item.id;
  }
  return item.id;
};

const getItemSubtitle = (item: any) => {
  if (props.type === 'Projects') {
    if (item.startDate && item.endDate) {
      return `${item.startDate} - ${item.endDate}`;
    }
    return item.acronym || '';
  } else if (props.type === 'Institutions') {
    return item.country || item.address_country || '';
  } else if (props.type === 'Products') {
    return item.type_title || item.product_type_name || '';
  }
  return '';
};

const getCordisUrl = (projectId: string) => {
  return `http://cordis.europa.eu/project/id/${projectId}`;
};
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900">
        {{ type }} ({{ items.length }})
      </h3>
    </div>
    
    <div class="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
      <div
        v-for="(item, index) in items"
        :key="(item as any).id || index"
        class="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <div class="flex flex-col">
          <div class="font-medium text-gray-900">
            <a
              v-if="type === 'Projects' && (item as any).cordis_id"
              :href="getCordisUrl((item as any).cordis_id)"
              target="_blank"
              rel="noopener noreferrer"
              class="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              {{ getItemTitle(item as any) }}
            </a>
            <span v-else>
              {{ getItemTitle(item as any) }}
            </span>
          </div>
          <div v-if="getItemSubtitle(item as any)" class="text-sm text-gray-500 mt-1">
            {{ getItemSubtitle(item as any) }}
          </div>
          <div v-if="type === 'Projects' && (item as any).totalCost" class="text-xs text-gray-400 mt-1">
            Cost: {{ formatter((item as any).totalCost) }} €
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

