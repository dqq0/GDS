const API_URL = '/api';

// ========== LOGIN TRADICIONAL ==========
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('error-message');

  // Limpiar error previo
  errorDiv.style.display = 'none';

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // Guardar usuario
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirigir según rol
      if (data.user.rol === 'profesor' || data.user.rol === 'ayudante') {
        window.location.href = 'blueprint.html';
      } else {
        window.location.href = 'schedule.html';
      }
    } else {
      mostrarError(data.error || 'Error al iniciar sesión');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarError('Error de conexión con el servidor');
  }
});

// ========== LOGIN CON GOOGLE ==========
document.getElementById('btn-google')?.addEventListener('click', async () => {
  mostrarError('Funcionalidad de Google Auth próximamente. Use login tradicional por ahora.');
  
  // TODO: Implementar Supabase Auth cuando esté configurado
  // const { createClient } = supabase;
  // const supabase = createClient('URL', 'KEY');
  // await supabase.auth.signInWithOAuth({ provider: 'google' });
});

// ========== FUNCIÓN AUXILIAR ==========
function mostrarError(mensaje) {
  const errorDiv = document.getElementById('error-message');
  if (errorDiv) {
    errorDiv.textContent = mensaje;
    errorDiv.style.display = 'block';
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 5000);
  }
}

// ========== LOGOUT ==========
function logout() {
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

// ========== VERIFICAR SI YA HAY SESIÓN ==========
window.addEventListener('load', () => {
  const userStr = localStorage.getItem('user');
  if (userStr && window.location.pathname.endsWith('index.html')) {
    const user = JSON.parse(userStr);
    // Si ya está logueado, redirigir
    if (user.rol === 'profesor' || user.rol === 'ayudante') {
      window.location.href = 'blueprint.html';
    } else {
      window.location.href = 'schedule.html';
    }
  }
});