<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useContactsStore, type Contact } from '@/stores/contacts';
import { useSectionsStore } from '@/stores/sections';
import { useTagsStore } from '@/stores/tags';
import { useAuthStore } from '@/stores/auth';
import ContactCard from '@/components/ContactCard.vue';
import ContactForm from '@/components/ContactForm.vue';
import Sheet from '@/components/ui/Sheet.vue';
import { Button } from '@/components/ui/button';
import Badge from '@/components/ui/Badge.vue';
import {
  Plus,
  Download,
  UserPlus,
  BookOpen,
  LayoutGrid,
  List,
  Building2,
  User,
  Phone,
  Mail,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Archive,
} from 'lucide-vue-next';

const { t } = useI18n();
const route = useRoute();
const contactsStore = useContactsStore();
const sectionsStore = useSectionsStore();
const tagsStore = useTagsStore();
const auth = useAuthStore();

const selectedTagId = ref<number | null>(null);
const showForm = ref(false);
const editContact = ref<Contact | null>(null);
const showFilters = ref(false);
const showArchived = ref(false);
const viewMode = ref<'grid' | 'table'>(
  (localStorage.getItem('contactsViewMode') as 'grid' | 'table') || 'grid'
);
const sortBy = ref<string | null>(null);
const sortDir = ref<'asc' | 'desc'>('asc');

watch(viewMode, (v) => localStorage.setItem('contactsViewMode', v));

const sortedContacts = computed(() => {
  if (!sortBy.value) return contactsStore.contacts;
  return [...contactsStore.contacts].sort((a, b) => {
    let av = '';
    let bv = '';
    if (sortBy.value === 'name') {
      av = [a.firstName, a.lastName].filter(Boolean).join(' ').toLowerCase();
      bv = [b.firstName, b.lastName].filter(Boolean).join(' ').toLowerCase();
    } else if (sortBy.value === 'company') {
      av = [a.role, a.company].filter(Boolean).join(' @ ').toLowerCase();
      bv = [b.role, b.company].filter(Boolean).join(' @ ').toLowerCase();
    } else if (sortBy.value === 'type') {
      av = a.type;
      bv = b.type;
    }
    const cmp = av.localeCompare(bv);
    return sortDir.value === 'asc' ? cmp : -cmp;
  });
});

function toggleSort(col: string) {
  if (sortBy.value === col) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortBy.value = col;
    sortDir.value = 'asc';
  }
}

const title = computed(() => {
  if (showArchived.value) return t('contacts.titleArchive');
  if (sectionsStore.activeSection) {
    const sec = sectionsStore.sections.find(
      (s) => s.id === sectionsStore.activeSection,
    );
    return sec?.name || t('contacts.titleAll');
  }
  if (sectionsStore.activeType === 'company') return t('contacts.titleCompany');
  if (sectionsStore.activeType === 'personal') return t('contacts.titlePersonal');
  return t('contacts.titleAll');
});

async function load() {
  const q = (route.query.q as string) || undefined;
  await contactsStore.fetchContacts({
    sectionId: q || showArchived.value ? undefined : (sectionsStore.activeSection || undefined),
    tagId: showArchived.value ? undefined : (selectedTagId.value || undefined),
    type: q || showArchived.value ? undefined : (sectionsStore.activeType !== 'all' ? sectionsStore.activeType : undefined),
    search: q,
    archived: showArchived.value || undefined,
  });
}

watch(
  [() => sectionsStore.activeSection, () => sectionsStore.activeType],
  load,
);

watch(selectedTagId, load);
watch(showArchived, load);
watch(() => route.query.q, load);
onMounted(load);

function openNew() {
  editContact.value = null;
  showForm.value = true;
}

function openEdit(contact: Contact) {
  editContact.value = contact;
  showForm.value = true;
}

async function onSaved() {
  showForm.value = false;
  editContact.value = null;
  await load();
}

async function onDeleted() {
  showForm.value = false;
  editContact.value = null;
  await load();
}

async function onArchived() {
  showForm.value = false;
  editContact.value = null;
  await load();
}

async function onUnarchived() {
  showForm.value = false;
  editContact.value = null;
  await load();
}

