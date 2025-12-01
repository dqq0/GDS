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
// CONFIGURACIÓN DE PISOS (ACTUALIZADA)
// ==========================================
const CONFIGURACION_PISOS = {
  1: { 
    nombre: "Primer Piso", 
    salas: [
      { id: 105, numero: '105', tipo: 'sala', capacidad: 20, tiene_computadores: false, tiene_proyector: false, utilidad: 'Sala de clases estándar', nombre: 'Sala 105' },
      { id: 101, numero: '101', tipo: 'sala', capacidad: 25, tiene_computadores: true, tiene_proyector: true, utilidad: 'Laboratorio de computación', nombre: 'Sala 101' },
      { id: 103, numero: '103', tipo: 'sala', capacidad: 25, tiene_computadores: true, tiene_proyector: true, utilidad: 'Laboratorio de computación', nombre: 'Sala 103' },
      { id: 104, numero: '104', tipo: 'sala', capacidad: 20, tiene_computadores: false, tiene_proyector: true, utilidad: 'Sala con proyector', nombre: 'Sala 104' },
      { id: 102, numero: '102', tipo: 'sala', capacidad: 20, tiene_computadores: false, tiene_proyector: true, utilidad: 'Sala con proyector', nombre: 'Sala 102' },
      { id: 106, numero: '106', tipo: 'sala', capacidad: 20, tiene_computadores: false, tiene_proyector: true, utilidad: 'Sala con proyector', nombre: 'Sala 106' }
    ] 
  },
  2: { 
    nombre: "Segundo Piso", 
    salas: [
      { id: 209, numero: '209', tipo: 'sala', capacidad: 30, tiene_computadores: true, tiene_proyector: true, utilidad: 'Laboratorio de computación', nombre: 'Sala 209' },
      { id: 207, numero: '207', tipo: 'sala', capacidad: 30, tiene_computadores: true, tiene_proyector: true, utilidad: 'Laboratorio de computación', nombre: 'Sala 207' },
      { id: 205, numero: '205', tipo: 'sala', capacidad: 30, tiene_computadores: true, tiene_proyector: true, utilidad: 'Laboratorio de computación', nombre: 'Sala 205' },
      { id: 203, numero: '203', tipo: 'sala', capacidad: 35, tiene_computadores: false, tiene_proyector: true, utilidad: 'Sala con proyector', nombre: 'Sala 203' },
      { id: 210, numero: '210', tipo: 'sala', capacidad: 35, tiene_computadores: false, tiene_proyector: true, utilidad: 'Sala con proyector', nombre: 'Sala 210' },
      { id: 208, numero: '208', tipo: 'sala', capacidad: 35, tiene_computadores: true, tiene_proyector: true, utilidad: 'Laboratorio de computación', nombre: 'Sala 208' },
      { id: 204, numero: '204', tipo: 'sala', capacidad: 15, tiene_computadores: true, tiene_proyector: true, utilidad: 'Laboratorio de computación', nombre: 'Sala 204' },
      { id: 201, numero: '201', tipo: 'sala', capacidad: 30, tiene_computadores: false, tiene_proyector: true, utilidad: 'Sala con proyector', nombre: 'Sala 201' }
    ] 
  },
  3: { 
    nombre: "Tercer Piso", 
    salas: [
      { id: 308, numero: '308', tipo: 'sala', capacidad: 40, tiene_computadores: false, tiene_proyector: true, utilidad: 'Pizarra digital, Proyector', nombre: 'Sala 308' },
      { id: 307, numero: '307', tipo: 'sala', capacidad: 30, tiene_computadores: false, tiene_proyector: true, utilidad: 'Pizarra, 30 sillas', nombre: 'Sala 307' },
      { id: 306, numero: '306', tipo: 'sala', capacidad: 35, tiene_computadores: false, tiene_proyector: true, utilidad: 'Proyector, Audio', nombre: 'Sala 306' },
      { id: 305, numero: '305', tipo: 'sala', capacidad: 25, tiene_computadores: true, tiene_proyector: true, utilidad: '20 Computadores', nombre: 'Sala 305' },
      { id: 304, numero: '304', tipo: 'sala', capacidad: 30, tiene_computadores: true, tiene_proyector: true, utilidad: '25 Computadores, Impresora', nombre: 'Sala 304' },
      { id: 303, numero: '303', tipo: 'sala', capacidad: 40, tiene_computadores: false, tiene_proyector: true, utilidad: 'Proyector 4K, Audio envolvente', nombre: 'Sala 303' },
      { id: 310, numero: '310', tipo: 'sala', capacidad: 15, tiene_computadores: false, tiene_proyector: true, utilidad: 'Mesa de conferencias, Proyector', nombre: 'Sala 310' },
      { id: 309, numero: '309', tipo: 'sala', capacidad: 20, tiene_computadores: false, tiene_proyector: false, utilidad: 'Mesas individuales, Silencioso', nombre: 'Sala 309' },
      { id: 301, numero: '301', tipo: 'sala', capacidad: 100, tiene_computadores: false, tiene_proyector: true, utilidad: '100 butacas, Audio profesional', nombre: 'Sala 301' },
      { id: 302, numero: '302', tipo: 'sala', capacidad: 10, tiene_computadores: true, tiene_proyector: false, utilidad: 'Equipos técnicos', nombre: 'Sala 302' }
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
      id: Date.now().toString(),
      nombre: usuario.nombre,
      email: emailLower,
      rol: usuario.rol,
      asignaturas: []
    }
  });
});

