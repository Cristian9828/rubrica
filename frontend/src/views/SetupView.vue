<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/Input.vue';
import Card from '@/components/ui/Card.vue';
import { BookUser, CheckCircle, Database, User, Loader2 } from 'lucide-vue-next';

const router = useRouter();

// --- Stato wizard ---
type Step = 'db' | 'restarting' | 'admin' | 'done';
const step = ref<Step>('db');

// --- Step 1: Database ---
const dbType = ref<'sqlite' | 'postgres'>('sqlite');
const pgForm = ref({ host: 'localhost', port: 5432, user: 'rubrica', password: '', database: 'rubrica' });
const dbTesting = ref(false);
const dbError = ref('');
const dbSaving = ref(false);

// --- Step 2: Admin ---
const adminForm = ref({ username: '', displayName: '', password: '', confirm: '' });
const adminError = ref('');
const adminSaving = ref(false);

// --- Polling durante riavvio ---
let pollInterval: ReturnType<typeof setInterval> | null = null;

onMounted(async () => {
  // Se il DB è già configurato (es. riavvio dopo postgres), vai direttamente allo step admin
  try {
    const { data } = await axios.get('/api/setup/status');
    if (data.dbConfigured) {
      step.value = 'admin';
    }
  } catch {
    // ignora
  }
});

async function testConnection() {
  dbError.value = '';
  dbTesting.value = true;
  try {
    await axios.post('/api/setup/test-db', {
      host: pgForm.value.host,
      port: pgForm.value.port,
      user: pgForm.value.user,
      password: pgForm.value.password,
      database: pgForm.value.database,
    });
    dbError.value = '';
    return true;
  } catch (e: any) {
    dbError.value = e.response?.data?.message || 'Connessione fallita';
    return false;
  } finally {
    dbTesting.value = false;
  }
}

async function saveDbConfig() {
  dbError.value = '';

  if (dbType.value === 'postgres') {
    const ok = await testConnection();
    if (!ok) return;
  }

  dbSaving.value = true;
  try {
    const payload =
      dbType.value === 'sqlite'
        ? { dbType: 'sqlite' }
        : {
            dbType: 'postgres',
            host: pgForm.value.host,
            port: pgForm.value.port,
            user: pgForm.value.user,
            password: pgForm.value.password,
            database: pgForm.value.database,
          };

    const { data } = await axios.post('/api/setup/configure-db', payload);

    if (data.restarting) {
      step.value = 'restarting';
      startPolling();
    } else {
      // SQLite: nessun riavvio necessario
      step.value = 'admin';
    }
  } catch (e: any) {
    dbError.value = e.response?.data?.message || 'Errore nel salvataggio';
  } finally {
    dbSaving.value = false;
  }
}

function startPolling() {
  pollInterval = setInterval(async () => {
    try {
      const { data } = await axios.get('/api/setup/status');
      if (data.dbConfigured) {
        clearInterval(pollInterval!);
        pollInterval = null;
        step.value = 'admin';
      }
    } catch {
      // Il server è ancora in riavvio, continua a pollare
    }
  }, 2000);
}

async function createAdmin() {
  adminError.value = '';

  if (!adminForm.value.username.trim()) {
    adminError.value = 'Inserisci uno username';
    return;
  }
  if (!adminForm.value.displayName.trim()) {
    adminError.value = 'Inserisci il nome visualizzato';
    return;
  }
  if (adminForm.value.password.length < 8) {
    adminError.value = 'La password deve essere di almeno 8 caratteri';
    return;
  }
  if (adminForm.value.password !== adminForm.value.confirm) {
    adminError.value = 'Le password non coincidono';
    return;
  }

  adminSaving.value = true;
  try {
    await axios.post('/api/setup/init', {
      username: adminForm.value.username.trim(),
      displayName: adminForm.value.displayName.trim(),
      password: adminForm.value.password,
    });
    step.value = 'done';
    setTimeout(() => router.push('/login'), 2500);
  } catch (e: any) {
    adminError.value = e.response?.data?.message || 'Errore durante la configurazione';
  } finally {
    adminSaving.value = false;
  }
}

