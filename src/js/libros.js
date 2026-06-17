// libros.js
// Agregar, listar y eliminar libros. Calcula puntos según la regla fija
// del proyecto y mantiene sincronizado el total de puntos del usuario.

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";
import { obtenerOCrearUsuario } from "./auth.js";
import {
  mostrarToast,
  setBotonCargando,
  mostrarErrorEnLinea,
  ocultarErrorEnLinea,
  escaparHTML,
} from "./ui.js";

const formLibro = document.getElementById("formLibro");
const nombreInput = document.getElementById("nombreLibro");
const autorInput = document.getElementById("autorLibro");
const paginasInput = document.getElementById("paginasLibro");
const libroError = document.getElementById("libroError");
const btnAgregar = document.getElementById("btnAgregarLibro");
const listaLibros = document.getElementById("listaLibros");
const librosVacio = document.getElementById("librosVacio");
const puntosTotalesEl = document.getElementById("puntosTotales");
const puntosDetalleEl = document.getElementById("puntosDetalle");

/**
 * Regla de puntuación del proyecto (definida en el README original):
 * <=100 pag = 1 pto, <=200 pag = 2 ptos, <=300 pag = 3,5 ptos, >300 pag = 5 ptos
 * @param {number} paginas
 */
export function calcularPuntos(paginas) {
  if (paginas <= 100) return 1;
  if (paginas <= 200) return 2;
  if (paginas <= 300) return 3.5;
  return 5;
}

function formatearPuntos(puntos) {
  return Number(puntos).toLocaleString("es-AR", { maximumFractionDigits: 1 });
}

function validarLibro(nombre, autor, paginas) {
  if (!nombre) return "El título no puede estar vacío.";
  if (!autor) return "Indicá el autor o autora.";
  if (!Number.isFinite(paginas) || paginas <= 0) {
    return "La cantidad de páginas tiene que ser un número mayor a 0.";
  }
  if (paginas > 20000) return "Esa cantidad de páginas no parece correcta.";
  return null;
}

formLibro.addEventListener("submit", async (event) => {
  event.preventDefault();
  ocultarErrorEnLinea(libroError);

  const nombre = nombreInput.value.trim();
  const autor = autorInput.value.trim();
  const paginas = parseInt(paginasInput.value, 10);

  const errorValidacion = validarLibro(nombre, autor, paginas);
  if (errorValidacion) {
    mostrarErrorEnLinea(libroError, errorValidacion);
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    mostrarToast("Por favor, iniciá sesión para agregar libros.", "error");
    return;
  }

  const puntos = calcularPuntos(paginas);
  setBotonCargando(btnAgregar, true);

  try {
    await addDoc(collection(db, "libros"), {
      userId: user.uid,
      nombre,
      autor,
      paginas,
      puntos,
      fecha: new Date(),
    });

    const { ref: userRef, data } = await obtenerOCrearUsuario(user.uid);
    const totalPuntos = (data.puntosTotales || 0) + puntos;
    await updateDoc(userRef, { puntosTotales: totalPuntos });

    mostrarToast(`"${nombre}" agregado (+${formatearPuntos(puntos)} ptos).`, "success");
    formLibro.reset();
    await Promise.all([cargarLibros(), actualizarEstadisticas()]);
  } catch (error) {
    console.error("Error al agregar el libro:", error);
    mostrarErrorEnLinea(libroError, "No se pudo guardar el libro. Probá de nuevo en un momento.");
  } finally {
    setBotonCargando(btnAgregar, false);
  }
});

function crearItemLibro(id, libroData) {
  const { nombre = "Desconocido", autor = "Desconocido", paginas = 0, puntos = 0 } = libroData;

  const li = document.createElement("li");
  li.className = "book-item";
  li.innerHTML = `
    <span class="book-item__puntos">${formatearPuntos(puntos)}</span>
    <div class="book-item__info">
      <p class="book-item__titulo">${escaparHTML(nombre)}</p>
      <p class="book-item__meta">${escaparHTML(autor)} · ${paginas} pág.</p>
    </div>
    <button class="book-item__eliminar" type="button" aria-label="Eliminar ${escaparHTML(nombre)}">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" d="M6 7h12l-1 13H7L6 7zm3-3h6l1 2H8l1-2zM4 7h16" fill="none"/></svg>
    </button>
  `;

  li.querySelector(".book-item__eliminar").addEventListener("click", () => eliminarLibro(id, nombre));
  return li;
}

export async function cargarLibros() {
  const user = auth.currentUser;
  if (!user) return;

  listaLibros.innerHTML = "";
  try {
    const librosRef = collection(db, "libros");
    const q = query(librosRef, where("userId", "==", user.uid));
    const snapshot = await getDocs(q);

    librosVacio.classList.toggle("hidden", !snapshot.empty);

    const libros = [];
    snapshot.forEach((d) => libros.push({ id: d.id, ...d.data() }));
    libros.sort((a, b) => (b.fecha?.toMillis?.() || 0) - (a.fecha?.toMillis?.() || 0));

    libros.forEach((libro) => listaLibros.appendChild(crearItemLibro(libro.id, libro)));
  } catch (error) {
    console.error("Error al obtener los libros:", error);
    mostrarToast("No se pudo cargar tu biblioteca. Revisá tu conexión.", "error");
  }
}

async function eliminarLibro(libroId, nombre) {
  const confirmado = window.confirm(`¿Eliminar "${nombre}" de tu biblioteca?`);
  if (!confirmado) return;

  const user = auth.currentUser;
  if (!user) return;

  try {
    const libroRef = doc(db, "libros", libroId);
    const libroDoc = await getDoc(libroRef);
    if (!libroDoc.exists()) {
      mostrarToast("Ese libro ya no existe.", "error");
      await cargarLibros();
      return;
    }

    const puntosLibro = libroDoc.data().puntos || 0;
    await deleteDoc(libroRef);

    const { ref: userRef, data } = await obtenerOCrearUsuario(user.uid);
    const totalPuntos = Math.max(0, (data.puntosTotales || 0) - puntosLibro);
    await updateDoc(userRef, { puntosTotales: totalPuntos });

    mostrarToast("Libro eliminado.", "info");
    await Promise.all([cargarLibros(), actualizarEstadisticas()]);
  } catch (error) {
    console.error("Error al eliminar el libro:", error);
    mostrarToast("No se pudo eliminar el libro. Probá de nuevo.", "error");
  }
}

export async function actualizarEstadisticas() {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const { data } = await obtenerOCrearUsuario(user.uid);
    const total = data.puntosTotales || 0;
    puntosTotalesEl.textContent = formatearPuntos(total);
    puntosDetalleEl.textContent =
      total === 0
        ? "Agregá tu primer libro para empezar a sumar."
        : "Seguí sumando para subir en la clasificación.";
  } catch (error) {
    console.error("Error al calcular las estadísticas:", error);
    puntosTotalesEl.textContent = "—";
  }
}
