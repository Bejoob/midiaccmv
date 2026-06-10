// ================================================================
//  Verificar status, esconder passados e ocultar meses vazios
// ================================================================
function verificarStatus() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  document.querySelectorAll('tr[data-date]').forEach(row => {
    const dateStr = row.getAttribute('data-date');
    if (!dateStr) return;

    const data = new Date(dateStr + 'T00:00:00');
    const diffDias = Math.round((data - hoje) / 86400000);

    row.classList.remove('status-past', 'status-current', 'status-future', 'data-passada');

    if (diffDias < 0) {
      // Oculta linhas cuja data já passou
      row.style.display = 'none';
    } else if (diffDias <= 7) {
      row.classList.add('status-current');
    } else {
      row.classList.add('status-future');
    }
  });

  // Oculta seções de mês onde todas as linhas estão escondidas
  document.querySelectorAll('section.mes').forEach(secao => {
    const linhas = secao.querySelectorAll('tbody tr[data-date]');
    const todasPassadas = Array.from(linhas).every(r => r.style.display === 'none');
    if (todasPassadas) secao.style.display = 'none';
  });
}

// ================================================================
//  Init
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
  verificarStatus();
});
