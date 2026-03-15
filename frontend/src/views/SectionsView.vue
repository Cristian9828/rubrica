<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSectionsStore } from '@/stores/sections';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/Input.vue';
import Card from '@/components/ui/Card.vue';
import Dialog from '@/components/ui/Dialog.vue';
import { toast } from 'vue-sonner';
import { Plus, Pencil, Trash2, Check, X, ChevronRight, AlertTriangle } from 'lucide-vue-next';
import { SECTION_ICONS, getIconComponent } from '@/lib/sectionIcons';

const { t } = useI18n();
const sectionsStore = useSectionsStore();
const auth = useAuthStore();

const showNewForm = ref(false);
const newName = ref('');
const newType = ref<'company' | 'personal'>('personal');
const newIcon = ref<string | null>(null);

const editingId = ref<number | null>(null);
const editName = ref('');
const editIcon = ref<string | null>(null);

const deletingId = ref<number | null>(null);
const deletingName = ref('');

onMounted(() => sectionsStore.fetchSections());

async function createSection() {
  if (!newName.value.trim()) return;
  try {
    await sectionsStore.createSection({
      name: newName.value.trim(),
      type: newType.value,
      icon: newIcon.value || undefined,
    });
    newName.value = '';
    newIcon.value = null;
    showNewForm.value = false;
    toast.success(t('sections.created'));
  } catch (e: any) {
    toast.error(e.response?.data?.message || t('common.error'));
  }
}

function startEdit(id: number, name: string, icon: string | null) {
  editingId.value = id;
  editName.value = name;
  editIcon.value = icon;
}

async function saveEdit() {
  if (!editingId.value || !editName.value.trim()) return;
  try {
    await sectionsStore.updateSection(editingId.value, {
      name: editName.value.trim(),
      icon: editIcon.value || undefined,
    });
    editingId.value = null;
    toast.success(t('sections.updated'));
  } catch (e: any) {
    toast.error(e.response?.data?.message || t('common.error'));
  }
}

function confirmDelete(id: number, name: string) {
  deletingId.value = id;
  deletingName.value = name;
}

async function doDelete() {
  if (!deletingId.value) return;
  try {
    await sectionsStore.deleteSection(deletingId.value);
    deletingId.value = null;
    toast.success(t('sections.deleted'));
  } catch (e: any) {
    toast.error(e.response?.data?.message || t('common.error'));
  }
}
</script>

<template>
  <div class="p-4 lg:p-6 max-w-2xl space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-xl lg:text-2xl font-bold">{{ t('sections.title') }}</h1>
      <Button size="sm" @click="showNewForm = true">
        <Plus class="h-4 w-4 mr-1" /> {{ t('sections.newSection') }}
      </Button>
    </div>

    <!-- Company -->
    <Card v-if="auth.isAdmin" class="p-6 space-y-3">
      <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{{ t('sections.company') }}</h2>
      <div v-if="sectionsStore.companySections.length" class="space-y-2">
        <SectionRow
          v-for="s in sectionsStore.companySections"
          :key="s.id"
          :section="s"
          :editing="editingId === s.id"
          :edit-name="editName"
          :edit-icon="editIcon"
          @start-edit="startEdit(s.id, s.name, s.icon)"
          @save-edit="saveEdit"
          @cancel-edit="editingId = null"
          @delete="confirmDelete(s.id, s.name)"
          @update:edit-name="editName = $event"
          @update:edit-icon="editIcon = $event"
        />
      </div>
      <p v-else class="text-sm text-muted-foreground">{{ t('sections.noCompany') }}</p>
    </Card>

    <!-- Personal -->
    <Card class="p-6 space-y-3">
      <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{{ t('sections.personal') }}</h2>
      <div v-if="sectionsStore.personalSections.length" class="space-y-2">
        <SectionRow
          v-for="s in sectionsStore.personalSections"
          :key="s.id"
          :section="s"
          :editing="editingId === s.id"
          :edit-name="editName"
          :edit-icon="editIcon"
          @start-edit="startEdit(s.id, s.name, s.icon)"
          @save-edit="saveEdit"
          @cancel-edit="editingId = null"
          @delete="confirmDelete(s.id, s.name)"
          @update:edit-name="editName = $event"
          @update:edit-icon="editIcon = $event"
        />
      </div>
      <p v-else class="text-sm text-muted-foreground">{{ t('sections.noPersonal') }}</p>
    </Card>

    <!-- New section dialog -->
    <Dialog :open="showNewForm" :title="t('sections.newSection')" @close="showNewForm = false">
      <form @submit.prevent="createSection" class="space-y-4">
        <div class="space-y-2">
          <label class="text-sm font-medium">{{ t('sections.name') }}</label>
          <Input v-model="newName" :placeholder="t('sections.namePlaceholder')" autofocus />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium">{{ t('sections.type') }}</label>
          <div class="flex gap-2">
            <Button :variant="newType === 'personal' ? 'default' : 'outline'" size="sm" type="button" @click="newType = 'personal'">{{ t('sections.typePersonal') }}</Button>
            <Button v-if="auth.isAdmin" :variant="newType === 'company' ? 'default' : 'outline'" size="sm" type="button" @click="newType = 'company'">{{ t('sections.typeCompany') }}</Button>
          </div>
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium">{{ t('sections.icon') }} <span class="text-muted-foreground font-normal">{{ t('sections.iconOptional') }}</span></label>
          <IconPicker v-model="newIcon" />
        </div>
        <div class="flex justify-end gap-2">
          <Button variant="outline" type="button" @click="showNewForm = false">{{ t('common.cancel') }}</Button>
          <Button type="submit" :disabled="!newName.trim()">{{ t('common.create') }}</Button>
        </div>
      </form>
    </Dialog>

    <!-- Delete confirm dialog -->
    <Dialog :open="!!deletingId" @close="deletingId = null" class="max-w-sm">
      <div class="flex flex-col items-center gap-4 text-center">
        <div class="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10">
          <AlertTriangle class="h-6 w-6 text-destructive" />
        </div>
        <div>
          <h3 class="font-semibold text-base">{{ t('sections.deleteTitle') }}</h3>
          <p class="text-sm text-muted-foreground mt-1">
            {{ t('sections.deleteConfirm') }} <span class="font-medium text-foreground">{{ deletingName }}</span>?
            {{ t('sections.deleteConfirmSuffix') }}
          </p>
        </div>
        <div class="flex gap-2 w-full">
          <Button variant="outline" class="flex-1" @click="deletingId = null">{{ t('common.cancel') }}</Button>
          <Button variant="destructive" class="flex-1" @click="doDelete">{{ t('common.delete') }}</Button>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, h, computed } from 'vue';
