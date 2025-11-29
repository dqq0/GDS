// Configuración de todos los pisos
const CONFIGURACION_PISOS = {
  2: {
    imagen: 'img/plano-piso2.png',
    salas: SALAS_PISO_2
  },
  3: {
    imagen: 'img/plano-piso3.png',
    salas: [
      {
        id: 11,
        numero: "310",
        nombre: "Laboratorio Principal",
        polygon: "50,150 180,150 180,280 50,280",
        utilidad: "30 Computadores, Proyector",
        capacidad: 35,
        tipo: "sala",
        piso: 3
      },
      // ... más salas del piso 3
    ]
  },
  4: {
    imagen: 'img/plano-piso4.png',
    salas: [
      // ... salas del piso 4
    ]
  }
};