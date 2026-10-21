// Confere se os números citados pela IA existem nos dados que ela recebeu (ou derivam deles).
// É deliberadamente tolerante: aceita arredondamentos, variações percentuais e diferenças entre dois números do contexto;
// o objetivo é pegar valores inventados, não punir contas legítimas. Função pura.

const NUMBER = /\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?/g;
const DATES = /\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?/g;
const MAX_BASE = 60;

function scan(text) {
  const found = [];
  for (const raw of String(text ?? '').replace(DATES, ' ').match(NUMBER) || []) {
    const decimals = raw.includes(',') ? raw.split(',')[1].length : 0;
    const value = Number(raw.replace(/\./g, '').replace(',', '.'));
    // Contagens pequenas ("3 dias", "5 passos") e anos não são métricas.
    if (!Number.isFinite(value) || (decimals === 0 && ((value <= 31) || (value >= 2000 && value <= 2100)))) continue;
    found.push({ value, decimals });
  }
  return found;
}

export const numbersIn = text => scan(text).map(item => item.value);

function collect(node, into) {
  if (typeof node === 'number' && Number.isFinite(node)) into.push(Math.abs(node));
  else if (Array.isArray(node)) node.forEach(item => collect(item, into));
  else if (node && typeof node === 'object') Object.values(node).forEach(item => collect(item, into));
}

function allowedFrom(contexts, userText) {
  const base = [];
  collect(contexts, base);
  scan(userText).forEach(item => base.push(item.value));
  const unique = [...new Set(base)];
  const allowed = new Set(unique);
  const head = unique.slice(0, MAX_BASE);
  for (const a of head) {
    allowed.add(a * 100);
    for (const b of head) {
      allowed.add(Math.abs(a - b));
      if (b) { allowed.add(Math.abs((a / b - 1) * 100)); allowed.add((a / b) * 100); }
    }
  }
  return [...allowed];
}

export function unsupportedNumbers(answer, contexts, userText = '') {
  const allowed = allowedFrom(contexts, userText);
  const bad = scan(answer).filter(({ value, decimals }) => {
    const tolerance = decimals > 0 ? 0.5 * 10 ** -decimals : 0.5;
    return !allowed.some(known => Math.abs(known - value) <= Math.max(tolerance, 0.005 * known) + 1e-9);
  });
  return [...new Set(bad.map(item => item.value))];
}

const format = value => value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

export function guardAnswer(text, contexts, userText = '') {
  const bad = unsupportedNumbers(text, contexts, userText).slice(0, 3);
  if (!bad.length) return { text, checked: true };
  return { text: `${text}\n\nConfira: não consegui confirmar ${bad.length > 1 ? 'os valores' : 'o valor'} ${bad.map(format).join(', ')} nos dados do painel. Veja o número no painel antes de decidir.`, checked: false };
}
