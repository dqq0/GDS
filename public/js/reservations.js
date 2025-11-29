const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// POST - Crear reserva con validación de conflictos
router.post('/', async (req, res) => {
  const { salaId, usuarioId, dia, horaInicio, horaFin, asignatura } = req.body;

  try {
    // 1. VALIDAR CONFLICTO DE HORARIO
    const { data: conflictos, error: errorConflicto } = await supabase
      .from('reservations')
      .select('*')
      .eq('salaId', salaId)
      .eq('dia', dia)
      .eq('estado', 'confirmada')
      .or(`horaInicio.eq.${horaInicio},horaInicio.lt.${horaFin}.and.horaFin.gt.${horaInicio}`);

    if (errorConflicto) throw errorConflicto;

    // Si hay conflictos, rechazar
    if (conflictos && conflictos.length > 0) {
      return res.status(409).json({
        error: 'Sala ya reservada en este horario',
        conflicto: conflictos[0]
      });
    }

    // 2. CREAR RESERVA
    const { data, error } = await supabase
      .from('reservations')
      .insert([
        {
          salaId,
          usuarioId,
          dia,
          horaInicio,
          horaFin,
          asignatura,
          estado: 'confirmada',
          createdAt: new Date().toISOString()
        }
      ])
      .select();

    if (error) throw error;

    res.status(201).json({ success: true, reserva: data[0] });
  } catch (error) {
    console.error('Error al crear reserva:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET - Obtener reservas con filtros
router.get('/', async (req, res) => {
  const { dia, piso } = req.query;

  try {
    let query = supabase
      .from('reservations')
      .select(`
        *,
        salas!inner(id, numero, nombre, piso)
      `)
      .eq('estado', 'confirmada');

    if (dia) query = query.eq('dia', dia);
    if (piso) query = query.eq('salas.piso', piso);

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Eliminar reserva
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;