const stepNumber = computed(() => (step.value === 'db' || step.value === 'restarting' ? 1 : 2));
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-background p-4">
    <Card class="w-full max-w-md p-8">

      <!-- Header -->
      <div class="flex flex-col items-center gap-2 mb-8">
        <div class="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
          <BookUser class="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 class="text-2xl font-bold">Configurazione iniziale</h1>
        <div v-if="step !== 'done'" class="flex items-center gap-2 text-sm text-muted-foreground">
          <span :class="stepNumber >= 1 ? 'text-primary font-medium' : ''">1. Database</span>
          <span>→</span>
          <span :class="stepNumber >= 2 ? 'text-primary font-medium' : ''">2. Account admin</span>
        </div>
      </div>

      <!-- STEP 1: Database -->
      <div v-if="step === 'db'" class="space-y-5">
        <p class="text-sm text-muted-foreground">
          Scegli dove archiviare i dati dell'applicazione.
        </p>

        <!-- Scelta tipo DB -->
        <div class="grid grid-cols-2 gap-3">
          <button
            @click="dbType = 'sqlite'"
            :class="[
              'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors text-left',
              dbType === 'sqlite'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground/50',
            ]"
            type="button"
          >
            <Database class="h-6 w-6" :class="dbType === 'sqlite' ? 'text-primary' : 'text-muted-foreground'" />
            <div>
              <p class="text-sm font-medium">SQLite</p>
              <p class="text-xs text-muted-foreground mt-0.5">File locale, zero config</p>
            </div>
          </button>

          <button
            @click="dbType = 'postgres'"
            :class="[
              'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors text-left',
              dbType === 'postgres'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground/50',
            ]"
            type="button"
          >
            <Database class="h-6 w-6" :class="dbType === 'postgres' ? 'text-primary' : 'text-muted-foreground'" />
            <div>
              <p class="text-sm font-medium">PostgreSQL</p>
              <p class="text-xs text-muted-foreground mt-0.5">Consigliato per produzione</p>
            </div>
          </button>
        </div>

        <!-- Form PostgreSQL -->
        <div v-if="dbType === 'postgres'" class="space-y-3">
          <div class="grid grid-cols-3 gap-2">
            <div class="col-span-2 space-y-1">
              <label class="text-xs font-medium">Host</label>
              <Input v-model="pgForm.host" placeholder="localhost" />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-medium">Porta</label>
              <Input v-model.number="pgForm.port" type="number" placeholder="5432" />
            </div>
          </div>
          <div class="space-y-1">
            <label class="text-xs font-medium">Database</label>
            <Input v-model="pgForm.database" placeholder="rubrica" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div class="space-y-1">
              <label class="text-xs font-medium">Utente</label>
              <Input v-model="pgForm.user" placeholder="rubrica" />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-medium">Password</label>
              <Input v-model="pgForm.password" type="password" placeholder="••••••" />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            type="button"
            :disabled="dbTesting"
            @click="testConnection"
            class="w-full"
          >
            <Loader2 v-if="dbTesting" class="h-3.5 w-3.5 mr-1.5 animate-spin" />
            {{ dbTesting ? 'Test in corso...' : 'Testa connessione' }}
          </Button>
        </div>

        <p v-if="dbError" class="text-sm text-destructive">{{ dbError }}</p>

        <Button
          class="w-full"
          type="button"
          :disabled="dbSaving || dbTesting"
          @click="saveDbConfig"
        >
          <Loader2 v-if="dbSaving" class="h-4 w-4 mr-2 animate-spin" />
          {{ dbSaving ? 'Salvataggio...' : 'Continua' }}
        </Button>
      </div>

      <!-- STEP 1b: Riavvio in corso -->
      <div v-else-if="step === 'restarting'" class="flex flex-col items-center gap-4 py-6 text-center">
        <Loader2 class="h-10 w-10 text-primary animate-spin" />
        <div>
          <p class="font-medium">Riavvio in corso...</p>
          <p class="text-sm text-muted-foreground mt-1">
            Il server si sta riconnettendo a PostgreSQL.<br />
            Attendi qualche secondo.
          </p>
        </div>
      </div>

      <!-- STEP 2: Admin -->
      <div v-else-if="step === 'admin'" class="space-y-4">
        <p class="text-sm text-muted-foreground">
          Crea l'account amministratore per accedere all'applicazione.
        </p>

        <div class="space-y-2">
          <label class="text-sm font-medium">Username</label>
          <Input v-model="adminForm.username" placeholder="admin" autofocus autocomplete="off" />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium">Nome visualizzato</label>
          <Input v-model="adminForm.displayName" placeholder="Amministratore" />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium">Password</label>
          <Input v-model="adminForm.password" type="password" placeholder="Min. 8 caratteri" autocomplete="new-password" />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium">Conferma password</label>
          <Input v-model="adminForm.confirm" type="password" placeholder="Ripeti la password" autocomplete="new-password" />
        </div>

        <p v-if="adminError" class="text-sm text-destructive">{{ adminError }}</p>

        <Button class="w-full" type="button" :disabled="adminSaving" @click="createAdmin">
          <Loader2 v-if="adminSaving" class="h-4 w-4 mr-2 animate-spin" />
          {{ adminSaving ? 'Creazione...' : 'Crea account amministratore' }}
        </Button>
      </div>

      <!-- Completato -->
      <div v-else class="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle class="h-10 w-10 text-green-500" />
        <div>
          <p class="font-medium">Configurazione completata!</p>
          <p class="text-sm text-muted-foreground mt-1">Reindirizzamento al login...</p>
        </div>
      </div>

    </Card>
  </div>
</template>
