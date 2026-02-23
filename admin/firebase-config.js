import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const firebaseConfig = {
    apiKey: 'AIzaSyCX5ieGN0YNMTrdmK0s4B9S7eSoQQz3n8w',
    authDomain: 'lecomax-a6c9b.firebaseapp.com',
    projectId: 'lecomax-a6c9b',
    storageBucket: 'lecomax-a6c9b.firebasestorage.app',
    messagingSenderId: '499537252435',
    appId: '1:499537252435:web:ab0eda7b0636630b1bb6a6'
};

export const ADMIN_EMAIL = 'admin@lecomax.com';

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
