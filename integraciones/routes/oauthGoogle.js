import express from 'express';
import * as googleOAuth from '../lib/googleOAuth.js';
import { estaConectado } from '../lib/tokenStore.js';

const router = express.Router();

router.get('/auth/google', (req, res) => {
  res.redirect(googleOAuth.construirUrlAutorizacion());
});

router.get('/auth/google/callback', async (req, res) => {
  try {
    if (req.query.error) throw new Error(req.query.error_description || req.query.error);
    await googleOAuth.intercambiarCodigo(req.query.code);
    res.redirect('/?conectado=google');
  } catch (error) {
    res.status(400).send(`<h2>Error conectando Google</h2><p>${error.message}</p><a href="/">Volver</a>`);
  }
});

router.get('/api/google/estado', async (req, res) => {
  res.json({ success: true, conectado: await estaConectado('google') });
});

export default router;
