/**
 * Sistema de Algoritmos de Asignación Inteligente de Salas
 * Implementa múltiples estrategias de optimización
 */

class AlgoritmosAsignacion {
  constructor(salas, reservasActuales) {
    this.salas = salas;
    this.reservasActuales = reservasActuales;
    this.patrones = this.analizarPatronesHistoricos();
  }

  /**
   * 1. BEST FIT - Minimiza el desperdicio de espacio
   */
  bestFit(requisitos) {
    console.log('🎯 Ejecutando algoritmo BEST FIT');
    
    const salasDisponibles = this.filtrarSalasDisponibles(requisitos);
    
    // Ordenar por la menor diferencia entre capacidad y requerimiento
    const salasOrdenadas = salasDisponibles
      .map(sala => {
        const desperdicio = sala.capacidad - requisitos.capacidadNecesaria;
        const scoreRecursos = this.calcularScoreRecursos(sala, requisitos);
        
        return {
          ...sala,
          desperdicio,
          scoreRecursos,
          scoreFinal: this.calcularScoreFinal(sala, requisitos, desperdicio)
        };
      })
      .filter(sala => sala.desperdicio >= 0) // Solo salas con capacidad suficiente
      .sort((a, b) => {
        // Primero por menor desperdicio, luego por score de recursos
        if (Math.abs(a.desperdicio - b.desperdicio) < 5) {
          return b.scoreRecursos - a.scoreRecursos;
        }
        return a.desperdicio - b.desperdicio;
      });

    return this.formatearResultados(salasOrdenadas, 'best-fit');
  }

  /**
   * 2. LOAD BALANCE - Equilibrio de carga entre pisos
   */
  loadBalance(requisitos) {
    console.log('⚖️ Ejecutando algoritmo LOAD BALANCE');
    
    const salasDisponibles = this.filtrarSalasDisponibles(requisitos);
    
    // Calcular ocupación actual por piso
    const ocupacionPorPiso = this.calcularOcupacionPorPiso(requisitos.dia, requisitos.horario);
    
    const salasOrdenadas = salasDisponibles
      .map(sala => {
        const ocupacionPiso = ocupacionPorPiso[sala.piso] || 0;
        const scoreBalanceo = 100 - ocupacionPiso; // Mayor score para pisos menos ocupados
        const scoreFinal = this.calcularScoreFinal(sala, requisitos, sala.capacidad - requisitos.capacidadNecesaria);
        
        return {
          ...sala,
          ocupacionPiso,
          scoreBalanceo,
          scoreFinal: scoreFinal * (scoreBalanceo / 100)
        };
      })
      .sort((a, b) => b.scoreFinal - a.scoreFinal);

    return this.formatearResultados(salasOrdenadas, 'load-balance');
  }

  /**
   * 3. PROXIMITY - Agrupa clases relacionadas
   */
  proximity(requisitos) {
    console.log('📍 Ejecutando algoritmo PROXIMITY');
    
    const salasDisponibles = this.filtrarSalasDisponibles(requisitos);
    
    // Buscar clases del mismo profesor o carrera
    const clasesRelacionadas = this.buscarClasesRelacionadas(requisitos);
    
    const salasOrdenadas = salasDisponibles
      .map(sala => {
        const scoreProximidad = this.calcularScoreProximidad(sala, clasesRelacionadas);
        const scoreFinal = this.calcularScoreFinal(sala, requisitos, sala.capacidad - requisitos.capacidadNecesaria);
        
        return {
          ...sala,
          scoreProximidad,
          scoreFinal: scoreFinal * (1 + scoreProximidad / 100)
        };
      })
      .sort((a, b) => b.scoreFinal - a.scoreFinal);

    return this.formatearResultados(salasOrdenadas, 'proximity');
  }

