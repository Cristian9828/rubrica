<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useContactsStore, type Contact } from '@/stores/contacts';
import { useSectionsStore } from '@/stores/sections';
import { useTagsStore } from '@/stores/tags';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/Input.vue';
import Badge from '@/components/ui/Badge.vue';
import Dialog from '@/components/ui/Dialog.vue';
import { X, Plus, Trash2, AlertTriangle, Camera, MapPin, Archive, ArchiveRestore } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

const { t } = useI18n();
const props = defineProps<{ contact: Contact | null }>();
const emit = defineEmits<{ saved: []; deleted: []; archived: []; unarchived: []; close: [] }>();

const contactsStore = useContactsStore();
const sectionsStore = useSectionsStore();
const tagsStore = useTagsStore();
const auth = useAuthStore();

const form = ref({
  firstName: '',
  lastName: '',
  company: '',
  role: '',
  phones: [''],
  emails: [''],
  website: '',
  notes: '',
  photo: null as string | null,
  address: '',
  city: '',
  postalCode: '',
  country: '',
  sectionId: null as number | null,
  type: 'personal' as 'company' | 'personal',
  tagIds: [] as number[],
});
const loading = ref(false);
const uploadingPhoto = ref(false);
const showDeleteConfirm = ref(false);

const isEdit = computed(() => !!props.contact);

const availableSections = computed(() => {
  return form.value.type === 'company'
    ? sectionsStore.companySections
    : sectionsStore.personalSections;
});

watch(
  () => props.contact,
  (c) => {
    if (c) {
      form.value = {
        firstName: c.firstName,
        lastName: c.lastName || '',
        company: c.company || '',
        role: c.role || '',
        phones: c.phones?.length ? [...c.phones] : [''],
        emails: c.emails?.length ? [...c.emails] : [''],
        website: c.website || '',
        notes: c.notes || '',
        photo: c.photo || null,
        address: c.address || '',
        city: c.city || '',
        postalCode: c.postalCode || '',
        country: c.country || '',
        sectionId: c.sectionId,
        type: c.type,
        tagIds: c.tags?.map((t) => t.id) || [],
      };
    } else {
      form.value = {
        firstName: '',
        lastName: '',
        company: '',
        role: '',
        phones: [''],
        emails: [''],
        website: '',
        notes: '',
        photo: null,
        address: '',
        city: '',
        postalCode: '',
        country: '',
        sectionId: sectionsStore.activeSection,
        type: sectionsStore.activeType === 'company' ? 'company' : 'personal',
        tagIds: [],
      };
    }
  },
  { immediate: true },
);

function addPhone() { form.value.phones.push(''); }
function removePhone(i: number) { form.value.phones.splice(i, 1); }
function addEmail() { form.value.emails.push(''); }
function removeEmail(i: number) { form.value.emails.splice(i, 1); }

function toggleTag(id: number) {
  const idx = form.value.tagIds.indexOf(id);
  if (idx !== -1) form.value.tagIds.splice(idx, 1);
  else form.value.tagIds.push(id);
}

async function onPhotoChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    toast.error(t('form.photoTooBig'));
    return;
  }
  uploadingPhoto.value = true;
  try {
    form.value.photo = await contactsStore.uploadPhoto(file);
  } catch {
    toast.error(t('form.photoError'));
  } finally {
    uploadingPhoto.value = false;
  }
}

async function save() {
  if (!form.value.firstName.trim()) {
    toast.error(t('form.nameRequired'));
    return;
  }
  loading.value = true;
  try {
    const payload = {
      ...form.value,
      phones: form.value.phones.filter(Boolean),
      emails: form.value.emails.filter(Boolean),
    };
    if (isEdit.value) {
      await contactsStore.updateContact(props.contact!.id, payload);
      toast.success(t('form.contactUpdated'));
    } else {
      await contactsStore.createContact(payload);
      toast.success(t('form.contactCreated'));
    }
    emit('saved');
  } catch (e: any) {
    toast.error(e.response?.data?.message || t('common.error'));
  } finally {
    loading.value = false;
  }
}

async function confirmDelete() {
  if (!props.contact) return;
  loading.value = true;
  showDeleteConfirm.value = false;
  try {
    await contactsStore.deleteContact(props.contact.id);
    toast.success(t('form.contactDeleted'));
    emit('deleted');
  } finally {
    loading.value = false;
  }
}

