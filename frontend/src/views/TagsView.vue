<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTagsStore } from '@/stores/tags';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/Input.vue';
import Card from '@/components/ui/Card.vue';
import { toast } from 'vue-sonner';
import { Plus, Pencil, Trash2, Check, X, Tag } from 'lucide-vue-next';

const { t } = useI18n();
const tagsStore = useTagsStore();

const newTagName = ref('');
const editingTagId = ref<number | null>(null);
const editingTagName = ref('');

onMounted(() => tagsStore.fetchTags());

async function createTag() {
  const name = newTagName.value.trim();
  if (!name) return;
  try {
    await tagsStore.createTag({ name });
    newTagName.value = '';
    toast.success(t('tags.created'));
  } catch (e: any) {
    toast.error(e.response?.data?.message || t('common.error'));
  }
}

function startEdit(id: number, name: string) {
  editingTagId.value = id;
  editingTagName.value = name;
}

async function saveEdit() {
  if (!editingTagId.value || !editingTagName.value.trim()) return;
  try {
    await tagsStore.updateTag(editingTagId.value, { name: editingTagName.value.trim() });
    editingTagId.value = null;
    toast.success(t('tags.updated'));
  } catch (e: any) {
    toast.error(e.response?.data?.message || t('common.error'));
  }
}

async function deleteTag(id: number) {
  try {
    await tagsStore.deleteTag(id);
    toast.success(t('tags.deleted'));
  } catch (e: any) {
    toast.error(e.response?.data?.message || t('common.error'));
  }
}
</script>

<template>
  <div class="p-4 lg:p-6 max-w-lg space-y-6">
    <h1 class="text-xl lg:text-2xl font-bold">{{ t('tags.title') }}</h1>

    <Card class="p-6 space-y-4">
      <form @submit.prevent="createTag" class="flex gap-2">
        <Input v-model="newTagName" :placeholder="t('tags.namePlaceholder')" class="flex-1" />
        <Button type="submit" size="sm" :disabled="!newTagName.trim()">
          <Plus class="h-4 w-4 mr-1" /> {{ t('common.add') }}
        </Button>
      </form>

      <div v-if="tagsStore.tags.length" class="space-y-2">
        <div
          v-for="tag in tagsStore.tags"
          :key="tag.id"
          class="flex items-center gap-2 rounded-md border px-3 py-2"
        >
          <template v-if="editingTagId === tag.id">
            <Input
              v-model="editingTagName"
              class="flex-1 h-7 text-sm"
              autofocus
              @keydown.enter="saveEdit"
              @keydown.escape="editingTagId = null"
            />
            <button @click="saveEdit" class="p-1 text-green-600 hover:text-green-700">
              <Check class="h-4 w-4" />
            </button>
            <button @click="editingTagId = null" class="p-1 text-muted-foreground hover:text-foreground">
              <X class="h-4 w-4" />
            </button>
          </template>

          <template v-else>
            <Tag class="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span class="flex-1 text-sm font-medium">{{ tag.name }}</span>
            <button @click="startEdit(tag.id, tag.name)" class="p-1 text-muted-foreground hover:text-foreground">
              <Pencil class="h-3.5 w-3.5" />
            </button>
            <button @click="deleteTag(tag.id)" class="p-1 text-muted-foreground hover:text-destructive">
              <Trash2 class="h-3.5 w-3.5" />
            </button>
          </template>
        </div>
      </div>

      <div v-else class="flex flex-col items-center gap-2 py-8 text-muted-foreground">
        <Tag class="h-8 w-8" />
        <p class="text-sm">{{ t('tags.noTags') }}</p>
      </div>
    </Card>
  </div>
</template>