// ==========================================
// SALAS Y BÚSQUEDA (CORREGIDO)
// ==========================================
app.get(`${API_URL}/salas/todas`, async (req, res) => {
  const todasLasSalas = [];
  try {
    Object.keys(CONFIGURACION_PISOS).forEach(piso => {
      const config = CONFIGURACION_PISOS[piso];
      if (config.salas) {
        const salasDelPiso = config.salas
          .filter(s => s.tipo === 'sala' || s.tipo === 'laboratorio')
          .map(s => ({ 
            ...s, 
            piso: parseInt(piso),
            disponible: true
          }));
        todasLasSalas.push(...salasDelPiso);
      }
    });
    
    console.log(`✅ ${todasLasSalas.length} salas cargadas`);
    res.json(todasLasSalas);
  } catch (error) {
    console.error("❌ Error al obtener salas:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

app.post(`${API_URL}/search/salas/inteligente`, async (req, res) => {
  try {
    const { capacidadNecesaria, requiereComputadores, requiereProyector, dia, horario } = req.body;
    
    // Obtener todas las salas
    const todasLasSalas = [];
    Object.keys(CONFIGURACION_PISOS).forEach(piso => {
      const config = CONFIGURACION_PISOS[piso];
      if (config.salas) {
        config.salas
          .filter(s => s.tipo === 'sala' || s.tipo === 'laboratorio')
          .forEach(s => todasLasSalas.push({ ...s, piso: parseInt(piso) }));
      }
    });

    // Filtrar reservas del día/horario
    const [horaInicio] = horario.split('-').map(h => h.trim());
    const idsOcupados = new Set(
      reservas
        .filter(r => r.dia === dia && r.horaInicio === horaInicio && r.estado === 'confirmada')
        .map(r => r.salaId)
    );

    // Filtrar salas disponibles
    const salasDisponibles = todasLasSalas.filter(sala => {
      if (idsOcupados.has(sala.id)) return false;
      if (sala.capacidad < capacidadNecesaria) return false;
      if (requiereComputadores && !sala.tiene_computadores) return false;
      if (requiereProyector && !sala.tiene_proyector) return false;
      return true;
    });

    // Calcular score
    const salasConScore = salasDisponibles.map(sala => {
      const ratioOcupacion = capacidadNecesaria / sala.capacidad;
      let score = 100;

      if (ratioOcupacion >= 0.75 && ratioOcupacion <= 0.95) score += 40;
      else if (ratioOcupacion >= 0.60) score += 30;
      else if (ratioOcupacion < 0.50) score -= 20;

      if (requiereComputadores && sala.tiene_computadores) score += 10;
      if (requiereProyector && sala.tiene_proyector) score += 10;

      if (sala.piso <= 2) score += 15;
      else if (sala.piso === 3) score += 10;

      return {
        ...sala,
        scoreFinal: Math.max(0, Math.min(150, score)),
        ratioOcupacion: ratioOcupacion * 100
      };
    });

    salasConScore.sort((a, b) => b.scoreFinal - a.scoreFinal);

    res.json({ 
      salas: salasConScore,
      algoritmo: 'heuristica_inteligente_v2',
      totalEncontradas: salasConScore.length
    });

  } catch (error) {
    console.error("❌ Error en búsqueda:", error);
    res.status(500).json({ error: "Error en búsqueda" });
  }
});

// ==========================================
// RESERVAS
// ==========================================
app.post(`${API_URL}/reservations`, async (req, res) => {
  try {
    const nuevaReserva = {
      id: Date.now(),
      ...req.body,
      estado: 'confirmada',
      created_at: new Date().toISOString()
    };
    
    reservas.push(nuevaReserva);
    res.status(201).json(nuevaReserva);
  } catch (error) {
    console.error("❌ Error al crear reserva:", error);
    res.status(500).json({ error: "Error al crear reserva" });
  }
});

app.get(`${API_URL}/reservations/todas`, async (req, res) => {
  res.json(reservas);
});

// ==========================================
// MENSAJES Y NOTIFICACIONES
// ==========================================
app.get(`${API_URL}/mensajes/:userId`, async (req, res) => {
  const { userId } = req.params;
  const userMensajes = mensajes
    .filter(m => String(m.destinatarioId) === String(userId) || m.destinatarioId === 'todos')
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  res.json({ mensajes: userMensajes });
});

app.get(`${API_URL}/notifications/:userId/count`, async (req, res) => {
  const { userId } = req.params;
  const count = mensajes.filter(m => 
    (String(m.destinatarioId) === String(userId) || m.destinatarioId === 'todos') && !m.leido
  ).length;
  res.json({ count });
});

app.patch(`${API_URL}/mensajes/:id/leer`, async (req, res) => {
  const { id } = req.params;
  const mensaje = mensajes.find(m => m.id === parseInt(id));
  if (mensaje) mensaje.leido = true;
  res.json({ success: true });
});

app.patch(`${API_URL}/mensajes/:userId/leer-todos`, async (req, res) => {
  const { userId } = req.params;
  mensajes
    .filter(m => String(m.destinatarioId) === String(userId) || m.destinatarioId === 'todos')
    .forEach(m => m.leido = true);
  res.json({ success: true });
});

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