const API_URL = '/api';
let currentUser = null;
let selectedRoom = null;
let reservaciones = [];
let pisoActual = 3;

window.onload = async () => {
  const userStr = localStorage.getItem("user");
  if (!userStr) {
    window.location.href = "index.html";
    return;
  }

  currentUser = JSON.parse(userStr);
  
  const userNameElement = document.getElementById("user-name");
  if(userNameElement) {
    userNameElement.innerHTML = `👤 ${currentUser.nombre} <span id="notif-badge" class="notification-badge" style="display: none;">0</span>`;
  }

  // Verificar si es profesor o ayudante para mostrar botón de asignación inteligente
  const profesorActions = document.getElementById('profesor-actions');
  if (profesorActions && (currentUser.rol === 'profesor' || currentUser.rol === 'ayudante')) {
    profesorActions.style.display = 'block';
  }

  const selectPiso = document.getElementById('piso-select');
  if(selectPiso) {
    pisoActual = parseInt(selectPiso.value);
  }

  // Verificar notificaciones
  await verificarNotificaciones();

  cambiarPiso();
};

async function verificarNotificaciones() {
  try {
    const response = await fetch(`${API_URL}/notifications/${currentUser.id}/count`);
    const data = await response.json();
    
    const badge = document.getElementById('notif-badge');
    if (badge && data.count > 0) {
      badge.textContent = data.count;
      badge.style.display = 'flex';
    }
  } catch (error) {
    console.error('Error al verificar notificaciones:', error);
  }
}

function irAPerfil() {
  window.location.href = 'perfil.html';
}

function cambiarPiso() {
  const select = document.getElementById('piso-select');
  if(select) {
      pisoActual = parseInt(select.value);
  }

  if (!CONFIGURACION_PISOS[pisoActual]) {
    return;
  }

  const config = CONFIGURACION_PISOS[pisoActual];
  
  const titulo = document.getElementById('titulo-piso');
  if(titulo) titulo.textContent = `🏫 Plano de Salas - ${config.nombre}`;

  const imagen = document.getElementById('imagen-plano');
  if(imagen) imagen.setAttribute('href', config.imagen);

  document.getElementById('salas-layer').innerHTML = '';
  document.getElementById('labels-layer').innerHTML = '';

  inicializarPlano();
  actualizarPlano();
}

function inicializarPlano() {
  const salasLayer = document.getElementById("salas-layer");
  const labelsLayer = document.getElementById("labels-layer");
  
  const salasDelPiso = CONFIGURACION_PISOS[pisoActual].salas;

  salasDelPiso.forEach((sala) => {
    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.setAttribute("points", sala.polygon);
    polygon.setAttribute("data-sala-id", sala.id);
    polygon.classList.add("sala-shape");

    if (sala.tipo === "baño") {
      polygon.classList.add("no-seleccionable", "tipo-baño");
    } else if (sala.tipo === "escalera") {
      polygon.classList.add("no-seleccionable", "tipo-escalera");
    } else {
      polygon.classList.add("seleccionable");
      polygon.addEventListener("click", () => handleSalaClick(sala));
      polygon.addEventListener("mouseenter", (e) => mostrarTooltip(e, sala));
      polygon.addEventListener("mouseleave", ocultarTooltip);
    }

    salasLayer.appendChild(polygon);

    if (sala.numero) {
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      
      const points = sala.polygon.split(" ").map((p) => p.split(",").map(Number));
      const centerX = points.reduce((sum, p) => sum + p[0], 0) / points.length;
      const centerY = points.reduce((sum, p) => sum + p[1], 0) / points.length;

      text.setAttribute("x", centerX);
      text.setAttribute("y", centerY);
      text.setAttribute("class", "sala-label");
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "middle");
      text.textContent = sala.numero;

      labelsLayer.appendChild(text);
    }
  });
}

async function actualizarPlano() {
  const dia = document.getElementById("dia-select").value;
  const horario = document.getElementById("horario-select").value;
  const [horaInicio] = horario.split("-").map((h) => h.trim());
  const piso = document.getElementById("piso-select")?.value || 3;

  try {
    const response = await fetch(`${API_URL}/reservations?dia=${dia}&piso=${piso}`);
    
    if (!response.ok) {
      throw new Error('Error al cargar reservas');
    }
    
    reservaciones = await response.json();

    const salasActuales = CONFIGURACION_PISOS[piso].salas;

    salasActuales.forEach((sala) => {
      if (sala.tipo !== "sala") return;

      const polygon = document.querySelector(`[data-sala-id="${sala.id}"]`);
      if (!polygon) return;

      const estaOcupada = reservaciones.some(
        (r) =>
          r.salaId === sala.id &&
          r.horaInicio === horaInicio &&
          r.estado === "confirmada"
      );

      polygon.classList.remove("disponible", "ocupada");

      if (estaOcupada) {
        polygon.classList.add("ocupada");
        polygon.style.pointerEvents = "none";
      } else {
        polygon.classList.add("disponible");
        polygon.style.pointerEvents = "auto";
      }
    });
  } catch (error) {
    alert("⚠️ Error al cargar disponibilidad de salas");
  }
}

