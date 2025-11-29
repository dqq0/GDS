const API_URL = '/api';
let currentUser = null;

window.onload = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    window.location.href = 'index.html';
    return;
  }

  currentUser = JSON.parse(userStr);

  // Solo profesores y ayudantes
  if (currentUser.rol === 'alumno') {
    alert('⚠️ Acceso denegado. Solo profesores pueden usar esta función.');
    window.location.href = 'schedule.html';
    return;
  }

  document.getElementById('user-name').textContent = `👤 ${currentUser.nombre}`;
};

document.getElementById('form-busqueda').addEventListener('submit', async (e) => {
  e.preventDefault();

  const capacidadMinima = parseInt(document.getElementById('capacidad').value);
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
      mostrarResultados(data.salas, capacidadMinima);
    } else {
      alert('❌ Error: ' + data.error);
    }
  } catch (error) {
    console.error('Error en búsqueda:', error);
    alert('❌ Error de conexión');
  }
});

function mostrarResultados(salas, capacidadSolicitada) {
  const container = document.getElementById('resultados');
  const lista = document.getElementById('lista-resultados');

  if (salas.length === 0) {
    lista.innerHTML = '<div class="no-results">❌ No se encontraron salas que cumplan los requisitos</div>';
    container.style.display = 'block';
    return;
  }

  let html = '';

  salas.forEach((sala, index) => {
    const desperdicio = sala.capacidad - capacidadSolicitada;
    const colorRecomendacion = 
      sala.score >= 90 ? '#4caf50' : 
      sala.score >= 70 ? '#ff9800' : '#9e9e9e';

    html += `
      <div class="resultado-card" style="border-left: 5px solid ${colorRecomendacion};">
        <div class="resultado-header">
          <div class="resultado-numero">#${index + 1}</div>
          <div class="resultado-titulo">
            <h3>Sala ${sala.numero}</h3>
            <span class="badge-recomendacion" style="background: ${colorRecomendacion};">
              ${sala.recomendacion}
            </span>
          </div>
        </div>

        <div class="resultado-body">
          <div class="info-grid">
            <div class="info-item">
              <strong>Capacidad:</strong> ${sala.capacidad} personas
              ${desperdicio > 0 ? `<span class="text-muted">(+${desperdicio} espacios libres)</span>` : ''}
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

          <div class="info-item">
            <strong>Utilidad:</strong> ${sala.utilidad || 'Sin especificar'}
          </div>

          <button onclick="reservarSala(${sala.id}, '${sala.numero}')" class="btn-primary btn-small">
            Reservar Esta Sala
          </button>
        </div>
      </div>
    `;
  });

  lista.innerHTML = html;
  container.style.display = 'block';
}

function reservarSala(salaId, salaNumero) {
  // Redirigir al blueprint con la sala pre-seleccionada
  localStorage.setItem('salaPreseleccionada', salaId);
  window.location.href = 'blueprint.html';
}

function logout() {
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}