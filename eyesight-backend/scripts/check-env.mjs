// Diagnóstico do .env: mostra o que está preenchido e o que cada variável vazia desliga.
// Nunca imprime valores. Uso: node scripts/check-env.mjs
import 'dotenv/config';

const GROUPS = [
  ['Login, cadastro e "esqueci a senha" (Supabase)', ['SUPABASE_URL', 'SUPABASE_ANON_KEY'], 'ninguém consegue entrar, cadastrar ou redefinir a senha'],
  ['E-mails (confirmação e redefinição, via Resend)', ['RESEND_API_KEY'], 'o Supabase não envia e-mails se o SMTP do Resend não estiver ligado no painel dele'],
  ['Assistente de IA (OpenAI)', ['OPENAI_API_KEY'], 'os botões "Explicar" e a página do assistente ficam indisponíveis'],
  ['Conexão com Meta Ads', ['META_APP_ID', 'META_APP_SECRET', 'META_REDIRECT_URI'], 'não é possível conectar contas do Meta'],
  ['Conexão com Google Ads', ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI', 'GOOGLE_DEVELOPER_TOKEN'], 'não é possível conectar contas do Google'],
  ['Banco de dados', ['DATABASE_URL', 'DIRECT_URL'], 'nada funciona'],
  ['Sessão', ['JWT_SECRET'], 'tokens próprios não podem ser assinados'],
];

let missing = 0;
for (const [name, keys, effect] of GROUPS) {
  const empty = keys.filter(key => !String(process.env[key] ?? '').trim());
  missing += empty.length;
  console.log(`${empty.length ? '✗' : '✓'} ${name}${empty.length ? `\n    vazias: ${empty.join(', ')}\n    efeito: ${effect}` : ''}`);
}
const encryption = String(process.env.TOKEN_ENCRYPTION_KEY ?? '').trim();
console.log(`${encryption ? '✓' : '·'} Criptografia dos tokens das contas de anúncio (opcional)${encryption ? '' : '\n    TOKEN_ENCRYPTION_KEY vazia: os tokens seguem gravados em texto. Para ligar, gere 32 bytes aleatórios em base64.'}`);
console.log(missing ? `\n${missing} variável(is) vazia(s).` : '\nTudo preenchido.');
