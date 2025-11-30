const API_URL = '/api';
let currentUser = null;

window.onload = async () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    window.location.href = 'index.html';
    return;
  }

  currentUser = JSON.parse(userStr);
  document.getElementById('user-name').textContent = `👤 ${currentUser.nombre}`;

  cargarInfoUsuario();
  await cargarMensajes();
  await cargarNotificaciones();
  await cargarHistorialCancelaciones();

  // Mostrar panel de envío de mensajes solo para profesores
  if (currentUser.rol === 'profesor' || currentUser.rol === 'ayudante') {
    document.getElementById('panel-enviar-mensaje').style.display = 'block';
    await cargarClasesProfesor();
  }
};

function cargarInfoUsuario() {
  const infoDiv = document.getElementById('info-usuario');
  
  infoDiv.innerHTML = `
    <p><strong>Nombre:</strong> ${currentUser.nombre}</p>
    <p><strong>Email:</strong> ${currentUser.email}</p>
    <p><strong>Rol:</strong> <span class="badge-rol">${currentUser.rol}</span></p>
  `;
}

async function cargarMensajes() {
  try {
    const response = await fetch(`${API_URL}/mensajes/${currentUser.id}`);
    const data = await response.json();

    const mensajes = data.mensajes || [];
    const lista = document.getElementById('lista-mensajes');

    if (mensajes.length === 0) {
      lista.innerHTML = '<p class="no-data">📭 No tienes mensajes</p>';
      return;
    }

    let html = '';
    mensajes.forEach(mensaje => {
      html += `
        <div class="mensaje-item ${mensaje.leido ? 'leido' : 'no-leido'}">
          ${!mensaje.leido ? '<span class="badge-nuevo">NUEVO</span>' : ''}
          
          <div class="mensaje-header">
            <span class="mensaje-tipo">Cancelación de Clase</span>
            <span class="mensaje-fecha">${new Date(mensaje.fecha).toLocaleString('es-ES')}</span>
          </div>

          <div class="mensaje-contenido">
            <p class="mensaje-clase">
              📚 ${mensaje.asignatura?.nombre} (${mensaje.asignatura?.codigo})
            </p>
            <p><strong>Día:</strong> ${mensaje.dia} | <strong>Horario:</strong> ${mensaje.horario}</p>
            <p><strong>Sala:</strong> ${mensaje.sala}</p>
            
            <div class="mensaje-motivo">
              <strong>Motivo:</strong> ${mensaje.motivo}
            </div>

            <p class="mensaje-profesor">
              👨🏫 Profesor: ${mensaje.profesor}
            </p>
          </div>

          ${!mensaje.leido ? `
            <button onclick="marcarMensajeLeido(${mensaje.id})" class="btn-primary btn-small">
              Marcar como leído
            </button>
          ` : ''}
        </div>
      `;
    });

    lista.innerHTML = html;
  } catch (error) {
    console.error('Error al cargar mensajes:', error);
  }
}

async function marcarMensajeLeido(id) {
  try {
    await fetch(`${API_URL}/mensajes/${id}/leer`, {
      method: 'PATCH'
    });
    await cargarMensajes();
  } catch (error) {
    console.error('Error:', error);
  }
}

async function marcarTodosLeidos() {
  try {
    await fetch(`${API_URL}/mensajes/${currentUser.id}/leer-todos`, {
      method: 'PATCH'
    });
    await cargarMensajes();
    alert('✅ Todos los mensajes marcados como leídos');
  } catch (error) {
    console.error('Error:', error);
  }
}