  /**
   * 4. PREDICTIVE - Basado en Machine Learning (simulado)
   */
  predictive(requisitos) {
    console.log('🔮 Ejecutando algoritmo PREDICTIVE');
    
    const salasDisponibles = this.filtrarSalasDisponibles(requisitos);
    
    const salasOrdenadas = salasDisponibles
      .map(sala => {
        // Análisis de patrones históricos
        const patronUso = this.patrones[sala.id] || {};
        const probabilidadExito = this.calcularProbabilidadExito(sala, requisitos, patronUso);
        const scorePredictivo = this.calcularScorePredictivo(sala, requisitos, patronUso);
        
        return {
          ...sala,
          probabilidadExito,
          scorePredictivo,
          scoreFinal: scorePredictivo,
          insights: this.generarInsights(sala, requisitos, patronUso)
        };
      })
      .sort((a, b) => b.scoreFinal - a.scoreFinal);

    return this.formatearResultados(salasOrdenadas, 'predictive');
  }

  /**
   * FUNCIONES AUXILIARES
   */

  filtrarSalasDisponibles(requisitos) {
    return this.salas.filter(sala => {
      // No es baño ni escalera
      if (sala.tipo !== 'sala') return false;

      // Verificar disponibilidad en el horario
      const estaOcupada = this.reservasActuales.some(reserva =>
        reserva.salaId === sala.id &&
        reserva.dia === requisitos.dia &&
        reserva.horaInicio === requisitos.horario.split('-')[0].trim() &&
        reserva.estado === 'confirmada'
      );
      if (estaOcupada) return false;

      // Verificar capacidad
      if (sala.capacidad < requisitos.capacidadNecesaria) return false;

      // Verificar recursos
      if (requisitos.requiereProyector && !sala.tiene_proyector) return false;
      if (requisitos.requiereComputadores && !sala.tiene_computadores) return false;

      // Verificar preferencia de piso
      if (requisitos.prioridadPiso && sala.piso !== parseInt(requisitos.prioridadPiso)) {
        // No filtrar, pero bajará el score
      }

      return true;
    });
  }

  calcularScoreRecursos(sala, requisitos) {
    let score = 100;

    // Penalizar recursos innecesarios (desperdicio de recursos)
    if (!requisitos.requiereComputadores && sala.tiene_computadores) {
      score -= 10;
    }
    if (!requisitos.requiereProyector && sala.tiene_proyector) {
      score -= 5;
    }

    // Bonificar recursos que coinciden
    if (requisitos.requiereComputadores && sala.tiene_computadores) {
      score += 15;
    }
    if (requisitos.requiereProyector && sala.tiene_proyector) {
      score += 10;
    }

    return Math.max(0, score);
  }

  calcularScoreFinal(sala, requisitos, desperdicio) {
    let score = 100;

    // Factor de desperdicio de espacio (0-30 puntos)
    const ratioOcupacion = requisitos.capacidadNecesaria / sala.capacidad;
    if (ratioOcupacion >= 0.8) score += 30; // Uso óptimo
    else if (ratioOcupacion >= 0.6) score += 20;
    else if (ratioOcupacion >= 0.4) score += 10;
    else score -= 10; // Mucho desperdicio

    // Factor de recursos (0-20 puntos)
    score += this.calcularScoreRecursos(sala, requisitos) * 0.2;

    // Factor de preferencia de piso (0-15 puntos)
    if (requisitos.prioridadPiso) {
      if (sala.piso === parseInt(requisitos.prioridadPiso)) {
        score += 15;
      } else {
        score -= Math.abs(sala.piso - parseInt(requisitos.prioridadPiso)) * 3;
      }
    }

    // Factor de accesibilidad (0-10 puntos)
    if (requisitos.accesibilidad) {
      if (sala.piso <= 2) score += 10;
      else score -= (sala.piso - 2) * 2;
    }

    return Math.max(0, Math.min(100, score));
  }

