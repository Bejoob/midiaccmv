// Vercel Serverless Function — roda via cron diariamente às 9h (horário de Brasília)
// Envia lembretes WhatsApp via Green API para membros da escala de mídia CCMV

const schedule = require('../data/schedule.json');

const DIAS_ALERTA = [0];

const MEMBER_PHONES = {
  'Alana':        ['5511957193825'],
  'Mell':         ['5511981199183'],
  'Manuella':     ['5511930169319', '5511959487095'],
  'Laura Lavny':  ['5511966161095', '5511945096432'],
  'Breno':        ['5511961328712'],
  'Thania':       ['5511913359244'],
  'Laura Falcão': ['5511914914951', '5511949796394'],
  'Elo':          ['5511960836843'],
  'Marcelo':      ['5511991667330'],
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

function getMensagem(nome) {
  return `Olá ${nome}! 🎯 Hoje é o seu dia na escala de mídia da CCMV! Não se esqueça de chegar 30 minutos antes do culto. Deus abençoe! 💪🙏`;
}

async function sendGreenApi(phone, message) {
  const instanceId = process.env.GREEN_INSTANCE_ID;
  const apiToken   = process.env.GREEN_API_TOKEN;
  const url = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${apiToken}`;

  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId: `${phone}@c.us`, message }),
  });

  let data;
  try { data = await res.json(); } catch (_) { data = { error: 'invalid response' }; }
  return { ok: res.ok, status: res.status, data };
}

module.exports = async function handler(req, res) {
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  const hojeStr = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const enviados  = [];
  const ignorados = [];
  const erros     = [];

  for (const entry of schedule) {
    const diffMs   = new Date(entry.date + 'T12:00:00Z') - new Date(hojeStr + 'T12:00:00Z');
    const diffDias = Math.round(diffMs / 86400000);

    if (!DIAS_ALERTA.includes(diffDias)) continue;

    for (const [role, nome] of [['Story', entry.story], ['Slides', entry.slides]]) {
      const phones   = MEMBER_PHONES[nome] || [];
      const mensagem = getMensagem(nome);

      if (phones.length === 0) {
        ignorados.push({ nome, role, motivo: 'sem número' });
        continue;
      }

      for (const phone of phones) {
        try {
          const result = await sendGreenApi(phone, mensagem);
          enviados.push({ nome, role, phone, diffDias, ok: result.ok, greenApi: result.data });
          if (!result.ok) erros.push({ nome, phone, status: result.status, data: result.data });
        } catch (err) {
          erros.push({ nome, phone, error: err.message });
        }
        await sleep(1200); // aguarda 1.2s entre envios para evitar rate limit
      }
    }
  }

  return res.status(200).json({
    data:      hojeStr,
    enviados:  enviados.length,
    ignorados: ignorados.length,
    erros:     erros.length,
    detalhes:  { enviados, ignorados, erros },
  });
};
