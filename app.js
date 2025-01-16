import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    doc,
    getDoc,
    updateDoc,
    setDoc,
    deleteDoc,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";
import {
    getMessaging,
    getToken,
    onMessage
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-messaging.js";


// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCD1wuSv95m9flkBh3P5yDkvVrxmC8xKaQ",
    authDomain: "competencia-de-lectura.firebaseapp.com",
    projectId: "competencia-de-lectura",
    storageBucket: "competencia-de-lectura.appspot.com",
    messagingSenderId: "816205347491",
    appId: "1:816205347491:web:f0ed3f0213e293d0f8dd16",
    measurementId: "G-X67LWQ6NR3",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const messaging = getMessaging(app);

// Functions to show/hide sections
function mostrarSeccionPrincipal() {
    document.getElementById("formAuth").style.display = "none";
    document.getElementById("principal").style.display = "block";
}

async function enviarMensaje(event) {
    event.preventDefault();

    const mensaje = document.getElementById("mensajeInput").value.trim();
    const user = auth.currentUser;

    if (user && mensaje) {
        try {
            // Obtener el nick del usuario desde Firestore
            const userRef = doc(db, "usuarios", user.uid);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const nick = userData.nombre || "Usuario Anónimo";  // Usamos el campo 'nombre' como nick

                // Enviar el mensaje junto con el nick del usuario y la marca de tiempo
                await addDoc(collection(db, "mensajes"), {
                    userId: user.uid,
                    nick: nick,
                    mensaje: mensaje,
                    timestamp: new Date(),
                });

                // Limpiar el campo de mensaje
                document.getElementById("mensajeInput").value = "";
            } else {
                console.log("No se encontró el usuario en la base de datos.");
            }
        } catch (error) {
            console.error("Error al enviar el mensaje: ", error.message);
        }
    } else {
        alert("Por favor, inicia sesión para enviar un mensaje.");
    }
}

// Function to show messages in real time
function mostrarMensajes() {
    const chatBox = document.getElementById("chatBox");

    const q = query(collection(db, "mensajes"), orderBy("timestamp"));

    // Listener en tiempo real para los mensajes
    onSnapshot(q, (querySnapshot) => {
        // Limpiar el contenido solo si deseas hacerlo al inicio
        // chatBox.innerHTML = "";  // Remover esta línea si no deseas limpiar el chat

        querySnapshot.forEach((doc) => {
            const mensajeData = doc.data();
            const mensajeElement = document.createElement("div");

            // Obtener nick y mensaje
            const nick = mensajeData.nick;
            const mensaje = mensajeData.mensaje;

            // Formatear la fecha (timestamp)
            const timestamp = mensajeData.timestamp.toDate();
            const fecha = timestamp.toLocaleDateString();  // Día/Mes/Año
            const hora = timestamp.toLocaleTimeString();  // Hora:Minutos:Segundos

            // Crear el contenido del mensaje con el nick y la fecha
            mensajeElement.innerHTML = `
                <strong>${nick}</strong>: ${mensaje} <br>
                <small>${fecha} ${hora}</small>
            `;

            chatBox.appendChild(mensajeElement);
            chatBox.scrollTop = chatBox.scrollHeight; // Asegura que el chat se desplace hacia abajo al recibir nuevos mensajes
        });
    });
}

// Function to show books of current user
async function mostrarLibros() {
    const user = auth.currentUser;
    const listaLibros = document.getElementById("listaLibros");
    listaLibros.innerHTML = "";

    if (user) {
        try {
            const librosRef = collection(db, "libros");
            const q = query(librosRef, where("userId", "==", user.uid));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                const mensaje = document.createElement("li");
                mensaje.textContent = "No has agregado libros aún.";
                listaLibros.appendChild(mensaje);
            } else {
                querySnapshot.forEach((doc) => {
                    const libroData = doc.data();
                    const {
                        nombre = "Desconocido", autor = "Desconocido", paginas = 0, puntos = 0
                    } = libroData;
                    const nuevoLibro = document.createElement("li");
                    nuevoLibro.textContent = `${nombre} - ${autor} (${paginas} páginas) = ${puntos} puntos`;

                    const btnEliminar = document.createElement("button");
                    btnEliminar.textContent = "Eliminar";
                    btnEliminar.classList.add("btn", "btn-danger", "ms-3");
                    btnEliminar.onclick = () => eliminarLibro(doc.id);

                    nuevoLibro.appendChild(btnEliminar);
                    listaLibros.appendChild(nuevoLibro);
                });
            }
        } catch (error) {
            console.error("Error al obtener los libros: ", error.message);
        }
    } else {
        alert("No hay usuario autenticado.");
    }
}

