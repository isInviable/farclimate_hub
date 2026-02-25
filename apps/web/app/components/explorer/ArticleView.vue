<template>
  <!-- Main content here -->
  <div :class="gridClass">
    <section>
      <div class="grid grid-cols-5 gap-4">
        <!-- first row -->
        <div class="bg-gray-50 px-4 py-2">
            <p class="text-xs pt-1"><span class="font-mono">sector: </span>{{ parsedDocument.sectors }}</p>
        </div>
        <div class="bg-gray-50 px-4 py-2 col-span-2">
            <p class="text-xs pt-1"><span class="font-mono">hazards: </span>{{ parsedDocument.climate_impacts }}</p>
        </div>
        <div class="bg-gray-50 px-4 py-2 ">
            <p class="text-xs pt-1"><span class="font-mono">date: </span>{{ parsedDocument.implementation_years }}</p>
        </div>
        <div class="bg-gray-50 px-4 py-2 ">
            <p class="text-xs pt-1"><span class="font-mono">phase: </span>N/A</p>
        </div>

        <!-- row 2 -->
        <div class="bg-gray-50 px-4 py-2 col-span-3">
            <p class="text-xs pt-1"><span class="font-mono">type of solution: </span><strong>{{ parsedDocument.adaptation_approaches }}</strong></p>
        </div>
        <div class="bg-gray-50 px-4 py-2 col-span-2">
            <p class="text-xs pt-1"><span class="font-mono">source: </span>ClimateAdapt</p>
        </div>

        <!-- row 3 title and map -->
        <div class="col-span-3 col-start-1 bg-white p-6 border border-white hover:border-sky-500 border-dashed">
            <h1 class="h1 text-2xl font-bold leading-6 text-stone-800 grow">{{ document.title }}</h1>
        </div>
        <div class="col-span-2 row-span-2 bg-white">
            <div class="border border-dashed border-white hover:border-sky-500 aspect-video">
                <MapBase v-if="mapPoints.length > 0" :points="mapPoints" class="w-full h-full" />
                <img v-else :src="document.image_url || '/img/dummy_map.png'" alt="article image" class="h-auto w-full mb-2 object-cover">
            </div>
            <div class="px-4 py-2 bg-gray-50 mt-2">
                <p class="text-xs pt-1 text-right"><span class="font-mono float-left">location: </span>{{ parsedDocument.location }}</p>
            </div>
            <div class="px-4 py-2 bg-gray-50 mt-2">
                <p class="text-xs pt-1 text-right"><span class="font-mono float-left">scale: </span>{{ document.governance_level }}</p>
            </div>
        </div>
        
        <!-- who -->
        <div class="col-span-3 col-start-1 bg-white p-6 border border-dashed border-white hover:border-sky-500 ">
            <h6 class="font-mono text-sm mb-2">who</h6>
            <p>{{ document.stakeholder_participation }}</p>
        </div>

        <!-- short description -->
        <div class="col-span-3 col-start-1 bg-white p-6 border border-white hover:border-sky-500 border-dashed">
            <h6 class="font-mono text-sm mb-2">short description</h6>
            <p>{{ document.subtitle }}</p>
        </div>

        <div class="col-span-2 row-span-2 col-start-4 bg-white">
            <div class=" p-6 border border-white hover:border-sky-500 border-dashed">
                <h6 class="font-mono text-sm mb-2">media gallery</h6>
                <div class="grid grid-cols-2 gap-2">
                    <img :src="document.image_url || '/img/img_placeholder.png'" alt="dummy map" class="aspect-video border border-white hover:border-sky-500 border-dashed">
                    <img src="/img/img_placeholder.png" alt="dummy map" class="aspect-video">
                    <img src="/img/video_placeholder.png" alt="dummy map" class="h-auto w-full ">
                </div>
            </div>
            <div class=" p-6 border border-white hover:border-sky-500 border-dashed">
                <h6 class="font-mono text-sm mb-2">keywords:</h6>
                <p>{{ parsedDocument.keywords }}</p>
            </div>
        </div>

        <!-- economic data -->
        <div class="col-span-5 col-start-1 bg-white p-6 border border-white hover:border-sky-500 border-dashed tBlock">
            <h6 class="font-mono text-sm mb-2">economic data</h6>
            <div v-html="parsedDocument.cost_benefit"></div>
        </div>

        <div class="col-span-5 px-4 pt-2 border-t border-dashed border-gray-300"></div>

        <!-- DYNAMIC SECTIONS FROM FULLTEXT -->
        <template v-for="(section, title) in parsedDocument.sections" :key="title">
          <div v-if="section" class="col-span-5 bg-white p-6 border border-white hover:border-sky-500 border-dashed tBlock">
              <h6 class="font-mono text-sm mb-2 capitalize">{{ title }}</h6>
              <div v-html="section"></div>
          </div>
        </template>

        <!-- separation row  -->
        <div class="col-span-5  px-4 pt-2 border-t border-dashed border-gray-300"></div>

        <div class="col-span-3  bg-white p-6 border border-white hover:border-sky-500 border-dashed ">
            <h6 class="font-mono text-sm mb-2">contact persons</h6>
            <p>{{ document.contact }}</p>
        </div>

        <div class="col-span-2  bg-white p-6 border border-white hover:border-sky-500 border-dashed ">
            <h6 class="font-mono text-sm mb-2">institutions</h6>
            <p>not available</p>
        </div>


        <div class="col-span-5  bg-white p-6 border border-white hover:border-sky-500 border-dashed ">
            <h6 class="font-mono text-sm mb-2">websites</h6>
            <a :href="document.websites?.url" target="_blank" class="font-semibold block text-base  mb-2 hover:underline">{{ document.websites?.url }}</a>
        </div>

        <div class="col-span-5  bg-white p-6 border border-white hover:border-sky-500 border-dashed ">
            <h6 class="font-mono text-sm mb-2">scientific references</h6>
            <p>{{ document.references }}</p>
        </div>

      </div>
    </section>
    
    <aside v-if="showSidebar">
        <div class="sticky top-8">
            <div class="bg-white p-2 rounded-lg shadow-lg border border-gray-100 text-xs">
                <p class="font-bold text-xs px-2 py-2 mb-4">table of contents:</p>
                <!-- TOC items would go here, maybe auto-generated from sections -->
            </div>
        </div>
    </aside>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import MarkdownIt from 'markdown-it';
