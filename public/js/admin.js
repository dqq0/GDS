const API_URL = '/api';
let currentUser = null;
let charts = {};

window.onload = async () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    window.location.href = 'index.html';
    return;
  }

  currentUser = JSON.parse(userStr);

  if (currentUser.rol !== 'admin') {
    alert('⛔ Acceso denegado. Solo para administradores.');
    window.location.href = 'blueprint.html';
    return;
  }

  document.getElementById('user-name').textContent = `👤 ${currentUser.nombre}`;

  inicializarTabs();
  await cargarDatos();
};

function inicializarTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });
}

async function cargarDatos() {
  try {
    // Cargar estadísticas
    const statsRes = await fetch(`${API_URL}/admin/stats`);
    const stats = await statsRes.json();

    document.getElementById('total-reservas').textContent = stats.totalReservas;
    document.getElementById('ocupacion').textContent = stats.ocupacionPromedio + '%';
    document.getElementById('salas-disponibles').textContent = stats.salasDisponibles;

    // Cargar cancelaciones
    const cancelacionesRes = await fetch(`${API_URL}/cancelaciones`);
    const cancelacionesData = await cancelacionesRes.json();
    document.getElementById('total-cancelaciones').textContent = cancelacionesData.cancelaciones.length;

    // Cargar heatmap
    const heatmapRes = await fetch(`${API_URL}/analytics/heatmap`);
    const heatmapData = await heatmapRes.json();
    renderHeatmap(heatmapData.heatmap);

    // Cargar reservas por día
    await cargarReservasPorDia();

    // Cargar predicción
    const prediccionRes = await fetch(`${API_URL}/analytics/prediccion`);
    const prediccionData = await prediccionRes.json();
    renderPrediccion(prediccionData.predicciones);

    // Cargar tablas
    await cargarTablaReservas();
    await cargarTablaSalas();
    await cargarTablaUsuarios();
    renderCancelaciones(cancelacionesData.cancelaciones);

  } catch (error) {
    console.error('Error al cargar datos:', error);
    alert('Error al cargar datos del dashboard');
  }
}

