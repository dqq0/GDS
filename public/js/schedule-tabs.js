const API_URL = '/api';
let currentUser = null;
let allSchedule = [];
let currentDay = 'lunes';

window.onload = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    window.location.href = 'index.html';
    return;
  }

  currentUser = JSON.parse(userStr);
  document.getElementById('user-name').textContent = `👤 ${currentUser.nombre}`;

  initializeTabs();
  cargarHorario();
};

function initializeTabs() {
  const tabs = document.querySelectorAll('.day-tab');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      currentDay = tab.dataset.day;
      renderScheduleForDay(currentDay);
    });
  });
}

async function cargarHorario() {
  const content = document.getElementById('schedule-content');

  try {
    const response = await fetch(`${API_URL}/schedule/${currentUser.id}`);
    const data = await response.json();

    allSchedule = data.schedule;

    if (allSchedule.length === 0) {
      content.innerHTML = '<div class="no-classes">No hay clases asignadas</div>';
      return;
    }

    renderScheduleForDay(currentDay);
  } catch (error) {
    content.innerHTML = '<div class="no-classes">Error al cargar el horario</div>';
  }
}

function renderScheduleForDay(dia) {
  const content = document.getElementById('schedule-content');

  const clasesDelDia = allSchedule.filter(
    (clase) => clase.dia.toLowerCase() === dia.toLowerCase()
  );

  if (clasesDelDia.length === 0) {
    content.innerHTML = `<div class="no-classes">No hay clases programadas para el día ${dia.charAt(0).toUpperCase() + dia.slice(1)}</div>`;
    return;
  }

  clasesDelDia.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

  let html = '';
  clasesDelDia.forEach((clase, index) => {
    html += `
      <div class="class-card">
        <div class="class-header">
          <div class="class-number">${index + 1}</div>
          <div class="class-time">${clase.horaInicio}-${clase.horaFin}</div>
        </div>
        <div class="class-body">
          <div class="class-title">${clase.asignatura?.nombre || 'Sin nombre'}</div>
          <div class="class-code">${clase.asignatura?.codigo || 'N/A'} · Sala ${clase.sala}</div>
          
          <div class="class-details">
            <div class="detail-row">
              <span class="detail-label">PROFESOR</span>
              <span class="detail-value">${clase.profesor || 'No asignado'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">LUGAR</span>
              <span class="detail-value">${clase.nombreSala || clase.sala}</span>
            </div>
          </div>
          
          ${currentUser.rol !== 'alumno' ? `
            <div class="class-actions">
              <button onclick="eliminarReserva(${clase.id})" class="btn-danger">
                Eliminar Reserva
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  });

  content.innerHTML = html;
}

async function descargarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Mi Horario de Clases', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Estudiante: ${currentUser.nombre}`, 20, 35);
  doc.text(`Periodo: 2025 Semestre 2`, 20, 42);
  doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 20, 49);

  const diasSemana = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'];
  let yPosition = 60;

  for (const dia of diasSemana) {
    const clasesDelDia = allSchedule.filter((c) => c.dia.toLowerCase() === dia);

    if (clasesDelDia.length === 0) continue;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(dia.toUpperCase(), 20, yPosition);
    yPosition += 8;

    const tableData = clasesDelDia.map((clase) => [
      `${clase.horaInicio}-${clase.horaFin}`,
      clase.asignatura?.codigo || 'N/A',
      clase.asignatura?.nombre || 'Sin nombre',
      clase.sala,
      clase.profesor || 'No asignado'
    ]);

    doc.autoTable({
      startY: yPosition,
      head: [['Horario', 'Código', 'Asignatura', 'Sala', 'Profesor']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [52, 152, 219], fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 20, right: 20 }
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
  }

  doc.save(`Horario_${currentUser.nombre.replace(/ /g, '_')}.pdf`);
}

document.querySelector('.btn-pdf').addEventListener('click', descargarPDF);

async function eliminarReserva(id) {
  if (!confirm('¿Estás seguro de eliminar esta reserva?')) return;

  try {
    const response = await fetch(`${API_URL}/reservations/${id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      alert('✅ Reserva eliminada');
      cargarHorario();
    } else {
      alert('❌ Error al eliminar');
    }
  } catch (error) {
    alert('❌ Error de conexión');
  }
}

function logout() {
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}