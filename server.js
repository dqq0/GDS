const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const API_URL = '/api';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ========== RUTAS DE AUTENTICACIÓN ==========

app.post(`${API_URL}/auth/login`, async (req, res) => {
  const { email, password } = req.body;

  // TODO: Aquí deberías validar contra Supabase
  // Por ahora mantengo tu lógica pero limpia
  
  let rol = 'alumno';
  if (email.endsWith('@academicos.uta.cl')) rol = 'profesor';
  else if (email.endsWith('@ayudantes.uta.cl')) rol = 'ayudante';
  else if (email.endsWith('@alumnos.uta.cl')) rol = 'alumno';

  res.json({
    user: {
      id: 1,
      nombre: email.split('@')[0],
      email: email,
      rol: rol
    }
  });
});

// ========== RUTAS DE SALAS ==========

app.get(`${API_URL}/salas`, async (req, res) => {
  // TODO: Conectar a Supabase
  res.json([]);
});

// ========== RUTAS DE RESERVACIONES ==========

app.get(`${API_URL}/reservations`, async (req, res) => {
  const { dia, piso } = req.query;
  
  // TODO: Conectar a Supabase con filtros
  res.json([]);
});

app.post(`${API_URL}/reservations`, async (req, res) => {
  const { salaId, usuarioId, dia, horaInicio, horaFin, asignatura } = req.body;

  // TODO: Validar conflictos en Supabase
  
  const nuevaReserva = {
    id: Date.now(),
    salaId,
    usuarioId,
    dia,
    horaInicio,
    horaFin,
    asignatura,
    estado: 'confirmada',
    createdAt: new Date().toISOString()
  };

  res.status(201).json({ success: true, reserva: nuevaReserva });
});

app.delete(`${API_URL}/reservations/:id`, async (req, res) => {
  // TODO: Eliminar de Supabase
  res.json({ success: true });
});

// ========== RUTA DE HORARIO ==========

app.get(`${API_URL}/schedule/:userId`, async (req, res) => {
  // TODO: Obtener de Supabase
  res.json({ schedule: [] });
});

// ========== BÚSQUEDA INTELIGENTE ==========

app.post(`${API_URL}/search/salas`, async (req, res) => {
  const { capacidadMinima, requiereComputadores, requiereProyector, piso, dia, horario } = req.body;

  // TODO: Implementar búsqueda en Supabase
  res.json({ total: 0, salas: [] });
});

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`✅ Servidor en http://localhost:${PORT}`);
  });
}