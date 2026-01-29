<script setup>
import { ref, computed, onMounted } from 'vue';
import { db, auth } from './firebase.js'; // Imports your keys (Updated to include .js extension)
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

// --- STATE ---
const isLoggedIn = ref(false);
const showLoginModal = ref(false);
const emailInput = ref("");
const passwordInput = ref("");
const loginError = ref("");
const medals = ref([]);

// --- 1. REAL-TIME DATA LISTENER ---
onMounted(() => {
  // Listen for Auth Changes (Is admin logged in?)
  onAuthStateChanged(auth, (user) => {
    isLoggedIn.value = !!user;
  });

  // Listen for Database Changes (Real-time updates)
  const countriesCollection = collection(db, "countries");
  onSnapshot(countriesCollection, (snapshot) => {
    medals.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  });
});

// --- 2. SORTING LOGIC ---
const sortedMedals = computed(() => {
  return [...medals.value].sort((a, b) => {
    // Sort logic: Gold -> Silver -> Bronze
    if (b.gold !== a.gold) return b.gold - a.gold;
    if (b.silver !== a.silver) return b.silver - a.silver;
    return b.bronze - a.bronze;
  });
});

// --- 3. ACTIONS ---
const login = async () => {
  try {
    await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
    showLoginModal.value = false;
    emailInput.value = "";
    passwordInput.value = "";
    loginError.value = "";
  } catch (error) {
    loginError.value = "Invalid email or password.";
  }
};

const logout = async () => {
  await signOut(auth);
};

// Update function (Only works if user is logged in)
const updateCount = async (id, field, value) => {
  if (!isLoggedIn.value) return;
  const countryRef = doc(db, "countries", id);
  await updateDoc(countryRef, {
    [field]: Number(value) // Ensure it saves as a number
  });
};
</script>

