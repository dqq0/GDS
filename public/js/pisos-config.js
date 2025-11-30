const CONFIGURACION_PISOS = {
  // ==========================================
  // PISO 1
  // ==========================================
  1: {
    nombre: 'Piso 1',
    imagen: 'img/plano-piso1.png',
    salas: [
      {
        id: 105,
        numero: "105",
        nombre: "Sala 105",
        polygon: "267,101 480,101 482,260 268,260",
        utilidad: "Sala de clases estándar",
        capacidad: 20,
        tipo: "sala",
        piso: 1,
        tiene_computadores: false,
        tiene_proyector: false
      },
      {
        id: 101,
        numero: "101",
        nombre: "Sala 101",
        polygon: "869,101 1063,101 1066,262 868,262",
        utilidad: "Laboratorio de computación",
        capacidad: 25,
        tipo: "sala",
        piso: 1,
        tiene_computadores: true,
        tiene_proyector: true
      },
      {
        id: 103,
        numero: "103",
        nombre: "Sala 103",
        polygon: "657,102 853,101 855,262 656,263",
        utilidad: "Laboratorio de computación",
        capacidad: 25,
        tipo: "sala",
        piso: 1,
        tiene_computadores: true,
        tiene_proyector: true
      },
      {
        id: 104,
        numero: "104",
        nombre: "Sala 104",
        polygon: "665,330 868,329 868,491 665,491",
        utilidad: "Sala de clases con proyector",
        capacidad: 20,
        tipo: "sala",
        piso: 1,
        tiene_computadores: false,
        tiene_proyector: true
      },
      {
        id: 102,
        numero: "102",
        nombre: "Sala 102",
        polygon: "882,329 1087,329 1088,494 883,493",
        utilidad: "Sala de clases con proyector",
        capacidad: 20,
        tipo: "sala",
        piso: 1,
        tiene_computadores: false,
        tiene_proyector: true
      },
      {
        id: 106,
        numero: "106",
        nombre: "Sala 106",
        polygon: "256,329 416,329 418,493 257,491",
        utilidad: "Sala de clases con proyector",
        capacidad: 20,
        tipo: "sala",
        piso: 1,
        tiene_computadores: false,
        tiene_proyector: true
      },
      // Baños y escaleras
      {
        id: "baño-1h",
        numero: "♂",
        polygon: "435,330 520,330 520,491 435,491",
        tipo: "baño",
        piso: 1
      },
      {
        id: "escalera-1",
        numero: "↕",
        polygon: "530,330 645,330 645,491 530,491",
        tipo: "escalera",
        piso: 1
      },
      {
        id: "baño-1m",
        numero: "♀",
        polygon: "495,100 580,100 580,262 495,262",
        tipo: "baño",
        piso: 1
      }
    ]
  },

  // ==========================================
  // PISO 2
  // ==========================================
  2: {
    nombre: 'Piso 2',
    imagen: 'img/plano-piso2.png',
    salas: [
      {
        id: 209,
        numero: "209",
        nombre: "Sala 209",
        polygon: "35,99 250,97 252,262 33,263",
        utilidad: "Laboratorio de computación",
        capacidad: 30,
        tipo: "sala",
        piso: 2,
        tiene_computadores: true,
        tiene_proyector: true
      },
      {
        id: 207,
        numero: "207",
        nombre: "Sala 207",
        polygon: "265,101 482,100 483,260 269,259",
        utilidad: "Laboratorio de computación",
        capacidad: 30,
        tipo: "sala",
        piso: 2,
        tiene_computadores: true,
        tiene_proyector: true
      },
      {
        id: 205,
        numero: "205",
        nombre: "Sala 205",
        polygon: "655,100 852,100 852,262 657,262",
        utilidad: "Laboratorio de computación",
        capacidad: 30,
        tipo: "sala",
        piso: 2,
        tiene_computadores: true,
        tiene_proyector: true
      },
      {
        id: 203,
        numero: "203",
        nombre: "Sala 203",
        polygon: "867,101 1064,101 1065,263 868,260",
        utilidad: "Sala de clases con proyector",
        capacidad: 35,
        tipo: "sala",
        piso: 2,
        tiene_computadores: false,
        tiene_proyector: true
      },
      {
        id: 210,
        numero: "210",
        nombre: "Sala 210",
        polygon: "21,331 201,330 203,491 21,492",
        utilidad: "Sala de clases con proyector",
        capacidad: 35,
        tipo: "sala",
        piso: 2,
        tiene_computadores: false,
        tiene_proyector: true
      },
      {
        id: 208,
        numero: "208",
        nombre: "Sala 208",
        polygon: "217,330 419,329 418,491 215,492",
        utilidad: "Laboratorio de computación",
        capacidad: 35,
        tipo: "sala",
        piso: 2,
        tiene_computadores: true,
        tiene_proyector: true
      },
      {
        id: 204,
        numero: "204",
        nombre: "Sala 204",
        polygon: "666,330 869,331 871,490 666,491",
        utilidad: "Laboratorio de computación",
        capacidad: 15,
        tipo: "sala",
        piso: 2,
        tiene_computadores: true,
        tiene_proyector: true
      },
      {
        id: 201,
        numero: "201",
        nombre: "Sala 201",
        polygon: "882,330 1085,330 1086,491 884,491",
        utilidad: "Sala de clases con proyector",
        capacidad: 30,
        tipo: "sala",
        piso: 2,
        tiene_computadores: false,
        tiene_proyector: true
      },
      // Baños y escaleras (no seleccionables)
      {
        id: "baño-2h",
        numero: "♂",
        polygon: "435,330 520,330 520,491 435,491",
        tipo: "baño",
        piso: 2
      },
      {
        id: "escalera-2",
        numero: "↕",
        polygon: "530,330 645,330 645,491 530,491",
        tipo: "escalera",
        piso: 2
      },
      {
        id: "baño-2m",
        numero: "♀",
        polygon: "495,100 580,100 580,262 495,262",
        tipo: "baño",
        piso: 2
      }
    ]
  },

  // ==========================================
  // PISO 3 (IDs CORREGIDOS: +100)
  // ==========================================
  3: {
    nombre: 'Piso 3',
    imagen: 'img/plano-piso3.png',
    salas: [
      // === FILA SUPERIOR ===
      {
        id: 301,
        numero: "308",
        nombre: "Sala de Clases A",
        polygon: "20,80 180,80 180,220 20,220",
        utilidad: "Pizarra digital, Proyector",
        capacidad: 40,
        tipo: "sala",
        piso: 3,
        tiene_computadores: false,
        tiene_proyector: true
      },
      {
        id: 302,
        numero: "307",
        nombre: "Sala de Clases B",
        polygon: "200,80 360,80 360,220 200,220",
        utilidad: "Pizarra, 30 sillas",
        capacidad: 30,
        tipo: "sala",
        piso: 3,
        tiene_computadores: false,
        tiene_proyector: true
      },
      {
        id: 303,
        numero: "306",
        nombre: "Sala de Clases C",
        polygon: "380,80 540,80 540,220 380,220",
        utilidad: "Proyector, Audio",
        capacidad: 35,
        tipo: "sala",
        piso: 3,
        tiene_computadores: false,
        tiene_proyector: true
      },

      // === FILA SUPERIOR DERECHA ===
      {
        id: 304,
        numero: "305",
        nombre: "Laboratorio 1",
        polygon: "620,80 780,80 780,220 620,220",
        utilidad: "20 Computadores",
        capacidad: 25,
        tipo: "sala",
        piso: 3,
        tiene_computadores: true,
        tiene_proyector: true
      },
      {
        id: 305,
        numero: "304",
        nombre: "Laboratorio 2",
        polygon: "800,80 960,80 960,220 800,220",
        utilidad: "25 Computadores, Impresora",
        capacidad: 30,
        tipo: "sala",
        piso: 3,
        tiene_computadores: true,
        tiene_proyector: true
      },
      {
        id: 306,
        numero: "303",
        nombre: "Sala Multimedia",
        polygon: "980,80 1080,80 1080,220 980,220",
        utilidad: "Proyector 4K, Audio envolvente",
        capacidad: 40,
        tipo: "sala",
        piso: 3,
        tiene_computadores: false,
        tiene_proyector: true
      },

      // === FILA INFERIOR ===
      {
        id: 307,
        numero: "310",
        nombre: "Sala de Reuniones",
        polygon: "20,380 180,380 180,520 20,520",
        utilidad: "Mesa de conferencias, Proyector",
        capacidad: 15,
        tipo: "sala",
        piso: 3,
        tiene_computadores: false,
        tiene_proyector: true
      },
      {
        id: 308,
        numero: "309",
        nombre: "Sala de Estudio",
        polygon: "200,380 360,380 360,520 200,520",
        utilidad: "Mesas individuales, Silencioso",
        capacidad: 20,
        tipo: "sala",
        piso: 3,
        tiene_computadores: false,
        tiene_proyector: false
      },

      // === BAÑOS Y ESCALERAS (no seleccionables) ===
      {
        id: "baño-3h",
        numero: "♂",
        polygon: "390,380 470,380 470,520 390,520",
        tipo: "baño",
        piso: 3
      },
      {
        id: "escalera-3",
        numero: "↕",
        polygon: "490,380 600,380 600,520 490,520",
        tipo: "escalera",
        piso: 3
      },
      {
        id: "baño-3m",
        numero: "♀",
        polygon: "620,380 700,380 700,520 620,520",
        tipo: "baño",
        piso: 3
      },

      {
        id: 309,
        numero: "301",
        nombre: "Auditorio",
        polygon: "740,380 900,380 900,520 740,520",
        utilidad: "100 butacas, Audio profesional",
        capacidad: 100,
        tipo: "sala",
        piso: 3,
        tiene_computadores: false,
        tiene_proyector: true
      },
      {
        id: 310,
        numero: "302",
        nombre: "Sala Técnica",
        polygon: "920,380 1080,380 1080,520 920,520",
        utilidad: "Equipos técnicos",
        capacidad: 10,
        tipo: "sala",
        piso: 3,
        tiene_computadores: true,
        tiene_proyector: false
      }
    ]
  }
};