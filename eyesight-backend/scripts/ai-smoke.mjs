// Teste real do provedor de IA configurado no .env (gasta 2 requisições). Nunca imprime a chave.
// Uso: node scripts/ai-smoke.mjs
import 'dotenv/config';
import { complete } from '../src/services/iaService.js';

const host = (() => { try { return new URL(process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').host; } catch { return 'endereço inválido'; } })();
console.log(`Provedor: ${host} · modelo: ${process.env.OPENAI_MODEL || 'gpt-4o-mini'}`);
try {
  const chat = await complete([{ role: 'user', content: 'Explique em uma frase, para um leigo, o que é CTR em anúncios.' }]);
  console.log('✓ Chat:', chat.text);
  const analysis = await complete([
    { role: 'system', content: 'Você analisa campanhas de anúncios em português.' },
    { role: 'user', content: 'Campanha com 1000 cliques, 20000 impressões, gasto de R$ 500 e 25 conversões. Analise.' },
  ], { structured: true });
  console.log('✓ Análise estruturada: score', analysis.score_desempenho, '·', analysis.texto.slice(0, 120));
} catch (error) {
  console.error('✗ Falhou:', error.status ?? '', error.message);
  process.exitCode = 1;
}
