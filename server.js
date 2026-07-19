const express = require('express');
const multer  = require('multer');
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');
const path    = require('path');
const fs      = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Secret JWT gerado uma vez por processo ──────────────────────────────────
const JWT_SECRET = require('crypto').randomBytes(64).toString('hex');

// ── Senha de acesso (hash gerado em runtime para nunca expor plain text) ────
const PLAIN_PASSWORD = '^AlG-[gk!4f>EUDsB';
const PASSWORD_HASH  = bcrypt.hashSync(PLAIN_PASSWORD, 10);

// ── Caminhos de arquivos ────────────────────────────────────────────────────
const ROOT         = __dirname;
const CONFIG_PATH  = path.join(ROOT, 'config.json');
const DEFAULT_PATH = path.join(ROOT, 'config-defaults.json');
const ASSETS_DIR   = path.join(ROOT, 'custom-assets');

// ── Multer – upload de imagens ──────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, ASSETS_DIR),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, Date.now() + '_' + safe);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Apenas imagens são permitidas'));
  }
});

// ── Helpers ─────────────────────────────────────────────────────────────────
function readConfig()  { return JSON.parse(fs.readFileSync(CONFIG_PATH,  'utf8')); }
function writeConfig(data) { fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), 'utf8'); }

function authMiddleware(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token  = header.replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'Token ausente' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

// ── Middlewares globais ──────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));

// Arquivos de upload acessíveis publicamente
app.use('/custom-assets', express.static(ASSETS_DIR));

// Painel CMS → /admin
app.use('/admin', express.static(path.join(ROOT, 'admin')));

// Site estático (root)
app.use(express.static(ROOT, { index: 'index.html' }));

// ── API ──────────────────────────────────────────────────────────────────────

// POST /api/auth — valida senha, devolve JWT
app.post('/api/auth', (req, res) => {
  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: 'Senha obrigatória' });
  if (!bcrypt.compareSync(password, PASSWORD_HASH))
    return res.status(401).json({ error: 'Senha incorreta' });
  const token = jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// GET /api/config — leitura pública (o site precisa ler sem auth)
app.get('/api/config', (_req, res) => {
  try { res.json(readConfig()); }
  catch { res.status(500).json({ error: 'Erro ao ler configuração' }); }
});

// POST /api/config — salva configuração (requer auth)
app.post('/api/config', authMiddleware, (req, res) => {
  try {
    const incoming = req.body;
    if (typeof incoming !== 'object' || Array.isArray(incoming))
      return res.status(400).json({ error: 'Payload inválido' });
    writeConfig(incoming);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/upload/:field — upload de imagem (requer auth)
app.post('/api/upload/:field', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  const url = '/custom-assets/' + req.file.filename;
  // Persiste no config.json automaticamente
  try {
    const cfg = readConfig();
    cfg.images = cfg.images || {};
    cfg.images[req.params.field] = url;
    writeConfig(cfg);
  } catch { /* silencioso – o caller pode salvar depois */ }
  res.json({ ok: true, url });
});

// POST /api/reset — restaura defaults (requer auth)
app.post('/api/reset', authMiddleware, (req, res) => {
  try {
    const defaults = JSON.parse(fs.readFileSync(DEFAULT_PATH, 'utf8'));
    writeConfig(defaults);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Fallback: qualquer rota não-API devolve index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/admin'))
    return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(ROOT, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀  CMS A Chave rodando em http://localhost:${PORT}`);
  console.log(`🔐  Painel CMS:      http://localhost:${PORT}/admin`);
  console.log(`📄  Site:            http://localhost:${PORT}\n`);
});