function handleSalaClick(sala) {
  const polygon = document.querySelector(`[data-sala-id="${sala.id}"]`);
  if (polygon.classList.contains("ocupada")) {
    alert("⚠️ Esta sala ya está ocupada en este horario");
    return;
  }

  selectedRoom = sala;
  mostrarInfoSala(sala);
}

function mostrarTooltip(event, sala) {
  const tooltip = document.getElementById("tooltip");
  const reserva = reservaciones.find(
    (r) => r.salaId === sala.id && r.estado === "confirmada"
  );

  let contenido = `<strong>Sala ${sala.numero}</strong><br>`;
  contenido += `Capacidad: ${sala.capacidad}<br>`;
  
  if (sala.tiene_computadores) contenido += `💻 Lab. Computación<br>`;

  if (reserva) {
    contenido += `<br><span style="color: #ff4444;">⛔ Ocupada (${reserva.asignatura?.nombre || "Clase"})</span>`;
  } else {
    contenido += `<br><span style="color: #4caf50;">✅ Disponible</span>`;
  }

  tooltip.innerHTML = contenido;
  tooltip.style.display = "block";
  tooltip.style.left = (event.pageX + 15) + "px";
  tooltip.style.top = (event.pageY + 15) + "px";
}

function ocultarTooltip() {
  document.getElementById("tooltip").style.display = "none";
}

function mostrarInfoSala(sala) {
  const infoDiv = document.getElementById("room-info");
  const btnReservar = document.getElementById("btn-reservar");

  document.getElementById("room-title").textContent = `Sala ${sala.numero}`;

  let detalles = `
    <p><strong>Tipo:</strong> ${sala.tipo === 'laboratorio' ? 'Laboratorio' : 'Aula Teórica'}</p>
    <p><strong>Capacidad:</strong> ${sala.capacidad} estudiantes</p>
    <p><strong>Recursos:</strong> ${sala.tiene_computadores ? 'Proyector, PC' : 'Proyector'}</p>
  `;

  document.getElementById("room-details").innerHTML = detalles;
  
  // Solo mostrar botón si es profesor o ayudante
  if (currentUser.rol === 'profesor' || currentUser.rol === 'ayudante') {
    btnReservar.style.display = "inline-block";
    btnReservar.onclick = abrirModalReserva;
  } else {
    btnReservar.style.display = "none";
  }

  infoDiv.style.display = "block";
}

function cerrarInfo() {
  document.getElementById("room-info").style.display = "none";
}

function abrirModalReserva() {
  document.getElementById("modal-sala-numero").textContent = selectedRoom.numero;
  document.getElementById("modal-reserva").style.display = "flex";
}

function cerrarModal() {
  document.getElementById("modal-reserva").style.display = "none";
  document.getElementById("form-reserva").reset();
}

document.getElementById("form-reserva").addEventListener("submit", async (e) => {
  e.preventDefault();

  const codigo = document.getElementById("asignatura-codigo").value;
  const nombre = document.getElementById("asignatura-nombre").value;
  const dia = document.getElementById("dia-select").value;
  const horario = document.getElementById("horario-select").value;
  const [horaInicio, horaFin] = horario.split("-").map((h) => h.trim());

  try {
    const response = await fetch(`${API_URL}/reservations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        salaId: selectedRoom.id,
        usuarioId: currentUser.id,
        dia,
        horaInicio,
        horaFin,
        piso: pisoActual,
        asignatura: { codigo, nombre },
        profesor: currentUser.nombre,
        estado: "confirmada"
      }),
    });

    const data = await response.json();

    if (response.ok) {
      alert("✅ Reserva creada exitosamente");
      cerrarModal();
      cerrarInfo();
      await actualizarPlano();
    } else if (response.status === 409) {
      alert(`❌ CONFLICTO: ${data.error}`);
    } else {
      alert("❌ Error: " + data.error);
    }
  } catch (error) {
    alert("❌ Error de conexión");
  }
});

function logout() {
  localStorage.removeItem("user");
  window.location.href = "index.html";
}