// Function to add a book
async function agregarLibro(event) {
    event.preventDefault();

    const nombre = document.getElementById("nombreLibro").value;
    const autor = document.getElementById("autorLibro").value;
    const paginas = parseInt(document.getElementById("paginasLibro").value);
    const puntos = calcularPuntos(paginas);
    const user = auth.currentUser;

    if (user) {
        try {
            await addDoc(collection(db, "libros"), {
                userId: user.uid,
                nombre,
                autor,
                paginas,
                puntos,
                fecha: new Date()
            });

            const userRef = doc(db, "usuarios", user.uid);
            const userDoc = await getDoc(userRef);

            let totalPuntos = 0;
            if (userDoc.exists()) {
                totalPuntos = userDoc.data().puntosTotales || 0;
            } else {
                await setDoc(userRef, {
                    puntosTotales: 0
                });
            }

            totalPuntos += puntos;

            await updateDoc(userRef, {
                puntosTotales: totalPuntos
            });

            alert("Libro agregado con éxito.");
            mostrarLibros();
            mostrarEstadisticasUsuario();

        } catch (error) {
            console.error("Error al agregar el libro: ", error.message);
        }
    } else {
        alert("Por favor, inicia sesión para agregar libros.");
    }
}

// Function to remove a book
async function eliminarLibro(libroId) {
    const confirmacion = confirm("¿Estás seguro de eliminar este libro?");
    if (confirmacion) {
        const user = auth.currentUser;

        if (user) {
            try {
                const libroRef = doc(db, "libros", libroId);
                const libroDoc = await getDoc(libroRef);
                if (!libroDoc.exists()) {
                    alert("El libro no existe.");
                    return;
                }

                const libroData = libroDoc.data();
                const puntosLibro = libroData.puntos;

                await deleteDoc(libroRef);
                alert("Libro eliminado con éxito.");

                const userRef = doc(db, "usuarios", user.uid);
                const userDoc = await getDoc(userRef);

                let totalPuntos = 0;
                if (userDoc.exists()) {
                    totalPuntos = userDoc.data().puntosTotales || 0;
                }

                totalPuntos -= puntosLibro;

                await updateDoc(userRef, {
                    puntosTotales: totalPuntos
                });

                mostrarLibros();
                mostrarEstadisticasUsuario();

            } catch (error) {
                console.error("Error al eliminar el libro: ", error.message);
            }
        } else {
            alert("Por favor, inicia sesión para eliminar libros.");
        }
    }
}

// Function to calculate points
function calcularPuntos(paginas) {
    if (paginas <= 100) return 1;
    if (paginas <= 200) return 2;
    if (paginas <= 300) return 3.5;
    return 5;
}

// Function to show user statistics
async function mostrarEstadisticasUsuario() {
    const user = auth.currentUser;
    const puntosTotales = document.getElementById("puntosTotales");

    if (user) {
        try {
            const userRef = doc(db, "usuarios", user.uid);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                const totalPuntos = userDoc.data().puntosTotales || 0;
                puntosTotales.textContent = `Total de puntos: ${totalPuntos}`;
            } else {
                puntosTotales.textContent = "No se pudo obtener los puntos del usuario.";
            }
        } catch (error) {
            console.error("Error al calcular las estadísticas: ", error.message);
        }
    }
}

