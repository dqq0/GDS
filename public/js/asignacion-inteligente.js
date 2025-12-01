const API_URL = '/api';
let currentUser = null;
let algoritmos = null;
let resultadoActual = null;
let salaSeleccionada = null;

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
};

async function inicializarSistema() {
  try {
    const [salasRes, reservasRes] = await Promise.all([
      fetch(`${API_URL}/salas/todas`),
      fetch(`${API_URL}/reservations/todas`)
    ]);

    const salas = await salasRes.json();
    const reservas = await reservasRes.json();

    algoritmos = new AlgoritmosAsignacion(salas, reservas);

    console.log('✅ Sistema inicializado');
    console.log(`📊 ${salas.length} salas disponibles`);

  } catch (error) {
    console.error('Error al inicializar:', error);
    alert('Error al cargar datos del sistema');
  }
}

document.getElementById('form-asignacion').addEventListener('submit', async (e) => {
  e.preventDefault();

  const codigoAsignatura = document.getElementById('asignatura-codigo').value.trim();
  const nombreAsignatura = document.getElementById('asignatura-nombre').value.trim();
  const dia = document.getElementById('dia').value;
  const horario = document.getElementById('horario').value;
  const numEstudiantes = parseInt(document.getElementById('num-estudiantes').value);
  const margenSeguridad = document.getElementById('margen-seguridad').checked;

  const capacidadNecesaria = margenSeguridad 
    ? Math.ceil(numEstudiantes * 1.1) 
    : numEstudiantes;

  // ⚡ LEER CHECKBOXES CORRECTAMENTE
  const requiereProyector = document.getElementById('req-proyector').checked;
  const requiereComputadores = document.getElementById('req-computadores').checked;

  console.log('📋 Requisitos del usuario:');
  console.log('- Proyector:', requiereProyector);
  console.log('- Computadores:', requiereComputadores);

  const requisitos = {
    codigoAsignatura,
    nombreAsignatura,
    dia,
    horario,
    numEstudiantes,
    capacidadNecesaria,
    requiereProyector,      // ⚡ Asegúrate de que se pase
    requiereComputadores    // ⚡ Asegúrate de que se pase
  };

  await procesarBusqueda(requisitos);
});

async function procesarBusqueda(requisitos) {
  const tiempoInicio = performance.now();

  // El sistema elige automáticamente el mejor algoritmo
  const resultado = algoritmos.busquedaInteligente(requisitos);

  const tiempoFin = performance.now();
  resultado.tiempoProcesamiento = (tiempoFin - tiempoInicio).toFixed(2);
  resultado.requisitos = requisitos;

  resultadoActual = resultado;

  mostrarResultados(resultado);
}

