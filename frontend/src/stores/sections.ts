import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/lib/api';

export interface Section {
  id: number;
  name: string;
  icon: string | null;
  color: string | null;
  userId: number | null;
  type: 'company' | 'personal';
  position: number;
}

export const useSectionsStore = defineStore('sections', () => {
  const sections = ref<Section[]>([]);
  const activeSection = ref<number | null>(null);
  const activeType = ref<'all' | 'company' | 'personal'>('all');

  const companySections = computed(() =>
    sections.value.filter((s) => s.type === 'company'),
  );

  const personalSections = computed(() =>
    sections.value.filter((s) => s.type === 'personal'),
  );

  async function fetchSections() {
    const { data } = await api.get('/sections');
    sections.value = data;
  }

  async function createSection(payload: {
    name: string;
    icon?: string;
    color?: string;
    type: 'company' | 'personal';
  }) {
    const { data } = await api.post('/sections', payload);
    sections.value.push(data);
    return data;
  }

  async function updateSection(
    id: number,
    payload: { name?: string; icon?: string; color?: string; position?: number },
  ) {
    const { data } = await api.patch(`/sections/${id}`, payload);
    const idx = sections.value.findIndex((s) => s.id === id);
    if (idx !== -1) sections.value[idx] = data;
  }

  async function deleteSection(id: number) {
    await api.delete(`/sections/${id}`);
    sections.value = sections.value.filter((s) => s.id !== id);
    if (activeSection.value === id) activeSection.value = null;
  }

  function setActive(sectionId: number | null, type: 'all' | 'company' | 'personal' = 'all') {
    activeSection.value = sectionId;
    activeType.value = type;
  }

  return {
    sections,
    companySections,
    personalSections,
    activeSection,
    activeType,
    fetchSections,
    createSection,
    updateSection,
    deleteSection,
    setActive,
  };
});
