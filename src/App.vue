<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { db, auth } from './firebase.js'; // Imports your keys
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

// --- STATE ---
const isLoggedIn = ref(false);
const isAdminView = ref(false); // NEW: Tracks which screen is active (Public vs Admin)
const showLoginModal = ref(false);
const emailInput = ref("");
const passwordInput = ref("");
const loginError = ref("");
const dataError = ref(null);
const medals = ref([]);

// Pagination State
const currentPage = ref(1);
const itemsPerPage = 10;

// New State for "Add Country" form
const newName = ref("");
const newFlag = ref("");
const newGold = ref(0);
const newSilver = ref(0);
const newBronze = ref(0);

// Auto-fill Data
const allCountries = ref([]);

// --- 1. REAL-TIME DATA LISTENER ---
onMounted(() => {
  // Listen for Auth Changes
  onAuthStateChanged(auth, (user) => {
    isLoggedIn.value = !!user;
    // If user logs in, automatically show the Admin View
    if (user) {
      isAdminView.value = true;
    } else {
      isAdminView.value = false;
    }
  });

  // Listen for Database Changes
  const countriesCollection = collection(db, "countries");
  onSnapshot(countriesCollection, (snapshot) => {
    medals.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    dataError.value = null;
  }, (error) => {
    console.error("Firebase Error:", error);
    if (error.code === 'permission-denied') {
      dataError.value = "Access Denied: Please update Firestore Rules in Firebase Console to 'allow read: if true;'";
    } else {
      dataError.value = "Database Error: " + error.message;
    }
  });

  // Fetch Country List for Auto-complete
  fetch("https://restcountries.com/v3.1/all?fields=name,flag")
    .then(res => res.json())
    .then(data => {
      // Sort alphabetically
      allCountries.value = data.sort((a, b) => 
        a.name.common.localeCompare(b.name.common)
      );
    })
    .catch(err => console.log("Auto-complete API unavailable"));
});

// --- 2. SORTING & PAGINATION LOGIC ---
const sortedMedals = computed(() => {
  return [...medals.value].sort((a, b) => {
    if (b.gold !== a.gold) return b.gold - a.gold;
    if (b.silver !== a.silver) return b.silver - a.silver;
    return b.bronze - a.bronze;
  });
});

const totalPages = computed(() => Math.ceil(sortedMedals.value.length / itemsPerPage));

const paginatedMedals = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return sortedMedals.value.slice(start, end);
});

// Reset page if we delete enough items to make the current page invalid
watch(totalPages, (newVal) => {
  if (currentPage.value > newVal && newVal > 0) {
    currentPage.value = newVal;
  }
});

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};

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
  isAdminView.value = false; // Go back to public view on logout
};

// Generic Update Function (Handles both Numbers and Strings)
const updateCountry = async (id, field, value) => {
  if (!isLoggedIn.value) return;
  const countryRef = doc(db, "countries", id);
  
  // If editing medals, convert to Number. If editing Name/Flag, keep as String.
  let finalValue = value;
  if (['gold', 'silver', 'bronze'].includes(field)) {
    finalValue = Number(value);
  }

  await updateDoc(countryRef, {
    [field]: finalValue
  });
};

const deleteCountry = async (id, name) => {
  if (!isLoggedIn.value) return;
  if (confirm(`Are you sure you want to delete ${name}?`)) {
    await deleteDoc(doc(db, "countries", id));
  }
};

// Auto-fill flag when country name matches
const onNameInput = () => {
  const match = allCountries.value.find(c => c.name.common === newName.value);
  if (match) {
    newFlag.value = match.flag;
  } else {
    newFlag.value = ""; // Clear if no match found
  }
};

const addCountry = async () => {
  if (!isLoggedIn.value) return;
  if (!newName.value || !newFlag.value) {
    alert("Please select a valid Country Name from the list.");
    return;
  }

  try {
    await addDoc(collection(db, "countries"), {
      name: newName.value,
      flag: newFlag.value,
      gold: Number(newGold.value),
      silver: Number(newSilver.value),
      bronze: Number(newBronze.value)
    });

    // Reset Form
    newName.value = "";
    newFlag.value = "";
    newGold.value = 0;
    newSilver.value = 0;
    newBronze.value = 0;
  } catch (e) {
    console.error("Error adding document: ", e);
    alert("Error adding country: " + e.message);
  }
};
</script>

