<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { RouterView } from 'vue-router'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/Input.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import { useTheme } from '@/composables/useTheme'
import { useSectionsStore } from '@/stores/sections'
import { useTagsStore } from '@/stores/tags'
import { Sun, Moon, Search, X } from 'lucide-vue-next'

const { isDark, toggle: toggleTheme } = useTheme()
const sectionsStore = useSectionsStore()
const tagsStore = useTagsStore()
const router = useRouter()
const route = useRoute()

const globalSearch = ref((route.query.q as string) || '')
let searchTimeout: ReturnType<typeof setTimeout>

// Keep input in sync if query changes externally (e.g. navigating away)
watch(() => route.query.q, (q) => {
  globalSearch.value = (q as string) || ''
})

function onGlobalSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    const q = globalSearch.value.trim()
    if (q) {
      sectionsStore.setActive(null, 'all')
      router.push({ path: '/', query: { q } })
    } else {
      router.push({ path: '/' })
    }
  }, 300)
}

function clearSearch() {
  globalSearch.value = ''
  router.push({ path: '/' })
}

onMounted(async () => {
  await Promise.all([sectionsStore.fetchSections(), tagsStore.fetchTags()])
})
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <header class="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger class="-ml-1" />
        <Separator orientation="vertical" class="mr-2 h-4" />
        <!-- Global search -->
        <div class="relative flex-1 max-w-md">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            v-model="globalSearch"
            placeholder="Cerca in tutti i contatti..."
            class="pl-9 h-9"
            @input="onGlobalSearch"
          />
          <button
            v-if="globalSearch"
            @click="clearSearch"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X class="h-4 w-4" />
          </button>
        </div>
        <div class="ml-auto">
          <Button variant="ghost" size="icon" @click="toggleTheme">
            <Sun v-if="isDark" class="size-5" />
            <Moon v-else class="size-5" />
          </Button>
        </div>
      </header>
      <main class="flex-1 overflow-auto">
        <RouterView />
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>