  calcularOcupacionPorPiso(dia, horario) {
    const horaInicio = horario.split('-')[0].trim();
    const ocupacion = {};

    [1, 2, 3, 4, 5].forEach(piso => {
      const salasEnPiso = this.salas.filter(s => s.piso === piso && s.tipo === 'sala');
      const salasOcupadas = salasEnPiso.filter(sala =>
        this.reservasActuales.some(r =>
          r.salaId === sala.id &&
          r.dia === dia &&
          r.horaInicio === horaInicio &&
          r.estado === 'confirmada'
        )
      );

      ocupacion[piso] = salasEnPiso.length > 0 
        ? (salasOcupadas.length / salasEnPiso.length) * 100 
        : 0;
    });

    return ocupacion;
  }

  buscarClasesRelacionadas(requisitos) {
    // Buscar clases del mismo profesor en horarios cercanos
    return this.reservasActuales.filter(r =>
      r.dia === requisitos.dia &&
      r.estado === 'confirmada'
    );
  }

  calcularScoreProximidad(sala, clasesRelacionadas) {
    let score = 0;

    clasesRelacionadas.forEach(clase => {
      const salasClaseRelacionada = this.salas.filter(s => s.id === clase.salaId);
      
      salasClaseRelacionada.forEach(salaRelacionada => {
        // Bonificar mismo piso
        if (sala.piso === salaRelacionada.piso) score += 20;
        // Bonificar pisos adyacentes
        else if (Math.abs(sala.piso - salaRelacionada.piso) === 1) score += 10;
      });
    });

    return Math.min(score, 50);
  }

  analizarPatronesHistoricos() {
    // Simulación de análisis histórico
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

  calcularProbabilidadExito(sala, requisitos, patron) {
    let probabilidad = 85; // Base

    // Factor de satisfacción histórica
    probabilidad += (patron.satisfaccionUsuarios - 70) * 0.3;

    // Penalizar por problemas técnicos
    probabilidad -= patron.problemasTecnicos * 2;

    // Penalizar por alta tasa de cancelación
    probabilidad -= patron.tasaCancelacion;

    return Math.max(0, Math.min(100, probabilidad));
  }

  calcularScorePredictivo(sala, requisitos, patron) {
    let score = 100;

    // Basado en frecuencia de uso exitosa
    score += (patron.frecuenciaUso - 50) * 0.4;

    // Basado en satisfacción
    score += (patron.satisfaccionUsuarios - 70) * 0.5;

    // Penalizar problemas técnicos
    score -= patron.problemasTecnicos * 5;

    // Penalizar cancelaciones
    score -= patron.tasaCancelacion * 2;

    // Factor de capacidad óptima
    const ratioOcupacion = requisitos.capacidadNecesaria / sala.capacidad;
    if (ratioOcupacion >= 0.7 && ratioOcupacion <= 0.9) {
      score += 15;
    }

    return Math.max(0, Math.min(100, score));
  }

  generarInsights(sala, requisitos, patron) {
    const insights = [];

    if (patron.satisfaccionUsuarios > 85) {
      insights.push('⭐ Sala con alta satisfacción histórica de usuarios');
    }

    if (patron.problemasTecnicos < 2) {
      insights.push('🔧 Equipamiento confiable, bajo historial de fallas');
    }

    if (patron.tasaCancelacion < 3) {
      insights.push('✅ Baja tasa de cancelaciones en esta sala');
    }

    const ratioOcupacion = (requisitos.capacidadNecesaria / sala.capacidad) * 100;
    if (ratioOcupacion >= 70 && ratioOcupacion <= 90) {
      insights.push('📊 Capacidad óptima: ' + ratioOcupacion.toFixed(0) + '% de ocupación');
    }

    if (sala.tiene_computadores && requisitos.requiereComputadores) {
      insights.push('💻 Laboratorio equipado con computadores');
    }

    return insights;
  }

  formatearResultados(salas, algoritmo) {
    return {
      algoritmo,
      timestamp: Date.now(),
      salasEncontradas: salas.length,
      mejorOpcion: salas[0] || null,
      alternativas: salas.slice(1, 4),
      todasLasSalas: salas
    };
  }
}

// Exportar para uso global
window.AlgoritmosAsignacion = AlgoritmosAsignacion;