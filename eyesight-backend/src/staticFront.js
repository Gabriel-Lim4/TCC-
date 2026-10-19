// ─────────────────────────────────────────────────────────────
// staticFront.js — serve o front compilado pelo próprio back
//
// Em produção, um único serviço entrega o site (frontend/dist) e a API.
// Se a pasta não existir (desenvolvimento local), não faz nada.
// Deve ser montado DEPOIS das rotas da API e ANTES do notFoundHandler.
// ─────────────────────────────────────────────────────────────
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';

export const API_PREFIXES = ['/auth', '/meta', '/google', '/instagram', '/metricas', '/ia', '/jobs', '/resumo', '/health'];
const isApi = url => API_PREFIXES.some(prefix => url === prefix || url.startsWith(`${prefix}/`));

export function mountFront(app, dir) {
  const index = path.join(dir, 'index.html');
  if (!fs.existsSync(index)) return false;
  // Arquivos com hash no nome (assets/) nunca mudam: cache longo. O resto revalida sempre.
  app.use(express.static(dir, {
    index: false,
    setHeaders: (res, file) => {
      res.setHeader('Cache-Control', file.includes(`${path.sep}assets${path.sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache');
    },
  }));
  // Rotas do React (/login, /app/google, ...) devolvem o index.html; a API mantém o 404 em JSON.
  app.get('*', (req, res, next) => {
    if (isApi(req.path) || path.extname(req.path)) return next();
    res.setHeader('Cache-Control', 'no-cache');
    return res.sendFile(index);
  });
  return true;
}
