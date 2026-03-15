import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/lib/api';

export interface Contact {
  id: number;
  firstName: string;
  lastName: string | null;
  company: string | null;
  role: string | null;
  phones: string[];
  emails: string[];
  website: string | null;
  notes: string | null;
  photo: string | null;
  archivedAt: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  sectionId: number | null;
  userId: number | null;
  type: 'company' | 'personal';
  tags: { id: number; name: string; color: string | null }[];
  section?: { id: number; name: string };
  createdAt: string;
  updatedAt: string;
}

export const useContactsStore = defineStore('contacts', () => {
  const contacts = ref<Contact[]>([]);
  const loading = ref(false);
  const selectedContact = ref<Contact | null>(null);

  async function fetchContacts(params?: {
    search?: string;
    sectionId?: number;
    tagId?: number;
    type?: string;
    archived?: boolean;
  }) {
    loading.value = true;
    try {
      const { data } = await api.get('/contacts', { params });
      contacts.value = data;
    } finally {
      loading.value = false;
    }
  }

  async function fetchContact(id: number) {
    const { data } = await api.get(`/contacts/${id}`);
    selectedContact.value = data;
    return data;
  }

  async function createContact(payload: any) {
    const { data } = await api.post('/contacts', payload);
    contacts.value.unshift(data);
    return data;
  }

  async function updateContact(id: number, payload: any) {
    const { data } = await api.patch(`/contacts/${id}`, payload);
    const idx = contacts.value.findIndex((c) => c.id === id);
    if (idx !== -1) contacts.value[idx] = data;
    if (selectedContact.value?.id === id) selectedContact.value = data;
    return data;
  }

  async function deleteContact(id: number) {
    await api.delete(`/contacts/${id}`);
    contacts.value = contacts.value.filter((c) => c.id !== id);
    if (selectedContact.value?.id === id) selectedContact.value = null;
  }

  async function archiveContact(id: number) {
    const { data } = await api.patch(`/contacts/${id}/archive`);
    contacts.value = contacts.value.filter((c) => c.id !== id);
    if (selectedContact.value?.id === id) selectedContact.value = null;
    return data;
  }

  async function unarchiveContact(id: number) {
    const { data } = await api.patch(`/contacts/${id}/unarchive`);
    contacts.value = contacts.value.filter((c) => c.id !== id);
    if (selectedContact.value?.id === id) selectedContact.value = null;
    return data;
  }

  async function uploadPhoto(file: File) {
    const formData = new FormData();
    formData.append('photo', file);
    const { data } = await api.post('/contacts/photo', formData);
    return data.url as string;
  }

  async function exportContacts(format: 'xlsx' | 'vcf', sectionId?: number, type?: string) {
    const params: any = { format };
    if (sectionId) params.sectionId = sectionId;
    if (type) params.type = type;
    const { data, headers } = await api.get('/contacts/export', {
      params,
      responseType: 'blob',
    });
    const blob = new Blob([data], { type: headers['content-type'] });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = format === 'vcf' ? 'contatti.vcf' : 'contatti.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  }

  return {
    contacts,
    loading,
    selectedContact,
    fetchContacts,
    fetchContact,
    createContact,
    updateContact,
    deleteContact,
    archiveContact,
    unarchiveContact,
    uploadPhoto,
    exportContacts,
  };
});
