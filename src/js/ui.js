// ui.js
// Helpers de interfaz reutilizables: notificaciones tipo toast,
// estados de carga en botones, y traducción de errores de Firebase al español.

const toastRegion = document.getElementById("toastRegion");

/**
 * Muestra una notificación temporal no intrusiva.
 * @param {string} mensaje
 * @param {"success"|"error"|"info"} tipo
 */
export function mostrarToast(mensaje, tipo = "info") {
  const toast = document.createElement("p");
  toast.className = `toast toast--${tipo}`;
  toast.setAttribute("role", tipo === "error" ? "alert" : "status");
  toast.textContent = mensaje;
  toastRegion.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 4000);
}

/**
 * Activa o desactiva el estado de "cargando" de un botón con spinner interno.
 * Evita doble envío de formularios y comunica el estado a lectores de pantalla.
 * @param {HTMLButtonElement} boton
 * @param {boolean} cargando
 */
export function setBotonCargando(boton, cargando) {
  const label = boton.querySelector(".btn__label");
  const spinner = boton.querySelector(".btn__spinner");
  boton.disabled = cargando;
  boton.setAttribute("aria-busy", String(cargando));
  if (spinner) spinner.classList.toggle("hidden", !cargando);
  if (label) label.style.opacity = cargando ? "0.6" : "1";
}

/**
 * Muestra un mensaje de error dentro de un contenedor de alerta inline.
 * @param {HTMLElement} contenedor
 * @param {string} mensaje
 */
export function mostrarErrorEnLinea(contenedor, mensaje) {
  if (!contenedor) return;
  contenedor.textContent = mensaje;
  contenedor.classList.remove("hidden");
}

/**
 * Oculta el contenedor de alerta inline.
 * @param {HTMLElement} contenedor
 */
export function ocultarErrorEnLinea(contenedor) {
  if (!contenedor) return;
  contenedor.textContent = "";
  contenedor.classList.add("hidden");
}

/**
 * Traduce los códigos de error de Firebase Auth a mensajes claros en español.
 * @param {string} codigo
 */
export function traducirErrorAuth(codigo) {
  const mensajes = {
    "auth/invalid-email": "El correo electrónico no es válido.",
    "auth/missing-password": "Ingresá una contraseña.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/email-already-in-use": "Ya existe una cuenta con ese correo. Probá iniciar sesión.",
    "auth/invalid-credential": "Correo o contraseña incorrectos.",
    "auth/wrong-password": "Correo o contraseña incorrectos.",
    "auth/user-not-found": "No existe una cuenta con ese correo. Probá registrarte.",
    "auth/too-many-requests": "Demasiados intentos. Esperá un momento y volvé a intentar.",
    "auth/network-request-failed": "Hubo un problema de conexión. Revisá tu internet.",
  };
  return mensajes[codigo] || "Ocurrió un error inesperado. Intentá de nuevo.";
}

/**
 * Escapa texto antes de insertarlo como contenido HTML, para evitar
 * inyección de marcado a través de nombres de usuario o mensajes de chat.
 * @param {string} texto
 */
export function escaparHTML(texto) {
  const div = document.createElement("div");
  div.textContent = texto ?? "";
  return div.innerHTML;
}
