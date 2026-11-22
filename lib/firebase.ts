import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore,
} from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyAjMpF6lXVdF0jURidxFTJxm2ua_lHomLs",
  authDomain: "billingsoftware-11.firebaseapp.com",
  projectId: "billingsoftware-11",
  storageBucket: "billingsoftware-11.firebasestorage.app",
  messagingSenderId: "75306232120",
  appId: "1:75306232120:web:394e0d413a24f018a279cd",
};

const app = getApps()[0] ?? initializeApp(firebaseConfig);
export const auth = getAuth(app);

let _db: Firestore;
try {
  _db =
    typeof window !== "undefined"
      ? initializeFirestore(app, {
          localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
        })
      : getFirestore(app);
} catch {
  _db = getFirestore(app);
}
export const db = _db;
