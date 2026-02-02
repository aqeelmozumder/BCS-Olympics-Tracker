<script setup>
import { ref } from 'vue';
import { useAuth } from '../composables/useAuth';

const emit = defineEmits(['close']);
const { login } = useAuth();

const emailInput = ref("");
const passwordInput = ref("");
const errorMsg = ref("");

const handleLogin = async () => {
  try {
    await login(emailInput.value, passwordInput.value);
    emit('close');
  } catch (err) {
    errorMsg.value = "Invalid credentials";
  }
};
</script>

<template>
  <div class="modal-overlay">
    <div class="modal">
      <h2>Staff Access</h2>
      <input type="email" v-model="emailInput" placeholder="Email" class="auth-input">
      <input type="password" v-model="passwordInput" placeholder="Password" class="auth-input" @keyup.enter="handleLogin">
      <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
      <div class="modal-buttons">
        <button class="btn-secondary" @click="$emit('close')">Cancel</button>
        <button class="btn-primary" @click="handleLogin">Login</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: grid; place-items: center; z-index: 100; backdrop-filter: blur(2px); }
.modal { background: white; padding: 2rem; border-radius: 12px; width: 90%; max-width: 350px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
.auth-input { width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; }
.modal-buttons { display: flex; gap: 10px; justify-content: center; margin-top: 15px; }
.btn-primary { background: var(--bcs-primary); color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; }
.btn-secondary { background: #eee; color: #333; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; }
.error-msg { color: red; font-size: 0.8rem; margin: 5px 0; }
</style>