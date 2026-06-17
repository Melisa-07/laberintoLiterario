// auth.js
// Maneja el flujo de autenticación: alterna entre "iniciar sesión" y
// "registrarse" de forma explícita (en vez de adivinar probando ambos),
// valida en el cliente y traduce errores de Firebase a español.

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";
import {
  mostrarToast,
  setBotonCargando,
  mostrarErrorEnLinea,
  ocultarErrorEnLinea,
  traducirErrorAuth,
} from "./ui.js";

const formAuth = document.getElementById("formAuth");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const nickInput = document.getElementById("nick");
const campoNick = document.getElementById("campoNick");
const authError = document.getElementById("authError");
const btnSubmit = document.getElementById("btnAuthSubmit");
const btnSwitch = document.getElementById("btnAuthSwitch");
const togglePassword = document.getElementById("togglePassword");
const btnLogout = document.getElementById("btnLogout");

let modo = "login"; // "login" | "registro"

function actualizarModoUI() {
  const esRegistro = modo === "registro";
  campoNick.classList.toggle("hidden", !esRegistro);
  nickInput.required = esRegistro;
  formAuth.querySelector(".btn__label").textContent = esRegistro
    ? "Crear cuenta"
    : "Iniciar sesión";
  btnSwitch.textContent = esRegistro
    ? "¿Ya tenés cuenta? Iniciá sesión"
    : "¿No tenés cuenta? Registrate";
  ocultarErrorEnLinea(authError);
}

btnSwitch.addEventListener("click", () => {
  modo = modo === "login" ? "registro" : "login";
  actualizarModoUI();
});

togglePassword.addEventListener("click", () => {
  const esTexto = passwordInput.type === "text";
  passwordInput.type = esTexto ? "password" : "text";
  togglePassword.setAttribute("aria-pressed", String(!esTexto));
  togglePassword.querySelector(".sr-only").textContent = esTexto
    ? "Mostrar contraseña"
    : "Ocultar contraseña";
});

formAuth.addEventListener("submit", async (event) => {
  event.preventDefault();
  ocultarErrorEnLinea(authError);

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const nick = nickInput.value.trim();

  if (modo === "registro" && !nick) {
    mostrarErrorEnLinea(authError, "Elegí un nombre para mostrar en la clasificación.");
    return;
  }

  setBotonCargando(btnSubmit, true);

  try {
    if (modo === "registro") {
      const credencial = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "usuarios", credencial.user.uid), {
        puntosTotales: 0,
        nombre: nick,
      });
      mostrarToast(`¡Bienvenida/o, ${nick}!`, "success");
    } else {
      await signInWithEmailAndPassword(auth, email, password);
      mostrarToast("Sesión iniciada.", "success");
    }
  } catch (error) {
    mostrarErrorEnLinea(authError, traducirErrorAuth(error.code));
  } finally {
    setBotonCargando(btnSubmit, false);
  }
});

btnLogout.addEventListener("click", async () => {
  try {
    await signOut(auth);
    mostrarToast("Sesión cerrada.", "info");
  } catch (error) {
    mostrarToast("No se pudo cerrar la sesión. Probá de nuevo.", "error");
  }
});

/**
 * Obtiene (o crea con valores por defecto) el documento de un usuario en Firestore.
 * Centraliza la lógica de "si no existe, lo creo" que antes estaba repetida
 * en varias funciones del archivo original.
 * @param {string} uid
 */
export async function obtenerOCrearUsuario(uid, nombrePorDefecto = "Usuario") {
  const userRef = doc(db, "usuarios", uid);
  const userDoc = await getDoc(userRef);
  if (userDoc.exists()) {
    return { ref: userRef, data: userDoc.data() };
  }
  const datosIniciales = { puntosTotales: 0, nombre: nombrePorDefecto };
  await setDoc(userRef, datosIniciales);
  return { ref: userRef, data: datosIniciales };
}

actualizarModoUI();
