import { ref, computed, onMounted } from 'vue';
import { db } from '../firebase.js';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';

const medals = ref([]);
const error = ref(null);
const loading = ref(true);

export function useMedals() {
  
  // Real-time listener
  onMounted(() => {
    const countriesCollection = collection(db, "countries");
    onSnapshot(countriesCollection, (snapshot) => {
      medals.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      loading.value = false;
      error.value = null;
    }, (err) => {
      console.error("Firebase Error:", err);
      if (err.code === 'permission-denied') {
        error.value = "Access Denied: Check Firestore Rules.";
      } else {
        error.value = err.message;
      }
      loading.value = false;
    });
  });

  // Sorting
  const sortedMedals = computed(() => {
    return [...medals.value].sort((a, b) => {
      if (b.gold !== a.gold) return b.gold - a.gold;
      if (b.silver !== a.silver) return b.silver - a.silver;
      return b.bronze - a.bronze;
    });
  });

  // Actions
  const updateCountry = async (id, field, value) => {
    const countryRef = doc(db, "countries", id);
    let finalValue = value;
    if (['gold', 'silver', 'bronze'].includes(field)) {
      finalValue = Number(value);
    }
    await updateDoc(countryRef, { [field]: finalValue });
  };

  const addCountry = async (countryData) => {
    await addDoc(collection(db, "countries"), {
      name: countryData.name,
      flag: countryData.flag,
      gold: Number(countryData.gold),
      silver: Number(countryData.silver),
      bronze: Number(countryData.bronze)
    });
  };

  const deleteCountry = async (id) => {
    await deleteDoc(doc(db, "countries", id));
  };

  return {
    medals,
    sortedMedals,
    loading,
    error,
    updateCountry,
    addCountry,
    deleteCountry
  };
}