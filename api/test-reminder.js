// Endpoint de teste — NÃO é chamado pelo cron, apenas para validação manual
// Acesse: https://escalamidiaccmv.vercel.app/api/test-reminder?secret=SEU_CRON_SECRET&phone=55119...&dias=7

const schedule = require('../data/schedule.json');

const ESCALA_URL = 'https://escalamidiaccmv.vercel.app/';

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

function getMensagem(nome, dataFormatada, diasRestantes) {
  if (diasRestantes === 0) {
    return `[TESTE ✅] Olá ${nome}! 🎯 Hoje é o seu dia na escala de mídia da CCMV! Não se esqueça de chegar 30 minutos antes do culto. Deus abençoe! 💪🙏`;
  }
  if (diasRestantes <= 3) {
    const plural = diasRestantes > 1 ? 'dias' : 'dia';
    return `[TESTE ✅] Olá ${nome}! 😊 Passando para lembrar que você está na escala de mídia da CCMV daqui a ${diasRestantes} ${plural}, no dia ${dataFormatada}.\n\nConfira a escala completa: ${ESCALA_URL}\n\nQualquer dúvida é só chamar! Deus abençoe! 🙏`;
  }
  return `[TESTE ✅] Olá ${nome}! 👋 Passando para lembrar que você está na escala de mídia da CCMV no dia ${dataFormatada} (daqui a 1 semana).\n\nConfira a escala completa: ${ESCALA_URL}\n\nNão se esqueça! Deus abençoe! 😊🙏`;
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

  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

module.exports = async function handler(req, res) {
  const { secret, phone, dias } = req.query;

  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'secret inválido' });
  }

  if (!phone) {
    return res.status(400).json({ error: 'informe ?phone=5511... para receber a mensagem de teste' });
  }

  const diasSimulados = parseInt(dias ?? '7', 10);
  if (![0, 3, 7].includes(diasSimulados)) {
    return res.status(400).json({ error: 'dias deve ser 0, 3 ou 7' });
  }

  const hojeStr = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const entrada = schedule.find(e => {
    const diff = Math.round(
      (new Date(e.date + 'T00:00:00') - new Date(hojeStr + 'T00:00:00')) / 86400000
    );
    return diff >= 0;
  }) ?? schedule[0];

  const dataFormatada = new Date(entrada.date + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  });

  const mensagem = getMensagem(entrada.story, dataFormatada, diasSimulados);

  let resultado;
  try {
    resultado = await sendGreenApi(phone, mensagem);
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao chamar Green API', detalhe: err.message });
  }

  const previaReal = schedule
    .filter(e => Math.round(
      (new Date(e.date + 'T00:00:00') - new Date(hojeStr + 'T00:00:00')) / 86400000
    ) === diasSimulados)
    .flatMap(e => [
      { data: e.date, nome: e.story,  funcao: 'Story',  phones: MEMBER_PHONES[e.story]  ?? [] },
      { data: e.date, nome: e.slides, funcao: 'Slides', phones: MEMBER_PHONES[e.slides] ?? [] },
    ]);

  return res.status(200).json({
    ok: resultado.ok,
    teste: {
      phoneDestino:     phone,
      diasSimulados,
      mensagemEnviada:  mensagem,
      respostaGreenApi: resultado.data,
    },
    previaReal: {
      descricao: `Membros que receberiam mensagem se hoje fosse ${diasSimulados} dias antes de um serviço`,
      membros:   previaReal,
    },
  });
};
