// chat.js
// Chat en tiempo real entre lectores. Controla la suscripción a Firestore
// para evitar listeners duplicados si la persona cierra e inicia sesión
// varias veces en la misma pestaña (bug presente en la versión anterior).

import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  limit,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";
import { obtenerOCrearUsuario } from "./auth.js";
import { mostrarToast, escaparHTML } from "./ui.js";

const formChat = document.getElementById("formChat");
const mensajeInput = document.getElementById("mensajeInput");
const chatBox = document.getElementById("chatBox");

let unsubscribeChat = null;

function crearElementoMensaje(nick, mensaje, timestamp) {
  const el = document.createElement("p");
  el.className = "chat-msg";
  const fechaTexto = timestamp
    ? `${timestamp.toLocaleDateString("es-AR")} ${timestamp.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`
    : "";
  el.innerHTML = `
    <span class="chat-msg__nick">${escaparHTML(nick)}</span>: ${escaparHTML(mensaje)}
    ${fechaTexto ? `<span class="chat-msg__hora">${fechaTexto}</span>` : ""}
  `;
  return el;
}

export function iniciarChat() {
  detenerChat(); // por si quedó una suscripción previa activa

  const q = query(collection(db, "mensajes"), orderBy("timestamp", "desc"), limit(50));

  unsubscribeChat = onSnapshot(
    q,
    (snapshot) => {
      chatBox.innerHTML = "";
      const mensajes = [];
      snapshot.forEach((d) => mensajes.push(d.data()));
      mensajes.reverse(); // mostrar del más viejo al más nuevo

      mensajes.forEach(({ nick, mensaje, timestamp }) => {
        chatBox.appendChild(
          crearElementoMensaje(nick || "Anónimo", mensaje || "", timestamp?.toDate?.())
        );
      });

      chatBox.scrollTop = chatBox.scrollHeight;
    },
    (error) => {
      console.error("Error al recibir mensajes del chat:", error);
      mostrarToast("Se perdió la conexión con el chat.", "error");
    }
  );
}

export function detenerChat() {
  if (unsubscribeChat) {
    unsubscribeChat();
    unsubscribeChat = null;
  }
}

formChat.addEventListener("submit", async (event) => {
  event.preventDefault();

  const mensaje = mensajeInput.value.trim();
  const user = auth.currentUser;

  if (!user || !mensaje) return;

  try {
    const { data } = await obtenerOCrearUsuario(user.uid);
    await addDoc(collection(db, "mensajes"), {
      userId: user.uid,
      nick: data.nombre || "Usuario anónimo",
      mensaje,
      timestamp: new Date(),
    });
    mensajeInput.value = "";
  } catch (error) {
    console.error("Error al enviar el mensaje:", error);
    mostrarToast("No se pudo enviar el mensaje. Probá de nuevo.", "error");
  }
});
