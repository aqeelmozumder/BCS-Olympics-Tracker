<script setup>
import { ref, computed, watch } from 'vue';
import { useMedals } from '../composables/useMedals';

const { sortedMedals, loading, error } = useMedals();

// Pagination Logic
const currentPage = ref(1);
const itemsPerPage = 10;

const totalPages = computed(() => Math.ceil(sortedMedals.value.length / itemsPerPage));

const paginatedMedals = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return sortedMedals.value.slice(start, end);
});

watch(totalPages, (newVal) => {
  if (currentPage.value > newVal && newVal > 0) currentPage.value = newVal;
});

const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++; };
const prevPage = () => { if (currentPage.value > 1) currentPage.value--; };
</script>

<template>
  <div class="card">
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
        <tr v-if="error">
          <td colspan="6" class="error-msg" style="padding: 2rem; text-align: center;">
            <i class="fas fa-exclamation-triangle"></i> {{ error }}
          </td>
        </tr>
        <tr v-else-if="loading || sortedMedals.length === 0">
          <td colspan="6" style="padding: 2rem;">Loading data...</td>
        </tr>
        <tr v-for="(country, index) in paginatedMedals" :key="country.id" :class="{'top-3': (currentPage === 1 && index < 3)}">
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
    
    <div v-if="totalPages > 1" class="pagination-footer">
      <button @click="prevPage" :disabled="currentPage === 1" class="btn-page">
        <i class="fas fa-chevron-left"></i> Prev
      </button>
      <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
      <button @click="nextPage" :disabled="currentPage === totalPages" class="btn-page">
        Next <i class="fas fa-chevron-right"></i>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* TABLE STYLES */
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
.error-msg { color: red; font-size: 0.9rem; }

/* PAGINATION */
.pagination-footer { display: flex; justify-content: center; align-items: center; padding: 1rem; background: var(--bg-color); border-top: 1px solid #eee; gap: 20px; }
.page-info { font-weight: bold; color: var(--text-secondary); font-size: 0.9rem; }
.btn-page { background: white; border: 1px solid #ddd; padding: 8px 15px; border-radius: 4px; cursor: pointer; color: var(--text-primary); font-weight: 500; display: flex; align-items: center; gap: 5px; }
.btn-page:hover:not(:disabled) { background: #f0f0f0; border-color: #bbb; }
.btn-page:disabled { opacity: 0.5; cursor: not-allowed; }

@media (max-width: 768px) {
  .rank-cell { display: none; }
  th, td { padding: 10px 5px; font-size: 1rem; }
}
</style>