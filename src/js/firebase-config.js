// firebase-config.js
// Inicialización centralizada de Firebase. Si necesitás rotar la API key
// (recomendado: restringila por dominio en la consola de Firebase),
// este es el único lugar donde hay que tocar algo.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCD1wuSv95m9flkBh3P5yDkvVrxmC8xKaQ",
  authDomain: "competencia-de-lectura.firebaseapp.com",
  projectId: "competencia-de-lectura",
  storageBucket: "competencia-de-lectura.appspot.com",
  messagingSenderId: "816205347491",
  appId: "1:816205347491:web:f0ed3f0213e293d0f8dd16",
  measurementId: "G-X67LWQ6NR3",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