async function doArchive() {
  if (!props.contact) return;
  loading.value = true;
  try {
    await contactsStore.archiveContact(props.contact.id);
    toast.success(t('form.contactArchived'));
    emit('archived');
  } catch (e: any) {
    toast.error(e.response?.data?.message || t('common.error'));
  } finally {
    loading.value = false;
  }
}

async function doUnarchive() {
  if (!props.contact) return;
  loading.value = true;
  try {
    await contactsStore.unarchiveContact(props.contact.id);
    toast.success(t('form.contactRestored'));
    emit('unarchived');
  } catch (e: any) {
    toast.error(e.response?.data?.message || t('common.error'));
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold">
        {{ isEdit ? t('form.editContact') : t('form.newContact') }}
      </h2>
      <button @click="emit('close')" class="p-1 rounded hover:bg-accent">
        <X class="h-5 w-5" />
      </button>
    </div>

    <form @submit.prevent="save" class="space-y-4">
      <!-- Photo -->
      <div class="flex items-center gap-4">
        <div class="relative shrink-0">
          <div v-if="uploadingPhoto" class="h-16 w-16 rounded-full bg-muted flex items-center justify-center border">
            <div class="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
          </div>
          <img
            v-else-if="form.photo"
            :src="form.photo"
            class="h-16 w-16 rounded-full object-cover border"
          />
          <div
            v-else
            class="h-16 w-16 rounded-full bg-muted flex items-center justify-center border"
          >
            <Camera class="h-6 w-6 text-muted-foreground" />
          </div>
          <label class="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1 cursor-pointer hover:bg-primary/90">
            <Camera class="h-3 w-3" />
            <input type="file" accept="image/*" class="hidden" @change="onPhotoChange" :disabled="uploadingPhoto" />
          </label>
        </div>
        <div class="flex-1 space-y-1">
          <p class="text-sm font-medium">{{ t('form.profilePhoto') }}</p>
          <p class="text-xs text-muted-foreground">{{ uploadingPhoto ? t('form.photoUploading') : t('form.photoHint') }}</p>
          <button
            v-if="form.photo && !uploadingPhoto"
            type="button"
            class="text-xs text-destructive hover:underline"
            @click="form.photo = null"
          >{{ t('form.removePhoto') }}</button>
        </div>
      </div>

      <!-- Type -->
      <div class="space-y-2">
        <label class="text-sm font-medium">{{ t('form.type') }}</label>
        <div class="flex gap-2">
          <Button :variant="form.type === 'personal' ? 'default' : 'outline'" size="sm" @click="form.type = 'personal'" type="button">{{ t('form.typePersonal') }}</Button>
          <Button v-if="auth.isAdmin" :variant="form.type === 'company' ? 'default' : 'outline'" size="sm" @click="form.type = 'company'" type="button">{{ t('form.typeCompany') }}</Button>
        </div>
      </div>

      <!-- Section -->
      <div class="space-y-2">
        <label class="text-sm font-medium">{{ t('form.section') }}</label>
        <select
          v-model="form.sectionId"
          class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option :value="null">{{ t('form.noSection') }}</option>
          <option v-for="s in availableSections" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </div>

      <!-- Name -->
      <div class="grid grid-cols-2 gap-3">
        <div class="space-y-2">
          <label class="text-sm font-medium">{{ t('form.firstName') }}</label>
          <Input v-model="form.firstName" placeholder="Mario" />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium">{{ t('form.lastName') }}</label>
          <Input v-model="form.lastName" placeholder="Rossi" />
        </div>
      </div>

      <!-- Company & Role -->
      <div class="grid grid-cols-2 gap-3">
        <div class="space-y-2">
          <label class="text-sm font-medium">{{ t('form.company') }}</label>
          <Input v-model="form.company" placeholder="Azienda Srl" />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium">{{ t('form.role') }}</label>
          <Input v-model="form.role" placeholder="Manager" />
        </div>
      </div>

      <!-- Phones -->
      <div class="space-y-2">
        <label class="text-sm font-medium">{{ t('form.phones') }}</label>
        <div v-for="(_, i) in form.phones" :key="i" class="flex gap-2">
          <Input v-model="form.phones[i]" placeholder="+39 123 456 7890" class="flex-1" />
          <Button v-if="form.phones.length > 1" variant="ghost" size="icon" @click="removePhone(i)" type="button">
            <X class="h-4 w-4" />
          </Button>
        </div>
        <Button variant="ghost" size="sm" @click="addPhone" type="button">
          <Plus class="h-3 w-3 mr-1" /> {{ t('common.add') }}
        </Button>
      </div>

      <!-- Emails -->
      <div class="space-y-2">
        <label class="text-sm font-medium">{{ t('form.emails') }}</label>
        <div v-for="(_, i) in form.emails" :key="i" class="flex gap-2">
          <Input v-model="form.emails[i]" placeholder="mario@email.com" class="flex-1" />
          <Button v-if="form.emails.length > 1" variant="ghost" size="icon" @click="removeEmail(i)" type="button">
            <X class="h-4 w-4" />
          </Button>
        </div>
        <Button variant="ghost" size="sm" @click="addEmail" type="button">
          <Plus class="h-3 w-3 mr-1" /> {{ t('common.add') }}
        </Button>
      </div>

      <!-- Website -->
      <div class="space-y-2">
        <label class="text-sm font-medium">{{ t('form.website') }}</label>
        <Input v-model="form.website" placeholder="https://esempio.it" />
      </div>

      <!-- Address -->
      <div class="space-y-2">
        <label class="text-sm font-medium flex items-center gap-1.5">
          <MapPin class="h-3.5 w-3.5" /> {{ t('form.address') }}
        </label>
        <Input v-model="form.address" placeholder="Via Roma 1" />
        <div class="grid grid-cols-3 gap-2">
          <Input v-model="form.city" placeholder="Città" />
          <Input v-model="form.postalCode" placeholder="CAP" />
          <Input v-model="form.country" placeholder="Paese" />
        </div>
      </div>

      <!-- Notes -->
      <div class="space-y-2">
        <label class="text-sm font-medium">{{ t('form.notes') }}</label>
        <textarea
          v-model="form.notes"
          rows="3"
          class="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          :placeholder="t('form.notesPlaceholder')"
        />
      </div>

      <!-- Tags -->
      <div class="space-y-2">
        <label class="text-sm font-medium">{{ t('form.tags') }}</label>
        <div class="flex flex-wrap gap-1">
          <Badge
            v-for="tag in tagsStore.tags"
            :key="tag.id"
            :variant="form.tagIds.includes(tag.id) ? 'default' : 'outline'"
            class="cursor-pointer"
            @click="toggleTag(tag.id)"
          >
            {{ tag.name }}
          </Badge>
          <span v-if="!tagsStore.tags.length" class="text-sm text-muted-foreground">{{ t('form.noTags') }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2 pt-4 border-t">
        <Button type="submit" :disabled="loading" class="flex-1">
          {{ loading ? t('common.saving') : isEdit ? t('common.update') : t('common.create') }}
        </Button>
        <template v-if="isEdit">
          <Button
            v-if="!contact?.archivedAt"
            variant="outline"
            @click="doArchive"
            :disabled="loading"
            type="button"
            :title="t('form.archiveContact')"
          >
            <Archive class="h-4 w-4" />
          </Button>
          <Button
            v-else
            variant="outline"
            @click="doUnarchive"
            :disabled="loading"
            type="button"
            :title="t('form.restoreContact')"
          >
            <ArchiveRestore class="h-4 w-4" />
          </Button>
          <Button variant="destructive" @click="showDeleteConfirm = true" :disabled="loading" type="button">
            <Trash2 class="h-4 w-4" />
          </Button>
        </template>
      </div>
    </form>
  </div>

  <!-- Confirm delete dialog -->
  <Dialog :open="showDeleteConfirm" @close="showDeleteConfirm = false" class="max-w-sm">
    <div class="flex flex-col items-center gap-4 text-center">
      <div class="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10">
        <AlertTriangle class="h-6 w-6 text-destructive" />
      </div>
      <div>
        <h3 class="font-semibold text-base">{{ t('form.deleteTitle') }}</h3>
        <p class="text-sm text-muted-foreground mt-1">
          {{ t('form.deleteConfirm') }}
          <span class="font-medium text-foreground">{{ contact?.firstName }} {{ contact?.lastName }}</span>?
          {{ t('common.irreversible') }}
        </p>
      </div>
      <div class="flex gap-2 w-full">
        <Button variant="outline" class="flex-1" @click="showDeleteConfirm = false">{{ t('common.cancel') }}</Button>
        <Button variant="destructive" class="flex-1" :disabled="loading" @click="confirmDelete">{{ t('common.delete') }}</Button>
      </div>
    </div>
  </Dialog>
</template>
