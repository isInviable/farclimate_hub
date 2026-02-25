<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const { user, signOut, isAuthenticated } = useAuth();
const router = useRouter();

const items: NavigationMenuItem[] = [
  {
    label: "Entities (CORDIS)",
    icon: "i-lucide-building-2",
    to: "/admin/entities",
  },
  {
    label: "Projects (CORDIS)",
    icon: "i-lucide-folders",
    to: "/admin/projects",
  },
  {
    label: "Products (CORDIS)",
    icon: "i-lucide-package-search",
    to: "/admin/products",
  },
  {
    label: "Products (custom)",
    icon: "i-lucide-package-plus",
    to: "/admin/products-custom",
  },
  {
    label: "Climate risks",
    icon: "i-lucide-zap",
    to: "/admin/aux-climate-risks",
  },
  {
    label: "Themes",
    icon: "i-lucide-layers-3",
    to: "/admin/aux-themes",
  },
];

const handleLogout = async () => {
  const { error } = await signOut();
  if (!error) {
    await router.push("/login");
  }
};

const userEmail = computed(() => user.value?.email || "User");
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="admin"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <div class="flex items-center gap-2">
          <UIcon
            name="i-simple-icons-nuxtdotjs"
            class="size-5 text-primary"
          />
          <span v-if="!collapsed" class="text-sm font-semibold truncate">
            Admin panel
          </span>
        </div>
        <div v-if="!collapsed" class="mt-2">
          <UBadge
            :color="isAuthenticated ? 'green' : 'gray'"
            variant="soft"
            size="xs"
          >
            <UIcon
              :name="isAuthenticated ? 'i-heroicons-check-circle' : 'i-heroicons-eye'"
              class="w-3 h-3 mr-1"
            />
            {{ isAuthenticated ? 'Edit Mode' : 'View Only' }}
          </UBadge>
        </div>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :items="items"
          :collapsed="collapsed"
          orientation="vertical"
          class="w-full"
        />
      </template>

      <template #footer="{ collapsed }">
        <div class="p-4 space-y-2">
          <div v-if="!collapsed && isAuthenticated" class="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 truncate">
            {{ userEmail }}
          </div>
          <UButton
            v-if="isAuthenticated"
            block
            variant="ghost"
            color="red"
            @click="handleLogout"
            :class="{ 'justify-center': collapsed }"
          >
            <UIcon name="i-lucide-log-out" class="w-4 h-4" />
            <span v-if="!collapsed" class="ml-2">Logout</span>
          </UButton>
          <UButton
            v-else
            block
            variant="ghost"
            color="primary"
            to="/login"
            :class="{ 'justify-center': collapsed }"
          >
            <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-4 h-4" />
            <span v-if="!collapsed" class="ml-2">Login to Edit</span>
          </UButton>
        </div>
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>


