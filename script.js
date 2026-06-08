// ================================================================
//  CONFIGURAÇÃO — Números de WhatsApp dos membros
//  Formato: '55' + DDD + número (sem espaços ou traços)
//  Exemplo: '5511999998888' para (11) 9 9999-8888
// ================================================================
// Formato: ['número do membro'] ou ['número do membro', 'número da mãe']
// '55' + DDD + número, sem espaços ou traços
const MEMBER_PHONES = {
  'Alana':        ['5511957193825'],
  'Mell':         ['5511981199183'],
  'Manuella':     ['5511930169319', '5511959487095'],
  'Laura Lavny':  ['5511966161095', '5511949796394'],
  'Breno':        ['5511961328712'],
  'Thania':       ['5511913359244'],
  'Laura Falcão': ['5511914914951', '5511945096432'],
  'Elo':          ['5511960836843'],
  'Marcelo':      ['5511991667330'],
};

const ESCALA_URL = 'https://escalamidiaccmv.vercel.app/';

// ================================================================
//  Mensagens de lembrete
// ================================================================
function getMensagem(nome, dataFormatada, diasRestantes) {
  if (diasRestantes === 0) {
    return `Olá ${nome}! 🎯 Hoje é o seu dia na escala de mídia da CCMV! Não se esqueça de chegar 30 minutos antes do culto. Deus abençoe! 💪🙏`;
  }
  if (diasRestantes <= 3) {
    const plural = diasRestantes > 1 ? 'dias' : 'dia';
    return `Olá ${nome}! 😊 Passando para lembrar que você está na escala de mídia da CCMV daqui a ${diasRestantes} ${plural}, no dia ${dataFormatada}. Qualquer dúvida é só chamar! Deus abençoe! 🙏`;
  }
  return `Olá ${nome}! 👋 Passando para lembrar que você está na escala de mídia da CCMV no dia ${dataFormatada} (daqui a 1 semana). Não se esqueça! Qualquer dúvida é só chamar. Deus abençoe! 😊🙏`;
}

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
//  Montar o painel de lembretes
// ================================================================
function construirNotificacoes() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const notificacoes = [];

  document.querySelectorAll('tr[data-date]').forEach(row => {
    const dateStr = row.getAttribute('data-date');
    if (!dateStr) return;

    const data = new Date(dateStr + 'T00:00:00');
    const diffDias = Math.round((data - hoje) / 86400000);

    if (diffDias !== 0 && diffDias !== 3 && diffDias !== 7) return;

    const cells = row.querySelectorAll('td');
    if (cells.length < 3) return;

    const dataFormatada = data.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day:     '2-digit',
      month:   '2-digit',
    });

    const membros = [
      { nome: cells[1]?.textContent?.trim(), funcao: 'Story' },
      { nome: cells[2]?.textContent?.trim(), funcao: 'Slides' },
    ].filter(m => m.nome);

    membros.forEach(({ nome, funcao }) => {
      const phones   = MEMBER_PHONES[nome] || [];
      const mensagem = getMensagem(nome, dataFormatada, diffDias);
      const waUrls   = phones.map(p => `https://wa.me/${p}?text=${encodeURIComponent(mensagem)}`);

      notificacoes.push({ nome, funcao, dataFormatada, diffDias, waUrls });
    });
  });

  const panel = document.getElementById('notif-panel');
  const list  = document.getElementById('notif-items');
  const badge = document.getElementById('notif-count');

  if (!panel || !list) return;

  if (notificacoes.length === 0) {
    panel.style.display = 'none';
    return;
  }

  panel.style.display = 'block';
  if (badge) badge.textContent = notificacoes.length;

  const waIconSvg = `<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>`;

  list.innerHTML = notificacoes.map(n => {
    const cls   = n.diffDias === 0 ? 'urgency-today'  : n.diffDias === 3 ? 'urgency-3days'  : 'urgency-7days';
    const label = n.diffDias === 0 ? '🔴 Hoje'        : n.diffDias === 3 ? '🟡 Em 3 dias'   : '🟢 Em 1 semana';

    const btn = n.waUrls && n.waUrls.length > 0
      ? n.waUrls.map((url, i) => {
          const label = n.waUrls.length > 1
            ? (i === 0 ? 'Membro' : 'Responsável')
            : 'Enviar lembrete';
          return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="btn-whatsapp">
                    ${waIconSvg} ${label}
                  </a>`;
        }).join('')
      : `<span class="btn-no-phone" title="Adicione o número em script.js">📵 Sem número</span>`;

    return `
      <div class="notif-item ${cls}">
        <div class="notif-item-info">
          <div class="notif-item-header">
            <span class="notif-urgency">${label}</span>
            <span class="notif-funcao-tag">${n.funcao}</span>
          </div>
          <div class="notif-membro">${n.nome}</div>
          <div class="notif-data">📅 ${n.dataFormatada}</div>
        </div>
        ${btn}
      </div>`;
  }).join('');
}

// ================================================================
//  Painel de divulgação mensal
// ================================================================
function getMensagemDivulgacao(nome, mesNome) {
  return `Olá ${nome}! 📅 A escala de mídia da CCMV de ${mesNome} já está disponível!\n\nConfira seu horário no link abaixo:\n🔗 ${ESCALA_URL}\n\nQualquer dúvida é só chamar. Deus abençoe! 🙏`;
}

function construirDivulgacao() {
  const hoje     = new Date();
  const mesNome  = hoje.toLocaleDateString('pt-BR', { month: 'long' });
  const mesLabel = mesNome.charAt(0).toUpperCase() + mesNome.slice(1);

  const panel    = document.getElementById('broadcast-panel');
  const items    = document.getElementById('broadcast-items');
  const mesBadge = document.getElementById('broadcast-mes-badge');
  const btnOpen  = document.getElementById('btn-broadcast-open');
  const btnClose = document.getElementById('broadcast-close');

  if (!panel || !items) return;

  if (mesBadge) mesBadge.textContent = mesLabel;

  // Abre automaticamente no dia 1º de cada mês
  if (hoje.getDate() === 1) panel.style.display = 'block';

  if (btnOpen) btnOpen.addEventListener('click', () => {
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  });

  if (btnClose) btnClose.addEventListener('click', () => {
    panel.style.display = 'none';
  });

  const waIconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>`;

  items.innerHTML = Object.entries(MEMBER_PHONES).map(([nome, phones]) => {
    const mensagem = getMensagemDivulgacao(nome, mesLabel);
    const btns = phones.length > 0
      ? phones.map((p, i) => {
          const url   = `https://wa.me/${p}?text=${encodeURIComponent(mensagem)}`;
          const label = phones.length > 1 ? (i === 0 ? 'Membro' : 'Responsável') : 'Enviar';
          return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="btn-whatsapp btn-whatsapp-sm">${waIconSvg} ${label}</a>`;
        }).join('')
      : `<span class="btn-no-phone">📵 Sem número</span>`;

    return `
      <div class="broadcast-item">
        <span class="broadcast-nome">${nome}</span>
        <div class="broadcast-btns">${btns}</div>
      </div>`;
  }).join('');
}

// ================================================================
//  Init
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
  verificarStatus();
  construirNotificacoes();
  construirDivulgacao();
});