<template>
  <div class="app-container">
    
    <!-- HEADER -->
    <header>
      <div class="brand-area">
        <!-- REPLACED: Image Logo instead of Text Placeholder -->
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
        
        <!-- AUTH BUTTONS -->
        <button v-if="!isLoggedIn" class="btn-header" @click="showLoginModal = true">
          <i class="fas fa-lock"></i> Staff Login
        </button>
        
        <div v-else class="user-info">
          <span class="user-name">Athletics Dept</span>
          <!-- NEW: Link to switch back to Admin Mode if viewing public board -->
          <span v-if="!isAdminView" class="edit-link" @click="isAdminView = true">
            <i class="fas fa-pen"></i> Edit Mode
          </span>
          <span class="logout-link" @click="logout">Logout</span>
        </div>
      </div>
    </header>

    <main>
      <!-- PUBLIC VIEW (Read Only) -->
      <!-- Show this if NOT in Admin View mode -->
      <div v-if="!isAdminView" class="card">
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
            <tr v-if="dataError">
              <td colspan="6" class="error-msg" style="padding: 2rem; text-align: center;">
                <i class="fas fa-exclamation-triangle"></i> {{ dataError }}
              </td>
            </tr>
            <tr v-else-if="medals.length === 0">
              <td colspan="6" style="padding: 2rem;">Loading data... (Or add countries in Firebase Console)</td>
            </tr>
            <!-- Use paginatedMedals here -->
            <tr v-for="(country, index) in paginatedMedals" :key="country.id" :class="{'top-3': (currentPage === 1 && index < 3)}">
              <!-- Calculate Rank based on page number -->
              <td class="rank-cell">{{ (currentPage - 1) * itemsPerPage + index + 1 }}</td>
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
        
        <!-- PAGINATION CONTROLS -->
        <div v-if="totalPages > 1" class="pagination-footer">
          <button 
            @click="prevPage" 
            :disabled="currentPage === 1" 
            class="btn-page"
          >
            <i class="fas fa-chevron-left"></i> Prev
          </button>
          <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
          <button 
            @click="nextPage" 
            :disabled="currentPage === totalPages" 
            class="btn-page"
          >
            Next <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>

      <!-- ADMIN VIEW (Editable) -->
      <!-- Show this ONLY if logged in AND in Admin View mode -->
      <div v-else class="admin-panel">
        <div class="admin-header">
          <h2><i class="fas fa-pen-to-square"></i> Update Medals</h2>
          <!-- UPDATED: Just switch view, don't logout -->
          <button class="btn-secondary" @click="isAdminView = false">View Board</button>
        </div>

        <!-- NEW: ADD COUNTRY FORM -->
        <div class="add-country-form">
          <h3>Add New Country</h3>
          <div class="add-inputs">
            <!-- Flag Display (Replaces text input) -->
            <div class="flag-preview" title="Flag auto-fills based on name">
              {{ newFlag || '🏳️' }}
            </div>
            
            <!-- Smart Country Search -->
            <input 
              v-model="newName" 
              list="country-options" 
              @input="onNameInput"
              placeholder="Search Country Name..." 
              class="input-name"
            >
            <datalist id="country-options">
              <option v-for="c in allCountries" :key="c.name.common" :value="c.name.common" />
            </datalist>

            <input type="number" v-model="newGold" placeholder="G" class="input-medal gold-border" min="0">
            <input type="number" v-model="newSilver" placeholder="S" class="input-medal silver-border" min="0">
            <input type="number" v-model="newBronze" placeholder="B" class="input-medal bronze-border" min="0">
            <button @click="addCountry" class="btn-add"><i class="fas fa-plus"></i> Add</button>
          </div>
        </div>

        <div class="admin-grid">
          <div v-for="country in medals" :key="country.id" class="country-card">
            
            <!-- EDITABLE HEADER (Flag, Name, Delete) -->
            <div class="card-header-edit">
              <input 
                class="edit-flag" 
                :value="country.flag" 
                @change="e => updateCountry(country.id, 'flag', e.target.value)"
              >
              <input 
                class="edit-name" 
                :value="country.name" 
                @change="e => updateCountry(country.id, 'name', e.target.value)"
              >
              <button class="btn-delete" @click="deleteCountry(country.id, country.name)" title="Delete Country">
                <i class="fas fa-trash"></i>
              </button>
            </div>

            <div class="input-group">
              <div class="input-wrapper">
                <label class="lbl-gold">Gold</label>
                <input type="number" :value="country.gold" @change="e => updateCountry(country.id, 'gold', e.target.value)" min="0">
              </div>
              <div class="input-wrapper">
                <label>Silver</label>
                <input type="number" :value="country.silver" @change="e => updateCountry(country.id, 'silver', e.target.value)" min="0">
              </div>
              <div class="input-wrapper">
                <label class="lbl-bronze">Bronze</label>
                <input type="number" :value="country.bronze" @change="e => updateCountry(country.id, 'bronze', e.target.value)" min="0">
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

