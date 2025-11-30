const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const API_URL = '/api';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// BASE DE DATOS EN MEMORIA
// ==========================================
let reservas = [];
let notificaciones = [];
let cancelaciones = [];
let mensajes = [];

// ==========================================
// CONFIGURACIÓN DE PISOS
// ==========================================
const CONFIGURACION_PISOS = {
  1: { 
    nombre: "Primer Piso", 
    salas: [
      { id: 101, numero: '101', tipo: 'sala', capacidad: 40 },
      { id: 102, numero: '102', tipo: 'sala', capacidad: 35 }
    ] 
  },
  2: { 
    nombre: "Segundo Piso", 
    salas: [
      { id: 201, numero: '201', tipo: 'sala', capacidad: 30 },
      { id: 202, numero: '202', tipo: 'laboratorio', capacidad: 25 }
    ] 
  },
  3: { 
    nombre: "Tercer Piso", 
    salas: [
      { id: 301, numero: '301', tipo: 'sala', capacidad: 50 },
      { id: 302, numero: '302', tipo: 'sala', capacidad: 45 }
    ] 
  }
};

// ==========================================
// AUTENTICACIÓN
// ==========================================
app.post(`${API_URL}/auth/login`, async (req, res) => {
  const { email, password } = req.body;
  const emailLower = email.toLowerCase().trim();
  
  // Determinar rol
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
      id: Date.now().toString(), // String para compatibilidad con Supabase
      nombre: usuario.nombre,
      email: emailLower,
      rol: usuario.rol,
      asignaturas: []
    }
  });
});

// ==========================================
// RESERVACIONES
// ==========================================

// Obtener reservas con filtros
app.get(`${API_URL}/reservations`, async (req, res) => {
  const { dia, piso } = req.query;
  let resultado = reservas.filter(r => r.estado === 'confirmada');
  
  if (dia) resultado = resultado.filter(r => r.dia === dia);
  if (piso) resultado = resultado.filter(r => r.piso === parseInt(piso));
  
  res.json(resultado);
});

// Obtener todas las reservas
app.get(`${API_URL}/reservations/todas`, async (req, res) => {
  res.json(reservas);
});

// Obtener reservas de un profesor específico
app.get(`${API_URL}/reservations/profesor/:userId`, async (req, res) => {
  const { userId } = req.params;
  
  const reservasProfesor = reservas.filter(r => 
    String(r.usuarioId) === String(userId) && 
    r.estado === 'confirmada'
  );
  
  res.json({ reservas: reservasProfesor });
});