function fullName(c: Contact) {
  return [c.firstName, c.lastName].filter(Boolean).join(' ');
}
</script>

<template>
  <div class="p-4 lg:p-6 space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between gap-4">
      <h1 class="text-xl lg:text-2xl font-bold">{{ title }}</h1>
      <div class="flex items-center gap-2">
        <!-- Toggle archivio -->
        <button
          :class="['flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-sm transition-colors', showArchived ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent']"
          @click="showArchived = !showArchived"
          :title="t('contacts.archive')"
        >
          <Archive class="h-4 w-4" />
          <span class="hidden sm:inline">{{ t('contacts.archive') }}</span>
        </button>

        <!-- View mode toggle -->
        <div class="flex items-center border rounded-md overflow-hidden">
          <button
            :class="['px-2.5 py-1.5 transition-colors', viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent']"
            @click="viewMode = 'grid'"
            :title="t('contacts.grid')"
          >
            <LayoutGrid class="h-4 w-4" />
          </button>
          <button
            :class="['px-2.5 py-1.5 transition-colors', viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent']"
            @click="viewMode = 'table'"
            :title="t('contacts.table')"
          >
            <List class="h-4 w-4" />
          </button>
        </div>

        <div v-if="contactsStore.contacts.length" class="relative group">
          <Button variant="outline" size="sm" @click="showFilters = !showFilters">
            <Download class="h-4 w-4 mr-1" />
            <span class="hidden sm:inline">{{ t('contacts.export') }}</span>
          </Button>
          <div
            v-if="showFilters"
            class="absolute right-0 top-full mt-1 bg-popover border rounded-md shadow-md p-2 z-10 space-y-1 min-w-[120px]"
          >
            <button
              class="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-accent"
              @click="contactsStore.exportContacts('xlsx', sectionsStore.activeSection || undefined, sectionsStore.activeType !== 'all' ? sectionsStore.activeType : undefined); showFilters = false"
            >
              Excel (.xlsx)
            </button>
            <button
              class="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-accent"
              @click="contactsStore.exportContacts('vcf', sectionsStore.activeSection || undefined, sectionsStore.activeType !== 'all' ? sectionsStore.activeType : undefined); showFilters = false"
            >
              vCard (.vcf)
            </button>
          </div>
        </div>
        <Button size="sm" @click="openNew">
          <Plus class="h-4 w-4 mr-1" />
          <span class="hidden sm:inline">{{ t('contacts.newContact') }}</span>
        </Button>
      </div>
    </div>

    <!-- Tag filters -->
    <div v-if="tagsStore.tags.length" class="flex gap-1 flex-wrap">
      <Badge
        v-for="tag in tagsStore.tags"
        :key="tag.id"
        :variant="selectedTagId === tag.id ? 'default' : 'outline'"
        class="cursor-pointer"
        @click="selectedTagId = selectedTagId === tag.id ? null : tag.id"
      >
        {{ tag.name }}
      </Badge>
    </div>

    <!-- Loading -->
    <div v-if="contactsStore.loading" class="flex items-center justify-center py-20">
      <div class="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
    </div>

    <!-- Empty -->
    <div
      v-else-if="contactsStore.contacts.length === 0"
      class="flex flex-col items-center justify-center py-20 text-muted-foreground"
    >
      <BookOpen class="h-12 w-12 mb-4" />
      <p class="text-lg font-medium">{{ t('contacts.empty') }}</p>
      <p class="text-sm">{{ t('contacts.emptyHint') }}</p>
      <Button class="mt-4" @click="openNew">
        <UserPlus class="h-4 w-4 mr-2" />
        {{ t('contacts.addContact') }}
      </Button>
    </div>

    <!-- Grid view -->
    <div
      v-else-if="viewMode === 'grid'"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
    >
      <ContactCard
        v-for="contact in sortedContacts"
        :key="contact.id"
        :contact="contact"
        @click="openEdit(contact)"
      />
    </div>

    <!-- Table view -->
    <div v-else class="rounded-lg border overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-muted/50">
          <tr class="border-b">
            <th class="text-left px-4 py-3 font-medium text-muted-foreground">
              <button class="inline-flex items-center gap-1 hover:text-foreground" @click="toggleSort('name')">
                {{ t('contacts.colName') }}
                <ChevronUp v-if="sortBy === 'name' && sortDir === 'asc'" class="h-3.5 w-3.5" />
                <ChevronDown v-else-if="sortBy === 'name' && sortDir === 'desc'" class="h-3.5 w-3.5" />
                <ChevronsUpDown v-else class="h-3.5 w-3.5 opacity-40" />
              </button>
            </th>
            <th class="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">
              <button class="inline-flex items-center gap-1 hover:text-foreground" @click="toggleSort('type')">
                {{ t('contacts.colType') }}
                <ChevronUp v-if="sortBy === 'type' && sortDir === 'asc'" class="h-3.5 w-3.5" />
                <ChevronDown v-else-if="sortBy === 'type' && sortDir === 'desc'" class="h-3.5 w-3.5" />
                <ChevronsUpDown v-else class="h-3.5 w-3.5 opacity-40" />
              </button>
            </th>
            <th class="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
              <button class="inline-flex items-center gap-1 hover:text-foreground" @click="toggleSort('company')">
                {{ t('contacts.colCompany') }}
                <ChevronUp v-if="sortBy === 'company' && sortDir === 'asc'" class="h-3.5 w-3.5" />
                <ChevronDown v-else-if="sortBy === 'company' && sortDir === 'desc'" class="h-3.5 w-3.5" />
                <ChevronsUpDown v-else class="h-3.5 w-3.5 opacity-40" />
              </button>
            </th>
            <th class="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">{{ t('contacts.colPhone') }}</th>
            <th class="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">{{ t('contacts.colEmail') }}</th>
            <th class="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">{{ t('contacts.colTags') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="contact in sortedContacts"
            :key="contact.id"
            class="border-b last:border-0 hover:bg-muted/40 cursor-pointer transition-colors"
            @click="openEdit(contact)"
          >
            <td class="px-4 py-3 font-medium">{{ fullName(contact) }}</td>
            <td class="px-4 py-3 hidden sm:table-cell">
              <span class="inline-flex items-center gap-1">
                <Building2 v-if="contact.type === 'company'" class="h-3.5 w-3.5 text-blue-500" />
                <User v-else class="h-3.5 w-3.5 text-emerald-500" />
                <span class="text-muted-foreground text-xs">{{ contact.type === 'company' ? t('contacts.typeCompany') : t('contacts.typePersonal') }}</span>
              </span>
            </td>
            <td class="px-4 py-3 text-muted-foreground hidden md:table-cell">
              {{ [contact.role, contact.company].filter(Boolean).join(' @ ') || '—' }}
            </td>
            <td class="px-4 py-3 hidden lg:table-cell">
              <a
                v-if="contact.phones?.length"
                :href="`tel:${contact.phones[0]}`"
                @click.stop
                class="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:underline"
              >
                <Phone class="h-3.5 w-3.5 shrink-0" />{{ contact.phones[0] }}
              </a>
              <span v-else class="text-muted-foreground/40">—</span>
            </td>
            <td class="px-4 py-3 hidden lg:table-cell">
              <a
                v-if="contact.emails?.length"
                :href="`mailto:${contact.emails[0]}`"
                @click.stop
                class="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:underline"
              >
                <Mail class="h-3.5 w-3.5 shrink-0" />{{ contact.emails[0] }}
              </a>
              <span v-else class="text-muted-foreground/40">—</span>
            </td>
            <td class="px-4 py-3 hidden xl:table-cell">
              <div class="flex flex-wrap gap-1">
                <Badge
                  v-for="tag in contact.tags"
                  :key="tag.id"
                  variant="secondary"
                  class="text-[10px] px-1.5 py-0"
                >{{ tag.name }}</Badge>
                <span v-if="!contact.tags?.length" class="text-muted-foreground/40">—</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Contact form sheet -->
    <Sheet :open="showForm" @close="showForm = false">
      <ContactForm
        :contact="editContact"
        @saved="onSaved"
        @deleted="onDeleted"
        @archived="onArchived"
        @unarchived="onUnarchived"
        @close="showForm = false"
      />
    </Sheet>
  </div>
</template>
