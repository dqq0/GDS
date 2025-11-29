const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// --------------------------------------------------------------------------
// CONFIGURACIÓN SUPABASE (BACKEND)
// --------------------------------------------------------------------------
// IMPORTANTE: Aquí debes usar la 'SERVICE_ROLE_KEY' (no la anon key)
// Esto permite al backend saltarse las reglas RLS para asignar roles.
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY 
);

// --------------------------------------------------------------------------
// UTILIDAD: Asignar Rol
// --------------------------------------------------------------------------
function asignarRolPorDominio(email) {
  if (!email) return 'alumno'; 
  
  if (email.endsWith('@academicos.uta.cl')) {
    return 'profesor';
  } else if (email.endsWith('@alumnos.uta.cl')) {
    return 'alumno';
  } else if (email.endsWith('@ayudantes.uta.cl')) {
    return 'ayudante';
  }
  return 'alumno'; // Default
}

// --------------------------------------------------------------------------
// ROUTE: Procesar Login con Google
// --------------------------------------------------------------------------
router.post('/google-callback', async (req, res) => {
  try {
    // 1. Recibimos la sesión completa desde el frontend
    const { session } = req.body;

    // Validación básica
    if (!session || !session.access_token) {
      return res.status(400).json({ error: 'Falta el token de acceso' });
    }

    // 2. SEGURIDAD: Verificar el token directamente con Supabase
    // Esto evita que alguien falsifique el correo enviando un JSON falso.
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(session.access_token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Token inválido o sesión expirada' });
    }

    // 3. Verificar si el usuario ya existe en tu tabla 'users'
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id) // Buscamos por ID de Auth (más seguro que email)
      .single();

    // CASO A: Usuario ya registrado -> Devolvemos sus datos
    if (existingUser) {
      return res.json({
        message: 'Login exitoso',
        user: existingUser
      });
    }

    // CASO B: Usuario Nuevo -> Lo creamos
    const email = user.email;
    const rol = asignarRolPorDominio(email);
    const nombre = user.user_metadata.full_name || email.split('@')[0];
    const avatar = user.user_metadata.avatar_url || '';

    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert([
        {
          id: user.id, // Vinculamos ID de Auth con tu tabla
          email,
          nombre,
          rol,
          avatar
        }
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    // Retornamos el nuevo usuario
    res.json({
      message: 'Usuario creado exitosamente',
      user: newUser
    });

  } catch (error) {
    console.error('Error en Google callback:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// --------------------------------------------------------------------------
// ROUTE: Login Tradicional (Opcional/Legacy)
// --------------------------------------------------------------------------
// Nota: Si usas Supabase Auth, idealmente no deberías usar un login propio de passwords,
// pero lo dejo aquí por si lo usas para pruebas locales.
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password) // Nota: Esto guarda pass en texto plano (Inseguro para prod)
      .single();

    if (error || !data) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    res.json({ user: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;