function renderHeatmap(heatmap) {
  const ctx = document.getElementById('heatmapChart')?.getContext('2d');
  if (!ctx) return;

  if (charts.heatmap) charts.heatmap.destroy();

  charts.heatmap = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Piso 1', 'Piso 2', 'Piso 3', 'Piso 4', 'Piso 5'],
      datasets: [{
        label: 'Uso (%)',
        data: [
          heatmap.piso1?.uso || 0,
          heatmap.piso2?.uso || 0,
          heatmap.piso3?.uso || 0,
          heatmap.piso4?.uso || 0,
          heatmap.piso5?.uso || 0
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(153, 102, 255, 0.8)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

async function cargarReservasPorDia() {
  try {
    const response = await fetch(`${API_URL}/admin/reservas`);
    const data = await response.json();

    const reservasPorDia = {
      lunes: 0,
      martes: 0,
      miércoles: 0,
      jueves: 0,
      viernes: 0
    };

    data.reservas.forEach(r => {
      if (reservasPorDia.hasOwnProperty(r.dia)) {
        reservasPorDia[r.dia]++;
      }
    });

    const ctx = document.getElementById('reservasDiaChart')?.getContext('2d');
    if (!ctx) return;

    if (charts.reservasDia) charts.reservasDia.destroy();

    charts.reservasDia = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
        datasets: [{
          label: 'Reservas',
          data: [
            reservasPorDia.lunes,
            reservasPorDia.martes,
            reservasPorDia.miércoles,
            reservasPorDia.jueves,
            reservasPorDia.viernes
          ],
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

function renderPrediccion(predicciones) {
  const ctx = document.getElementById('prediccionChart')?.getContext('2d');
  if (!ctx) return;

  if (charts.prediccion) charts.prediccion.destroy();

  charts.prediccion = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: predicciones.map(p => `${p.dia} ${p.hora}`),
      datasets: [{
        label: 'Demanda Predicha',
        data: predicciones.map(p => 
          p.demanda === 'alta' ? 3 : p.demanda === 'media' ? 2 : 1
        ),
        backgroundColor: predicciones.map(p =>
          p.demanda === 'alta' ? 'rgba(255, 99, 132, 0.8)' :
          p.demanda === 'media' ? 'rgba(255, 206, 86, 0.8)' :
          'rgba(75, 192, 192, 0.8)'
        )
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 3,
          ticks: {
            callback: function(value) {
              return ['', 'Baja', 'Media', 'Alta'][value];
            }
          }
        }
      }
    }
  });
}

async function cargarTablaReservas() {
  try {
    const response = await fetch(`${API_URL}/admin/reservas`);
    const data = await response.json();

    const tabla = document.getElementById('tabla-reservas');

    if (data.reservas.length === 0) {
      tabla.innerHTML = '<p class="no-data">No hay reservas registradas</p>';
      return;
    }

    let html = `
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Sala</th>
            <th>Asignatura</th>
            <th>Día</th>
            <th>Horario</th>
            <th>Profesor</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.reservas.forEach(r => {
      html += `
        <tr>
          <td>${r.id}</td>
          <td>Sala ${r.salaId}</td>
          <td>${r.asignatura?.nombre || 'N/A'}</td>
          <td>${r.dia}</td>
          <td>${r.horaInicio} - ${r.horaFin}</td>
          <td>${r.profesor || 'N/A'}</td>
          <td><span class="badge badge-${r.estado}">${r.estado}</span></td>
          <td>
            <button onclick="eliminarReservaAdmin(${r.id})" class="btn-danger btn-small">
              Eliminar
            </button>
          </td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    tabla.innerHTML = html;
  } catch (error) {
    console.error('Error:', error);
  }
}

async function cargarTablaSalas() {
  try {
    const response = await fetch(`${API_URL}/salas/todas`);
    const salas = await response.json();

    const tabla = document.getElementById('tabla-salas');

    let html = `
      <table>
        <thead>
          <tr>
            <th>Número</th>
            <th>Piso</th>
            <th>Capacidad</th>
            <th>Computadores</th>
            <th>Proyector</th>
          </tr>
        </thead>
        <tbody>
    `;

    salas.forEach(s => {
      html += `
        <tr>
          <td><strong>${s.numero}</strong></td>
          <td>Piso ${s.piso}</td>
          <td>${s.capacidad} personas</td>
          <td>${s.tiene_computadores ? '✅' : '❌'}</td>
          <td>${s.tiene_proyector ? '✅' : '❌'}</td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    tabla.innerHTML = html;
  } catch (error) {
    console.error('Error:', error);
  }
}

async function cargarTablaUsuarios() {
  try {
    const response = await fetch(`${API_URL}/admin/usuarios`);
    const data = await response.json();

    const tabla = document.getElementById('tabla-usuarios');

    let html = `
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.usuarios.forEach(u => {
      html += `
        <tr>
          <td>${u.id}</td>
          <td>${u.nombre}</td>
          <td>${u.email}</td>
          <td><span class="badge badge-${u.rol}">${u.rol}</span></td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    tabla.innerHTML = html;
  } catch (error) {
    console.error('Error:', error);
  }
}

function renderCancelaciones(cancelaciones) {
  const tabla = document.getElementById('tabla-cancelaciones');

  if (cancelaciones.length === 0) {
    tabla.innerHTML = '<p class="no-data">No hay cancelaciones registradas</p>';
    return;
  }

  let html = `
    <table>
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Asignatura</th>
          <th>Motivo</th>
        </tr>
      </thead>
      <tbody>
  `;

  cancelaciones.forEach(c => {
    html += `
      <tr>
        <td>${new Date(c.fecha_cancelacion).toLocaleString('es-ES')}</td>
        <td>${c.asignatura?.nombre || 'N/A'}</td>
        <td>${c.motivo}</td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  tabla.innerHTML = html;
}

async function eliminarReservaAdmin(id) {
  if (!confirm('¿Seguro que deseas eliminar esta reserva?')) return;

  try {
    const response = await fetch(`${API_URL}/reservations/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        motivo: 'Eliminada por administrador',
        canceladoPor: currentUser.id
      })
    });

    if (response.ok) {
      alert('✅ Reserva eliminada');
      await cargarDatos();
    } else {
      alert('❌ Error al eliminar');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

function logout() {
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}