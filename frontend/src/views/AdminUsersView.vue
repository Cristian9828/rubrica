<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/Input.vue';
import Card from '@/components/ui/Card.vue';
import Dialog from '@/components/ui/Dialog.vue';
import Avatar from '@/components/ui/Avatar.vue';
import Badge from '@/components/ui/Badge.vue';
import { Plus, Pencil, Trash2 } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

const { t } = useI18n();

interface UserItem {
  id: number;
  username: string;
  displayName: string;
  role: 'admin' | 'user';
}

const users = ref<UserItem[]>([]);
const showForm = ref(false);
const editUser = ref<UserItem | null>(null);
const form = ref({ username: '', password: '', displayName: '', role: 'user' as 'admin' | 'user' });

async function load() {
  const { data } = await api.get('/users');
  users.value = data;
}

onMounted(load);

function openNew() {
  editUser.value = null;
  form.value = { username: '', password: '', displayName: '', role: 'user' };
  showForm.value = true;
}

function openEdit(u: UserItem) {
  editUser.value = u;
  form.value = { username: u.username, password: '', displayName: u.displayName, role: u.role };
  showForm.value = true;
}

async function save() {
  try {
    if (editUser.value) {
      const payload: any = { displayName: form.value.displayName, role: form.value.role };
      if (form.value.password) payload.password = form.value.password;
      await api.patch(`/users/${editUser.value.id}`, payload);
      toast.success(t('users.updated'));
    } else {
      await api.post('/users', form.value);
      toast.success(t('users.created'));
    }
    showForm.value = false;
    await load();
  } catch (e: any) {
    toast.error(e.response?.data?.message || t('common.error'));
  }
}

async function deleteUser(id: number) {
  await api.delete(`/users/${id}`);
  toast.success(t('users.deleted'));
  await load();
}
</script>

<template>
  <div class="p-4 lg:p-6 space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl lg:text-2xl font-bold">{{ t('users.title') }}</h1>
      <Button size="sm" @click="openNew">
        <Plus class="h-4 w-4 mr-1" /> {{ t('users.newUser') }}
      </Button>
    </div>

    <div class="grid gap-3">
      <Card v-for="u in users" :key="u.id" class="p-4 flex items-center gap-4">
        <Avatar :name="u.displayName" />
        <div class="flex-1 min-w-0">
          <p class="font-medium">{{ u.displayName }}</p>
          <p class="text-sm text-muted-foreground">@{{ u.username }}</p>
        </div>
        <Badge :variant="u.role === 'admin' ? 'default' : 'secondary'">{{ u.role }}</Badge>
        <div class="flex gap-1">
          <Button variant="ghost" size="icon" @click="openEdit(u)">
            <Pencil class="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" @click="deleteUser(u.id)">
            <Trash2 class="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </Card>
    </div>

    <Dialog :open="showForm" :title="editUser ? t('users.editUserTitle') : t('users.newUserTitle')" @close="showForm = false">
      <form @submit.prevent="save" class="space-y-4">
        <div v-if="!editUser" class="space-y-2">
          <label class="text-sm font-medium">{{ t('users.username') }}</label>
          <Input v-model="form.username" placeholder="username" />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium">{{ t('users.displayName') }}</label>
          <Input v-model="form.displayName" placeholder="Mario Rossi" />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium">{{ editUser ? t('users.passwordEdit') : t('users.password') }}</label>
          <Input v-model="form.password" type="password" :placeholder="t('users.password')" />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium">{{ t('users.role') }}</label>
          <div class="flex gap-2">
            <Button
              :variant="form.role === 'user' ? 'default' : 'outline'"
              size="sm"
              @click="form.role = 'user'"
              type="button"
            >
              {{ t('users.roleUser') }}
            </Button>
            <Button
              :variant="form.role === 'admin' ? 'default' : 'outline'"
              size="sm"
              @click="form.role = 'admin'"
              type="button"
            >
              {{ t('users.roleAdmin') }}
            </Button>
          </div>
        </div>
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="showForm = false" type="button">{{ t('common.cancel') }}</Button>
          <Button type="submit">{{ editUser ? t('common.update') : t('common.create') }}</Button>
        </div>
      </form>
    </Dialog>
  </div>
</template>
