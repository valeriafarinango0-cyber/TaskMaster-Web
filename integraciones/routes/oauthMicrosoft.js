import express from 'express';
import * as msOAuth from '../lib/microsoftOAuth.js';
import { estaConectado } from '../lib/tokenStore.js';

const router = express.Router();

router.get('/auth/microsoft', (req, res) => {
  res.redirect(msOAuth.construirUrlAutorizacion());
});

router.get('/auth/microsoft/callback', async (req, res) => {
  try {
    if (req.query.error) throw new Error(req.query.error_description || req.query.error);
    await msOAuth.intercambiarCodigo(req.query.code);
    res.redirect('/?conectado=microsoft');
  } catch (error) {
    res.status(400).send(`<h2>Error conectando Microsoft</h2><p>${error.message}</p><a href="/">Volver</a>`);
  }
});

router.get('/api/microsoft/estado', async (req, res) => {
  res.json({ success: true, conectado: await estaConectado('microsoft') });
});

export default router;
