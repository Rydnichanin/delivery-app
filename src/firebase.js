import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCL6-EtOKTlXcuM0ayOkJ_s7k-sZ3BdmYg",
  authDomain: "todace-df1af.firebaseapp.com",
  projectId: "todace-df1af",
  storageBucket: "todace-df1af.firebasestorage.app",
  messagingSenderId: "87380622450",
  appId: "1:87380622450:web:4f8df013151c78aaa4d6eb"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
