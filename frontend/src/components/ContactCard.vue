<script setup lang="ts">
import { ref } from 'vue';
import type { Contact } from '@/stores/contacts';
import Card from '@/components/ui/Card.vue';
import Avatar from '@/components/ui/Avatar.vue';
import Badge from '@/components/ui/Badge.vue';
import Dialog from '@/components/ui/Dialog.vue';
import { Building2, User, Phone, Mail } from 'lucide-vue-next';

defineProps<{ contact: Contact }>();

const showPhotoPreview = ref(false);

function fullName(c: Contact) {
  return [c.firstName, c.lastName].filter(Boolean).join(' ');
}
</script>

<template>
  <Card
    class="p-4 cursor-pointer hover:shadow-md transition-shadow hover:border-primary/20 group"
  >
    <div class="flex items-start gap-3">
      <img
        v-if="contact.photo"
        :src="contact.photo"
        class="h-10 w-10 rounded-full object-cover border shrink-0 cursor-zoom-in"
        @click.stop="showPhotoPreview = true"
      />
      <Avatar v-else :name="fullName(contact)" />
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1.5">
          <p class="font-medium truncate">{{ fullName(contact) }}</p>
          <Building2 v-if="contact.type === 'company'" class="h-3.5 w-3.5 text-blue-500 shrink-0" />
          <User v-else class="h-3.5 w-3.5 text-emerald-500 shrink-0" />
        </div>
        <p v-if="contact.company || contact.role" class="text-sm text-muted-foreground truncate">
          {{ [contact.role, contact.company].filter(Boolean).join(' @ ') }}
        </p>
      </div>
    </div>

    <div class="mt-3 space-y-1">
      <div v-if="contact.phones?.length" class="flex items-center gap-2 text-sm text-muted-foreground">
        <Phone class="h-3.5 w-3.5 shrink-0" />
        <a
          :href="`tel:${contact.phones[0]}`"
          @click.stop
          class="truncate hover:text-foreground hover:underline"
        >{{ contact.phones[0] }}</a>
      </div>
      <div v-if="contact.emails?.length" class="flex items-center gap-2 text-sm text-muted-foreground">
        <Mail class="h-3.5 w-3.5 shrink-0" />
        <a
          :href="`mailto:${contact.emails[0]}`"
          @click.stop
          class="truncate hover:text-foreground hover:underline"
        >{{ contact.emails[0] }}</a>
      </div>
    </div>

    <div v-if="contact.tags?.length" class="mt-3 flex flex-wrap gap-1">
      <Badge v-for="tag in contact.tags" :key="tag.id" variant="secondary" class="text-[10px] px-1.5 py-0">
        {{ tag.name }}
      </Badge>
    </div>

    <Dialog
      :open="showPhotoPreview"
      @close="showPhotoPreview = false"
      class="max-w-sm p-2 bg-transparent border-0 shadow-none"
    >
      <img
        :src="contact.photo!"
        class="w-full rounded-lg object-contain max-h-[80vh]"
      />
    </Dialog>
  </Card>
</template>