function mostrarResultados(resultado) {
  const panel = document.getElementById('resultados-panel');
  panel.style.display = 'block';
  panel.scrollIntoView({ behavior: 'smooth' });

  // Resumen de búsqueda
  document.getElementById('resumen-busqueda').textContent = 
    `${resultado.requisitos.numEstudiantes} estudiantes - ${resultado.requisitos.dia} ${resultado.requisitos.horario}`;
  
  document.getElementById('tiempo-procesamiento').textContent = 
    `${resultado.tiempoProcesamiento}ms`;

  // Sala recomendada por IA
  const salaRecomendadaDiv = document.getElementById('sala-recomendada');

  if (resultado.mejorOpcion) {
  const sala = resultado.mejorOpcion;
  const ratioOcupacion = ((resultado.requisitos.capacidadNecesaria / sala.capacidad) * 100).toFixed(0);
  
  salaRecomendadaDiv.innerHTML = `
    <div class="recomendacion-badge">
      <span class="ia-icon">🤖</span>
      <span>RECOMENDACIÓN IA</span>
    </div>
    
    <div class="recomendacion-header">
      <h3>🏆 Sala ${sala.numero}</h3>
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
          <span class="value">${sala.capacidad - resultado.requisitos.capacidadNecesaria}</span>
        </div>
      </div>

      <div class="recursos-grid">
        ${sala.tiene_computadores ? '<span class="recurso-badge">💻 Computadores</span>' : ''}
        ${sala.tiene_proyector ? '<span class="recurso-badge">📽️ Proyector</span>' : ''}
        ${!sala.tiene_computadores && !sala.tiene_proyector ? '<span class="recurso-badge">📚 Básica</span>' : ''}
      </div>

      <!-- ⚡ MOSTRAR QUÉ SE SOLICITÓ -->
      <div style="margin-top: 15px; padding: 10px; background: rgba(255,255,255,0.2); border-radius: 8px;">
        <strong>Requisitos solicitados:</strong><br>
        ${resultado.requisitos.requiereComputadores ? '✅ Computadores requeridos' : '➖ Computadores no requeridos'}<br>
        ${resultado.requisitos.requiereProyector ? '✅ Proyector requerido' : '➖ Proyector no requerido'}
      </div>

      ${sala.insights && sala.insights.length > 0 ? `
        <div class="insights-mini">
          <strong>Por qué es la mejor opción:</strong>
          <ul>
            ${sala.insights.slice(0, 3).map(insight => `<li>${insight}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      <button onclick="seleccionarSala(${sala.id}, '${sala.numero}')" class="btn-primary btn-large">
        ✅ Reservar Esta Sala
      </button>
    </div>
  `;
}else {
    salaRecomendadaDiv.innerHTML = `
      <div class="no-results">
        <h3>❌ No se encontraron salas disponibles</h3>
        <p>No hay salas que cumplan con todos los requisitos en este horario.</p>
        <p><strong>Sugerencias:</strong></p>
        <ul>
          <li>Intenta con otro horario</li>
          <li>Reduce el número de estudiantes</li>
          <li>Elimina algunos requisitos de recursos</li>
        </ul>
      </div>
    `;
  }

  // Alternativas
  const alternativasDiv = document.getElementById('alternativas-list');
  
  if (resultado.alternativas && resultado.alternativas.length > 0) {
    let html = '<div class="alternativas-grid">';
    
    resultado.alternativas.forEach((sala, index) => {
      const ratioOcupacion = ((resultado.requisitos.capacidadNecesaria / sala.capacidad) * 100).toFixed(0);
      
      html += `
        <div class="alternativa-card">
          <div class="alternativa-header">
            <h4>Sala ${sala.numero}</h4>
            <span class="score-mini">${sala.scoreFinal?.toFixed(0) || 'N/A'}/100</span>
          </div>
          
          <div class="alternativa-body">
            <div class="alt-info">
              <span>📍 Piso ${sala.piso}</span>
              <span>👥 ${sala.capacidad} personas</span>
              <span>📊 ${ratioOcupacion}% ocupación</span>
            </div>
            
            <div class="alt-recursos">
              ${sala.tiene_computadores ? '<span>💻</span>' : ''}
              ${sala.tiene_proyector ? '<span>📽️</span>' : ''}
            </div>
            
            <button onclick="seleccionarSala(${sala.id}, '${sala.numero}')" class="btn-secondary btn-small">
              Reservar
            </button>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    alternativasDiv.innerHTML = html;
  } else {
    alternativasDiv.innerHTML = '<p class="no-data">No hay otras opciones disponibles</p>';
  }

  // Estadísticas
  mostrarEstadisticas(resultado);
}

function mostrarEstadisticas(resultado) {
  const statsDiv = document.getElementById('stats-content');
  
  const totalSalas = resultado.todasLasSalas?.length || 0;
  const salasOptimas = resultado.todasLasSalas?.filter(s => 
    (s.capacidad / resultado.requisitos.capacidadNecesaria) >= 1 && 
    (s.capacidad / resultado.requisitos.capacidadNecesaria) <= 1.3
  ).length || 0;

  statsDiv.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-number">${totalSalas}</div>
        <div class="stat-label">Salas encontradas</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${salasOptimas}</div>
        <div class="stat-label">Con capacidad óptima</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${resultado.mejorOpcion ? 1 : 0}</div>
        <div class="stat-label">Recomendación IA</div>
      </div>
    </div>
  `;
}

async function seleccionarSala(salaId, salaNumero) {
  if (!resultadoActual) return;

  const sala = resultadoActual.todasLasSalas.find(s => s.id === salaId);
  if (!sala) {
    alert('Error: Sala no encontrada');
    return;
  }

  const requisitos = resultadoActual.requisitos;
  const [horaInicio, horaFin] = requisitos.horario.split('-').map(h => h.trim());

  if (!confirm(`¿Confirmar reserva de Sala ${salaNumero}?`)) return;

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
        scoreAsignacion: sala.scoreFinal
      })
    });

    if (response.ok) {
      alert('✅ Sala reservada exitosamente');
      window.location.href = 'blueprint.html';
    } else {
      const data = await response.json();
      alert('❌ Error: ' + data.error);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('❌ Error de conexión');
  }
}

function irAPerfil() {
  window.location.href = 'perfil.html';
}

function logout() {
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}