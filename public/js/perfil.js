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
  await cargarNotificaciones();
};

function cargarInfoUsuario() {
  const infoDiv = document.getElementById('info-usuario');
  
  infoDiv.innerHTML = `
    <p><strong>Nombre:</strong> ${currentUser.nombre}</p>
    <p><strong>Email:</strong> ${currentUser.email}</p>
    <p><strong>Rol:</strong> <span class="badge-rol">${currentUser.rol}</span></p>
  `;
}

async function cargarNotificaciones() {
  try {
    const response = await fetch(`${API_URL}/notifications/${currentUser.id}`);
    const data = await response.json();

    const notificaciones = data.notificaciones || [];
    const noLeidas = notificaciones.filter(n => !n.leido).length;

    document.getElementById('badge-notif').textContent = noLeidas;

    const lista = document.getElementById('lista-notificaciones');

    if (notificaciones.length === 0) {
      lista.innerHTML = '<p class="no-data">No tienes notificaciones</p>';
      return;
    }

    let html = '';
    notificaciones.forEach(notif => {
      html += `
        <div class="notif-item ${notif.leido ? 'leida' : 'no-leida'}">
          <div class="notif-header">
            <span class="notif-tipo">${notif.tipo}</span>
            <span class="notif-fecha">${new Date(notif.fecha).toLocaleString()}</span>
          </div>
          <p>${notif.mensaje}</p>
          ${!notif.leido ? `<button onclick="marcarLeida(${notif.id})" class="btn-small">Marcar como leída</button>` : ''}
        </div>
      `;
    });

    lista.innerHTML = html;
  } catch (error) {
    console.error('Error al cargar notificaciones:', error);
  }
}

async function marcarLeida(id) {
  try {
    await fetch(`${API_URL}/notifications/${id}/read`, {
      method: 'PATCH'
    });

    await cargarNotificaciones();
  } catch (error) {
    console.error('Error:', error);
  }
}

function logout() {
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}