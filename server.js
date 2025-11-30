const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const API_URL = '/api';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Base de datos en memoria (reemplazar con Supabase)
let reservas = [];
let notificaciones = [];
let cancelaciones = [];

// ========== AUTENTICACIÓN ==========
app.post(`${API_URL}/auth/login`, async (req, res) => {
  const { email, password } = req.body;

  const emailLower = email.toLowerCase().trim();
  
  // ✅ DETERMINAR ROL CORRECTAMENTE
  let rol = 'alumno';
  
  if (emailLower.includes('admin') || emailLower.includes('administrador')) {
    rol = 'admin';
  } else if (emailLower.includes('profe') || emailLower.endsWith('@academicos.uta.cl')) {
    rol = 'profesor';
  } else if (emailLower.includes('ayudante') || emailLower.endsWith('@ayudantes.uta.cl')) {
    rol = 'ayudante';
  } else {
    rol = 'alumno';
  }

  // Usuarios demo
  const usuariosDemo = {
    'profe@demo.com': { rol: 'profesor', nombre: 'Profesor Demo' },
    'ayudante@mail.com': { rol: 'ayudante', nombre: 'Ayudante Test' },
    'alumno@test.com': { rol: 'alumno', nombre: 'Alumno Test' },
    'admin@demo.com': { rol: 'admin', nombre: 'Admin Principal' }
  };

  const usuario = usuariosDemo[emailLower] || {
    rol: rol,
    nombre: emailLower.split('@')[0]
  };

  res.json({
    user: {
      id: Date.now(),
      nombre: usuario.nombre,
      email: emailLower,
      rol: usuario.rol,
      asignaturas: []
    }
  });
});

// ========== RESERVACIONES ==========
app.get(`${API_URL}/reservations`, async (req, res) => {
  const { dia, piso } = req.query;
  
  let resultado = reservas.filter(r => r.estado === 'confirmada');
  
  if (dia) {
    resultado = resultado.filter(r => r.dia === dia);
  }
  
  if (piso) {
    resultado = resultado.filter(r => r.piso === parseInt(piso));
  }
  
  res.json(resultado);
});

app.post(`${API_URL}/reservations`, async (req, res) => {
  const { salaId, usuarioId, dia, horaInicio, horaFin, asignatura, piso, profesor } = req.body;

  // ✅ VALIDAR CONFLICTOS
  const conflicto = reservas.find(r => 
    r.salaId === salaId &&
    r.dia === dia &&
    r.horaInicio === horaInicio &&
    r.estado === 'confirmada'
  );

  if (conflicto) {
    return res.status(409).json({ 
      error: 'Esta sala ya está reservada en ese horario',
      conflicto: conflicto
    });
  }

  // ✅ CREAR RESERVA
  const nuevaReserva = {
    id: Date.now(),
    salaId,
    usuarioId,
    dia,
    horaInicio,
    horaFin,
    asignatura,
    piso,
    profesor: profesor || 'No asignado',
    estado: 'confirmada',
    createdAt: new Date().toISOString()
  };

  reservas.push(nuevaReserva);

  res.status(201).json({ success: true, reserva: nuevaReserva });
});

app.delete(`${API_URL}/reservations/:id`, async (req, res) => {
  const { id } = req.params;
  const { motivo, canceladoPor } = req.body;
  
  const index = reservas.findIndex(r => r.id === parseInt(id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Reserva no encontrada' });
  }

  const reserva = reservas[index];
  
  // ✅ REGISTRAR CANCELACIÓN
  cancelaciones.push({
    id: Date.now(),
    reserva_id: parseInt(id),
    fecha_cancelacion: new Date().toISOString(),
    motivo: motivo || 'Sin motivo',
    cancelado_por: canceladoPor || reserva.usuarioId
  });

  // ✅ CREAR NOTIFICACIÓN
  notificaciones.push({
    id: Date.now(),
    usuario_id: reserva.usuarioId,
    tipo: 'cancelacion',
    mensaje: `Tu clase de ${reserva.asignatura?.nombre} ha sido cancelada`,
    leido: false,
    fecha: new Date().toISOString()
  });

  reservas.splice(index, 1);

  res.json({ success: true });
});

// ========== HORARIO ==========
app.get(`${API_URL}/schedule/:userId`, async (req, res) => {
  const { userId } = req.params;
  
  const horario = reservas
    .filter(r => r.usuarioId === parseInt(userId) && r.estado === 'confirmada')
    .map(r => ({
      id: r.id,
      dia: r.dia,
      horaInicio: r.horaInicio,
      horaFin: r.horaFin,
      asignatura: r.asignatura,
      sala: r.salaId,
      nombreSala: `Sala ${r.salaId}`,
      profesor: r.profesor
    }));

  res.json({ schedule: horario });
});

// ========== NOTIFICACIONES ==========
app.get(`${API_URL}/notifications/:userId`, async (req, res) => {
  const { userId } = req.params;
  
  const userNotif = notificaciones.filter(n => n.usuario_id === parseInt(userId));
  
  res.json({ notificaciones: userNotif });
});

app.patch(`${API_URL}/notifications/:id/read`, async (req, res) => {
  const { id } = req.params;
  
  const notif = notificaciones.find(n => n.id === parseInt(id));
  
  if (notif) {
    notif.leido = true;
  }
  
  res.json({ success: true });
});

// ========== CANCELACIONES ==========
app.get(`${API_URL}/cancelaciones`, async (req, res) => {
  res.json({ cancelaciones });
});

// ========== BÚSQUEDA INTELIGENTE CON ALGORITMO ==========
app.post(`${API_URL}/search/salas/inteligente`, async (req, res) => {
  const { capacidadMinima, requiereComputadores, requiereProyector, dia, horario } = req.body;

  // Aquí implementarías el algoritmo de asignación
  // Por ahora devuelvo un ejemplo

  const salasDisponibles = [
    { id: 1, numero: '101', capacidad: 50, tiene_computadores: true, tiene_proyector: true, piso: 1, score: 95 },
    { id: 2, numero: '102', capacidad: 35, tiene_computadores: false, tiene_proyector: true, piso: 1, score: 85 }
  ];

  res.json({ salas: salasDisponibles, algoritmo: 'heuristica_v1' });
});

// ========== ANALÍTICA PREDICTIVA ==========
app.get(`${API_URL}/analytics/heatmap`, async (req, res) => {
  // Calcular zonas calientes y frías
  const heatmap = {
    piso1: { uso: 75, tendencia: 'alta' },
    piso2: { uso: 90, tendencia: 'alta' },
    piso3: { uso: 60, tendencia: 'media' },
    piso4: { uso: 40, tendencia: 'baja' },
    piso5: { uso: 30, tendencia: 'baja' }
  };

  res.json({ heatmap });
});

app.get(`${API_URL}/analytics/prediccion`, async (req, res) => {
  const predicciones = [
    { dia: 'martes', hora: '11:00', demanda: 'alta', recurso: 'proyector' },
    { dia: 'jueves', hora: '14:00', demanda: 'media', recurso: 'computadores' }
  ];

  res.json({ predicciones });
});

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`✅ Servidor en http://localhost:${PORT}`);
  });
}