async function cargarNotificaciones() {
  try {
    const response = await fetch(`${API_URL}/notifications/${currentUser.id}`);
    const data = await response.json();

    const notificaciones = data.notificaciones || [];
    const lista = document.getElementById('lista-notificaciones');

    if (notificaciones.length === 0) {
      lista.innerHTML = '<p class="no-data">No tienes notificaciones del sistema</p>';
      return;
    }

    let html = '';
    notificaciones.forEach(notif => {
      html += `
        <div class="notif-item ${notif.leido ? 'leida' : 'no-leida'}">
          <div class="notif-header">
            <span class="notif-tipo">${notif.tipo}</span>
            <span class="notif-fecha">${new Date(notif.fecha).toLocaleString('es-ES')}</span>
          </div>
          <p>${notif.mensaje}</p>
          ${!notif.leido ? `<button onclick="marcarNotifLeida(${notif.id})" class="btn-small btn-primary">Marcar como leída</button>` : ''}
        </div>
      `;
    });

    lista.innerHTML = html;
  } catch (error) {
    console.error('Error al cargar notificaciones:', error);
  }
}

async function marcarNotifLeida(id) {
  try {
    await fetch(`${API_URL}/notifications/${id}/read`, {
      method: 'PATCH'
    });
    await cargarNotificaciones();
  } catch (error) {
    console.error('Error:', error);
  }
}

async function cargarHistorialCancelaciones() {
  try {
    const response = await fetch(`${API_URL}/cancelaciones/usuario/${currentUser.id}`);
    const data = await response.json();

    const cancelaciones = data.cancelaciones || [];
    const historial = document.getElementById('historial-cancelaciones');

    if (cancelaciones.length === 0) {
      historial.innerHTML = '<p class="no-data">No hay cancelaciones en tu historial</p>';
      return;
    }

    let html = `
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Clase</th>
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
    historial.innerHTML = html;
  } catch (error) {
    console.error('Error:', error);
  }
}

// PARA PROFESORES: Cargar sus clases
async function cargarClasesProfesor() {
  try {
    const response = await fetch(`${API_URL}/reservations/profesor/${currentUser.id}`);
    const data = await response.json();

    const reservas = data.reservas || [];
    const select = document.getElementById('clase-select');

    if (reservas.length === 0) {
      select.innerHTML = '<option value="">No tienes clases programadas</option>';
      return;
    }

    let html = '<option value="">Selecciona una clase...</option>';
    reservas.forEach(reserva => {
      html += `
        <option value="${reserva.id}" 
                data-asignatura='${JSON.stringify(reserva.asignatura)}'
                data-dia="${reserva.dia}"
                data-horario="${reserva.horaInicio}-${reserva.horaFin}"
                data-sala="${reserva.salaId}">
          ${reserva.asignatura?.nombre} - ${reserva.dia} ${reserva.horaInicio}
        </option>
      `;
    });

    select.innerHTML = html;
  } catch (error) {
    console.error('Error:', error);
  }
}

// ENVIAR MENSAJE DE CANCELACIÓN
document.getElementById('form-enviar-mensaje')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const select = document.getElementById('clase-select');
  const reservaId = select.value;
  const option = select.options[select.selectedIndex];
  
  if (!reservaId) {
    alert('Debes seleccionar una clase');
    return;
  }

  const asignatura = JSON.parse(option.dataset.asignatura);
  const dia = option.dataset.dia;
  const horario = option.dataset.horario;
  const sala = option.dataset.sala;
  const motivo = document.getElementById('motivo-cancelacion').value.trim();

  if (!confirm('¿Estás seguro de cancelar esta clase y enviar avisos a los estudiantes?')) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/reservations/${reservaId}/cancelar-con-aviso`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        motivo,
        canceladoPor: currentUser.id,
        asignatura,
        dia,
        horario,
        sala,
        profesor: currentUser.nombre
      })
    });

    if (response.ok) {
      alert('✅ Clase cancelada y avisos enviados a los estudiantes');
      document.getElementById('form-enviar-mensaje').reset();
      await cargarClasesProfesor();
    } else {
      const data = await response.json();
      alert('❌ Error: ' + data.error);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('❌ Error de conexión');
  }
});

function logout() {
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}