<template>
  <div class="app-container">
    
    <!-- HEADER -->
    <header>
      <div class="brand-area">
        <!-- Replaced "B" with image placeholder logic if you added logo.png, otherwise uses text -->
        <div class="crest-placeholder">B</div>
        <div class="titles">
          <h1>Olympic Tracker</h1>
          <span class="subtitle">Brentwood College School</span>
        </div>
      </div>
      
      <div class="status-area">
        <div class="live-badge">
          <span class="live-dot"></span> LIVE
        </div>
        
        <!-- AUTH BUTTONS -->
        <button v-if="!isLoggedIn" class="btn-header" @click="showLoginModal = true">
          <i class="fas fa-lock"></i> Staff Login
        </button>
        
        <div v-else class="user-info">
          <span class="user-name">Athletics Dept</span>
          <span class="logout-link" @click="logout">Logout</span>
        </div>
      </div>
    </header>

    <main>
      <!-- PUBLIC VIEW (Read Only) -->
      <div v-if="!isLoggedIn" class="card">
        <table>
          <thead>
            <tr>
              <th class="rank-cell">#</th>
              <th class="text-left">Country</th>
              <th class="gold-header">Gold</th>
              <th>Silver</th>
              <th>Bronze</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="medals.length === 0">
              <td colspan="6" style="padding: 2rem;">Loading data... (Or add countries in Firebase Console)</td>
            </tr>
            <tr v-for="(country, index) in sortedMedals" :key="country.id" :class="{'top-3': index < 3}">
              <td class="rank-cell">{{ index + 1 }}</td>
              <td class="country-cell">
                <span class="flag">{{ country.flag }}</span> {{ country.name }}
              </td>
              <td class="gold-val">{{ country.gold }}</td>
              <td>{{ country.silver }}</td>
              <td>{{ country.bronze }}</td>
              <td class="total-val">{{ country.gold + country.silver + country.bronze }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ADMIN VIEW (Editable) -->
      <div v-else class="admin-panel">
        <div class="admin-header">
          <h2><i class="fas fa-pen-to-square"></i> Update Medals</h2>
          <button class="btn-secondary" @click="isLoggedIn = false">View Board</button>
        </div>
        <div class="admin-grid">
          <div v-for="country in medals" :key="country.id" class="country-card">
            <h3><span class="flag">{{ country.flag }}</span> {{ country.name }}</h3>
            <div class="input-group">
              <div class="input-wrapper">
                <label class="lbl-gold">Gold</label>
                <input type="number" :value="country.gold" @change="e => updateCount(country.id, 'gold', e.target.value)" min="0">
              </div>
              <div class="input-wrapper">
                <label>Silver</label>
                <input type="number" :value="country.silver" @change="e => updateCount(country.id, 'silver', e.target.value)" min="0">
              </div>
              <div class="input-wrapper">
                <label class="lbl-bronze">Bronze</label>
                <input type="number" :value="country.bronze" @change="e => updateCount(country.id, 'bronze', e.target.value)" min="0">
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- LOGIN MODAL -->
    <div v-if="showLoginModal" class="modal-overlay">
      <div class="modal">
        <h2>Staff Access</h2>
        <input type="email" v-model="emailInput" placeholder="Email" class="auth-input">
        <input type="password" v-model="passwordInput" placeholder="Password" class="auth-input" @keyup.enter="login">
        <p v-if="loginError" class="error-msg">{{ loginError }}</p>
        <div class="modal-buttons">
          <button class="btn-secondary" @click="showLoginModal = false">Cancel</button>
          <button class="btn-primary" @click="login">Login</button>
        </div>
      </div>
    </div>

  </div>
</template>

<style>
/* --- BRENTWOOD RED THEME --- */
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

/* HEADER */
header {
  background: var(--bcs-primary); color: white; padding: 1rem 2rem;
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 4px solid var(--bcs-primary-hover);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
}

.brand-area { display: flex; align-items: center; gap: 1rem; }
.crest-placeholder {
  width: 45px; height: 45px; background: white; border-radius: 50%;
  display: grid; place-items: center; border: 2px solid white;
  font-family: 'Georgia', serif; font-weight: 900; font-size: 1.4rem; color: var(--bcs-primary);
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

/* BUTTONS */
.btn-header {
  background: rgba(255,255,255,0.15); color: white; border: 1px solid rgba(255,255,255,0.3);
  padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 600;
  display: flex; align-items: center; gap: 6px; transition: all 0.2s;
}
.btn-header:hover { background: white; color: var(--bcs-primary); }

.user-info { text-align: right; font-size: 0.75rem; line-height: 1.2; }
.user-name { font-weight: bold; display: block; }
.logout-link { color: rgba(255,255,255,0.8); cursor: pointer; text-decoration: underline; }
.logout-link:hover { color: white; }

/* LAYOUT */
main { padding: 2rem; max-width: 1200px; margin: 0 auto; width: 100%; box-sizing: border-box; }

/* TABLE */
.card { background: var(--card-bg); border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); overflow: hidden; border-top: 4px solid var(--bcs-primary); }
table { width: 100%; border-collapse: collapse; }
thead { background: var(--bg-color); border-bottom: 2px solid #e5e7eb; }
th { padding: 1.2rem 1rem; text-align: center; color: var(--text-secondary); font-size: 0.85rem; font-weight: 700; text-transform: uppercase; }
th.text-left { text-align: left; padding-left: 2rem; }
th.gold-header { color: var(--gold); background: rgba(214, 175, 54, 0.05); }

tr { border-bottom: 1px solid #f3f4f6; }
td { padding: 1.2rem 1rem; text-align: center; font-size: 1.3rem; font-weight: 500; }
.rank-cell { color: #999; width: 60px; font-weight: 400; }
.top-3 .rank-cell { color: var(--bcs-primary); font-weight: 900; }
.country-cell { text-align: left; padding-left: 2rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 12px; }
.flag { font-size: 1.8rem; }
.gold-val { color: var(--gold); font-weight: 800; background: rgba(214, 175, 54, 0.08); border-radius: 6px; }
.total-val { font-weight: 900; font-size: 1.4rem; }

/* ADMIN PANEL */
.admin-panel { background: var(--card-bg); padding: 2rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; }
.admin-header { display: flex; justify-content: space-between; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #f3f4f6; }
.admin-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.country-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; background: var(--bg-color); }
.country-card h3 { margin: 0 0 15px 0; font-size: 1.1rem; display: flex; align-items: center; gap: 10px; }
.input-group { display: flex; gap: 10px; }
.input-wrapper { flex: 1; text-align: center; }
.input-wrapper label { display: block; font-size: 0.7rem; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; color: #666; }
.lbl-gold { color: var(--gold) !important; }
.lbl-bronze { color: var(--bronze) !important; }
.input-wrapper input { width: 100%; padding: 8px; text-align: center; border: 1px solid #d1d5db; border-radius: 4px; font-size: 1.2rem; font-weight: bold; box-sizing: border-box;}

/* MODAL */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: grid; place-items: center; z-index: 100; backdrop-filter: blur(2px); }
.modal { background: white; padding: 2rem; border-radius: 12px; width: 90%; max-width: 350px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
.auth-input { width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; }
.modal-buttons { display: flex; gap: 10px; justify-content: center; margin-top: 15px; }
.btn-primary { background: var(--bcs-primary); color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; }
.btn-secondary { background: #eee; color: #333; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; }
.error-msg { color: red; font-size: 0.8rem; margin: 5px 0; }

@media (max-width: 768px) {
  .subtitle, .rank-cell { display: none; }
  th, td { padding: 10px 5px; font-size: 1rem; }
  .titles h1 { font-size: 1rem; }
  .live-badge { display: none; }
}
</style>