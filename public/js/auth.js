const API_URL = 'http://localhost:3000/api';

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('error-message');

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // Guardar usuario en localStorage
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirigir según rol
      if (data.user.rol === 'profesor' || data.user.rol === 'ayudante') {
        window.location.href = 'blueprint.html';
      } else {
        window.location.href = 'schedule.html';
      }
    } else {
      errorDiv.textContent = data.error;
      errorDiv.style.display = 'block';
    }
  } catch (error) {
    errorDiv.textContent = 'Error de conexión';
    errorDiv.style.display = 'block';
  }
});