import Input from '@/components/ui/Input.vue';
import { Button } from '@/components/ui/button';
import { Check, X, Pencil, Trash2, ChevronRight } from 'lucide-vue-next';
import { SECTION_ICONS, getIconComponent } from '@/lib/sectionIcons';
import type { Section } from '@/stores/sections';

const IconPicker = defineComponent({
  name: 'IconPicker',
  props: { modelValue: { type: String as () => string | null, default: null } },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('div', { class: 'grid grid-cols-6 gap-1.5' },
      SECTION_ICONS.map(({ name, component }) =>
        h('button', {
          type: 'button',
          title: name,
          class: [
            'flex items-center justify-center p-2 rounded-md border transition-colors',
            props.modelValue === name
              ? 'bg-primary text-primary-foreground border-primary'
              : 'hover:bg-accent border-transparent',
          ],
          onClick: () => emit('update:modelValue', props.modelValue === name ? null : name),
        }, [h(component, { class: 'h-4 w-4' })])
      )
    );
  },
});

const SectionRow = defineComponent({
  name: 'SectionRow',
  props: {
    section: { type: Object as () => Section, required: true },
    editing: { type: Boolean, default: false },
    editName: { type: String, default: '' },
    editIcon: { type: String as () => string | null, default: null },
  },
  emits: ['start-edit', 'save-edit', 'cancel-edit', 'delete', 'update:editName', 'update:editIcon'],
  setup(props, { emit }) {
    const iconComp = computed(() => getIconComponent(props.section.icon));

    return () => {
      if (props.editing) {
        return h('div', { class: 'space-y-3 rounded-md border p-3' }, [
          h('div', { class: 'flex items-center gap-2' }, [
            h(Input, {
              modelValue: props.editName,
              class: 'flex-1 h-8 text-sm',
              autofocus: true,
              'onUpdate:modelValue': (v: string) => emit('update:editName', v),
              onKeydown: (e: KeyboardEvent) => {
                if (e.key === 'Enter') emit('save-edit');
                if (e.key === 'Escape') emit('cancel-edit');
              },
            }),
            h('button', { class: 'p-1 text-green-600 hover:text-green-700', onClick: () => emit('save-edit') },
              [h(Check, { class: 'h-4 w-4' })]),
            h('button', { class: 'p-1 text-muted-foreground hover:text-foreground', onClick: () => emit('cancel-edit') },
              [h(X, { class: 'h-4 w-4' })]),
          ]),
          h('div', { class: 'grid grid-cols-6 gap-1.5' },
            SECTION_ICONS.map(({ name, component }) =>
              h('button', {
                type: 'button',
                title: name,
                class: [
                  'flex items-center justify-center p-2 rounded-md border transition-colors',
                  props.editIcon === name
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'hover:bg-accent border-transparent',
                ],
                onClick: () => emit('update:editIcon', props.editIcon === name ? null : name),
              }, [h(component, { class: 'h-4 w-4' })])
            )
          ),
        ]);
      }

      return h('div', { class: 'flex items-center gap-3 rounded-md border px-3 py-2.5' }, [
        iconComp.value
          ? h(iconComp.value, { class: 'h-4 w-4 text-muted-foreground shrink-0' })
          : h(ChevronRight, { class: 'h-4 w-4 text-muted-foreground shrink-0' }),
        h('span', { class: 'flex-1 text-sm font-medium' }, props.section.name),
        h('button', { class: 'p-1 text-muted-foreground hover:text-foreground', onClick: () => emit('start-edit') },
          [h(Pencil, { class: 'h-3.5 w-3.5' })]),
        h('button', { class: 'p-1 text-muted-foreground hover:text-destructive', onClick: () => emit('delete') },
          [h(Trash2, { class: 'h-3.5 w-3.5' })]),
      ]);
    };
  },
});

export default { components: { IconPicker, SectionRow } };
</script>
