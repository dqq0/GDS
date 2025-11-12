// Configuración de todas las salas del Piso 2
	// Coordenadas basadas en el plano arquitectónico
	
	const SALAS_PISO_2 = [
	  // FILA SUPERIOR (3 salas grandes)
	  {
	    id: 1,
	    numero: "308",
	    nombre: "Sala de Clases A",
	    polygon: "10,120 120,120 120,260 10,260", // x1,y1 x2,y2 x3,y3 x4,y4	    utilidad: "Pizarra digital, Proyector",
	    capacidad: 40,
	    tipo: "sala",
	    piso: 2,
	  },
	  {
	    id: 2,
	    numero: "307",
	    nombre: "Sala de Clases B",
	    polygon: "135,120 245,120 245,260 135,260",
	    utilidad: "Pizarra, 30 sillas",
	    capacidad: 30,
	    tipo: "sala",
	    piso: 2,
	  },
	  {
	    id: 3,
	    numero: "306",
	    nombre: "Sala de Clases C",
	    polygon: "260,120 370,120 370,260 260,260",
	    utilidad: "Proyector, Audio",
	    capacidad: 35,
	    tipo: "sala",
	    piso: 2,
	  },
	
	  // FILA SUPERIOR DERECHA (3 salas)
	  {
	    id: 4,
	    numero: "305",
	    nombre: "Laboratorio 1",
	    polygon: "440,120 550,120 550,260 440,260",
	    utilidad: "20 Computadores",
	    capacidad: 25,
	    tipo: "sala",
	    piso: 2,
	  },
	  {
	    id: 5,
	    numero: "304",
	    nombre: "Laboratorio 2",
	    polygon: "565,120 675,120 675,260 565,260",
	    utilidad: "25 Computadores, Impresora",
	    capacidad: 30,
	    tipo: "sala",
	    piso: 2,
	  },
	  {
	    id: 6,
	    numero: "303",
	    nombre: "Sala Multimedia",
	    polygon: "690,120 790,120 790,260 690,260",
	    utilidad: "Proyector 4K, Audio envolvente",
	    capacidad: 40,
	    tipo: "sala",
	    piso: 2,
	  },
	
	  // BAÑOS (junto a escalera central) - NO SELECCIONABLES
	  {
	    id: "baño-h",
	    numero: "Baño Mujer",
		polygon: "280,350 360,350 360,490 280,490",
	    tipo: "baño",
	    piso: 2,
	  },
	  {
	    id: "baño-m",
	    numero: "Baño Hombre",
		polygon: "450,350 530,350 530,490 450,490",
	    tipo: "baño",
	    piso: 2,
	  },
	
	  // FILA INFERIOR IZQUIERDA (2 salas)
	  {
	    id: 7,
	    numero: "310",
	    nombre: "Sala de Reuniones",
	    polygon: "30,350 150,350 150,490 30,490",
	    utilidad: "Mesa de conferencias, Proyector",
	    capacidad: 15,
	    tipo: "sala",
	    piso: 2,
	  },
	  {
	    id: 8,
	    numero: "309",
	    nombre: "Sala de Estudio",
	    polygon: "170,350 280,350 280,490 170,490",
	    utilidad: "Mesas individuales, Silencioso",
	    capacidad: 20,
	    tipo: "sala",
	    piso: 2,
	  },
	
	  // FILA INFERIOR DERECHA (2 salas)
	  {
	    id: 9,
	    numero: "301",
	    nombre: "Sala de Estudio",
	    polygon: "530,350 645,350 645,490 530,490",
		utilidad: "Escenario, 100 butacas, Audio profesional",
	    capacidad: 100,
	    tipo: "sala",
	    piso: 2,
	  },
	  {
	    id: 10,
	    numero: "302",
	    nombre: "Sala Técnica",
	    polygon: "665,350 775,350 775,490 665,490",
	    utilidad: "Equipos técnicos, Herramientas",
	    capacidad: 10,
	    tipo: "sala",
	    piso: 2,
	  },
	
	  // ESCALERA - NO SELECCIONABLE
	  {
	    id: "escalera",
	    numero: "Escalera",
	    polygon: "365,350 445,350 445,490 365,490",
	    tipo: "escalera",
	    piso: 2,
	  },
	];
	
	// Función auxiliar para obtener sala por ID
	const getSalaById = (id) => {
	  return SALAS_PISO_2.find((sala) => sala.id === id);
	};
	
	// Función auxiliar para obtener solo salas reservables
	const getSalasReservables = () => {
	  return SALAS_PISO_2.filter((sala) => sala.tipo === "sala");
	};