<script setup>
import { ref, watch } from 'vue';
import { useAuth } from './composables/useAuth';
import AppHeader from './components/AppHeader.vue';
import Scoreboard from './components/Scoreboard.vue';
import AdminPanel from './components/AdminPanel.vue';
import LoginModal from './components/LoginModal.vue';

const { isLoggedIn, logout } = useAuth();
const showLoginModal = ref(false);
const isAdminView = ref(false);

// Automatically show Admin View when user logs in
watch(isLoggedIn, (newVal) => {
  if (newVal) isAdminView.value = true;
  else isAdminView.value = false;
});

const handleLogout = async () => {
  await logout();
  isAdminView.value = false;
};
</script>

<template>
  <div class="app-container">
    <AppHeader 
      :isLoggedIn="isLoggedIn" 
      :isAdminView="isAdminView"
      @open-login="showLoginModal = true"
      @logout="handleLogout"
      @toggle-view="isAdminView = true"
    />

    <main>
      <Scoreboard v-if="!isAdminView" />
      <AdminPanel 
        v-else 
        :isLoggedIn="isLoggedIn"
        @close-view="isAdminView = false" 
      />
    </main>

    <LoginModal 
      v-if="showLoginModal" 
      @close="showLoginModal = false" 
    />
  </div>
</template>

<style>
/* --- GLOBAL THEME VARIABLES --- */
:root {
  --bcs-primary: #dc2626;       /* Red-600 */
  --bcs-primary-hover: #b91c1c; /* Red-700 */
  --bg-color: #f9fafb;          /* Gray-50 */
  --card-bg: #ffffff;           
  --text-primary: #111827;      /* Gray-900 */
  --text-secondary: #4b5563;    /* Gray-600 */
  --gold: #D6AF36;
  --silver: #A7A7AD;
  --bronze: #824A02;
}

body {
  font-family: 'Segoe UI', Roboto, Helvetica, sans-serif;
  margin: 0; background-color: var(--bg-color); color: var(--text-primary);
  min-height: 100vh;
}

main { padding: 2rem; max-width: 1200px; margin: 0 auto; width: 100%; box-sizing: border-box; }
</style>