/* REPLACED: New Logo Styles */
.crest-logo {
  width: 55px;
  height: 55px;
  object-fit: contain;
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

/* BUTTONS */
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

/* PAGINATION FOOTER */
.pagination-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  background: var(--bg-color);
  border-top: 1px solid #eee;
  gap: 20px;
}
.page-info { font-weight: bold; color: var(--text-secondary); font-size: 0.9rem; }
.btn-page {
  background: white; border: 1px solid #ddd; padding: 8px 15px; border-radius: 4px; cursor: pointer; color: var(--text-primary); font-weight: 500;
  display: flex; align-items: center; gap: 5px;
}
.btn-page:hover:not(:disabled) { background: #f0f0f0; border-color: #bbb; }
.btn-page:disabled { opacity: 0.5; cursor: not-allowed; }

/* ADMIN PANEL */
.admin-panel { background: var(--card-bg); padding: 2rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; }
.admin-header { display: flex; justify-content: space-between; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #f3f4f6; }

/* ADD COUNTRY FORM */
.add-country-form {
  background: #fdfdfd;
  border: 1px dashed #ccc;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}
.add-country-form h3 { margin-top: 0; color: var(--text-secondary); font-size: 1rem; margin-bottom: 1rem; }
.add-inputs {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center; /* Vertically align items */
}
.flag-preview {
  width: 50px;
  height: 40px; /* Match height of inputs */
  font-size: 1.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  border-radius: 4px;
  cursor: default;
  border: 1px solid #d1d5db; /* Match input border */
}
.input-name { flex: 2; min-width: 150px; font-weight: bold; }
.input-medal { width: 60px; text-align: center; }
.gold-border { border-color: var(--gold); }
.silver-border { border-color: #aaa; }
.bronze-border { border-color: var(--bronze); }
.btn-add {
  background: var(--bcs-primary); color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold;
}
.btn-add:hover { background: var(--bcs-primary-hover); }

/* ADMIN GRID */
.admin-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.country-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; background: var(--bg-color); }

/* CARD HEADER EDIT */
.card-header-edit {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}
.edit-flag { width: 40px; font-size: 1.5rem; border: 1px solid transparent; background: transparent; text-align: center; border-radius: 4px; }
.edit-flag:hover, .edit-flag:focus { border-color: #ddd; background: white; }

.edit-name { flex: 1; font-weight: bold; font-size: 1.1rem; border: 1px solid transparent; background: transparent; color: var(--text-primary); padding: 4px; border-radius: 4px;}
.edit-name:hover, .edit-name:focus { border-color: #ddd; background: white; }

.btn-delete {
  background: none; border: none; color: #ccc; cursor: pointer; padding: 5px; transition: color 0.2s;
}
.btn-delete:hover { color: var(--bcs-primary); }

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