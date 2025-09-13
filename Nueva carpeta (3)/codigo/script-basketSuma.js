let preguntasDisponibles = [];
let preguntasUsadas = [];
let preguntas = [];

let puntosJugador = 0;
let puntosCPU = 0;
let fallosJugador = 0;

let musicaFondo = null;

const videosCanasta = [
    "/video/gol/canasta.mp4",
    "/video/gol/canasta2.mp4",
    "/video/gol/canasta3.mp4",
    "/video/gol/canasta4.mp4",
    "/video/gol/canasta5.mp4"
];

const videosFallo = [
    "/video/fallo/failedB1.mp4",
    "/video/fallo/failedB2.mp4",
    "/video/fallo/failedB3.mp4",
    "/video/fallo/failedB4.mp4",
    "/video/fallo/failedB5.mp4"
];

const sonidoAcierto = new Audio("/sound/encesto.mp3");
const sonidoFallo = new Audio("/sound/failed.mp3");
const sonidoGanar = new Audio("/sound/victorpy.mp3");
const sonidoPerder = new Audio("/sound/failed.mp3");
const sonidoEmpate = new Audio("/sound/incorrecto.mp3");


// Carga preguntas con async/await para mejor manejo de errores
async function cargarPreguntas() {
    try {
        const res = await fetch("preguntasBasket.json");
        if (!res.ok) throw new Error("No se pudo cargar preguntas");
        preguntas = await res.json();
        preguntasDisponibles = [...preguntas];
        document.getElementById("iniciar").disabled = false;
        document.getElementById("cargandoMensaje").style.display = "none";
    } catch (error) {
        alert("Error cargando preguntas: " + error.message);
        console.error(error);
    }
}

cargarPreguntas();

document.getElementById("iniciar").addEventListener("click", () => {
    iniciarJuego();
});

document.addEventListener('DOMContentLoaded', () => {


  const btnReiniciarJuego = document.getElementById('Reiniciar');
  const btnSalirJuego = document.getElementById('Salir');

  console.log('btnReiniciarJuego:', btnReiniciarJuego);
  console.log('btnSalirJuego:', btnSalirJuego);

  if (btnReiniciarJuego) btnReiniciarJuego.addEventListener('click', reiniciarJuego);
  else console.warn('No se encontró btnReiniciarJuego');

  if (btnSalirJuego) btnSalirJuego.addEventListener('click', salirJuego);
  else console.warn('No se encontró btnSalirJuego');
});


function iniciarJuego() {
    if (!preguntas.length) {
        alert("No hay preguntas para iniciar el juego");
        return;
    }
    reproducirMusicaFondo();
    document.querySelector(".fueraJuego").style.display = "none";
    document.querySelector(".Dentrojuego").style.display = "block";
    actualizarMarcador();
    mostrarSiguientePregunta();
}

function reproducirMusicaFondo() {
    if (musicaFondo) {
        musicaFondo.pause();
        musicaFondo.currentTime = 0;
    }
    musicaFondo = new Audio("/sound/fondoBaketball.mp3");
    musicaFondo.loop = true;
    musicaFondo.volume = 0.1;
    musicaFondo.play().catch(e => {
        console.warn("No se pudo reproducir la música automáticamente", e);
    });
}

function obtenerPreguntaAleatoria() {
    if (preguntasDisponibles.length === 0) {
        preguntasDisponibles = [...preguntas];
        preguntasUsadas = [];
    }
    const indice = Math.floor(Math.random() * preguntasDisponibles.length);
    const pregunta = preguntasDisponibles[indice];
    preguntasDisponibles.splice(indice, 1);
    preguntasUsadas.push(pregunta);
    return pregunta;
}


function mostrarSiguientePregunta() {
    const contenedorOpciones = document.getElementById("opciones");
    contenedorOpciones.innerHTML = "";
    document.getElementById("video2").innerHTML = "";

    const pregunta = obtenerPreguntaAleatoria();
    document.getElementById("pregunta").textContent = `¿Cuánto es ${pregunta.cantidad1} ${pregunta.operacion} ${pregunta.cantidad2}?`;

    mostrarBalones(pregunta.cantidad1, pregunta.cantidad2, pregunta.operacion);

    // Mezclar las opciones para que no siempre estén en el mismo orden
    const opcionesMezcladas = mezclarArray([...pregunta.opciones]);
    
    opcionesMezcladas.forEach(opcion => {
        const btn = document.createElement("button");
        btn.textContent = opcion;

        btn.addEventListener("mouseover", () => {
            btn.style.transform = "scale(1.05)";
            btn.style.boxShadow = "0 0 10px rgba(0,0,0,0.2)";
        });
        
        btn.addEventListener("mouseout", () => {
            btn.style.transform = "scale(1)";
            btn.style.boxShadow = "none";
        });

        btn.addEventListener("click", () => {
            const acierto = opcion === pregunta.respuesta;
            manejarRespuesta(acierto);
        });
        
        contenedorOpciones.appendChild(btn);
    });

}

