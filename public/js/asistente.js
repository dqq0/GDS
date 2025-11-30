const API_URL = '/api';
let currentUser = null;

window.onload = () => {
  const userStr = localStorage.getItem('user');
  
  // 1. Si no hay usuario, devolver al login
  if (!userStr) {
    window.location.href = 'index.html';
    return;
  }

  try {
    currentUser = JSON.parse(userStr);
  } catch (e) {
    // Si el JSON está corrupto, limpiamos y mandamos al login
    localStorage.removeItem('user');
    window.location.href = 'index.html';
    return;
  }

  // --- VALIDACIÓN DE ROL MEJORADA ---
  // Convertimos el rol a minúsculas y quitamos espacios para evitar errores (ej: "Profesor " -> "profesor")
  const rolUsuario = (currentUser.rol || '').trim().toLowerCase();
  
  // Lista blanca: Solo estos roles pueden ver esta página
  const rolesPermitidos = ['profesor', 'docente', 'admin'];

  if (!rolesPermitidos.includes(rolUsuario)) {
    alert(`⚠️ Acceso denegado.\nTu rol es: "${currentUser.rol}".\nEsta función es exclusiva para profesores.`);
    window.location.href = 'schedule.html';
    return;
  }
  // ----------------------------------

  const nombreDisplay = document.getElementById('user-name');
  if (nombreDisplay) {
    nombreDisplay.textContent = `👤 ${currentUser.nombre}`;
  }
};

document.getElementById('form-busqueda').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const btnBuscar = e.target.querySelector('button[type="submit"]'); // Asumiendo que hay un botón submit
  const textoOriginal = btnBuscar ? btnBuscar.innerText : 'Buscar';

  // Desactivar botón para evitar doble click
  if (btnBuscar) {
    btnBuscar.disabled = true;
    btnBuscar.innerText = 'Buscando...';
  }

  const capacidadMinima = parseInt(document.getElementById('capacidad').value) || 0;
  const requiereComputadores = document.getElementById('computadores').checked;
  const requiereProyector = document.getElementById('proyector').checked;
  const piso = document.getElementById('piso').value || null;
  const dia = document.getElementById('dia').value || null;
  const horario = document.getElementById('horario').value || null;

  try {
    const response = await fetch(`${API_URL}/search/salas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        capacidadMinima,
        requiereComputadores,
        requiereProyector,
        piso,
        dia,
        horario
      })
    });

    const data = await response.json();

    if (response.ok) {
      mostrarResultados(data.salas || [], capacidadMinima);
    } else {
      alert('❌ Error del servidor: ' + (data.error || 'Desconocido'));
    }
  } catch (error) {
    console.error(error);
    alert('❌ Error de conexión con el servidor');
  } finally {
    // Reactivar botón
    if (btnBuscar) {
      btnBuscar.disabled = false;
      btnBuscar.innerText = textoOriginal;
    }
  }
});

function mostrarResultados(salas, capacidadSolicitada) {
  const container = document.getElementById('resultados');
  const lista = document.getElementById('lista-resultados');

  if (!salas || salas.length === 0) {
    lista.innerHTML = '<div class="no-results">❌ No se encontraron salas con esos criterios. Intenta reducir los requisitos.</div>';
    container.style.display = 'block';
    return;
  }

  let html = '';

  salas.forEach((sala, index) => {
    const desperdicio = sala.capacidad - capacidadSolicitada;
    
    // Lógica de colores semáforo para el score
    const colorRecomendacion = 
      sala.score >= 90 ? '#4caf50' : // Verde
      sala.score >= 70 ? '#ff9800' : // Naranja
      '#9e9e9e';                     // Gris

    html += `
      <div class="resultado-card" style="border-left: 5px solid ${colorRecomendacion};">
        <div class="resultado-header">
          <div class="resultado-numero">#${index + 1}</div>
          <div class="resultado-titulo">
            <h3>Sala ${sala.numero}</h3>
            <span class="badge-recomendacion" style="background: ${colorRecomendacion}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8em;">
              ${sala.recomendacion || 'Disponible'}
            </span>
          </div>
        </div>

        <div class="resultado-body">
          <div class="info-grid">
            <div class="info-item">
              <strong>Capacidad:</strong> ${sala.capacidad} personas
              ${desperdicio > 0 ? `<span style="color: #666; font-size: 0.9em;">(+${desperdicio} libres)</span>` : ''}
            </div>
            <div class="info-item">
              <strong>Piso:</strong> ${sala.piso}
            </div>
            <div class="info-item">
              <strong>Computadores:</strong> ${sala.tiene_computadores ? '✅ Sí' : '❌ No'}
            </div>
            <div class="info-item">
              <strong>Proyector:</strong> ${sala.tiene_proyector ? '✅ Sí' : '❌ No'}
            </div>
          </div>

          <div class="info-item" style="margin-top: 10px;">
            <strong>Utilidad principal:</strong> ${sala.utilidad || 'General'}
          </div>

          <button onclick="reservarSala(${sala.id}, '${sala.numero}')" class="btn-primary btn-small" style="margin-top: 15px; width: 100%;">
            Reservar Esta Sala
          </button>
        </div>
      </div>
    `;
  });

  lista.innerHTML = html;
  container.style.display = 'block';
  // Scroll suave hacia los resultados
  container.scrollIntoView({ behavior: 'smooth' });
}

function reservarSala(salaId, salaNumero) {
  if(!salaId) return;
  localStorage.setItem('salaPreseleccionada', salaId);
  window.location.href = 'blueprint.html';
}

function logout() {
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}