<script setup>
defineProps(['isLoggedIn', 'isAdminView']);
defineEmits(['open-login', 'logout', 'toggle-view']);
</script>

<template>
  <header>
    <div class="brand-area">
      <img src="/bcs_logo.png" alt="BCS Logo" class="crest-logo" />
      <div class="titles">
        <h1>Olympic Tracker</h1>
        <span class="subtitle">Brentwood College School</span>
      </div>
    </div>
    
    <div class="status-area">
      <div class="live-badge">
        <span class="live-dot"></span> LIVE
      </div>
      
      <button v-if="!isLoggedIn" class="btn-header" @click="$emit('open-login')">
        <i class="fas fa-lock"></i> Staff Login
      </button>
      
      <div v-else class="user-info">
        <span class="user-name">Athletics Dept</span>
        <!-- Toggle View Link -->
        <span v-if="!isAdminView" class="edit-link" @click="$emit('toggle-view')">
          <i class="fas fa-pen"></i> Edit Mode
        </span>
        <span class="logout-link" @click="$emit('logout')">Logout</span>
      </div>
    </div>
  </header>
</template>

<style scoped>
header {
  background: var(--bcs-primary); color: white; padding: 1rem 2rem;
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 4px solid var(--bcs-primary-hover);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
}
.brand-area { display: flex; align-items: center; gap: 1rem; }
.crest-logo {
  width: 55px; height: 55px; object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
}
.titles h1 { margin: 0; font-size: 1.4rem; text-transform: uppercase; font-weight: 800; }
.titles .subtitle { font-size: 0.7rem; opacity: 0.9; text-transform: uppercase; display: block; }
.status-area { display: flex; align-items: center; gap: 15px; }
.live-badge {
  background: white; color: var(--bcs-primary); padding: 5px 12px;
  border-radius: 20px; font-weight: bold; font-size: 0.8rem;
  display: inline-flex; align-items: center; gap: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}
.live-dot { width: 8px; height: 8px; background: var(--bcs-primary); border-radius: 50%; animation: pulse 1.5s infinite; }
@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
.btn-header {
  background: rgba(255,255,255,0.15); color: white; border: 1px solid rgba(255,255,255,0.3);
  padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 600;
  display: flex; align-items: center; gap: 6px; transition: all 0.2s;
}
.btn-header:hover { background: white; color: var(--bcs-primary); }
.user-info { text-align: right; font-size: 0.75rem; line-height: 1.2; display: flex; align-items: center; gap: 15px; }
.user-name { font-weight: bold; }
.logout-link { color: rgba(255,255,255,0.8); cursor: pointer; text-decoration: underline; }
.logout-link:hover { color: white; }
.edit-link { color: white; cursor: pointer; text-decoration: none; font-weight: bold; background: rgba(0,0,0,0.2); padding: 5px 10px; border-radius: 4px; }
.edit-link:hover { background: rgba(0,0,0,0.4); }

@media (max-width: 768px) {
  .titles h1 { font-size: 1rem; }
  .live-badge { display: none; }
}
</style>