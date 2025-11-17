const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// --- INSERTA ESTE BLOQUE AQUÍ ---
// Rutas para servir las páginas HTML

// Ruta raíz (para index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta para admin.html
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Ruta para blueprint.html
app.get('/blueprint', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'blueprint.html'));
});

// Ruta para schedule.html
app.get('/schedule', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'schedule.html'));
});


// Rutas de archivos JSON
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const ROOMS_FILE = path.join(__dirname, 'data', 'rooms.json');
const RESERVATIONS_FILE = path.join(
  __dirname,
  'data',
  'reservations.json'
);

// Helpers para leer/escribir JSON
const readJSON = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return [];
  }
};

const writeJSON = (file, data) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

// ========== AUTH ==========
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const users = readJSON(USERS_FILE);

  const user = users.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
    },
  });
});

app.post('/api/auth/register', (req, res) => {
  const { nombre, email, password, rol } = req.body;
  const users = readJSON(USERS_FILE);

  if (users.find((u) => u.email === email)) {
    return res.status(400).json({ error: 'Email ya registrado' });
  }

  const newUser = {
    id: users.length + 1,
    nombre,
    email,
    password, // En producción: hashear con bcrypt
    rol: rol || 'alumno',
    asignaturas: [],
  };

  users.push(newUser);
  writeJSON(USERS_FILE, users);

  res.status(201).json({ success: true, user: newUser });
});

// ========== ROOMS ==========
app.get('/api/rooms', (req, res) => {
  const { piso } = req.query;
  let rooms = readJSON(ROOMS_FILE);

  if (piso) {
    rooms = rooms.filter((r) => r.piso === parseInt(piso));
  }

  res.json(rooms);
});

app.post('/api/rooms', (req, res) => {
  const rooms = readJSON(ROOMS_FILE);
  const newRoom = {
    id: rooms.length + 1,
    ...req.body,
    disponible: true,
  };

  rooms.push(newRoom);
  writeJSON(ROOMS_FILE, rooms);

  res.status(201).json(newRoom);
});

app.put('/api/rooms/:id', (req, res) => {
  const rooms = readJSON(ROOMS_FILE);
  const index = rooms.findIndex((r) => r.id === parseInt(req.params.id));

  if (index === -1) {
    return res.status(404).json({ error: 'Sala no encontrada' });
  }

  rooms[index] = { ...rooms[index], ...req.body };
  writeJSON(ROOMS_FILE, rooms);

  res.json(rooms[index]);
});

// ========== RESERVATIONS ==========
app.get('/api/reservations', (req, res) => {
  const { dia, piso, usuarioId } = req.query;
  let reservations = readJSON(RESERVATIONS_FILE);

  if (dia) {
    reservations = reservations.filter((r) => r.dia === dia);
  }

  if (piso) {
    const rooms = readJSON(ROOMS_FILE).filter(
      (room) => room.piso === parseInt(piso)
    );
    const roomIds = rooms.map((r) => r.id);
    reservations = reservations.filter((r) =>
      roomIds.includes(r.salaId)
    );
  }

  if (usuarioId) {
    reservations = reservations.filter(
      (r) => r.usuarioId === parseInt(usuarioId)
    );
  }

  res.json(reservations);
});

app.post('/api/reservations', (req, res) => {
  const { salaId, usuarioId, dia, horaInicio, horaFin, asignatura } =
    req.body;
  const reservations = readJSON(RESERVATIONS_FILE);
  const users = readJSON(USERS_FILE);

  // Verificar ventana de tiempo por rol
  const user = users.find((u) => u.id === usuarioId);
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  // Bloquear alumnos de reservar
  if (user.rol === 'alumno') {
    return res
      .status(403)
      .json({ error: 'Los alumnos no pueden reservar salas' });
  }

  // Verificar disponibilidad
  const conflict = reservations.find(
    (r) =>
      r.salaId === salaId &&
      r.dia === dia &&
      r.horaInicio === horaInicio &&
      r.estado !== 'cancelada'
  );

  if (conflict) {
    return res
      .status(400)
      .json({ error: 'La sala ya está reservada en ese horario' });
  }

  const newReservation = {
    id: reservations.length + 1,
    salaId,
    usuarioId,
    dia,
    horaInicio,
    horaFin,
    asignatura,
    estado: 'confirmada',
    createdAt: new Date().toISOString(),
  };

  reservations.push(newReservation);
  writeJSON(RESERVATIONS_FILE, reservations);

  res.status(201).json(newReservation);
});

app.delete('/api/reservations/:id', (req, res) => {
  let reservations = readJSON(RESERVATIONS_FILE);
  const index = reservations.findIndex(
    (r) => r.id === parseInt(req.params.id)
  );

  if (index === -1) {
    return res.status(404).json({ error: 'Reserva no encontrada' });
  }

  reservations.splice(index, 1);
  writeJSON(RESERVATIONS_FILE, reservations);

  res.json({ success: true, message: 'Reserva eliminada' });
});

// ========== SCHEDULE GENERATION ==========
app.get('/api/schedule/:usuarioId', (req, res) => {
  const { usuarioId } = req.params;
  const users = readJSON(USERS_FILE);
  const reservations = readJSON(RESERVATIONS_FILE);
  const rooms = readJSON(ROOMS_FILE);

  const user = users.find((u) => u.id === parseInt(usuarioId));
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  // Si es alumno, generar horario basado en sus asignaturas
  if (user.rol === 'alumno') {
    const asignaturaCodigos = user.asignaturas.map((a) => a.codigo);
    const userReservations = reservations
      .filter((r) =>
        asignaturaCodigos.includes(r.asignatura?.codigo)
      )
      .map((r) => {
        const room = rooms.find((room) => room.id === r.salaId);
        return {
          ...r,
          sala: room?.numeroSala || 'N/A',
          nombreSala: room?.nombre || 'N/A',
        };
      });

    return res.json({ schedule: userReservations });
  }

  // Si es profesor/ayudante, mostrar sus propias reservas
  const userReservations = reservations
    .filter((r) => r.usuarioId === parseInt(usuarioId))
    .map((r) => {
      const room = rooms.find((room) => room.id === r.salaId);
      return {
        ...r,
        sala: room?.numeroSala || 'N/A',
        nombreSala: room?.nombre || 'N/A',
      };
    });

  res.json({ schedule: userReservations });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});