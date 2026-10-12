import test from 'node:test';
import assert from 'node:assert/strict';
import { openToken, sealToken, tokenEncryptionEnabled } from '../services/tokenVault.js';

const KEY = Buffer.alloc(32, 7).toString('base64');
const OTHER = Buffer.alloc(32, 9).toString('base64');
const withKey = (key, fn) => {
  const previous = process.env.TOKEN_ENCRYPTION_KEY;
  if (key === undefined) delete process.env.TOKEN_ENCRYPTION_KEY; else process.env.TOKEN_ENCRYPTION_KEY = key;
  try { return fn(); } finally { if (previous === undefined) delete process.env.TOKEN_ENCRYPTION_KEY; else process.env.TOKEN_ENCRYPTION_KEY = previous; }
};

test('sem chave configurada, nada muda: o valor segue em texto e abre igual', () => {
  withKey(undefined, () => {
    assert.equal(tokenEncryptionEnabled(), false);
    assert.equal(sealToken('abc'), 'abc');
    assert.equal(openToken('abc'), 'abc');
  });
});

test('com chave, o valor é gravado cifrado, com prefixo e sem o texto original, e abre de volta', () => {
  withKey(KEY, () => {
    assert.equal(tokenEncryptionEnabled(), true);
    const sealed = sealToken('EAAB-token-secreto');
    assert.match(sealed, /^enc:v1:/);
    assert.ok(!sealed.includes('EAAB-token-secreto'));
    assert.equal(openToken(sealed), 'EAAB-token-secreto');
  });
});

test('cada cifragem usa um valor aleatório novo (mesmo texto, resultados diferentes)', () => {
  withKey(KEY, () => assert.notEqual(sealToken('igual'), sealToken('igual')));
});

test('valores antigos em texto continuam legíveis depois de ligar a chave', () => {
  withKey(KEY, () => assert.equal(openToken('token-antigo-em-texto'), 'token-antigo-em-texto'));
});

test('valor já cifrado não é cifrado de novo', () => {
  withKey(KEY, () => {
    const sealed = sealToken('x');
    assert.equal(sealToken(sealed), sealed);
  });
});

test('nulos e vazios passam sem erro', () => {
  withKey(KEY, () => {
    for (const empty of [null, undefined, '']) {
      assert.equal(sealToken(empty), empty);
      assert.equal(openToken(empty), empty);
    }
  });
});

test('chave errada ou valor adulterado não abre e o erro não revela o conteúdo', () => {
  const sealed = withKey(KEY, () => sealToken('segredo'));
  withKey(OTHER, () => assert.throws(() => openToken(sealed), error => error.code === 'TOKEN_DECRYPT_FAILED' && !String(error.message).includes('segredo')));
  withKey(KEY, () => {
    const parts = sealed.split(':');
    const tampered = [...parts.slice(0, -1), Buffer.from('lixo-lixo-lixo-lixo').toString('base64url')].join(':');
    assert.throws(() => openToken(tampered), { code: 'TOKEN_DECRYPT_FAILED' });
  });
});

test('valor cifrado sem chave configurada exige a chave (não devolve o lixo cifrado como se fosse token)', () => {
  const sealed = withKey(KEY, () => sealToken('segredo'));
  withKey(undefined, () => assert.throws(() => openToken(sealed), { code: 'TOKEN_KEY_MISSING' }));
});

test('chave com tamanho inválido é recusada', () => {
  withKey(Buffer.alloc(10).toString('base64'), () => assert.throws(() => sealToken('x'), { code: 'TOKEN_KEY_INVALID' }));
});

test('aceita a chave em hexadecimal de 64 caracteres', () => {
  withKey('ab'.repeat(32), () => assert.equal(openToken(sealToken('hex')), 'hex'));
});

test('tag GCM encurtada ou IV de tamanho errado são recusados', () => {
  withKey(KEY, () => {
    const [iv, tag, body] = sealToken('segredo').slice('enc:v1:'.length).split(':');
    const shortTag = Buffer.from(tag, 'base64url').subarray(0, 4).toString('base64url');
    assert.throws(() => openToken(`enc:v1:${iv}:${shortTag}:${body}`), { code: 'TOKEN_DECRYPT_FAILED' });
    const shortIv = Buffer.from(iv, 'base64url').subarray(0, 8).toString('base64url');
    assert.throws(() => openToken(`enc:v1:${shortIv}:${tag}:${body}`), { code: 'TOKEN_DECRYPT_FAILED' });
  });
});

test('um token em texto que só começa com o prefixo é cifrado normalmente, pois não tem o formato completo', () => {
  withKey(KEY, () => {
    const odd = 'enc:v1:isto-nao-e-cifrado';
    const sealed = sealToken(odd);
    assert.notEqual(sealed, odd);
    assert.equal(openToken(sealed), odd);
  });
});

test('os erros do cofre trazem status HTTP: reconectar para token ilegível, erro do operador para chave ausente ou inválida', () => {
  const sealed = withKey(KEY, () => sealToken('x'));
  withKey(OTHER, () => assert.throws(() => openToken(sealed), { code: 'TOKEN_DECRYPT_FAILED', status: 409 }));
  withKey(undefined, () => assert.throws(() => openToken(sealed), { code: 'TOKEN_KEY_MISSING', status: 500 }));
  withKey(Buffer.alloc(10).toString('base64'), () => assert.throws(() => sealToken('x'), { code: 'TOKEN_KEY_INVALID', status: 500 }));
});
