const API_URL = '/api';

document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('error-message');

  errorDiv.style.display = 'none';

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.user.rol === 'profesor' || data.user.rol === 'ayudante') {
        window.location.href = 'blueprint.html';
      } else {
        window.location.href = 'schedule.html';
      }
    } else {
      mostrarError(data.error || 'Error al iniciar sesión');
    }
  } catch (error) {
    mostrarError('Error de conexión con el servidor');
  }
});

document.getElementById('btn-google')?.addEventListener('click', async () => {
  mostrarError('Funcionalidad de Google Auth próximamente.');
});

function mostrarError(mensaje) {
  const errorDiv = document.getElementById('error-message');
  if (errorDiv) {
    errorDiv.textContent = mensaje;
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 5000);
  }
}

function logout() {
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

window.addEventListener('load', () => {
  const userStr = localStorage.getItem('user');
  if (userStr && window.location.pathname.endsWith('index.html')) {
    const user = JSON.parse(userStr);
    if (user.rol === 'profesor' || user.rol === 'ayudante') {
      window.location.href = 'blueprint.html';
    } else {
      window.location.href = 'schedule.html';
    }
  }
});