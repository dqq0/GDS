const API_URL = '/api';
let currentUser = null;
let algoritmos = null;
let resultadoActual = null;
let chartOcupacion = null;

window.onload = async () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    window.location.href = 'index.html';
    return;
  }

  currentUser = JSON.parse(userStr);
  
  const rolesPermitidos = ['profesor', 'admin', 'ayudante'];
  if (!rolesPermitidos.includes(currentUser.rol?.toLowerCase())) {
    alert('Acceso denegado. Solo para profesores y ayudantes.');
    window.location.href = 'schedule.html';
    return;
  }

  document.getElementById('user-name').textContent = `👤 ${currentUser.nombre}`;

  await inicializarSistema();
  inicializarChart();
};

async function inicializarSistema() {
  try {
    // Cargar salas y reservas
    const [salasRes, reservasRes] = await Promise.all([
      fetch(`${API_URL}/salas/todas`),
      fetch(`${API_URL}/reservations/todas`)
    ]);

    const salas = await salasRes.json();
    const reservas = await reservasRes.json();

    // Inicializar algoritmos
    algoritmos = new AlgoritmosAsignacion(salas, reservas);

    console.log('✅ Sistema de asignación inteligente inicializado');
    console.log(`📊 ${salas.length} salas cargadas`);
    console.log(`📅 ${reservas.length} reservas activas`);

  } catch (error) {
    console.error('Error al inicializar:', error);
    alert('Error al cargar datos del sistema');
  }
}

function inicializarChart() {
  const ctx = document.getElementById('ocupacion-chart')?.getContext('2d');
  if (!ctx) return;

  chartOcupacion = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Piso 1', 'Piso 2', 'Piso 3', 'Piso 4', 'Piso 5'],
      datasets: [{
        label: 'Ocupación (%)',
        data: [0, 0, 0, 0, 0],
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)'
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        },
        title: {
          display: true,
          text: 'Ocupación Actual por Piso'
        }
      }
    }
  });
}

document.getElementById('form-asignacion').addEventListener('submit', async (e) => {
  e.preventDefault();

  const codigoAsignatura = document.getElementById('asignatura-codigo').value.trim();
  const nombreAsignatura = document.getElementById('asignatura-nombre').value.trim();
  const dia = document.getElementById('dia').value;
  const horario = document.getElementById('horario').value;
  const numEstudiantes = parseInt(document.getElementById('num-estudiantes').value);
  const margenSeguridad = document.getElementById('margen-seguridad').checked;
  const algoritmoSeleccionado = document.getElementById('algoritmo').value;

  // Calcular capacidad necesaria
  const capacidadNecesaria = margenSeguridad 
    ? Math.ceil(numEstudiantes * 1.1) 
    : numEstudiantes;

  const requisitos = {
    codigoAsignatura,
    nombreAsignatura,
    dia,
    horario,
    numEstudiantes,
    capacidadNecesaria,
    requiereProyector: document.getElementById('req-proyector').checked,
    requiereComputadores: document.getElementById('req-computadores').checked,
    requiereAire: document.getElementById('req-aire').checked,
    requierePizarraDigital: document.getElementById('req-pizarra-digital').checked,
    prioridadPiso: document.getElementById('prioridad-piso').value,
    evitarAdyacentes: document.getElementById('evitar-adyacentes').checked,
    accesibilidad: document.getElementById('accesibilidad').checked
  };

  await procesarAsignacion(requisitos, algoritmoSeleccionado);
});

async function procesarAsignacion(requisitos, algoritmo) {
  const tiempoInicio = performance.now();

  // Ejecutar algoritmo seleccionado
  let resultado;
  switch (algoritmo) {
    case 'best-fit':
      resultado = algoritmos.bestFit(requisitos);
      break;
    case 'load-balance':
      resultado = algoritmos.loadBalance(requisitos);
      break;
    case 'proximity':
      resultado = algoritmos.proximity(requisitos);
      break;
    case 'predictive':
      resultado = algoritmos.predictive(requisitos);
      break;
    default:
      resultado = algoritmos.predictive(requisitos);
  }

  const tiempoFin = performance.now();
  resultado.tiempoProcesamiento = (tiempoFin - tiempoInicio).toFixed(2);
  resultado.requisitos = requisitos;

  resultadoActual = resultado;

  mostrarResultados(resultado);
  actualizarChartOcupacion(requisitos.dia, requisitos.horario);
}

