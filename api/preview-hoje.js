// Endpoint de diagnóstico — mostra quem receberia mensagem hoje sem enviar nada
// Acesse: https://escalamidiaccmv.vercel.app/api/preview-hoje?secret=SEU_CRON_SECRET

const schedule = require('../data/schedule.json');

const DIAS_ALERTA = [0, 3, 7];

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

module.exports = function handler(req, res) {
  if (req.query.secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'secret inválido' });
  }

  const hojeStr = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const mensagens = [];
  const ignorados = [];

  for (const entry of schedule) {
    const diffMs   = new Date(entry.date + 'T12:00:00Z') - new Date(hojeStr + 'T12:00:00Z');
    const diffDias = Math.round(diffMs / 86400000);

    if (!DIAS_ALERTA.includes(diffDias)) continue;

    const label = diffDias === 0 ? 'HOJE' : diffDias === 3 ? '3 dias' : '7 dias';

    for (const [role, nome] of [['Story', entry.story], ['Slides', entry.slides]]) {
      const phones = MEMBER_PHONES[nome] || [];
      if (phones.length === 0) {
        ignorados.push({ nome, role, data: entry.date, motivo: 'sem número cadastrado' });
      } else {
        mensagens.push({ nome, role, data: entry.date, alerta: label, phones });
      }
    }
  }

  return res.status(200).json({
    hoje: hojeStr,
    totalMensagens: mensagens.reduce((acc, m) => acc + m.phones.length, 0),
    mensagens,
    ignorados,
  });
};
