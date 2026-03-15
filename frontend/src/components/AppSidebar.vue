<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useSectionsStore } from '@/stores/sections'
import {
  BookUser,
  Building2,
  User,
  ChevronRight,
  ChevronsUpDown,
  Settings,
  LogOut,
  Users,
  Tag,
  Layers,
  Info,
  Github,
} from 'lucide-vue-next'
import Dialog from '@/components/ui/Dialog.vue'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'vue-sonner'
import { getIconComponent } from '@/lib/sectionIcons'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const sections = useSectionsStore()
const showInfo = ref(false)

function getUserInitials() {
  const name = auth.user?.displayName || ''
  return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
}

function selectSection(id: number | null, type: 'all' | 'company' | 'personal') {
  sections.setActive(id, type)
  router.push('/')
}

function handleLogout() {
  auth.logout()
  toast.success(t('nav.logoutSuccess'))
  router.push('/login')
}
</script>

<template>
  <Sidebar collapsible="icon">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" as-child :is-active="sections.activeSection === null && sections.activeType === 'all'">
            <a href="#" @click.prevent="selectSection(null, 'all')">
              <div class="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <BookUser class="size-4" />
              </div>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold">Rubrica</span>
                <span class="truncate text-xs text-muted-foreground">{{ t('nav.allContacts') }}</span>
              </div>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <SidebarContent>
      <!-- Company -->
      <SidebarGroup v-if="auth.isAdmin || sections.companySections.length">
        <SidebarGroupLabel class="group-data-[collapsible=icon]:hidden">{{ t('nav.company') }}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton as-child :tooltip="t('nav.allCompany')" :is-active="sections.activeSection === null && sections.activeType === 'company'">
                <a href="#" @click.prevent="selectSection(null, 'company')">
                  <Building2 />
                  <span class="group-data-[collapsible=icon]:hidden">{{ t('nav.allCompany') }}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem v-for="s in sections.companySections" :key="s.id">
              <SidebarMenuButton as-child :tooltip="s.name" :is-active="sections.activeSection === s.id">
                <a href="#" @click.prevent="selectSection(s.id, 'company')">
                  <component :is="getIconComponent(s.icon) || ChevronRight" class="size-3.5" />
                  <span class="truncate group-data-[collapsible=icon]:hidden">{{ s.name }}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarSeparator />

      <!-- Personal -->
      <SidebarGroup>
        <SidebarGroupLabel class="group-data-[collapsible=icon]:hidden">{{ t('nav.personal') }}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton as-child :tooltip="t('nav.allPersonal')" :is-active="sections.activeSection === null && sections.activeType === 'personal'">
                <a href="#" @click.prevent="selectSection(null, 'personal')">
                  <User />
                  <span class="group-data-[collapsible=icon]:hidden">{{ t('nav.allPersonal') }}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem v-for="s in sections.personalSections" :key="s.id">
              <SidebarMenuButton as-child :tooltip="s.name" :is-active="sections.activeSection === s.id">
                <a href="#" @click.prevent="selectSection(s.id, 'personal')">
                  <component :is="getIconComponent(s.icon) || ChevronRight" class="size-3.5" />
                  <span class="truncate group-data-[collapsible=icon]:hidden">{{ s.name }}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <SidebarMenuButton size="lg" class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                <Avatar class="h-8 w-8 rounded-lg">
                  <AvatarFallback class="rounded-lg">{{ getUserInitials() }}</AvatarFallback>
                </Avatar>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-semibold">{{ auth.user?.displayName }}</span>
                  <span class="truncate text-xs text-muted-foreground">{{ auth.user?.role }}</span>
                </div>
                <ChevronsUpDown class="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent class="w-[--reka-popper-anchor-width] min-w-56 rounded-lg" side="bottom" align="end" :side-offset="4">
              <DropdownMenuItem @click="router.push('/settings')">
                <Settings class="mr-2 size-4" />
                {{ t('nav.settings') }}
              </DropdownMenuItem>
              <DropdownMenuItem @click="router.push('/sections')">
                <Layers class="mr-2 size-4" />
                {{ t('nav.sections') }}
              </DropdownMenuItem>
              <DropdownMenuItem @click="router.push('/tags')">
                <Tag class="mr-2 size-4" />
                {{ t('nav.tags') }}
              </DropdownMenuItem>
              <DropdownMenuItem v-if="auth.isAdmin" @click="router.push('/admin/users')">
                <Users class="mr-2 size-4" />
                {{ t('nav.users') }}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="showInfo = true">
                <Info class="mr-2 size-4" />
                {{ t('nav.info') }}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="handleLogout" class="text-destructive focus:text-destructive">
                <LogOut class="mr-2 size-4" />
                {{ t('nav.logout') }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>

    <SidebarRail />
  </Sidebar>

  <Dialog :open="showInfo" @close="showInfo = false">
    <div class="space-y-4 text-sm text-center">
      <div class="flex flex-col items-center gap-3">
        <div class="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <BookUser class="size-6" />
        </div>
        <div>
          <p class="font-semibold text-base">Rubrica</p>
          <p class="text-muted-foreground text-xs">v1.0.0</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        {{ t('settings.madeBy') }}
        <a
          href="https://github.com/Cristian9828"
          target="_blank"
          rel="noopener noreferrer"
          class="text-foreground hover:underline font-medium"
        >Cristian Rama</a>
      </p>
      <p class="text-muted-foreground text-xs">MIT License</p>
      <div class="flex justify-center">
        <a
          href="https://github.com/Cristian9828/rubrica"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Github class="size-4" />
          GitHub
        </a>
      </div>
    </div>
  </Dialog>
</template>
