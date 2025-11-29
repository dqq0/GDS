const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ========== RUTAS DE AUTENTICACIÓN ==========

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const usersData = await fs.readFile(path.join(__dirname, 'data', 'users.json'), 'utf-8');
    const users = JSON.parse(usersData);

    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Determinar rol por dominio
    let rol = user.rol || 'alumno';
    if (email.endsWith('@academicos.uta.cl')) rol = 'profesor';
    else if (email.endsWith('@ayudantes.uta.cl')) rol = 'ayudante';
    else if (email.endsWith('@alumnos.uta.cl')) rol = 'alumno';

    res.json({
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: rol
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/auth/google-callback
app.post('/api/auth/google-callback', async (req, res) => {
  const { user } = req.body;

  try {
    const email = user.email;
    
    // Asignar rol por dominio
    let rol = 'alumno';
    if (email.endsWith('@academicos.uta.cl')) rol = 'profesor';
    else if (email.endsWith('@ayudantes.uta.cl')) rol = 'ayudante';

    const usersData = await fs.readFile(path.join(__dirname, 'data', 'users.json'), 'utf-8');
    const users = JSON.parse(usersData);

    let existingUser = users.find(u => u.email === email);

    if (!existingUser) {
      // Crear nuevo usuario
      existingUser = {
        id: users.length + 1,
        email,
        nombre: user.user_metadata?.full_name || email.split('@')[0],
        rol,
        avatar: user.user_metadata?.avatar_url
      };
      users.push(existingUser);
      await fs.writeFile(
        path.join(__dirname, 'data', 'users.json'),
        JSON.stringify(users, null, 2)
      );
    }

    res.json({
      user: {
        id: existingUser.id,
        nombre: existingUser.nombre,
        email: existingUser.email,
        rol: existingUser.rol
      }
    });
  } catch (error) {
    console.error('Error en Google callback:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ========== RUTAS DE SALAS ==========

// GET /api/salas
app.get('/api/salas', async (req, res) => {
  try {
    const roomsData = await fs.readFile(path.join(__dirname, 'data', 'rooms.json'), 'utf-8');
    const rooms = JSON.parse(roomsData);
    res.json(rooms);
  } catch (error) {
    console.error('Error leyendo salas:', error);
    res.status(500).json({ error: 'Error al cargar salas' });
  }
});

// ========== RUTAS DE RESERVACIONES ==========

// GET /api/reservations
app.get('/api/reservations', async (req, res) => {
  const { dia, piso } = req.query;

  try {
    const reservationsData = await fs.readFile(
      path.join(__dirname, 'data', 'reservations.json'),
      'utf-8'
    );
    let reservations = JSON.parse(reservationsData);

    // Filtrar por día
    if (dia) {
      reservations = reservations.filter(r => r.dia === dia);
    }

    // Filtrar por piso (necesita cruzar con rooms.json)
    if (piso) {
      const roomsData = await fs.readFile(path.join(__dirname, 'data', 'rooms.json'), 'utf-8');
      const rooms = JSON.parse(roomsData);
      
      const roomsInFloor = rooms.filter(r => r.piso === parseInt(piso)).map(r => r.id);
      reservations = reservations.filter(r => roomsInFloor.includes(r.salaId));
    }

    res.json(reservations);
  } catch (error) {
    console.error('Error leyendo reservaciones:', error);
    res.status(500).json({ error: 'Error al cargar reservaciones' });
  }
});

// POST /api/reservations - Con validación de conflictos
app.post('/api/reservations', async (req, res) => {
  const { salaId, usuarioId, dia, horaInicio, horaFin, asignatura } = req.body;

  try {
    const reservationsData = await fs.readFile(
      path.join(__dirname, 'data', 'reservations.json'),
      'utf-8'
    );
    const reservations = JSON.parse(reservationsData);

    // ✅ VALIDAR CONFLICTO DE HORARIO
    const conflicto = reservations.find(
      r =>
        r.salaId === salaId &&
        r.dia === dia &&
        r.horaInicio === horaInicio &&
        r.estado === 'confirmada'
    );

    if (conflicto) {
      return res.status(409).json({
        error: 'Sala ya reservada en este horario',
        conflicto
      });
    }

    // Crear nueva reserva
    const nuevaReserva = {
      id: reservations.length + 1,
      salaId,
      usuarioId,
      dia,
      horaInicio,
      horaFin,
      asignatura,
      estado: 'confirmada',
      createdAt: new Date().toISOString()
    };

    reservations.push(nuevaReserva);

    await fs.writeFile(
      path.join(__dirname, 'data', 'reservations.json'),
      JSON.stringify(reservations, null, 2)
    );

    res.status(201).json({ success: true, reserva: nuevaReserva });
  } catch (error) {
    console.error('Error creando reserva:', error);
    res.status(500).json({ error: 'Error al crear reserva' });
  }
});

// DELETE /api/reservations/:id
app.delete('/api/reservations/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const reservationsData = await fs.readFile(
      path.join(__dirname, 'data', 'reservations.json'),
      'utf-8'
    );
    let reservations = JSON.parse(reservationsData);

    reservations = reservations.filter(r => r.id !== parseInt(id));

    await fs.writeFile(
      path.join(__dirname, 'data', 'reservations.json'),
      JSON.stringify(reservations, null, 2)
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error eliminando reserva:', error);
    res.status(500).json({ error: 'Error al eliminar reserva' });
  }
});

// ========== RUTA DE HORARIO ==========

// GET /api/schedule/:userId
app.get('/api/schedule/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const reservationsData = await fs.readFile(
      path.join(__dirname, 'data', 'reservations.json'),
      'utf-8'
    );
    const roomsData = await fs.readFile(path.join(__dirname, 'data', 'rooms.json'), 'utf-8');

    const reservations = JSON.parse(reservationsData);
    const rooms = JSON.parse(roomsData);

    // Filtrar reservas del usuario
    const userReservations = reservations.filter(
      r => r.usuarioId === parseInt(userId) && r.estado === 'confirmada'
    );

    // Enriquecer con info de salas
    const schedule = userReservations.map(r => {
      const room = rooms.find(room => room.id === r.salaId);
      return {
        id: r.id,
        dia: r.dia,
        horaInicio: r.horaInicio,
        horaFin: r.horaFin,
        asignatura: r.asignatura,
        sala: room?.numero || 'N/A',
        nombreSala: room?.nombre || 'Sin nombre',
        profesor: r.asignatura?.profesor || 'No asignado'
      };
    });

    res.json({ schedule });
  } catch (error) {
    console.error('Error obteniendo horario:', error);
    res.status(500).json({ error: 'Error al cargar horario' });
  }
});

// ========== BÚSQUEDA INTELIGENTE ==========

// POST /api/search/salas
app.post('/api/search/salas', async (req, res) => {
  const {
    capacidadMinima,
    requiereComputadores,
    requiereProyector,
    piso,
    dia,
    horario
  } = req.body;

  try {
    const roomsData = await fs.readFile(path.join(__dirname, 'data', 'rooms.json'), 'utf-8');
    let salas = JSON.parse(roomsData).filter(s => s.tipo === 'sala');

    // Filtrar por capacidad
    if (capacidadMinima) {
      salas = salas.filter(s => s.capacidad >= capacidadMinima);
    }

    // Filtrar por computadores
    if (requiereComputadores) {
      salas = salas.filter(s => s.tiene_computadores === true);
    }

    // Filtrar por proyector
    if (requiereProyector) {
      salas = salas.filter(s => s.tiene_proyector === true);
    }

    // Filtrar por piso
    if (piso) {
      salas = salas.filter(s => s.piso === parseInt(piso));
    }

    // Filtrar ocupadas si se especifica horario
    if (dia && horario) {
      const [horaInicio] = horario.split('-').map(h => h.trim());
      
      const reservationsData = await fs.readFile(
        path.join(__dirname, 'data', 'reservations.json'),
        'utf-8'
      );
      const reservations = JSON.parse(reservationsData);

      const idsOcupadas = new Set(
        reservations
          .filter(r => r.dia === dia && r.horaInicio === horaInicio && r.estado === 'confirmada')
          .map(r => r.salaId)
      );

      salas = salas.filter(s => !idsOcupadas.has(s.id));
    }

    // Ordenar por mejor ajuste
    if (capacidadMinima) {
      salas.sort((a, b) => {
        const diffA = Math.abs(a.capacidad - capacidadMinima);
        const diffB = Math.abs(b.capacidad - capacidadMinima);
        return diffA - diffB;
      });
    }

    // Calcular score
    const resultados = salas.map(sala => {
      let score = 100;

      if (capacidadMinima) {
        const desperdicio = sala.capacidad - capacidadMinima;
        if (desperdicio > capacidadMinima * 0.5) {
          score -= 30;
        } else if (desperdicio < 5) {
          score += 10;
        }
      }

      return {
        ...sala,
        score,
        recomendacion: score >= 90 ? 'Excelente' : score >= 70 ? 'Buena' : 'Aceptable'
      };
    });

    res.json({
      total: resultados.length,
      salas: resultados
    });
  } catch (error) {
    console.error('Error en búsqueda:', error);
    res.status(500).json({ error: 'Error en búsqueda' });
  }
});

// ========== SERVIR HTML ==========
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/blueprint', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'blueprint.html'));
});

app.get('/schedule', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'schedule.html'));
});

app.get('/asistente', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'asistente.html'));
});
// ========== EXPORTAR PARA VERCEL ==========
module.exports = app;

// Solo para desarrollo local
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  });
}