// Función auxiliar para mezclar un array (algoritmo Fisher-Yates)
function mezclarArray(array) {
    const nuevoArray = [...array];
    for (let i = nuevoArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [nuevoArray[i], nuevoArray[j]] = [nuevoArray[j], nuevoArray[i]];
    }
    return nuevoArray;
}

function mostrarBalones(cantidad1, cantidad2, operador) {
    const contenedor = document.getElementById("balones");
    contenedor.innerHTML = "";

    // Mostrar balones de cantidad1
    for (let i = 0; i < cantidad1; i++) {
        const img = document.createElement("img");
        img.src = "/img/balosBasketball.png";
        img.classList.add("balones");
        contenedor.appendChild(img);
    }

    // Mostrar el signo + o -
    const signo = document.createElement("span");
    signo.innerText = operador;
    signo.style.fontSize = "30px";
    signo.style.margin = "0 10px";
    contenedor.appendChild(signo);

    // Mostrar balones de cantidad2
    for (let i = 0; i < cantidad2; i++) {
        const img = document.createElement("img");
        img.src = "/img/balosBasketball.png";
        img.classList.add("balones");
        contenedor.appendChild(img);
    }
}


// Maneja la respuesta dada por el jugador
function manejarRespuesta(correcto) {
    // Primero oculta opciones para evitar clicks repetidos
    document.getElementById("opciones").querySelectorAll("button").forEach(b => b.disabled = true);

    // Ocultar la sección Dentrojuego para mostrar video después
    document.querySelector(".Dentrojuego").style.display = "none";

    // Elige video correcto o fallo aleatorio
    const videoURL = correcto ? 
        videosCanasta[Math.floor(Math.random() * videosCanasta.length)] : 
        videosFallo[Math.floor(Math.random() * videosFallo.length)];

    reproducirVideoResultado(videoURL, correcto);


}

function reproducirVideoResultado(videoURL, correcto) {
    const contenedorVideo = document.getElementById("contenedorVideoAnimacion");
    contenedorVideo.innerHTML = "";
    
    // Estilos para centrado absoluto
    contenedorVideo.style.position = "fixed";
    contenedorVideo.style.top = "0";
    contenedorVideo.style.left = "0";
    contenedorVideo.style.width = "100%";
    contenedorVideo.style.height = "100%";
    contenedorVideo.style.display = "flex";
    contenedorVideo.style.justifyContent = "center";
    contenedorVideo.style.alignItems = "center";
    contenedorVideo.style.backgroundColor = "rgba(0,0,0,0.8)";
    contenedorVideo.style.zIndex = "1000";

    // Contenedor interno para el video
    const videoContainer = document.createElement("div");
    videoContainer.style.width = "80%";
    videoContainer.style.maxWidth = "800px";
    videoContainer.style.height = "80vh";
    videoContainer.style.position = "relative";

    const videoElem = document.createElement("video");
    videoElem.src = videoURL;
    videoElem.autoplay = true;
    videoElem.controls = false;
    videoElem.muted = false;
    videoElem.style.width = "100%";
    videoElem.style.height = "100%";
    videoElem.style.objectFit = "contain";
    videoElem.style.borderRadius = "8px";

    videoContainer.appendChild(videoElem);
    contenedorVideo.appendChild(videoContainer);
    contenedorVideo.style.display = "flex";

    videoElem.onended = () => {
        contenedorVideo.style.display = "none";
        mostrarAlertaResultado(correcto);
    };
}
// Muestra la alerta con el resultado y actualiza marcador
function mostrarAlertaResultado(correcto) {
    const alerta = document.getElementById("alerta");
    const mensaje = document.getElementById("mensaje");

    if (correcto) {
        puntosJugador += 2;
        mensaje.textContent = "¡Has anotado 2 puntos!";
        sonidoAcierto.play();
    } else {
        fallosJugador++;
        // Lógica CPU con probabilidad creciente
        const probCPU = Math.min(0.2 + fallosJugador * 0.15, 1);
        if (Math.random() < probCPU) {
            puntosCPU += 2;
            mensaje.textContent = "CPU anota 2 puntos :(";
        } else {
            mensaje.textContent = "No anotó nadie esta vez";
        }
        sonidoFallo.play();
    }

    actualizarMarcador();

    alerta.style.display = "block";
    alerta.style.opacity = "1";

    // Animar y luego ocultar alerta para continuar juego
    setTimeout(() => {
        alerta.style.opacity = "0";
        setTimeout(() => {
            alerta.style.display = "none";
            continuarJuego();
        }, 300);
    }, 3000);
}

function actualizarMarcador() {
    const marcador = document.getElementById("marcador");
    marcador.textContent = `${puntosJugador} - ${puntosCPU}`;
}