// Crear nueva reserva
app.post(`${API_URL}/reservations`, async (req, res) => {
  const { salaId, usuarioId, dia, horaInicio, horaFin, asignatura, piso, profesor } = req.body;

  // Validar conflictos
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

// Cancelación Normal (Administrativa)
app.delete(`${API_URL}/reservations/:id`, async (req, res) => {
  const { id } = req.params;
  const { motivo, canceladoPor } = req.body;
  
  const index = reservas.findIndex(r => r.id === parseInt(id));
  if (index === -1) return res.status(404).json({ error: 'Reserva no encontrada' });

  const reserva = reservas[index];
  
  // Registrar cancelación
  cancelaciones.push({
    id: Date.now(),
    reserva_id: parseInt(id),
    fecha_cancelacion: new Date().toISOString(),
    motivo: motivo || 'Sin motivo',
    cancelado_por: canceladoPor || reserva.usuarioId
  });

  // Notificación simple
  notificaciones.push({
    id: Date.now(),
    usuario_id: reserva.usuarioId,
    tipo: 'cancelacion',
    mensaje: `Tu clase de ${reserva.asignatura?.nombre || 'la asignatura'} ha sido cancelada`,
    leido: false,
    fecha: new Date().toISOString()
  });

  reservas.splice(index, 1);
  res.json({ success: true });
});

// Cancelar con Aviso (Para Profesores)
app.delete(`${API_URL}/reservations/:id/cancelar-con-aviso`, async (req, res) => {
  const { id } = req.params;
  const { motivo, canceladoPor, asignatura, dia, horario, sala, profesor } = req.body;
  
  const index = reservas.findIndex(r => r.id === parseInt(id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Reserva no encontrada' });
  }

  const reserva = reservas[index];
  
  // Registrar cancelación
  cancelaciones.push({
    id: Date.now(),
    reserva_id: parseInt(id),
    fecha_cancelacion: new Date().toISOString(),
    motivo: motivo || 'Sin motivo',
    cancelado_por: canceladoPor,
    asignatura: reserva.asignatura
  });

  // Crear mensaje para TODOS los estudiantes
  const mensaje = {
    id: Date.now(),
    destinatarioId: 'todos', 
    tipo: 'cancelacion',
    asignatura,
    dia,
    horario,
    sala: `Sala ${sala}`,
    motivo,
    profesor,
    fecha: new Date().toISOString(),
    leido: false
  };
  
  mensajes.push(mensaje);

  // Eliminar reserva
  reservas.splice(index, 1);

  res.json({ 
    success: true, 
    mensaje: 'Clase cancelada y avisos enviados',
    mensajesEnviados: 1 
  });
});

// ==========================================
// SALAS Y BÚSQUEDA
// ==========================================
app.get(`${API_URL}/salas/todas`, async (req, res) => {
  const todasLasSalas = [];
  try {
    Object.keys(CONFIGURACION_PISOS).forEach(piso => {
      const config = CONFIGURACION_PISOS[piso];
      if (config.salas) {
        const salasDelPiso = config.salas
          .filter(s => s.tipo === 'sala' || s.tipo === 'laboratorio')
          .map(s => ({ ...s, piso: parseInt(piso) }));
        todasLasSalas.push(...salasDelPiso);
      }
    });
    res.json(todasLasSalas);
  } catch (error) {
    console.error("Error al obtener salas:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

app.post(`${API_URL}/search/salas/inteligente`, async (req, res) => {
  // Simulación de algoritmo
  const salasDisponibles = [
    { id: 101, numero: '101', capacidad: 40, tiene_computadores: true, tiene_proyector: true, piso: 1, score: 95 },
    { id: 201, numero: '201', capacidad: 30, tiene_computadores: false, tiene_proyector: true, piso: 2, score: 85 }
  ];
  res.json({ salas: salasDisponibles, algoritmo: 'heuristica_v1' });
});

// ==========================================
// MENSAJES Y NOTIFICACIONES
// ==========================================

// Obtener mensajes de un usuario (Incluye mensajes para 'todos')
app.get(`${API_URL}/mensajes/:userId`, async (req, res) => {
  const { userId } = req.params;
  
  const userMensajes = mensajes
    .filter(m => String(m.destinatarioId) === String(userId) || m.destinatarioId === 'todos')
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  
  res.json({ mensajes: userMensajes });
});

// Contar mensajes no leídos
app.get(`${API_URL}/notifications/:userId/count`, async (req, res) => {
  const { userId } = req.params;
  
  const count = mensajes.filter(m => 
    (String(m.destinatarioId) === String(userId) || m.destinatarioId === 'todos') && !m.leido
  ).length;
  
  res.json({ count });
});

// Marcar mensaje individual como leído
app.patch(`${API_URL}/mensajes/:id/leer`, async (req, res) => {
  const { id } = req.params;
  
  const mensaje = mensajes.find(m => m.id === parseInt(id));
  if (mensaje) {
    mensaje.leido = true;
  }
  
  res.json({ success: true });
});

// Marcar todos los mensajes como leídos
app.patch(`${API_URL}/mensajes/:userId/leer-todos`, async (req, res) => {
  const { userId } = req.params;
  
  mensajes
    .filter(m => String(m.destinatarioId) === String(userId) || m.destinatarioId === 'todos')
    .forEach(m => m.leido = true);
  
  res.json({ success: true });
});

// Compatibilidad con sistema antiguo de notificaciones
app.get(`${API_URL}/notifications/:userId`, async (req, res) => {
  const { userId } = req.params;
  const userNotif = notificaciones.filter(n => String(n.usuario_id) === String(userId));
  res.json({ notificaciones: userNotif });
});

// ==========================================
// CANCELACIONES E HISTORIAL
// ==========================================
app.get(`${API_URL}/cancelaciones`, async (req, res) => {
  res.json({ cancelaciones });
});

// Obtener cancelaciones de un usuario específico
app.get(`${API_URL}/cancelaciones/usuario/:userId`, async (req, res) => {
  const { userId } = req.params;
  const userCancelaciones = cancelaciones.filter(c => 
    String(c.cancelado_por) === String(userId)
  );
  res.json({ cancelaciones: userCancelaciones });
});

// ==========================================
// HORARIO Y ANALÍTICA
// ==========================================
app.get(`${API_URL}/schedule/:userId`, async (req, res) => {
  const { userId } = req.params;
  const horario = reservas
    .filter(r => String(r.usuarioId) === String(userId) && r.estado === 'confirmada')
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

app.get(`${API_URL}/analytics/heatmap`, async (req, res) => {
  res.json({ 
    heatmap: {
      piso1: { uso: 75, tendencia: 'alta' },
      piso2: { uso: 90, tendencia: 'alta' },
      piso3: { uso: 60, tendencia: 'media' }
    }
  });
});

app.get(`${API_URL}/analytics/prediccion`, async (req, res) => {
  res.json({ 
    predicciones: [
      { dia: 'martes', hora: '11:00', demanda: 'alta', recurso: 'proyector' },
      { dia: 'jueves', hora: '14:00', demanda: 'media', recurso: 'computadores' }
    ]
  });
});

// ==========================================
// ADMIN
// ==========================================
app.get(`${API_URL}/admin/stats`, async (req, res) => {
  const totalReservas = reservas.filter(r => r.estado === 'confirmada').length;
  const totalSalas = Object.values(CONFIGURACION_PISOS)
    .reduce((acc, piso) => acc + (piso.salas?.filter(s => s.tipo === 'sala').length || 0), 0);
  
  const salasOcupadas = [...new Set(reservas.map(r => r.salaId))].length;
  const ocupacionPromedio = totalSalas > 0 ? ((salasOcupadas / totalSalas) * 100).toFixed(1) : 0;

  res.json({
    totalReservas,
    totalSalas,
    salasDisponibles: totalSalas - salasOcupadas,
    ocupacionPromedio
  });
});

app.get(`${API_URL}/admin/reservas`, async (req, res) => {
  res.json({ reservas });
});

// ==========================================
// HEALTH CHECK
// ==========================================
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    reservas: reservas.length,
    mensajes: mensajes.length
  });
});

// ==========================================
// EXPORT Y SERVER
// ==========================================
module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📡 API disponible en http://localhost:${PORT}${API_URL}`);
  });
}