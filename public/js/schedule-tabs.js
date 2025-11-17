const API_URL = '/api';
let currentUser = null;
let allSchedule = [];
let currentDay = 'lunes';

window.onload = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    window.location.href = 'index.html';
    return;
  }

  currentUser = JSON.parse(userStr);
  document.getElementById('user-name').textContent = `👤 ${
    currentUser.nombre
  }`;

  initializeTabs();
  cargarHorario();
};

// ========== INICIALIZAR TABS ==========
function initializeTabs() {
  const tabs = document.querySelectorAll('.day-tab');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      // Remover active de todos
      tabs.forEach((t) => t.classList.remove('active'));

      // Activar el seleccionado
      tab.classList.add('active');

      // Guardar día actual
      currentDay = tab.dataset.day;

      // Mostrar horario del día
      renderScheduleForDay(currentDay);
    });
  });
}

// ========== CARGAR HORARIO ==========
async function cargarHorario() {
  const content = document.getElementById('schedule-content');

  try {
    const response = await fetch(`${API_URL}/schedule/${currentUser.id}`);
    const data = await response.json();

    allSchedule = data.schedule;

    if (allSchedule.length === 0) {
      content.innerHTML =
        '<div class="no-classes">No hay clases asignadas</div>';
      return;
    }

    // Renderizar el día actual (lunes por defecto)
    renderScheduleForDay(currentDay);
  } catch (error) {
    console.error('Error al cargar horario:', error);
    content.innerHTML =
      '<div class="no-classes">Error al cargar el horario</div>';
  }
}

// ========== RENDERIZAR HORARIO DE UN DÍA ==========
function renderScheduleForDay(dia) {
  const content = document.getElementById('schedule-content');

  // Filtrar clases del día seleccionado
  const clasesDelDia = allSchedule.filter(
    (clase) => clase.dia.toLowerCase() === dia.toLowerCase()
  );

  if (clasesDelDia.length === 0) {
    content.innerHTML = `<div class="no-classes">No hay clases programadas para el día ${
      dia.charAt(0).toUpperCase() + dia.slice(1)
    }</div>`;
    return;
  }

  // Ordenar por hora de inicio
  clasesDelDia.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

  // Generar HTML
  let html = '';
  clasesDelDia.forEach((clase, index) => {
    html += `
      <div class="class-card">
        <div class="class-header">
          <div class="class-number">${index + 1}</div>
          <div class="class-time">${clase.horaInicio}-${clase.horaFin}</div>
        </div>
        <div class="class-body">
          <div class="class-title">${
            clase.asignatura?.nombre || 'Sin nombre'
          }</div>
          <div class="class-code">${
            clase.asignatura?.codigo || 'N/A'
          } · Sala ${clase.sala}</div>
          
          <div class="class-details">
            <div class="detail-row">
              <span class="detail-label">PROFESOR</span>
              <span class="detail-value">${
                clase.profesor || 'No asignado'
              }</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">LUGAR</span>
              <span class="detail-value">${
                clase.nombreSala || clase.sala
              }</span>
            </div>
          </div>
          
          ${
            currentUser.rol !== 'alumno'
              ? `
            <div class="class-actions">
              <button onclick="eliminarReserva(${
                clase.id
              })" class="btn-danger">
                Eliminar Reserva
              </button>
            </div>
          `
              : ''
          }
        </div>
      </div>
    `;
  });

  content.innerHTML = html;
}

// ========== ELIMINAR RESERVA ==========
async function eliminarReserva(id) {
  if (!confirm('¿Estás seguro de eliminar esta reserva?')) return;

  try {
    const response = await fetch(`${API_URL}/reservations/${id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      alert('✅ Reserva eliminada');
      cargarHorario();
    } else {
      alert('❌ Error al eliminar');
    }
  } catch (error) {
    alert('❌ Error de conexión');
  }
}

// ========== LOGOUT ==========
function logout() {
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}