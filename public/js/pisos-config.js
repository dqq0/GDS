const CONFIGURACION_PISOS = {
  1: {
    nombre: 'Piso 1',
    imagen: 'img/plano-piso1.png',
    salas: [
      {
        id: 101,
        numero: "101",
        nombre: "Sala Grande 1",
        polygon: "50,150 180,150 180,280 50,280",
        utilidad: "Pizarra, Proyector, 50 sillas",
        capacidad: 50,
        tipo: "sala",
        piso: 1,
        tiene_computadores: false,
        tiene_proyector: true
      },
      {
        id: 102,
        numero: "102",
        nombre: "Lab Computación 1",
        polygon: "200,150 350,150 350,280 200,280",
        utilidad: "30 Computadores, Proyector",
        capacidad: 35,
        tipo: "sala",
        piso: 1,
        tiene_computadores: true,
        tiene_proyector: true
      },
      {
        id: 103,
        numero: "103",
        nombre: "Sala Multimedia",
        polygon: "370,150 500,150 500,280 370,280",
        utilidad: "Proyector 4K, Audio profesional",
        capacidad: 40,
        tipo: "sala",
        piso: 1,
        tiene_computadores: false,
        tiene_proyector: true
      },
      {
        id: "baño-1h",
        numero: "Baño Hombres",
        polygon: "280,350 360,350 360,490 280,490",
        tipo: "baño",
        piso: 1
      },
      {
        id: "baño-1m",
        numero: "Baño Mujeres",
        polygon: "450,350 530,350 530,490 450,490",
        tipo: "baño",
        piso: 1
      }
    ]
  },
  2: {
    imagen: 'img/plano-piso2.png',
    nombre: 'Piso 2',
    salas: SALAS_PISO_2
  },
  3: {
    nombre: 'Piso 3',
    imagen: 'img/plano-piso3.png',
    salas: [
      {
        id: 301,
        numero: "310",
        nombre: "Laboratorio Principal",
        polygon: "50,150 180,150 180,280 50,280",
        utilidad: "30 Computadores, Proyector",
        capacidad: 35,
        tipo: "sala",
        piso: 3,
        tiene_computadores: true,
        tiene_proyector: true
      },
      {
        id: 302,
        numero: "311",
        nombre: "Sala de Reuniones",
        polygon: "200,150 330,150 330,280 200,280",
        utilidad: "Mesa de conferencias, Proyector",
        capacidad: 20,
        tipo: "sala",
        piso: 3,
        tiene_computadores: false,
        tiene_proyector: true
      }
    ]
  },
  4: {
    nombre: 'Piso 4',
    imagen: 'img/plano-piso4.png',
    salas: [
      {
        id: 401,
        numero: "410",
        nombre: "Auditorio",
        polygon: "50,150 250,150 250,350 50,350",
        utilidad: "Escenario, 100 butacas, Audio profesional",
        capacidad: 100,
        tipo: "sala",
        piso: 4,
        tiene_computadores: false,
        tiene_proyector: true
      },
      {
        id: 402,
        numero: "411",
        nombre: "Sala de Profesores",
        polygon: "270,150 400,150 400,280 270,280",
        utilidad: "Reuniones, Café",
        capacidad: 15,
        tipo: "sala",
        piso: 4,
        tiene_computadores: false,
        tiene_proyector: false
      }
    ]
  },
  5: {
    nombre: 'Piso 5',
    imagen: 'img/plano-piso5.png',
    salas: [
      {
        id: 501,
        numero: "510",
        nombre: "Lab Investigación",
        polygon: "50,150 180,150 180,280 50,280",
        utilidad: "Equipos especializados",
        capacidad: 20,
        tipo: "sala",
        piso: 5,
        tiene_computadores: true,
        tiene_proyector: true
      },
      {
        id: 502,
        numero: "511",
        nombre: "Sala de Postgrado",
        polygon: "200,150 330,150 330,280 200,280",
        utilidad: "Sala exclusiva postgrado",
        capacidad: 25,
        tipo: "sala",
        piso: 5,
        tiene_computadores: false,
        tiene_proyector: true
      }
    ]
  }
};