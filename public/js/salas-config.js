// Configuración de todas las salas del Piso 2
	// Coordenadas basadas en el plano arquitectónico
	
	
	const SALAS_PISO_2 = [
	  // === FILA SUPERIOR ===
	  {
	    id: 201,
	    numero: "308",
	    nombre: "Sala de Clases A",
	    polygon: "20,80 180,80 180,220 20,220",
	    utilidad: "Pizarra digital, Proyector",
	    capacidad: 40,
	    tipo: "sala",
	    piso: 2,
	    tiene_computadores: false,
	    tiene_proyector: true
	  },
	  {
	    id: 202,
	    numero: "307",
	    nombre: "Sala de Clases B",
	    polygon: "200,80 360,80 360,220 200,220",
	    utilidad: "Pizarra, 30 sillas",
	    capacidad: 30,
	    tipo: "sala",
	    piso: 2,
	    tiene_computadores: false,
	    tiene_proyector: true
	  },
	  {
	    id: 203,
	    numero: "306",
	    nombre: "Sala de Clases C",
	    polygon: "380,80 540,80 540,220 380,220",
	    utilidad: "Proyector, Audio",
	    capacidad: 35,
	    tipo: "sala",
	    piso: 2,
	    tiene_computadores: false,
	    tiene_proyector: true
	  },
	
	  // === FILA SUPERIOR DERECHA ===
	  {
	    id: 204,
	    numero: "305",
	    nombre: "Laboratorio 1",
	    polygon: "620,80 780,80 780,220 620,220",
	    utilidad: "20 Computadores",
	    capacidad: 25,
	    tipo: "sala",
	    piso: 2,
	    tiene_computadores: true,
	    tiene_proyector: true
	  },
	  {
	    id: 205,
	    numero: "304",
	    nombre: "Laboratorio 2",
	    polygon: "800,80 960,80 960,220 800,220",
	    utilidad: "25 Computadores, Impresora",
	    capacidad: 30,
	    tipo: "sala",
	    piso: 2,
	    tiene_computadores: true,
	    tiene_proyector: true
	  },
	  {
	    id: 206,
	    numero: "303",
	    nombre: "Sala Multimedia",
	    polygon: "980,80 1080,80 1080,220 980,220",
	    utilidad: "Proyector 4K, Audio envolvente",
	    capacidad: 40,
	    tipo: "sala",
	    piso: 2,
	    tiene_computadores: false,
	    tiene_proyector: true
	  },
	
	  // === FILA INFERIOR ===
	  {
	    id: 207,
	    numero: "310",
	    nombre: "Sala de Reuniones",
	    polygon: "20,380 180,380 180,520 20,520",
	    utilidad: "Mesa de conferencias, Proyector",
	    capacidad: 15,
	    tipo: "sala",
	    piso: 2,
	    tiene_computadores: false,
	    tiene_proyector: true
	  },
	  {
	    id: 208,
	    numero: "309",
	    nombre: "Sala de Estudio",
	    polygon: "200,380 360,380 360,520 200,520",
	    utilidad: "Mesas individuales, Silencioso",
	    capacidad: 20,
	    tipo: "sala",
	    piso: 2,
	    tiene_computadores: false,
	    tiene_proyector: false
	  },
	
	  // === BAÑOS (no seleccionables) ===
	  {
	    id: "baño-2h",
	    numero: "♂",
	    polygon: "390,380 470,380 470,520 390,520",
	    tipo: "baño",
	    piso: 2
	  },
	  {
	    id: "escalera-2",
	    numero: "↕",
	    polygon: "490,380 600,380 600,520 490,520",
	    tipo: "escalera",
	    piso: 2
	  },
	  {
	    id: "baño-2m",
	    numero: "♀",
	    polygon: "620,380 700,380 700,520 620,520",
	    tipo: "baño",
	    piso: 2
	  },
	
	  {
	    id: 209,
	    numero: "301",
	    nombre: "Auditorio",
	    polygon: "740,380 900,380 900,520 740,520",
	    utilidad: "100 butacas, Audio profesional",
	    capacidad: 100,
	    tipo: "sala",
	    piso: 2,
	    tiene_computadores: false,
	    tiene_proyector: true
	  },
	  {
	    id: 210,
	    numero: "302",
	    nombre: "Sala Técnica",
	    polygon: "920,380 1080,380 1080,520 920,520",
	    utilidad: "Equipos técnicos",
	    capacidad: 10,
	    tipo: "sala",
	    piso: 2,
	    tiene_computadores: true,
	    tiene_proyector: false
	  }
	];
	
	// Función auxiliar para obtener sala por ID
	const getSalaById = (id) => {
	  return SALAS_PISO_2.find((sala) => sala.id === id);
	};
	
	// Función auxiliar para obtener solo salas reservables
	const getSalasReservables = () => {
	  return SALAS_PISO_2.filter((sala) => sala.tipo === "sala");
	};