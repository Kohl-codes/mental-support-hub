import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; 

//mika account
const firebaseConfig = {
    apiKey: "AIzaSyAMctAiJPmTTxKXTsSB973y8IlTuCLB7fI",
    authDomain: "mental-support-hub.firebaseapp.com",
    projectId: "mental-support-hub",
    storageBucket: "mental-support-hub.appspot.com",
    messagingSenderId: "875310282172",
    appId: "1:875310282172:web:9329d2002d13211c14e7b9",
    measurementId: "G-3KDEYJMEEZ"
};
  
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app); 

export { auth, provider, db };
