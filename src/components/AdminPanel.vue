<script setup>
import { ref, onMounted } from 'vue';
import { useMedals } from '../composables/useMedals';

const props = defineProps(['isLoggedIn']);
const emit = defineEmits(['close-view']);

const { medals, updateCountry, deleteCountry, addCountry } = useMedals();

// Add Country State
const newName = ref("");
const newFlag = ref("");
const newGold = ref(0);
const newSilver = ref(0);
const newBronze = ref(0);
const allCountries = ref([]);

onMounted(() => {
  fetch("https://restcountries.com/v3.1/all?fields=name,flag")
    .then(res => res.json())
    .then(data => {
      allCountries.value = data.sort((a, b) => a.name.common.localeCompare(b.name.common));
    })
    .catch(() => console.log("Auto-complete API unavailable"));
});

const onNameInput = () => {
  const match = allCountries.value.find(c => c.name.common === newName.value);
  newFlag.value = match ? match.flag : "";
};

const handleAdd = async () => {
  if (!newName.value || !newFlag.value) {
    alert("Please select a valid Country Name.");
    return;
  }
  await addCountry({
    name: newName.value,
    flag: newFlag.value,
    gold: newGold.value,
    silver: newSilver.value,
    bronze: newBronze.value
  });
  // Reset
  newName.value = ""; newFlag.value = ""; newGold.value = 0; newSilver.value = 0; newBronze.value = 0;
};

const handleDelete = async (id, name) => {
  if (confirm(`Delete ${name}?`)) {
    await deleteCountry(id);
  }
};
</script>

<template>
  <div class="admin-panel">
    <div class="admin-header">
      <h2><i class="fas fa-pen-to-square"></i> Update Medals</h2>
      <button class="btn-secondary" @click="$emit('close-view')">View Board</button>
    </div>

    <!-- ADD COUNTRY FORM -->
    <div class="add-country-form">
      <h3>Add New Country</h3>
      <div class="add-inputs">
        <div class="flag-preview" title="Flag auto-fills">{{ newFlag || '🏳️' }}</div>
        <input v-model="newName" list="country-options" @input="onNameInput" placeholder="Search Country Name..." class="input-name">
        <datalist id="country-options">
          <option v-for="c in allCountries" :key="c.name.common" :value="c.name.common" />
        </datalist>
        <input type="number" v-model="newGold" placeholder="G" class="input-medal gold-border" min="0">
        <input type="number" v-model="newSilver" placeholder="S" class="input-medal silver-border" min="0">
        <input type="number" v-model="newBronze" placeholder="B" class="input-medal bronze-border" min="0">
        <button @click="handleAdd" class="btn-add"><i class="fas fa-plus"></i> Add</button>
      </div>
    </div>

    <!-- GRID -->
    <div class="admin-grid">
      <div v-for="country in medals" :key="country.id" class="country-card">
        <div class="card-header-edit">
          <input class="edit-flag" :value="country.flag" @change="e => updateCountry(country.id, 'flag', e.target.value)">
          <input class="edit-name" :value="country.name" @change="e => updateCountry(country.id, 'name', e.target.value)">
          <button class="btn-delete" @click="handleDelete(country.id, country.name)"><i class="fas fa-trash"></i></button>
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
</template>

<style scoped>
.admin-panel { background: var(--card-bg); padding: 2rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; }
.admin-header { display: flex; justify-content: space-between; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #f3f4f6; }
.btn-secondary { background: #eee; color: #333; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; }

/* ADD FORM */
.add-country-form { background: #fdfdfd; border: 1px dashed #ccc; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; }
.add-country-form h3 { margin-top: 0; color: var(--text-secondary); font-size: 1rem; margin-bottom: 1rem; }
.add-inputs { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.flag-preview { width: 50px; height: 40px; font-size: 1.8rem; display: flex; align-items: center; justify-content: center; background: #f0f0f0; border-radius: 4px; border: 1px solid #d1d5db; }
.input-name { flex: 2; min-width: 150px; font-weight: bold; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; }
.input-medal { width: 60px; text-align: center; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; font-weight: bold; }
.gold-border { border-color: var(--gold); }
.silver-border { border-color: #aaa; }
.bronze-border { border-color: var(--bronze); }
.btn-add { background: var(--bcs-primary); color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; }
.btn-add:hover { background: var(--bcs-primary-hover); }

/* GRID */
.admin-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.country-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; background: var(--bg-color); }
.card-header-edit { display: flex; align-items: center; gap: 8px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee; }
.edit-flag { width: 40px; font-size: 1.5rem; border: 1px solid transparent; background: transparent; text-align: center; border-radius: 4px; }
.edit-flag:hover { background: white; border-color: #ddd; }
.edit-name { flex: 1; font-weight: bold; font-size: 1.1rem; border: 1px solid transparent; background: transparent; color: var(--text-primary); padding: 4px; border-radius: 4px;}
.edit-name:hover { background: white; border-color: #ddd; }
.btn-delete { background: none; border: none; color: #ccc; cursor: pointer; padding: 5px; }
.btn-delete:hover { color: var(--bcs-primary); }

.input-group { display: flex; gap: 10px; }
.input-wrapper { flex: 1; text-align: center; }
.input-wrapper label { display: block; font-size: 0.7rem; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; color: #666; }
.lbl-gold { color: var(--gold) !important; }
.lbl-bronze { color: var(--bronze) !important; }
.input-wrapper input { width: 100%; padding: 8px; text-align: center; border: 1px solid #d1d5db; border-radius: 4px; font-size: 1.2rem; font-weight: bold; box-sizing: border-box;}
</style>