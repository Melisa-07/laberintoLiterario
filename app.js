import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js"; 
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

//Firebase  
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

function mostrarSeccionPrincipal() {
    document.getElementById("formAuth").style.display = "none";
    document.getElementById("principal").style.display = "block";
}

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
                    const { nombre, autor, paginas, puntos } = doc.data();
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
            alert("Error al obtener los libros: " + error.message);
        }
    } else {
        alert("No hay usuario autenticado.");
    }
}

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
                await setDoc(userRef, { puntosTotales: 0 });
            }

            totalPuntos += puntos; 

            await updateDoc(userRef, {
                puntosTotales: totalPuntos
            });

            alert("Libro agregado con éxito.");
            mostrarLibros(); 
            mostrarEstadisticasUsuario(); 

        } catch (error) {
            alert("Error al agregar el libro: " + error.message);
        }
    } else {
        alert("Por favor, inicia sesión para agregar libros.");
    }
}

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
                alert("Error al eliminar el libro: " + error.message);
            }
        } else {
            alert("Por favor, inicia sesión para eliminar libros.");
        }
    }
}

function calcularPuntos(paginas) {
    if (paginas <= 100) return 1;
    if (paginas <= 200) return 2;
    if (paginas <= 300) return 3.5;
    return 5;
}

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
            alert("Error al calcular las estadísticas: " + error.message);
        }
    }
}

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

document.addEventListener("DOMContentLoaded", () => {
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
                    alert(`Error al iniciar sesión: ${error.message}`);
                }
            } else {
                alert(`Error: ${error.message}`);
            }
        }
    });

    const formLibro = document.getElementById("formLibro");
    formLibro.addEventListener("submit", agregarLibro);

    const formPeriodo = document.getElementById("formPeriodo");
    formPeriodo.addEventListener("submit", establecerPeriodo);
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log(`Usuario autenticado: ${user.email}`);
        mostrarSeccionPrincipal();
        mostrarLibros();
        mostrarEstadisticasUsuario(); 
        mostrarPeriodoActual(); 
        mostrarClasificacionGeneral(); 
    } else {
        console.log("No hay usuario autenticado.");
        document.getElementById("formAuth").style.display = "block";
        document.getElementById("principal").style.display = "none";
    }
});
