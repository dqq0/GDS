const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Función para determinar rol según dominio
function asignarRolPorDominio(email) {
  if (email.endsWith('@academicos.uta.cl')) {
    return 'profesor';
  } else if (email.endsWith('@alumnos.uta.cl')) {
    return 'alumno';
  } else if (email.endsWith('@ayudantes.uta.cl')) {
    return 'ayudante';
  }
  return 'alumno'; // Default
}

// POST - Callback de Google Auth
router.post('/google-callback', async (req, res) => {
  const { user } = req.body;

  try {
    const email = user.email;
    const rol = asignarRolPorDominio(email);

    // Verificar si el usuario ya existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      // Usuario existente
      return res.json({
        user: {
          id: existingUser.id,
          nombre: existingUser.nombre,
          email: existingUser.email,
          rol: existingUser.rol
        }
      });
    }

    // Crear nuevo usuario
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          nombre: user.user_metadata.full_name || email.split('@')[0],
          rol,
          avatar: user.user_metadata.avatar_url
        }
      ])
      .select()
      .single();

    if (error) throw error;

    res.json({
      user: {
        id: newUser.id,
        nombre: newUser.nombre,
        email: newUser.email,
        rol: newUser.rol
      }
    });
  } catch (error) {
    console.error('Error en Google callback:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST - Login tradicional (mantener para testing)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();

    if (error || !data) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    res.json({
      user: {
        id: data.id,
        nombre: data.nombre,
        email: data.email,
        rol: data.rol
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;