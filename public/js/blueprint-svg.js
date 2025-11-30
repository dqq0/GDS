const API_URL = '/api';
let currentUser = null;
let selectedRoom = null;
let reservaciones = [];
let pisoActual = 2; // 

window.onload = () => {
  const userStr = localStorage.getItem("user");
  if (!userStr) {
    window.location.href = "index.html";
    return;
  }

  currentUser = JSON.parse(userStr);
  
  const userNameElement = document.getElementById("user-name");
  if(userNameElement) userNameElement.textContent = `👤 ${currentUser.nombre}`;

  const selectPiso = document.getElementById('piso-select');
  if(selectPiso) {
    // Si el select existe, respetamos su valor, si no, usamos el default 3
    if (selectPiso.value) {
        pisoActual = parseInt(selectPiso.value);
    } else {
        selectPiso.value = pisoActual;
    }
  }

  cambiarPiso();
};

function cambiarPiso() {
  const select = document.getElementById('piso-select');
  if(select) {
      pisoActual = parseInt(select.value);
  }

  // Verificamos si existe la configuración global (asumiendo que viene de otro script)
  if (typeof CONFIGURACION_PISOS === 'undefined' || !CONFIGURACION_PISOS[pisoActual]) {
    console.warn("Configuración de pisos no encontrada para el piso", pisoActual);
    return;
  }

  const config = CONFIGURACION_PISOS[pisoActual];
  
  const titulo = document.getElementById('titulo-piso');
  if(titulo) titulo.textContent = `🏫 Plano de Salas - ${config.nombre}`;

  const imagen = document.getElementById('imagen-plano');
  if(imagen) imagen.setAttribute('href', config.imagen);

  const salasLayer = document.getElementById('salas-layer');
  const labelsLayer = document.getElementById('labels-layer');

  if(salasLayer) salasLayer.innerHTML = '';
  if(labelsLayer) labelsLayer.innerHTML = '';

  inicializarPlano();
  actualizarPlano();
}

function inicializarPlano() {
  const salasLayer = document.getElementById("salas-layer");
  const labelsLayer = document.getElementById("labels-layer");
  
  if (!salasLayer || !labelsLayer) return;

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
  const diaElement = document.getElementById("dia-select");
  const horarioElement = document.getElementById("horario-select");
  
  if (!diaElement || !horarioElement) return;

  const dia = diaElement.value;
  const horario = horarioElement.value;
  const [horaInicio] = horario.split("-").map((h) => h.trim());
  
  // Usamos pisoActual global
  const piso = pisoActual;

  try {
    const response = await fetch(`${API_URL}/reservations?dia=${dia}&piso=${piso}`);
    
    if (!response.ok) {
      throw new Error('Error al cargar reservas');
    }
    
    reservaciones = await response.json();

    const salasActuales = (window.CONFIGURACION_PISOS && CONFIGURACION_PISOS[piso]) 
      ? CONFIGURACION_PISOS[piso].salas 
      : [];

    salasActuales.forEach((sala) => {
      if (sala.tipo !== "sala" && sala.tipo !== "laboratorio") return;

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
    console.error(error);
    // Alert opcional, comentado para no spamear si falla al inicio
    // alert("⚠️ Error al cargar disponibilidad de salas");
  }
}

function handleSalaClick(sala) {
  const polygon = document.querySelector(`[data-sala-id="${sala.id}"]`);
  if (polygon && polygon.classList.contains("ocupada")) {
    alert("⚠️ Esta sala ya está ocupada en este horario");
    return;
  }

  selectedRoom = sala;
  mostrarInfoSala(sala);
}

function mostrarTooltip(event, sala) {
  const tooltip = document.getElementById("tooltip");
  if (!tooltip) return;

  const reserva = reservaciones.find(
    (r) => r.salaId === sala.id && r.estado === "confirmada"
  );

  let contenido = `<strong>Sala ${sala.numero}</strong><br>`;
  contenido += `Capacidad: ${sala.capacidad}<br>`;
  
  if (sala.computadores) contenido += `💻 Lab. Computación<br>`;

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
  const tooltip = document.getElementById("tooltip");
  if (tooltip) tooltip.style.display = "none";
}

function mostrarInfoSala(sala) {
  const infoDiv = document.getElementById("room-info");
  const btnReservar = document.getElementById("btn-reservar");
  const roomTitle = document.getElementById("room-title");
  const roomDetails = document.getElementById("room-details");

  if (roomTitle) roomTitle.textContent = `Sala ${sala.numero}`;

  let detalles = `
    <p><strong>Tipo:</strong> ${sala.tipo === 'laboratorio' ? 'Laboratorio' : 'Aula Teórica'}</p>
    <p><strong>Capacidad:</strong> ${sala.capacidad} estudiantes</p>
    <p><strong>Recursos:</strong> ${sala.computadores ? 'Proyector, PC' : 'Proyector'}</p>
  `;

  if (roomDetails) roomDetails.innerHTML = detalles;
  
  if (btnReservar) {
      btnReservar.style.display = "inline-block";
      btnReservar.onclick = abrirModalReserva;
  }

  if (infoDiv) infoDiv.style.display = "block";
}

function cerrarInfo() {
  const infoDiv = document.getElementById("room-info");
  if (infoDiv) infoDiv.style.display = "none";
}

function abrirModalReserva() {
  const modalNum = document.getElementById("modal-sala-numero");
  const modal = document.getElementById("modal-reserva");
  
  if (modalNum) modalNum.textContent = selectedRoom.numero;
  if (modal) modal.style.display = "flex";
}

function cerrarModal() {
  const modal = document.getElementById("modal-reserva");
  const form = document.getElementById("form-reserva");
  
  if (modal) modal.style.display = "none";
  if (form) form.reset();
}

// ✅ SISTEMA DE RESERVAS ACTUALIZADO (DEL FIX)
document.getElementById("form-reserva").addEventListener("submit", async (e) => {
  e.preventDefault();

  const codigo = document.getElementById("asignatura-codigo").value.trim();
  const nombre = document.getElementById("asignatura-nombre").value.trim();
  const dia = document.getElementById("dia-select").value;
  const horario = document.getElementById("horario-select").value;
  const [horaInicio, horaFin] = horario.split("-").map((h) => h.trim());

  // Validaciones
  if (!codigo || !nombre) {
    alert("❌ Por favor completa todos los campos");
    return;
  }

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
        estado: "confirmada",
        profesor: currentUser.nombre
      }),
    });

    const data = await response.json();

    if (response.ok) {
      alert("✅ Reserva creada exitosamente");
      cerrarModal();
      cerrarInfo();
      
      // ✅ AUTO-REFRESH AUTOMÁTICO
      await actualizarPlano();
      
      // Scroll suave al plano (opcional si el elemento existe)
      const planoSvg = document.getElementById('plano-svg');
      if (planoSvg) {
          planoSvg.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
      }
    } else if (response.status === 409) {
      alert(`❌ CONFLICTO: ${data.error}\n\nEsta sala ya está ocupada en ese horario.`);
    } else {
      alert("❌ Error: " + data.error);
    }
  } catch (error) {
    console.error("Error al crear reserva:", error);
    alert("❌ Error de conexión con el servidor");
  }
});

function logout() {
  localStorage.removeItem("user");
  window.location.href = "index.html";
}