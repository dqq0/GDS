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

  // Inicializar plano
  cambiarPiso();
  
  // ✅ CARGAR DISPONIBILIDAD INICIAL
  await actualizarPlano();

  // ✅ AGREGAR LISTENERS PARA ACTUALIZAR AUTOMÁTICAMENTE
  const diaSelect = document.getElementById('dia-select');
  const horarioSelect = document.getElementById('horario-select');
  const pisoSelect = document.getElementById('piso-select');

  if (diaSelect) {
    diaSelect.addEventListener('change', actualizarPlano);
  }
  if (horarioSelect) {
    horarioSelect.addEventListener('change', actualizarPlano);
  }
  if (pisoSelect) {
    pisoSelect.addEventListener('change', async () => {
      cambiarPiso();
      await actualizarPlano();
    });
  }
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

  // ✅ VALIDACIÓN: Solo pisos 1, 2 y 3
  if (![1, 2, 3].includes(pisoActual)) {
    console.error('Piso no válido:', pisoActual);
    pisoActual = 3; // Default al piso 3
  }

  if (!CONFIGURACION_PISOS[pisoActual]) {
    console.error('Configuración no encontrada para piso:', pisoActual);
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
}

function inicializarPlano() {
  const salasLayer = document.getElementById("salas-layer");
  const labelsLayer = document.getElementById("labels-layer");
  
  if (!salasLayer || !labelsLayer) {
    console.error('❌ Capas SVG no encontradas');
    return;
  }

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
  const diaSelect = document.getElementById("dia-select");
  const horarioSelect = document.getElementById("horario-select");
  const pisoSelect = document.getElementById("piso-select");

  if (!diaSelect || !horarioSelect || !pisoSelect) {
    console.error('❌ Selectores no encontrados');
    return;
  }

  const dia = diaSelect.value;
  const horario = horarioSelect.value;
  const piso = pisoSelect.value;

  console.log('🔍 Actualizando plano:', { dia, horario, piso });

  try {
    // ✅ USAR EL ENDPOINT CORRECTO
    const url = `/api/salas/disponibilidad?piso=${piso}&dia=${encodeURIComponent(dia)}&horario=${encodeURIComponent(horario)}`;
    console.log('📡 Llamando a:', url);

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const salas = await response.json();
    console.log('✅ Salas recibidas:', salas.length);

    // Actualizar el SVG con la disponibilidad
    salas.forEach((sala) => {
      if (sala.tipo !== "sala") return;

      const polygon = document.querySelector(`[data-sala-id="${sala.id}"]`);
      if (!polygon) {
        console.warn(`⚠️ Polígono no encontrado para sala ${sala.id}`);
        return;
      }

      polygon.classList.remove("disponible", "ocupada");

      if (sala.ocupada || !sala.disponible) {
        polygon.classList.add("ocupada");
        polygon.style.pointerEvents = "none";
        polygon.style.cursor = "not-allowed";
      } else {
        polygon.classList.add("disponible");
        polygon.style.pointerEvents = "auto";
        polygon.style.cursor = "pointer";
      }
    });

    console.log('✅ Plano actualizado correctamente');

  } catch (error) {
    console.error("❌ Error al cargar disponibilidad:", error);
    alert("⚠️ Error al cargar disponibilidad de salas: " + error.message);
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

async function mostrarTooltip(event, sala) {
  const tooltip = document.getElementById("tooltip");
  
  if (!tooltip) {
    console.warn('⚠️ Elemento tooltip no encontrado');
    return;
  }

  // Obtener estado actual de la sala
  const diaSelect = document.getElementById("dia-select");
  const horarioSelect = document.getElementById("horario-select");

  if (!diaSelect || !horarioSelect) return;

  const dia = diaSelect.value;
  const horario = horarioSelect.value;
  const [horaInicio] = horario.split("-").map((h) => h.trim());

  try {
    // Consultar todas las reservas
    const response = await fetch(`${API_URL}/reservations/todas`);
    const todasReservas = await response.json();

    const reserva = todasReservas.find(
      (r) => r.salaId === sala.id && 
             r.dia === dia && 
             r.horaInicio === horaInicio && 
             r.estado === "confirmada"
    );

    let contenido = `<strong>Sala ${sala.numero}</strong><br>`;
    contenido += `Capacidad: ${sala.capacidad} personas<br>`;
    
    if (sala.tiene_computadores) contenido += `💻 Computadores<br>`;
    if (sala.tiene_proyector) contenido += `📽️ Proyector<br>`;

    if (reserva) {
      contenido += `<br><span style="color: #ff4444;">⛔ Ocupada</span><br>`;
      contenido += `<small>${reserva.asignatura?.nombre || "Clase"}</small>`;
    } else {
      contenido += `<br><span style="color: #4caf50;">✅ Disponible</span>`;
    }

    tooltip.innerHTML = contenido;
    tooltip.style.display = "block";
    tooltip.style.left = (event.pageX + 15) + "px";
    tooltip.style.top = (event.pageY + 15) + "px";

  } catch (error) {
    console.error('Error al obtener info de sala:', error);
    tooltip.innerHTML = `<strong>Sala ${sala.numero}</strong><br>Error al cargar información`;
    tooltip.style.display = "block";
    tooltip.style.left = (event.pageX + 15) + "px";
    tooltip.style.top = (event.pageY + 15) + "px";
  }
}

function ocultarTooltip() {
  const tooltip = document.getElementById("tooltip");
  if (tooltip) {
    tooltip.style.display = "none";
  }
}

function mostrarInfoSala(sala) {
  const infoDiv = document.getElementById("room-info");
  const btnReservar = document.getElementById("btn-reservar");

  if (!infoDiv) return;

  const roomTitle = document.getElementById("room-title");
  const roomDetails = document.getElementById("room-details");

  if (roomTitle) {
    roomTitle.textContent = `Sala ${sala.numero}`;
  }

  let detalles = `
    <p><strong>Tipo:</strong> ${sala.tipo === 'laboratorio' ? 'Laboratorio' : 'Aula Teórica'}</p>
    <p><strong>Capacidad:</strong> ${sala.capacidad} estudiantes</p>
    <p><strong>Recursos:</strong> `;
  
  const recursos = [];
  if (sala.tiene_proyector) recursos.push('Proyector');
  if (sala.tiene_computadores) recursos.push('Computadores');
  if (recursos.length === 0) recursos.push('Básicos');
  
  detalles += recursos.join(', ') + '</p>';

  if (roomDetails) {
    roomDetails.innerHTML = detalles;
  }
  
  // Solo mostrar botón si es profesor o ayudante
  if (btnReservar) {
    if (currentUser.rol === 'profesor' || currentUser.rol === 'ayudante') {
      btnReservar.style.display = "inline-block";
      btnReservar.onclick = abrirModalReserva;
    } else {
      btnReservar.style.display = "none";
    }
  }

  infoDiv.style.display = "block";
}

function cerrarInfo() {
  const infoDiv = document.getElementById("room-info");
  if (infoDiv) {
    infoDiv.style.display = "none";
  }
}

function abrirModalReserva() {
  const modalSalaNumero = document.getElementById("modal-sala-numero");
  const modal = document.getElementById("modal-reserva");

  if (modalSalaNumero) {
    modalSalaNumero.textContent = selectedRoom.numero;
  }
  
  if (modal) {
    modal.style.display = "flex";
  }
}

function cerrarModal() {
  const modal = document.getElementById("modal-reserva");
  const form = document.getElementById("form-reserva");

  if (modal) {
    modal.style.display = "none";
  }
  
  if (form) {
    form.reset();
  }
}

// Event listener para el formulario de reserva
const formReserva = document.getElementById("form-reserva");
if (formReserva) {
  formReserva.addEventListener("submit", async (e) => {
    e.preventDefault();

    const codigoInput = document.getElementById("asignatura-codigo");
    const nombreInput = document.getElementById("asignatura-nombre");
    const diaSelect = document.getElementById("dia-select");
    const horarioSelect = document.getElementById("horario-select");

    if (!codigoInput || !nombreInput || !diaSelect || !horarioSelect) {
      alert("❌ Error: Formulario incompleto");
      return;
    }

    const codigo = codigoInput.value;
    const nombre = nombreInput.value;
    const dia = diaSelect.value;
    const horario = horarioSelect.value;
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
      console.error('Error al crear reserva:', error);
      alert("❌ Error de conexión");
    }
  });
}

function logout() {
  localStorage.removeItem("user");
  window.location.href = "index.html";
}