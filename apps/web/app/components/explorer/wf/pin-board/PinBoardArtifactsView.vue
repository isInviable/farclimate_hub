<template>
  <section class="space-y-6">
    <UCard>
      <template #header>
        <div>
          <h2 class="text-xl font-semibold text-gray-900">
            {{ $t("podcast.artifacts.title") }}
          </h2>
          <p class="text-sm text-gray-500">
            {{ $t("podcast.artifacts.description") }}
          </p>
        </div>
      </template>

      <div class="space-y-4">
        <div>
          <h3 class="flex items-center gap-2 text-lg font-medium text-gray-900">
            <UIcon name="i-heroicons-speaker-wave" class="h-5 w-5 text-primary-500" />
            {{ $t("podcast.artifacts.audioTitle") }}
          </h3>
          <p class="mt-1 text-sm text-gray-500">
            {{ $t("podcast.artifacts.audioDescription") }}
          </p>
        </div>

        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          :title="$t('podcast.artifacts.loadError')"
          :description="error"
        />

        <div v-if="loading" class="flex items-center gap-3 py-6 text-gray-600">
          <UIcon name="i-heroicons-arrow-path" class="h-5 w-5 animate-spin" />
          <span>{{ $t("podcast.artifacts.loading") }}</span>
        </div>

        <UAlert
          v-else-if="podcasts.length === 0"
          color="neutral"
          variant="soft"
          icon="i-heroicons-information-circle"
          :title="$t('podcast.artifacts.emptyTitle')"
          :description="$t('podcast.artifacts.emptyDescription')"
        />

        <div v-else class="grid gap-4 md:grid-cols-2">
          <UCard
            v-for="podcast in podcasts"
            :key="podcast.id"
            variant="subtle"
          >
            <div class="space-y-3">
              <div>
                <h4 class="font-semibold text-gray-900">
                  {{ podcast.title || $t("podcast.artifacts.untitled") }}
                </h4>
                <p class="text-xs text-gray-500">
                  {{ formatDate(podcast.created_at) }}
                  <span v-if="podcast.byte_size">
                    · {{ formatBytes(podcast.byte_size) }}
                  </span>
                </p>
              </div>

              <ClientOnly>
                <audio
                  v-if="audioUrls[podcast.id]"
                  :src="audioUrls[podcast.id]"
                  controls
                  class="w-full"
                />
                <UButton
                  v-else
                  type="button"
                  variant="soft"
                  color="primary"
                  size="sm"
                  :loading="loadingLinks[podcast.id]"
                  @click="loadAudioUrl(podcast)"
                >
                  {{ $t("podcast.artifacts.loadAudio") }}
                </UButton>
              </ClientOnly>

              <div class="flex flex-wrap gap-2">
                <UButton
                  type="button"
                  size="sm"
                  variant="outline"
                  icon="i-heroicons-arrow-down-tray"
                  :loading="downloading[podcast.id]"
                  @click="downloadPodcast(podcast)"
                >
                  {{ $t("podcast.artifacts.download") }}
                </UButton>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </UCard>
  </section>
</template>

<script setup lang="ts">
import type { HumanArtifactRow } from "~/types/artifacts";

const props = defineProps<{
  podcasts: readonly HumanArtifactRow[];
  loading?: boolean;
  error?: string | null;
}>();

const podcastArtifacts = usePodcastArtifacts();

const audioUrls = ref<Record<string, string>>({});
const loadingLinks = ref<Record<string, boolean>>({});
const downloading = ref<Record<string, boolean>>({});

watch(
  () => props.podcasts.map((podcast) => podcast.id).join(","),
  () => {
    const ids = new Set(props.podcasts.map((podcast) => podcast.id));
    audioUrls.value = Object.fromEntries(
      Object.entries(audioUrls.value).filter(([id]) => ids.has(id))
    );
  }
);

async function loadAudioUrl(podcast: HumanArtifactRow) {
  loadingLinks.value = { ...loadingLinks.value, [podcast.id]: true };
  try {
    const url = await podcastArtifacts.signedUrlForArtifact(podcast);
    if (url) {
      audioUrls.value = { ...audioUrls.value, [podcast.id]: url };
    }
  } finally {
    loadingLinks.value = { ...loadingLinks.value, [podcast.id]: false };
  }
}

async function downloadPodcast(podcast: HumanArtifactRow) {
  downloading.value = { ...downloading.value, [podcast.id]: true };
  try {
    const url = await podcastArtifacts.signedUrlForArtifact(podcast, true);
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.download = `${podcast.title || "podcast"}.mp3`;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    downloading.value = { ...downloading.value, [podcast.id]: false };
  }
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}
</script>
