import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyCAy64mUxkBO5KGcBX73tRlPDeR85jteKs',
  authDomain: 'brampton-bbd49.firebaseapp.com',
  projectId: 'brampton-bbd49',
  storageBucket: 'brampton-bbd49.firebasestorage.app',
  messagingSenderId: '247094682985',
  appId: '1:247094682985:web:be7038ca8e8df0488749f8',
  measurementId: 'G-7WV77P3G63',
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
export const db = getFirestore(app);
export const storage = getStorage(app);
