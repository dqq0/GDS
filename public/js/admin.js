const API_URL = '/api';
let currentUser = null;

window.onload = async () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    window.location.href = 'index.html';
    return;
  }

  currentUser = JSON.parse(userStr);

  if (currentUser.rol !== 'admin') {
    alert('Acceso denegado. Solo para administradores.');
    window.location.href = 'blueprint.html';
    return;
  }

  document.getElementById('user-name').textContent = `👤 ${currentUser.nombre}`;

  await cargarDatos();
};

async function cargarDatos() {
  try {
    // Cargar heatmap
    const heatmapRes = await fetch(`${API_URL}/analytics/heatmap`);
    const heatmapData = await heatmapRes.json();
    renderHeatmap(heatmapData.heatmap);

    // Cargar predicción
    const prediccionRes = await fetch(`${API_URL}/analytics/prediccion`);
    const prediccionData = await prediccionRes.json();
    renderPrediccion(prediccionData.predicciones);

    // Cargar cancelaciones
    const cancelacionesRes = await fetch(`${API_URL}/cancelaciones`);
    const cancelacionesData = await cancelacionesRes.json();
    renderCancelaciones(cancelacionesData.cancelaciones);

  } catch (error) {
    console.error('Error al cargar datos:', error);
  }
}

function renderHeatmap(heatmap) {
  const ctx = document.getElementById('heatmapChart').getContext('2d');
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Piso 1', 'Piso 2', 'Piso 3', 'Piso 4', 'Piso 5'],
      datasets: [{
        label: 'Uso (%)',
        data: [
          heatmap.piso1.uso,
          heatmap.piso2.uso,
          heatmap.piso3.uso,
          heatmap.piso4.uso,
          heatmap.piso5.uso
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(153, 102, 255, 0.6)'
        ]
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      }
    }
  });
}

function renderPrediccion(predicciones) {
  const ctx = document.getElementById('prediccionChart').getContext('2d');
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: predicciones.map(p => `${p.dia} ${p.hora}`),
      datasets: [{
        label: 'Demanda Predicha',
        data: predicciones.map(p => p.demanda === 'alta' ? 3 : p.demanda === 'media' ? 2 : 1),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }]
    }
  });
}

function renderCancelaciones(cancelaciones) {
  const tabla = document.getElementById('tabla-cancelaciones');
  
  if (cancelaciones.length === 0) {
    tabla.innerHTML = '<p class="no-data">No hay cancelaciones registradas</p>';
    return;
  }

  let html = '<table><thead><tr><th>Fecha</th><th>Motivo</th><th>Cancelado por</th></tr></thead><tbody>';
  
  cancelaciones.forEach(c => {
    html += `
      <tr>
        <td>${new Date(c.fecha_cancelacion).toLocaleString()}</td>
        <td>${c.motivo}</td>
        <td>${c.cancelado_por}</td>
      </tr>
    `;
  });
  
  html += '</tbody></table>';
  tabla.innerHTML = html;
}

function logout() {
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}