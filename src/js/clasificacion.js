// clasificacion.js
// Construye y muestra el ranking general de lectores ordenado por puntos.

import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "./firebase-config.js";
import { mostrarToast, escaparHTML } from "./ui.js";

const listaClasificacion = document.getElementById("listaClasificacion");
const clasificacionVacio = document.getElementById("clasificacionVacio");

function formatearPuntos(puntos) {
  return Number(puntos).toLocaleString("es-AR", { maximumFractionDigits: 1 });
}

function crearItemRanking(puesto, nombre, puntos) {
  const li = document.createElement("li");
  li.className = `rank-item${puesto === 1 ? " rank-item--1" : ""}`;
  li.innerHTML = `
    <span class="rank-item__puesto">${puesto}</span>
    <p class="rank-item__nombre">${escaparHTML(nombre)}</p>
    <span class="rank-item__puntos">${formatearPuntos(puntos)}</span>
  `;
  return li;
}

export async function cargarClasificacionGeneral() {
  listaClasificacion.innerHTML = "";

  try {
    const usuariosRef = collection(db, "usuarios");
    const snapshot = await getDocs(usuariosRef);

    const clasificacion = [];
    snapshot.forEach((d) => {
      const data = d.data();
      clasificacion.push({
        nombre: data.nombre || "Usuario sin nombre",
        puntos: data.puntosTotales || 0,
      });
    });

    clasificacion.sort((a, b) => b.puntos - a.puntos);

    clasificacionVacio.classList.toggle("hidden", clasificacion.length > 0);

    clasificacion.forEach((usuario, index) => {
      listaClasificacion.appendChild(crearItemRanking(index + 1, usuario.nombre, usuario.puntos));
    });
  } catch (error) {
    console.error("Error al obtener la clasificación:", error);
    mostrarToast("No se pudo cargar la clasificación general.", "error");
  }
}
