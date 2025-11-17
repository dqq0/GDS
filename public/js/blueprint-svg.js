const API_URL = '/api';
let currentUser = null;
let selectedRoom = null;
let reservaciones = [];

// Inicialización
window.onload = () => {
  const userStr = localStorage.getItem("user");
  if (!userStr) {
    window.location.href = "index.html";
    return;
  }

  currentUser = JSON.parse(userStr);
  document.getElementById("user-name").textContent = `👤 ${currentUser.nombre}`;

  inicializarPlano();
  actualizarPlano();
};

// ========== INICIALIZAR PLANO SVG ==========
function inicializarPlano() {
  const salasLayer = document.getElementById("salas-layer");
  const labelsLayer = document.getElementById("labels-layer");

  SALAS_PISO_2.forEach((sala) => {
    // Crear polígono para cada sala
    const polygon = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "polygon"
    );
    polygon.setAttribute("points", sala.polygon);
    polygon.setAttribute("data-sala-id", sala.id);
    polygon.classList.add("sala-shape");

    // Clases según tipo
    if (sala.tipo === "baño") {
      polygon.classList.add("no-seleccionable", "tipo-baño");
    } else if (sala.tipo === "escalera") {
      polygon.classList.add("no-seleccionable", "tipo-escalera");
    } else {
      polygon.classList.add("seleccionable");

      // Eventos solo para salas seleccionables
      polygon.addEventListener("click", () => handleSalaClick(sala));
      polygon.addEventListener("mouseenter", (e) => mostrarTooltip(e, sala));
      polygon.addEventListener("mouseleave", ocultarTooltip);
    }

    salasLayer.appendChild(polygon);

    // Agregar label con número de sala
    if (sala.numero) {
      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );

      // Calcular centro del polígono
      const points = sala.polygon
        .split(" ")
        .map((p) => p.split(",").map(Number));
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

// ========== ACTUALIZAR DISPONIBILIDAD ==========
async function actualizarPlano() {
  const dia = document.getElementById("dia-select").value;
  const horario = document.getElementById("horario-select").value;
  const [horaInicio] = horario.split("-").map((h) => h.trim());

  try {
    const response = await fetch(`${API_URL}/reservations?dia=${dia}&piso=2`);
    reservaciones = await response.json();

    // Actualizar colores de las salas
    SALAS_PISO_2.forEach((sala) => {
      if (sala.tipo !== "sala") return;

      const polygon = document.querySelector(
        `[data-sala-id="${sala.id}"]`
      );
      if (!polygon) return;

      const estaOcupada = reservaciones.some(
        (r) =>
          r.salaId === sala.id &&
          r.horaInicio === horaInicio &&
          r.estado === "confirmada"
      );

      // Remover clases previas
      polygon.classList.remove("disponible", "ocupada");

      // Agregar clase según estado
      if (estaOcupada) {
        polygon.classList.add("ocupada");
      } else {
        polygon.classList.add("disponible");
      }
    });
  } catch (error) {
    console.error("Error al actualizar plano:", error);
    alert("Error al cargar disponibilidad de salas");
  }
}

// ========== MANEJO DE CLICKS EN SALAS ==========
function handleSalaClick(sala) {
  const polygon = document.querySelector(`[data-sala-id="${sala.id}"]`);

  // Solo permitir selección de salas disponibles
  if (polygon.classList.contains("ocupada")) {
    alert("⚠️ Esta sala ya está ocupada en este horario");
    return;
  }

  selectedRoom = sala;
  mostrarInfoSala(sala);
}

// ========== TOOLTIP AL HACER HOVER ==========
function mostrarTooltip(event, sala) {
  const tooltip = document.getElementById("tooltip");
  const reserva = reservaciones.find(
    (r) => r.salaId === sala.id && r.estado === "confirmada"
  );

  let contenido = `<strong>${sala.numero}</strong><br>`;
  contenido += `${sala.nombre}<br>`;
  contenido += `Capacidad: ${sala.capacidad} personas`;

  if (reserva) {
    contenido += `<br><span style="color: #ff4444;">Ocupada por: ${reserva.asignatura?.nombre || "N/A"}</span>`;
  }

  tooltip.innerHTML = contenido;
  tooltip.style.display = "block";
  tooltip.style.left = event.pageX + 15 + "px";
  tooltip.style.top = event.pageY + 15 + "px";
}

function ocultarTooltip() {
  document.getElementById("tooltip").style.display = "none";
}

// ========== PANEL DE INFORMACIÓN ==========
function mostrarInfoSala(sala) {
  const infoDiv = document.getElementById("room-info");
  const btnReservar = document.getElementById("btn-reservar");

  document.getElementById("room-title").textContent = `Sala ${sala.numero}`;

  const reserva = reservaciones.find(
    (r) => r.salaId === sala.id && r.estado === "confirmada"
  );

  let detalles = `
    <strong>Nombre:</strong> ${sala.nombre}<br>
    <strong>Capacidad:</strong> ${sala.capacidad} personas<br>
    <strong>Utilidad:</strong> ${sala.utilidad}<br>
  `;

  if (reserva) {
    detalles += `<br><strong>Estado:</strong> <span style="color: #ff4444;">Ocupada</span><br>`;
    detalles += `<strong>Asignatura:</strong> ${reserva.asignatura?.nombre || "N/A"}`;
    btnReservar.style.display = "none";
  } else {
    detalles += `<br><strong>Estado:</strong> <span style="color: #4caf50;">Disponible</span>`;
    btnReservar.style.display = "inline-block";
    btnReservar.onclick = abrirModalReserva;
  }

  document.getElementById("room-details").innerHTML = detalles;
  infoDiv.style.display = "block";
}

function cerrarInfo() {
  document.getElementById("room-info").style.display = "none";
}

// ========== MODAL DE RESERVA ==========
function abrirModalReserva() {
  document.getElementById("modal-sala-numero").textContent =
    selectedRoom.numero;
  document.getElementById("modal-reserva").style.display = "flex";
}

function cerrarModal() {
  document.getElementById("modal-reserva").style.display = "none";
  document.getElementById("form-reserva").reset();
}

document
  .getElementById("form-reserva")
  .addEventListener("submit", async (e) => {
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
          asignatura: { codigo, nombre },
        }),
      });

      if (response.ok) {
        alert("✅ Reserva creada exitosamente");
        cerrarModal();
        cerrarInfo();
        actualizarPlano();
      } else {
        const error = await response.json();
        alert("❌ Error: " + error.error);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Error de conexión");
    }
  });

// ========== LOGOUT ==========
function logout() {
  localStorage.removeItem("user");
  window.location.href = "index.html";
}