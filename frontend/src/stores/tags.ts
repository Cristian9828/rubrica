import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/lib/api';

export interface Tag {
  id: number;
  name: string;
  color: string | null;
}

export const useTagsStore = defineStore('tags', () => {
  const tags = ref<Tag[]>([]);

  async function fetchTags() {
    const { data } = await api.get('/tags');
    tags.value = data;
  }

  async function createTag(payload: { name: string; color?: string }) {
    const { data } = await api.post('/tags', payload);
    tags.value.push(data);
    return data;
  }

  async function updateTag(id: number, payload: { name?: string; color?: string }) {
    const { data } = await api.patch(`/tags/${id}`, payload);
    const idx = tags.value.findIndex((t) => t.id === id);
    if (idx !== -1) tags.value[idx] = data;
  }

  async function deleteTag(id: number) {
    await api.delete(`/tags/${id}`);
    tags.value = tags.value.filter((t) => t.id !== id);
  }

  return { tags, fetchTags, createTag, updateTag, deleteTag };
});