function mostrarResultados(resultado) {
  document.getElementById('resultados-panel').style.display = 'block';
  document.getElementById('resultados-panel').scrollIntoView({ behavior: 'smooth' });

  // Información del algoritmo
  const nombresAlgoritmos = {
    'best-fit': 'Best Fit - Optimización de Espacio',
    'load-balance': 'Equilibrio de Carga',
    'proximity': 'Proximidad',
    'predictive': 'Predictivo con IA'
  };

  document.getElementById('algoritmo-usado').innerHTML = 
    `<strong>Algoritmo:</strong> ${nombresAlgoritmos[resultado.algoritmo]}`;
  document.getElementById('tiempo-procesamiento').innerHTML = 
    `<strong>Tiempo:</strong> ${resultado.tiempoProcesamiento}ms`;

  // Sala recomendada
  const salaRecomendadaDiv = document.getElementById('sala-recomendada');
  if (resultado.mejorOpcion) {
    const sala = resultado.mejorOpcion;
    const desperdicio = sala.capacidad - resultado.requisitos.capacidadNecesaria;
    const ratioOcupacion = ((resultado.requisitos.capacidadNecesaria / sala.capacidad) * 100).toFixed(0);

    salaRecomendadaDiv.innerHTML = `
      <div class="recomendacion-header">
        <h3>🏆 Mejor Opción: Sala ${sala.numero}</h3>
        <div class="score-badge">Score: ${sala.scoreFinal?.toFixed(0) || 100}/100</div>
      </div>
      
      <div class="recomendacion-body">
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Piso:</span>
            <span class="value">${sala.piso}</span>
          </div>
          <div class="info-item">
            <span class="label">Capacidad:</span>
            <span class="value">${sala.capacidad} personas</span>
          </div>
          <div class="info-item">
            <span class="label">Ocupación:</span>
            <span class="value">${ratioOcupacion}%</span>
          </div>
          <div class="info-item">
            <span class="label">Espacios libres:</span>
            <span class="value">${desperdicio}</span>
          </div>
        </div>

        <div class="recursos-grid">
          ${sala.tiene_computadores ? '<span class="recurso-badge">💻 Computadores</span>' : ''}
          ${sala.tiene_proyector ? '<span class="recurso-badge">📽️ Proyector</span>' : ''}
          ${sala.tiene_aire ? '<span class="recurso-badge">❄️ Aire Acondicionado</span>' : ''}
        </div>

        ${sala.probabilidadExito ? `
          <div class="probabilidad-exito">
            <strong>Probabilidad de Éxito:</strong> 
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${sala.probabilidadExito}%"></div>
            </div>
            <span>${sala.probabilidadExito.toFixed(0)}%</span>
          </div>
        ` : ''}
      </div>
    `;
  } else {
    salaRecomendadaDiv.innerHTML = `
      <div class="no-results">
        <h3>❌ No se encontraron salas disponibles</h3>
        <p>Intenta con otros horarios o requisitos menos restrictivos</p>
      </div>
    `;
  }

  // Alternativas
  const alternativasDiv = document.getElementById('alternativas-list');
  if (resultado.alternativas && resultado.alternativas.length > 0) {
    let html = '';
    resultado.alternativas.forEach((sala, index) => {
      html += `
        <div class="alternativa-card">
          <div class="alternativa-header">
            <h4>${index + 2}. Sala ${sala.numero}</h4>
            <span class="score-mini">${sala.scoreFinal?.toFixed(0) || 'N/A'}/100</span>
          </div>
          <div class="alternativa-body">
            <span>Piso ${sala.piso}</span>
            <span>Cap: ${sala.capacidad}</span>
            ${sala.tiene_computadores ? '<span>💻</span>' : ''}
            ${sala.tiene_proyector ? '<span>📽️</span>' : ''}
          </div>
        </div>
      `;
    });
    alternativasDiv.innerHTML = html;
  } else {
    alternativasDiv.innerHTML = '<p class="no-data">No hay alternativas disponibles</p>';
  }

  // Insights
  const insightsDiv = document.getElementById('insights-list');
  if (resultado.mejorOpcion?.insights && resultado.mejorOpcion.insights.length > 0) {
    let html = '<ul class="insights-list">';
    resultado.mejorOpcion.insights.forEach(insight => {
      html += `<li>${insight}</li>`;
    });
    html += '</ul>';
    insightsDiv.innerHTML = html;
  } else {
    insightsDiv.innerHTML = '<p class="no-data">No hay insights disponibles</p>';
  }
}

document.getElementById('btn-confirmar-asignacion').addEventListener('click', async () => {
  if (!resultadoActual || !resultadoActual.mejorOpcion) {
    alert('No hay sala seleccionada');
    return;
  }

  const sala = resultadoActual.mejorOpcion;
  const requisitos = resultadoActual.requisitos;
  const [horaInicio, horaFin] = requisitos.horario.split('-').map(h => h.trim());

  try {
    const response = await fetch(`${API_URL}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        salaId: sala.id,
        usuarioId: currentUser.id,
        dia: requisitos.dia,
        horaInicio,
        horaFin,
        piso: sala.piso,
        asignatura: {
          codigo: requisitos.codigoAsignatura,
          nombre: requisitos.nombreAsignatura
        },
        estado: 'confirmada',
        profesor: currentUser.nombre,
        asignadoPorIA: true,
        algoritmo: resultadoActual.algoritmo,
        scoreAsignacion: sala.scoreFinal
      })
    });

    if (response.ok) {
      alert('✅ Sala asignada exitosamente');
      window.location.href = 'blueprint.html';
    } else {
      const data = await response.json();
      alert('❌ Error: ' + data.error);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('❌ Error de conexión');
  }
});

async function actualizarChartOcupacion(dia, horario) {
  if (!chartOcupacion || !algoritmos) return;

  const horaInicio = horario.split('-')[0].trim();
  const ocupacion = algoritmos.calcularOcupacionPorPiso(dia, horaInicio);

  chartOcupacion.data.datasets[0].data = [
    ocupacion[1] || 0,
    ocupacion[2] || 0,
    ocupacion[3] || 0,
    ocupacion[4] || 0,
    ocupacion[5] || 0
  ];

  chartOcupacion.update();
}

function nuevaBusqueda() {
  document.getElementById('resultados-panel').style.display = 'none';
  document.getElementById('form-asignacion').scrollIntoView({ behavior: 'smooth' });
}

function logout() {
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}