// Continúa el juego mostrando siguiente pregunta o finaliza si algún equipo llega a 10
function continuarJuego() {
    if (puntosJugador >= 10 || puntosCPU >= 10) {
        mostrarFinalJuego();
    } else {
        // Mostrar sección Dentrojuego y siguiente pregunta
        document.querySelector(".Dentrojuego").style.display = "block";
        mostrarSiguientePregunta();
    }
}

function calcularPuntosExtra(diferencia) {
    // Ejemplo: si ganas por 4 o más puntos, +5 extras
    // si ganas por 2 o más, +2 extras, si menos, 0
    if (diferencia >= 4) return 5;
    if (diferencia >= 2) return 2;
    return 0;
}


// Mostrar final del juego con puntos extra y récord
function mostrarFinalJuego() {
    const alerta = document.getElementById("alerta");
    const mensaje = document.getElementById("mensaje");
    
    // 1. Resetear completamente el estado de la alerta primero
    alerta.style.transition = 'none';
    alerta.style.display = "block";
    alerta.style.opacity = "1";
    alerta.style.pointerEvents = "auto"; // Asegurar que acepte interacciones
    
    // 2. Configurar el mensaje (manteniendo tu lógica original)
    if (puntosJugador > puntosCPU) {
        sonidoGanar.play(); 
        const diferencia = puntosJugador - puntosCPU;
        const extra = calcularPuntosExtra(diferencia);
        const totalPuntos = puntosJugador + extra;
        const recordKey = "recordBasketballGame";
        let record = parseInt(localStorage.getItem(recordKey)) || 0;

        let textoRecord = "";
        if (totalPuntos > record) {
            localStorage.setItem(recordKey, totalPuntos);
            textoRecord = " 🎉 ¡Nuevo récord!";
        }

        mensaje.innerHTML = `
        🎉 <strong>¡Felicidades! Ganaste el juego 🏀</strong><br>
        Diferencia: <strong>${diferencia}</strong><br>
        Puntos extra: <strong>${extra}</strong><br>
        Total puntos: <strong>${totalPuntos}</strong>
        ${textoRecord ? `<br><em style="color: gold;">${textoRecord}</em>` : ''}`;
    } 
    else if (puntosCPU > puntosJugador) {
        sonidoPerder.play(); 
        mensaje.textContent = "CPU gana esta vez. ¡Inténtalo de nuevo!";
    } 
    else {
        mensaje.textContent = "Empate. ¡Juega otra vez!";
        sonidoEmpate.play(); 
    }

    // 3. Mostrar botones finales (con verificación robusta)
    const botonesFinales = document.getElementById("botonesFinales");
    botonesFinales.style.display = "block";
    botonesFinales.style.pointerEvents = "auto"; // Asegurar que los botones sean clickables

    // 4. Ocultar sección de juego
    document.querySelector(".Dentrojuego").style.display = "none";

    // 5. Asignación de eventos mejorada (con delegación de eventos)
    document.body.addEventListener('click', function manejarClickFinal(e) {
        if (e.target.id === 'btnReiniciar') {
            e.stopPropagation();
            reiniciarJuego();
            document.body.removeEventListener('click', manejarClickFinal);
        }
        if (e.target.id === 'btnSalirFinal') {
            e.stopPropagation();
            salirJuego();
            document.body.removeEventListener('click', manejarClickFinal);
        }
    });

    // 6. Debug adicional
    console.log('Alerta final mostrada. Estado:', {
        display: alerta.style.display,
        opacity: alerta.style.opacity,
        pointerEvents: alerta.style.pointerEvents,
        botonesVisible: botonesFinales.style.display
    });
}


function reiniciarJuego() {
    puntosJugador = 0;
    puntosCPU = 0;
    fallosJugador = 0;
    preguntasDisponibles = [...preguntas];
    preguntasUsadas = [];

    document.getElementById("botonesFinales").style.display = "none";
    document.getElementById("alerta").style.display = "none";
    document.querySelector(".fueraJuego").style.display = "none";
    document.querySelector(".Dentrojuego").style.display = "block";
    actualizarMarcador();
    mostrarSiguientePregunta();
}

function salirJuego() {
    // Detener música
    if (musicaFondo) {
        musicaFondo.pause();
        musicaFondo.currentTime = 0;
    }
    // Resetear juego
    puntosJugador = 0;
    puntosCPU = 0;
    fallosJugador = 0;
    preguntasDisponibles = [...preguntas];
    preguntasUsadas = [];

    // Mostrar pantalla inicial
    document.querySelector(".fueraJuego").style.display = "block";
    document.querySelector(".Dentrojuego").style.display = "none";
    document.getElementById("botonesFinales").style.display = "none";
    document.getElementById("alerta").style.display = "none";
    actualizarMarcador();
}
