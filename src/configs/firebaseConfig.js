import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

//mika account
const firebaseConfig = {
    apiKey: "AIzaSyAMctAiJPmTTxKXTsSB973y8IlTuCLB7fI",
    authDomain: "mental-support-hub.firebaseapp.com",
    projectId: "mental-support-hub",
    storageBucket: "mental-support-hub.appspot.com",
    messagingSenderId: "875310282172",
    appId: "1:875310282172:web:9329d2002d13211c14e7b9",
    measurementId: "G-3KDEYJMEEZ",
  // apiKey: "AIzaSyBAaWq-43VCcfhNRa--7l5oLEmNFtS2vf8",
  // authDomain: "mood-tracker-4003e.firebaseapp.com",
  // projectId: "mood-tracker-4003e",
  // storageBucket: "mood-tracker-4003e.appspot.com",
  // messagingSenderId: "948465157136",
  // appId: "1:948465157136:web:ba42c938cf5c0adadd7695",
  // measurementId: "G-5E282CCQBP",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, provider, db };
