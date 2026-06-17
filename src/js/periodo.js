// periodo.js
// Define y muestra el período de competencia activo.
// La escritura está pensada para restringirse a una cuenta admin
// mediante las reglas de seguridad de Firestore (ver firestore.rules).

import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "./firebase-config.js";
import { mostrarToast, mostrarErrorEnLinea, ocultarErrorEnLinea } from "./ui.js";

const periodoActualEl = document.getElementById("periodoActual");
const btnEditarPeriodo = document.getElementById("btnEditarPeriodo");
const formPeriodo = document.getElementById("formPeriodo");
const fechaInicioInput = document.getElementById("fechaInicio");
const fechaFinInput = document.getElementById("fechaFin");
const periodoError = document.getElementById("periodoError");
const btnCancelarPeriodo = document.getElementById("btnCancelarPeriodo");

function formatearFecha(isoString) {
  if (!isoString) return "";
  const partes = isoString.split("-");
  const anio = partes[0];
  const mes = partes[1];
  const dia = partes[2];
  return `${dia}/${mes}/${anio}`;
}

btnEditarPeriodo.addEventListener("click", () => {
  formPeriodo.classList.remove("hidden");
  btnEditarPeriodo.classList.add("hidden");
});

btnCancelarPeriodo.addEventListener("click", () => {
  formPeriodo.classList.add("hidden");
  btnEditarPeriodo.classList.remove("hidden");
  ocultarErrorEnLinea(periodoError);
});

export async function cargarPeriodoActual() {
  try {
    const settingsRef = doc(db, "settings", "competitionPeriod");
    const snap = await getDoc(settingsRef);

    if (snap.exists()) {
      const datos = snap.data();
      periodoActualEl.textContent = `${formatearFecha(datos.inicio)} a ${formatearFecha(datos.fin)}`;
    } else {
      periodoActualEl.textContent = "Sin definir todavía.";
    }
    btnEditarPeriodo.classList.remove("hidden");
  } catch (error) {
    console.error("Error al obtener el período:", error);
    periodoActualEl.textContent = "No se pudo cargar el período.";
  }
}

formPeriodo.addEventListener("submit", async (event) => {
  event.preventDefault();
  ocultarErrorEnLinea(periodoError);

  const inicio = fechaInicioInput.value;
  const fin = fechaFinInput.value;

  if (new Date(inicio) > new Date(fin)) {
    mostrarErrorEnLinea(periodoError, "La fecha de inicio no puede ser posterior a la de fin.");
    return;
  }

  try {
    await setDoc(doc(db, "settings", "competitionPeriod"), { inicio, fin });
    formPeriodo.classList.add("hidden");
    btnEditarPeriodo.classList.remove("hidden");
    mostrarToast("Período actualizado.", "success");
    await cargarPeriodoActual();
  } catch (error) {
    console.error("Error al establecer el período:", error);
    mostrarErrorEnLinea(
      periodoError,
      "No se pudo guardar el período. Es posible que tu cuenta no tenga permiso para editarlo."
    );
  }
});