// Function to show the general ranking
async function mostrarClasificacionGeneral() {
    const listaClasificacion = document.getElementById("listaClasificacion");
    listaClasificacion.innerHTML = "";

    try {
        const usuariosRef = collection(db, "usuarios");
        const querySnapshot = await getDocs(usuariosRef);

        let clasificacion = [];
        querySnapshot.forEach(doc => {
            const userData = doc.data();
            const nombre = userData.nombre || "Usuario Desconocido";
            clasificacion.push({
                usuarioId: doc.id,
                nombre: nombre,
                puntos: userData.puntosTotales || 0
            });
        });

        clasificacion.sort((a, b) => b.puntos - a.puntos);

        if (clasificacion.length === 0) {
            const mensaje = document.createElement("li");
            mensaje.textContent = "No hay usuarios registrados.";
            listaClasificacion.appendChild(mensaje);
            return;
        }

        clasificacion.forEach((usuario, index) => {
            const li = document.createElement("li");
            li.textContent = `${index + 1}. ${usuario.nombre} - ${usuario.puntos} puntos`;
            listaClasificacion.appendChild(li);
        });
    } catch (error) {
        console.error("Error al obtener la clasificación: ", error);
        const mensaje = document.createElement("li");
        mensaje.textContent = "Error al cargar la clasificación.";
        listaClasificacion.appendChild(mensaje);
    }
}

// Function to show current competition period
function mostrarPeriodoActual() {
    const periodoActual = document.getElementById("periodoActual");
    const settingsRef = doc(db, 'settings', 'competitionPeriod');
    getDoc(settingsRef).then(docSnap => {
        if (docSnap.exists()) {
            const periodo = docSnap.data();
            periodoActual.textContent = `Período de competencia: ${periodo.inicio} a ${periodo.fin}`;
        } else {
            periodoActual.textContent = "No hay un período de competencia establecido.";
        }
    }).catch(error => {
        console.error("Error al obtener el período: ", error);
        periodoActual.textContent = "Error al obtener el período.";
    });
}

// Function to set competition period
async function establecerPeriodo(event) {
    event.preventDefault();

    const fechaInicio = document.getElementById("fechaInicio").value;
    const fechaFin = document.getElementById("fechaFin").value;

    if (new Date(fechaInicio) > new Date(fechaFin)) {
        alert("La fecha de inicio no puede ser mayor a la fecha de fin.");
        return;
    }

    await setDoc(doc(db, 'settings', 'competitionPeriod'), {
        inicio: fechaInicio,
        fin: fechaFin
    });

    document.getElementById("formPeriodo").style.display = "none";
    mostrarPeriodoActual();
}

// Event listeners
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log(`Usuario autenticado: ${user.email}`);
        mostrarSeccionPrincipal();
        mostrarLibros();
        mostrarEstadisticasUsuario();
        mostrarPeriodoActual();
        mostrarClasificacionGeneral();        
        document.getElementById('chat').style.display = 'block'; 
        mostrarMensajes(); 

    } else {
        console.log("No hay usuario autenticado.");
        document.getElementById('chat').style.display = 'none'; 
        document.getElementById("formAuth").style.display = "block";
        document.getElementById("principal").style.display = "none";
    }
});

// Form listeners
document.getElementById("formAuth").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const nick = document.getElementById("nick").value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        alert(`Usuario registrado con éxito: ${userCredential.user.email}`);

        const userRef = doc(db, "usuarios", userCredential.user.uid);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
            await setDoc(userRef, {
                puntosTotales: 0,
                nombre: nick || "Usuario"
            });
        }
    } catch (error) {
        if (error.code === "auth/email-already-in-use") {
            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                alert(`Sesión iniciada como: ${userCredential.user.email}`);
            } catch (error) {
                console.error(`Error al iniciar sesión: ${error.message}`);
            }
        } else {
            console.error(`Error: ${error.message}`);
        }
    }
});

document.getElementById("formLibro").addEventListener("submit", agregarLibro);
document.getElementById("formPeriodo").addEventListener("submit", establecerPeriodo);
document.getElementById('formChat').addEventListener('submit', enviarMensaje);
