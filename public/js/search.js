const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// POST - Búsqueda inteligente de salas
router.post('/salas', async (req, res) => {
  const {
    capacidadMinima,
    requiereComputadores,
    requiereProyector,
    piso,
    dia,
    horario
  } = req.body;

  try {
    // 1. Obtener todas las salas que cumplen requisitos físicos
    let query = supabase
      .from('salas')
      .select('*')
      .eq('tipo', 'sala');

    if (capacidadMinima) {
      query = query.gte('capacidad', capacidadMinima);
    }

    if (requiereComputadores) {
      query = query.eq('tiene_computadores', true);
    }

    if (requiereProyector) {
      query = query.eq('tiene_proyector', true);
    }

    if (piso) {
      query = query.eq('piso', piso);
    }

    const { data: salas, error } = await query;

    if (error) throw error;

    // 2. Si se especifica día y horario, filtrar ocupadas
    let salasDisponibles = salas;

    if (dia && horario) {
      const [horaInicio] = horario.split('-').map((h) => h.trim());

      const { data: reservas } = await supabase
        .from('reservations')
        .select('salaId')
        .eq('dia', dia)
        .eq('horaInicio', horaInicio)
        .eq('estado', 'confirmada');

      const idsOcupadas = new Set(reservas?.map((r) => r.salaId) || []);

      salasDisponibles = salas.filter((sala) => !idsOcupadas.has(sala.id));
    }

    // 3. Ordenar por "mejor ajuste"
    // Prioridad: capacidad más cercana a la requerida (sin desperdiciar)
    if (capacidadMinima) {
      salasDisponibles.sort((a, b) => {
        const diffA = Math.abs(a.capacidad - capacidadMinima);
        const diffB = Math.abs(b.capacidad - capacidadMinima);
        return diffA - diffB;
      });
    }

    // 4. Calcular "score" de ajuste
    const resultados = salasDisponibles.map((sala) => {
      let score = 100;

      // Penalizar mucho desperdicio de capacidad
      if (capacidadMinima) {
        const desperdicio = sala.capacidad - capacidadMinima;
        if (desperdicio > capacidadMinima * 0.5) {
          score -= 30;
        } else if (desperdicio < 5) {
          score += 10; // Bonus por ajuste perfecto
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
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;