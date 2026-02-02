import { ref, onMounted } from 'vue';
import { auth } from '../firebase.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

const user = ref(null);
const isLoggedIn = ref(false);

export function useAuth() {
  
  onMounted(() => {
    onAuthStateChanged(auth, (u) => {
      user.value = u;
      isLoggedIn.value = !!u;
    });
  });

  const login = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return {
    user,
    isLoggedIn,
    login,
    logout
  };
}