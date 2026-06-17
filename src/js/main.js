// main.js
// Punto de entrada. Maneja la navegacion por pestanas y reacciona a los
// cambios de sesion, mostrando/ocultando secciones y arrancando o deteniendo
// las suscripciones en tiempo real (chat) segun corresponda.

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { auth } from "./firebase-config.js";
import "./auth.js";
import { cargarLibros, actualizarEstadisticas } from "./libros.js";
import { cargarClasificacionGeneral } from "./clasificacion.js";
import { cargarPeriodoActual } from "./periodo.js";
import { iniciarChat, detenerChat } from "./chat.js";

const cargaInicial = document.getElementById("cargaInicial");
const seccionAuth = document.getElementById("seccionAuth");
const appAutenticada = document.getElementById("appAutenticada");

const tabs = [
  { boton: document.getElementById("tabBtnLibros"), panel: document.getElementById("tabLibros") },
  { boton: document.getElementById("tabBtnClasificacion"), panel: document.getElementById("tabClasificacion") },
  { boton: document.getElementById("tabBtnChat"), panel: document.getElementById("tabChat") },
];

function activarTab(idPanel) {
  tabs.forEach(({ boton, panel }) => {
    const activo = panel.id === idPanel;
    panel.classList.toggle("hidden", !activo);
    boton.classList.toggle("is-active", activo);
    boton.setAttribute("aria-selected", String(activo));

    if (activo && idPanel === "tabClasificacion") {
      cargarClasificacionGeneral();
    }
  });
}

tabs.forEach(({ boton, panel }) => {
  boton.addEventListener("click", () => activarTab(panel.id));
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((error) => {
      console.error("No se pudo registrar el service worker:", error);
    });
  });
}

onAuthStateChanged(auth, async (user) => {
  cargaInicial.classList.add("hidden");

  if (user) {
    seccionAuth.classList.add("hidden");
    appAutenticada.classList.remove("hidden");

    await Promise.all([
      cargarLibros(),
      actualizarEstadisticas(),
      cargarPeriodoActual(),
    ]);

    activarTab("tabLibros");
    iniciarChat();
  } else {
    detenerChat();
    appAutenticada.classList.add("hidden");
    seccionAuth.classList.remove("hidden");
  }
});