import MapBase from '~/components/MapBase.vue';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

const props = defineProps({
    document: {
        type: Object,
        required: true
    },
    showSidebar: {
        type: Boolean,
        default: true,
    }
});
onMounted(() => {
    console.log(props.document);
});

const gridClass = computed(() => {
    return props.showSidebar ? 'grid grid-cols-[7fr_2fr] gap-8' : 'grid grid-cols-1';
});

const mapPoints = computed(() => {
    if (props.document && props.document.location && Array.isArray(props.document.location) && props.document.location.length === 2) {
        return [{
            label: props.document.title,
            location: {
                lat: props.document.location[0],
                lon: props.document.location[1]
            },
            articleId: props.document.id
        }];
    }
    return [];
});

function parseFullText(fulltext) {
    if (!fulltext) return {};
    const sections = {};
    const regex = /#####\s(.*?)\n([\s\S]*?)(?=\n##|#?$)/g;
    let match;
    while ((match = regex.exec(fulltext)) !== null) {
        const title = match[1].toLowerCase().trim().replace(/s\s*$/, "s");
        const content = md.render(match[2].trim());
        if(title === 'solutions' || title === 'challenges' || title === 'costs and benefits' || title === 'success and limiting factors' || title === 'stakeholder participation') {
            sections[title] = content;
        }
    }
    return sections;
}

const parsedDocument = computed(() => {
    if (!props.document) return {};
    
    const doc = props.document;
    const sections = parseFullText(doc.fulltext);

    return {
        sectors: doc.sectors,
        climate_impacts: Array.isArray(doc.climate_impacts) ? doc.climate_impacts.join(', ') : '',
        implementation_years: `${doc.implementation_years?.start_year || 'N/A'} - ${doc.implementation_years?.end_year || 'N/A'}`,
        adaptation_approaches: Array.isArray(doc.adaptation_approaches) ? doc.adaptation_approaches.join(', ') : '',
        location: Array.isArray(doc.location) ? `${doc.location[0].toFixed(2)}, ${doc.location[1].toFixed(2)}` : (doc.geographic_characterisation?.city || doc.geographic_characterisation?.countries || 'N/A'),
        keywords: Array.isArray(doc.keywords) ? doc.keywords.join(', ') : '',
        cost_benefit: md.render(doc.cost_benefit || ''),
        sections: sections,
    }
});

</script>

<style scoped>
.tBlock :deep(p) {
    margin-bottom: 0.75rem;
}
</style> 