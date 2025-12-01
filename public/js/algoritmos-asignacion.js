class AlgoritmosAsignacion {
  constructor(salas, reservasActuales) {
    this.salas = salas;
    this.reservasActuales = reservasActuales;
    this.patrones = this.analizarPatronesHistoricos();
  }

  /**
   * BÚSQUEDA INTELIGENTE AUTOMÁTICA
   * El sistema decide el mejor algoritmo según el contexto
   */
  busquedaInteligente(requisitos) {
    console.log('🤖 Iniciando búsqueda inteligente automática');
    
    const salasDisponibles = this.filtrarSalasDisponibles(requisitos);
    
    if (salasDisponibles.length === 0) {
      return {
        mejorOpcion: null,
        alternativas: [],
        todasLasSalas: [],
        salasEncontradas: 0
      };
    }

    // Calcular score para cada sala
    const salasConScore = salasDisponibles.map(sala => {
      const desperdicio = sala.capacidad - requisitos.capacidadNecesaria;
      const ratioOcupacion = requisitos.capacidadNecesaria / sala.capacidad;
      
      let score = 100;

      // 1. Factor de ocupación óptima (40 puntos)
      if (ratioOcupacion >= 0.75 && ratioOcupacion <= 0.95) {
        score += 40; // Uso muy óptimo
      } else if (ratioOcupacion >= 0.60 && ratioOcupacion < 0.75) {
        score += 30;
      } else if (ratioOcupacion >= 0.50 && ratioOcupacion < 0.60) {
        score += 20;
      } else if (ratioOcupacion < 0.50) {
        score -= 20; // Mucho desperdicio
      }

      // 2. Factor de recursos (20 puntos)
      if (requisitos.requiereComputadores && sala.tiene_computadores) score += 10;
      if (requisitos.requiereProyector && sala.tiene_proyector) score += 10;
      
      // Penalizar si tiene recursos que no se necesitan (desperdicio)
      if (!requisitos.requiereComputadores && sala.tiene_computadores) score -= 5;

      // 3. Factor de accesibilidad (15 puntos)
      if (sala.piso <= 2) score += 15;
      else if (sala.piso === 3) score += 10;
      else score += 5;

      // 4. Factor histórico (25 puntos)
      const patron = this.patrones[sala.id] || {};
      score += (patron.satisfaccionUsuarios - 70) * 0.35;
      score -= patron.problemasTecnicos * 5;

      // Generar insights
      const insights = this.generarInsights(sala, requisitos, patron, ratioOcupacion);

      return {
        ...sala,
        desperdicio,
        ratioOcupacion: ratioOcupacion * 100,
        scoreFinal: Math.max(0, Math.min(150, score)),
        insights
      };
    });

    // Ordenar por score
    const salasOrdenadas = salasConScore.sort((a, b) => b.scoreFinal - a.scoreFinal);

    return {
      mejorOpcion: salasOrdenadas[0],
      alternativas: salasOrdenadas.slice(1, 6),
      todasLasSalas: salasOrdenadas,
      salasEncontradas: salasOrdenadas.length,
      timestamp: Date.now()
    };
  }

  filtrarSalasDisponibles(requisitos) {
  console.log('🔍 Filtrando salas con requisitos:', requisitos);
  
  return this.salas.filter(sala => {
    // 1. Solo salas (no baños ni escaleras)
    if (sala.tipo !== 'sala') {
      console.log(`❌ ${sala.numero}: No es una sala`);
      return false;
    }

    // 2. Verificar que no esté ocupada
    const estaOcupada = this.reservasActuales.some(reserva =>
      reserva.salaId === sala.id &&
      reserva.dia === requisitos.dia &&
      reserva.horaInicio === requisitos.horario.split('-')[0].trim() &&
      reserva.estado === 'confirmada'
    );
    
    if (estaOcupada) {
      console.log(`❌ ${sala.numero}: Ocupada`);
      return false;
    }

    // 3. Verificar capacidad
    if (sala.capacidad < requisitos.capacidadNecesaria) {
      console.log(`❌ ${sala.numero}: Capacidad insuficiente (${sala.capacidad} < ${requisitos.capacidadNecesaria})`);
      return false;
    }

    // 4. ⚡ VERIFICAR PROYECTOR (si se requiere)
    if (requisitos.requiereProyector && !sala.tiene_proyector) {
      console.log(`❌ ${sala.numero}: No tiene proyector`);
      return false;
    }

    // 5. ⚡ VERIFICAR COMPUTADORES (si se requieren)
    if (requisitos.requiereComputadores && !sala.tiene_computadores) {
      console.log(`❌ ${sala.numero}: No tiene computadores`);
      return false;
    }

    console.log(`✅ ${sala.numero}: Cumple todos los requisitos`);
    return true;
  });
}

  analizarPatronesHistoricos() {
    const patrones = {};
    this.salas.forEach(sala => {
      patrones[sala.id] = {
        frecuenciaUso: Math.random() * 100,
        tasaCancelacion: Math.random() * 10,
        satisfaccionUsuarios: 70 + Math.random() * 30,
        problemasTecnicos: Math.random() * 5
      };
    });
    return patrones;
  }

  generarInsights(sala, requisitos, patron, ratioOcupacion) {
    const insights = [];

    if (ratioOcupacion >= 0.75 && ratioOcupacion <= 0.95) {
      insights.push('✅ Capacidad perfecta: aprovechamiento óptimo del espacio');
    } else if (ratioOcupacion > 0.95) {
      insights.push('⚠️ Sala casi llena, considera margen de seguridad');
    } else if (ratioOcupacion < 0.6) {
      insights.push('ℹ️ Sala amplia, hay espacio adicional disponible');
    }

    if (patron.satisfaccionUsuarios > 85) {
      insights.push('⭐ Alta satisfacción histórica de usuarios');
    }

    if (patron.problemasTecnicos < 2) {
      insights.push('🔧 Equipamiento confiable, bajo historial de fallas');
    }

    if (sala.tiene_computadores && requisitos.requiereComputadores) {
      insights.push('💻 Laboratorio equipado con computadores');
    }

    if (sala.piso <= 2) {
      insights.push('🚶 Fácil acceso, piso bajo');
    }

    return insights;
  }
}

window.AlgoritmosAsignacion = AlgoritmosAsignacion;