const API_URL = '/api';
let currentUser = null;
let selectedRoom = null;
let reservaciones = [];

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

function inicializarPlano() {
  const salasLayer = document.getElementById("salas-layer");
  const labelsLayer = document.getElementById("labels-layer");

  SALAS_PISO_2.forEach((sala) => {
    const polygon = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "polygon"
    );
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
      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
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

// ✅ ACTUALIZACIÓN CON VALIDACIÓN VISUAL
async function actualizarPlano() {
  const dia = document.getElementById("dia-select").value;
  const horario = document.getElementById("horario-select").value;
  const [horaInicio] = horario.split("-").map((h) => h.trim());

  try {
    const response = await fetch(`${API_URL}/reservations?dia=${dia}&piso=2`);
    
    if (!response.ok) {
      throw new Error('Error al cargar reservas');
    }
    
    reservaciones = await response.json();

    SALAS_PISO_2.forEach((sala) => {
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
        // Deshabilitar eventos de click
        polygon.style.pointerEvents = "none";
      } else {
        polygon.classList.add("disponible");
        polygon.style.pointerEvents = "auto";
      }
    });
  } catch (error) {
    console.error("Error al actualizar plano:", error);
    alert("⚠️ Error al cargar disponibilidad de salas");
  }
}

// ✅ MANEJO DE ERRORES MEJORADO
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
        asignatura: { codigo, nombre },
      }),
    });

    const data = await response.json();

    if (response.ok) {
      alert("✅ Reserva creada exitosamente");
      cerrarModal();
      cerrarInfo();
      actualizarPlano(); // Recargar estado visual
    } else if (response.status === 409) {
      // Conflicto de horario
      alert(`❌ ERROR: ${data.error}\n\nEsta sala ya está reservada en este horario.`);
    } else {
      alert("❌ Error: " + data.error);
    }
  } catch (error) {
    console.error("Error:", error);
    alert("❌ Error de conexión con el servidor");
  }
});

function handleSalaClick(sala) {
  const polygon = document.querySelector(`[data-sala-id="${sala.id}"]`);

  if (polygon.classList.contains("ocupada")) {
    alert("⚠️ Esta sala ya está ocupada en este horario");
    return;
  }

  selectedRoom = sala;
  mostrarInfoSala(sala);
}

// ... resto del código existente