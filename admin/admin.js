/* ═══════════════════════════════════════════════════════════════════════════
   CMS Admin · A Chave
   ═══════════════════════════════════════════════════════════════════════════ */

let TOKEN = sessionStorage.getItem('cms_token') || null;
let CFG   = {};

// ── Utilitários ─────────────────────────────────────────────────────────────
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

function toast(msg, type = 'ok') {
  const el = $('#toast');
  el.textContent = type === 'ok' ? '✓ ' + msg : '✗ ' + msg;
  el.className = 'show ' + type;
  clearTimeout(el._t);
  el._t = setTimeout(() => el.className = '', 3000);
}

async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (TOKEN) opts.headers['Authorization'] = 'Bearer ' + TOKEN;
  if (body)  opts.body = JSON.stringify(body);
  const r = await fetch(path, opts);
  if (!r.ok) throw new Error((await r.json()).error || r.statusText);
  return r.json();
}

async function uploadFile(field, file) {
  const fd = new FormData();
  fd.append('file', file);
  const r = await fetch('/api/upload/' + field, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + TOKEN },
    body: fd
  });
  if (!r.ok) throw new Error((await r.json()).error || r.statusText);
  return (await r.json()).url;
}

// ── Auth ─────────────────────────────────────────────────────────────────────
async function login() {
  const pwd = $('#pwd-input').value;
  try {
    const { token } = await api('POST', '/api/auth', { password: pwd });
    TOKEN = token;
    sessionStorage.setItem('cms_token', token);
    showApp();
  } catch {
    $('#login-error').style.display = 'block';
    setTimeout(() => $('#login-error').style.display = 'none', 3000);
  }
}

function logout() {
  TOKEN = null;
  sessionStorage.removeItem('cms_token');
  $('#app').style.display = 'none';
  $('#login-screen').style.display = 'flex';
  $('#pwd-input').value = '';
}

// ── App ──────────────────────────────────────────────────────────────────────
async function showApp() {
  $('#login-screen').style.display = 'none';
  $('#app').style.display = 'block';
  await loadConfig();
  buildUI();
}

async function loadConfig() {
  CFG = await api('GET', '/api/config');
}

// ── Navegação ─────────────────────────────────────────────────────────────────
function setupNav() {
  $$('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.nav-item').forEach(b => b.classList.remove('active'));
      $$('.cms-section').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      $('#sec-' + btn.dataset.section).classList.add('active');
    });
  });
}

// ── Cores ─────────────────────────────────────────────────────────────────────
const COLOR_GROUPS = {
  'grid-bg':     { '--bg':'Fundo principal','--bg-soft':'Fundo suave','--surface':'Superfície','--surface-2':'Superfície 2','--bg-light':'Fundo claro','--bg-gray':'Fundo cinza' },
  'grid-text':   { '--text':'Texto principal','--text-muted':'Texto secundário','--text-dim':'Texto terciário' },
  'grid-accent': { '--accent':'Dourado destaque','--accent-soft':'Dourado suave','--accent-deep':'Dourado escuro' },
  'grid-cta':    { '--cta':'Fundo botão','--cta-hover':'Hover botão','--cta-fg':'Texto botão' },
  'grid-misc':   { '--whatsapp':'WhatsApp', '--line':'Borda sutil (rgba)', '--line-strong':'Borda forte (rgba)' }
};

function buildColors() {
  Object.entries(COLOR_GROUPS).forEach(([gridId, vars]) => {
    const grid = $('#' + gridId);
    if (!grid) return;
    grid.innerHTML = '';
    Object.entries(vars).forEach(([cssVar, label]) => {
      const rawVal = (CFG.colors || {})[cssVar] || '#000000';
      const hexVal = rawToHex(rawVal);
      const div = document.createElement('div');
      div.className = 'field';
      div.innerHTML = `<label>${label}</label>
        <div class="color-field">
          <input type="color" data-color-var="${cssVar}" value="${hexVal}"/>
          <input type="text"  data-color-text="${cssVar}" value="${rawVal}"/>
        </div>`;
      grid.appendChild(div);
    });
  });

  // Sync color picker ↔ text field + live preview
  $$('[data-color-var]').forEach(picker => {
    const cssVar = picker.dataset.colorVar;
    const textEl = $(`[data-color-text="${cssVar}"]`);
    picker.addEventListener('input', () => {
      textEl.value = picker.value;
      setColorVar(cssVar, picker.value);
    });
    textEl.addEventListener('input', () => {
      const v = textEl.value.trim();
      CFG.colors[cssVar] = v;
      try { picker.value = rawToHex(v); } catch {}
      applyToPreview();
    });
  });
}

function rawToHex(val) {
  // rgba/rgb → aproximação simples; hex → passthrough
  if (!val) return '#000000';
  if (val.startsWith('#')) return val.slice(0, 7);
  const m = val.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (m) return '#' + [m[1],m[2],m[3]].map(n => parseInt(n).toString(16).padStart(2,'0')).join('');
  return '#000000';
}

function setColorVar(cssVar, val) {
  CFG.colors = CFG.colors || {};
  CFG.colors[cssVar] = val;
  applyToPreview();
}

// ── Botões ────────────────────────────────────────────────────────────────────
function buildButtons() {
  const btns = CFG.buttons || {};

  // Sliders radius
  function initSlider(id, lblId, cfgKey) {
    const sl  = $('#' + id);
    const lbl = $('#' + lblId);
    if (!sl) return;
    const current = parseInt(btns[cfgKey] || '12');
    sl.value = current;
    lbl.textContent = current + 'px';
    sl.addEventListener('input', () => {
      const v = sl.value + 'px';
      lbl.textContent = v;
      CFG.buttons = CFG.buttons || {};
      CFG.buttons[cfgKey] = v;
      applyToPreview();
    });
  }
  initSlider('sl-radius',    'lbl-radius',    '--radius');
  initSlider('sl-radius-lg', 'lbl-radius-lg', '--radius-lg');
  initSlider('sl-radius-xl', 'lbl-radius-xl', '--radius-xl');

  // CTA text fields
  const ctaContainer = $('#cta-texts-fields');
  ctaContainer.innerHTML = '';
  const ctaTexts = btns['cta-texts'] || [];
  const labels = [
    'Botão 1 — Hero',
    'Botão 2 — Two Comma',
    'Botão 3 — Depoimentos',
    'Botão 4 — Jornada',
    'Botão 5 — Inclusões',
    'Botão 6 — Garantia'
  ];
  ctaTexts.forEach((text, i) => {
    const div = document.createElement('div');
    div.className = 'field';
    div.innerHTML = `<label>${labels[i] || 'Botão ' + (i+1)}</label>
      <input type="text" data-cta-idx="${i}" value="${text}"/>`;
    ctaContainer.appendChild(div);
  });
  $$('[data-cta-idx]').forEach(inp => {
    inp.addEventListener('input', () => {
      const idx = parseInt(inp.dataset.ctaIdx);
      CFG.buttons['cta-texts'][idx] = inp.value;
      applyToPreview();
    });
  });

  // WhatsApp fields
  if ($('#wpp-btn-text')) $('#wpp-btn-text').value = btns['whatsapp-btn-text'] || '';
  if ($('#wpp-url'))      $('#wpp-url').value      = btns['whatsapp-url'] || '';
  if ($('#wpp-fab-url'))  $('#wpp-fab-url').value  = btns['whatsapp-fab-url'] || '';
  ['#wpp-btn-text','#wpp-url','#wpp-fab-url'].forEach(sel => {
    const el = $(sel);
    if (!el) return;
    el.addEventListener('input', () => {
      const map = { '#wpp-btn-text':'whatsapp-btn-text', '#wpp-url':'whatsapp-url', '#wpp-fab-url':'whatsapp-fab-url' };
      CFG.buttons[map[sel]] = el.value;
      applyToPreview();
    });
  });
}

// ── Tipografia ────────────────────────────────────────────────────────────────
function buildTypography() {
  const typo = CFG.typography || {};

  function syncSelect(id, key) {
    const el = $('#' + id);
    if (!el) return;
    el.value = typo[key] || el.options[0].value;
    el.addEventListener('change', () => {
      CFG.typography[key] = el.value;
      applyToPreview();
    });
  }
  syncSelect('font-body',    '--font-body');
  syncSelect('font-display', '--font-display');

  function initFsSlider(slId, lblId, key, min, max, step, unit) {
    const sl  = $('#' + slId);
    const lbl = $('#' + lblId);
    if (!sl) return;
    const current = parseFloat(typo[key] || max);
    sl.value = current;
    lbl.textContent = current + unit;
    sl.addEventListener('input', () => {
      lbl.textContent = sl.value + unit;
      CFG.typography[key] = sl.value + unit;
      applyToPreview();
    });
  }
  initFsSlider('sl-fs-body', 'lbl-fs-body', '--fs-body',           0.8, 1.25, 0.05, 'rem');
  initFsSlider('sl-fs-xl',   'lbl-fs-xl',   '--fs-display-xl-max', 3,   7,    0.25, 'rem');
  initFsSlider('sl-fs-lg',   'lbl-fs-lg',   '--fs-display-lg-max', 2,   5,    0.25, 'rem');
}

// ── Textos ────────────────────────────────────────────────────────────────────
function buildCopy() {
  const copy = CFG.copy || {};
  $$('[data-copy]').forEach(el => {
    el.value = copy[el.dataset.copy] || '';
    el.addEventListener('input', () => {
      CFG.copy[el.dataset.copy] = el.value;
      applyToPreview();
    });
  });
}

// ── Imagens ───────────────────────────────────────────────────────────────────
const IMAGE_LABELS = {
  'logo':               'Logo principal',
  'logo-footer':        'Logo rodapé',
  'hero-desktop':       'Hero (desktop)',
  'hero-mobile':        'Hero (mobile)',
  'two-comma':          'Two Comma Award',
  'depoimento-04':      'Depoimento 04',
  'depoimento-05':      'Depoimento 05',
  'depoimento-06':      'Depoimento 06',
  'depoimento-07':      'Depoimento 07',
  'depoimento-08':      'Depoimento 08',
  'depoimento-09':      'Depoimento 09',
  'depoimento-10':      'Depoimento 10',
  'depoimento-11':      'Depoimento 11',
  'depoimento-12':      'Depoimento 12',
  'premiacao-1':        'Premiação 1',
  'premiacao-2':        'Premiação 2',
  'premiacao-3':        'Premiação 3',
  'premiacao-4':        'Premiação 4',
  'premiacao-5':        'Premiação 5',
  'premiacao-6':        'Premiação 6',
  'isadora-duarte':     'Isadora Duarte',
  'milena-nobrega':     'Milena Nóbrega',
  'talita-marques':     'Talita Marques',
  'camila-nardi':       'Camila Nardi',
  'julia-pretti':       'Júlia da Silva',
  'kau-miranda':        'Kau Miranda',
  'maia-santos':        'Maia Santos',
  'marcella-estevs':    'Marcella Estevs',
  'vika-ferrari':       'Vika Ferrari',
  'bruno-rodrigues':    'Bruno Rodrigues',
  'adriel-araujo-power-ppt': 'Adriel Araújo',
  'anhanguera':         'Anhanguera',
  'universidade-de-fortaleza': 'Univ. Fortaleza',
  'eduzz':              'Eduzz',
  'kiwify':             'Kiwify',
  'onm':                'O Novo Mercado'
};

// Map de chaves para os caminhos padrão do site
const IMAGE_DEFAULTS = {
  'logo':               '/chave/assets/img/logo-chave.svg',
  'logo-footer':        '/chave/assets/img/OutsiderSchool-logo-completa.svg',
  'hero-desktop':       '/chave/assets/img/hero-2.webp',
  'hero-mobile':        '/chave/assets/img/hero-mobile.webp',
  'two-comma':          '/chave/assets/img/two-comma.webp',
  'depoimento-04':      '/chave/assets/img/depoimento-04.webp',
  'depoimento-05':      '/chave/assets/img/depoimento-05.webp',
  'depoimento-06':      '/chave/assets/img/depoimento-06.webp',
  'depoimento-07':      '/chave/assets/img/depoimento-07.webp',
  'depoimento-08':      '/chave/assets/img/depoimento-08.webp',
  'depoimento-09':      '/chave/assets/img/depoimento-09.webp',
  'depoimento-10':      '/chave/assets/img/depoimento-10.webp',
  'depoimento-11':      '/chave/assets/img/depoimento-11.webp',
  'depoimento-12':      '/chave/assets/img/depoimento-12.webp',
  'premiacao-1':        '/chave/assets/img/premiacao-1.webp',
  'premiacao-2':        '/chave/assets/img/premiacao-2.webp',
  'premiacao-3':        '/chave/assets/img/premiacao-3.webp',
  'premiacao-4':        '/chave/assets/img/premiacao-4.webp',
  'premiacao-5':        '/chave/assets/img/premiacao-5.webp',
  'premiacao-6':        '/chave/assets/img/premiacao-6.webp',
  'isadora-duarte':     '/chave/assets/img/isadora-duarte.webp',
  'milena-nobrega':     '/chave/assets/img/milena-nobrega.webp',
  'talita-marques':     '/chave/assets/img/talita-marques.webp',
  'camila-nardi':       '/chave/assets/img/camila-nardi.webp',
  'julia-pretti':       '/chave/assets/img/julia-pretti.webp',
  'kau-miranda':        '/chave/assets/img/kau-miranda.webp',
  'maia-santos':        '/chave/assets/img/maia-santos.webp',
  'marcella-estevs':    '/chave/assets/img/marcella-estevs.webp',
  'vika-ferrari':       '/chave/assets/img/vika-ferrari.webp',
  'bruno-rodrigues':    '/chave/assets/img/bruno-rodrigues.webp',
  'adriel-araujo-power-ppt': '/chave/assets/img/adriel-araujo-power-ppt.webp',
  'anhanguera':         '/chave/assets/img/anhanguera.webp',
  'universidade-de-fortaleza': '/chave/assets/img/universidade-de-fortaleza.webp',
  'eduzz':              '/chave/assets/img/eduzz.webp',
  'kiwify':             '/chave/assets/img/kiwify.webp',
  'onm':                '/chave/assets/img/onm.webp'
};

function buildImages() {
  const grid = $('#img-grid');
  grid.innerHTML = '';
  const images = CFG.images || {};

  Object.entries(IMAGE_LABELS).forEach(([key, label]) => {
    const current = images[key] || IMAGE_DEFAULTS[key] || '';
    const card = document.createElement('div');
    card.className = 'img-card';
    card.innerHTML = `
      <img class="img-card__thumb" src="${current}" alt="${label}" loading="lazy"/>
      <div class="img-card__body">
        <span class="img-card__label">${label}</span>
        <div class="img-card__actions">
          <label class="btn btn--ghost btn--sm" style="cursor:pointer;">
            Trocar <input type="file" data-img-field="${key}" accept="image/*"/>
          </label>
          <button class="btn btn--ghost btn--sm" data-img-reset="${key}" title="Remover personalização">↺</button>
        </div>
      </div>`;
    grid.appendChild(card);

    // Upload
    card.querySelector('[data-img-field]').addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const url = await uploadFile(key, file);
        CFG.images[key] = url;
        card.querySelector('.img-card__thumb').src = url;
        applyToPreview();
        toast('Imagem "' + label + '" atualizada');
      } catch (err) { toast('Erro: ' + err.message, 'err'); }
    });

    // Reset
    card.querySelector('[data-img-reset]').addEventListener('click', () => {
      CFG.images[key] = null;
      card.querySelector('.img-card__thumb').src = IMAGE_DEFAULTS[key] || '';
      applyToPreview();
    });
  });

  // SEO image uploads
  $$('[data-upload-field]').forEach(input => {
    input.addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;
      const field = input.dataset.uploadField;
      try {
        const url = await uploadFile(field, file);
        CFG.seo = CFG.seo || {};
        CFG.seo[field] = url;
        const preview = $('#' + field + '-preview');
        if (preview) preview.src = url;
        applyToPreview();
        toast('Imagem atualizada');
      } catch (err) { toast('Erro: ' + err.message, 'err'); }
    });
  });
}

// ── Vídeo ─────────────────────────────────────────────────────────────────────
function buildVideo() {
  const ytId = (CFG.video || {})['youtube-id'] || '';
  const input = $('#youtube-id');
  input.value = ytId;
  updateYtPreview(ytId);
  input.addEventListener('input', () => {
    CFG.video = CFG.video || {};
    CFG.video['youtube-id'] = input.value.trim();
    updateYtPreview(input.value.trim());
    applyToPreview();
  });
}

function updateYtPreview(id) {
  const container = $('#yt-preview');
  if (!id) { container.innerHTML = ''; return; }
  container.innerHTML = `<img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" style="width:100%;border-radius:8px;"/>`;
}

// ── SEO ───────────────────────────────────────────────────────────────────────
function buildSeo() {
  const seo = CFG.seo || {};
  $$('[data-seo]').forEach(el => {
    el.value = seo[el.dataset.seo] || '';
    el.addEventListener('input', () => {
      CFG.seo[el.dataset.seo] = el.value;
    });
  });
  if (seo['og-image']) $('#og-image-preview').src = seo['og-image'];
  if (seo['favicon'])  $('#favicon-preview').src  = seo['favicon'];
}

// ── Preview ao vivo ───────────────────────────────────────────────────────────
function applyToPreview() {
  const frame = $('#preview-frame');
  if (!frame || !frame.contentWindow) return;
  try {
    const root = frame.contentDocument.documentElement;
    const fWin = frame.contentWindow;

    // CSS vars: cores
    Object.entries(CFG.colors || {}).forEach(([k,v]) => root.style.setProperty(k, v));

    // CSS vars: tipografia
    const typo = CFG.typography || {};
    ['--font-body','--font-display','--fs-body'].forEach(k => {
      if (typo[k]) root.style.setProperty(k, typo[k]);
    });
    if (typo['--fs-display-xl-max'])
      root.style.setProperty('--fs-display-xl', `clamp(2.5rem, 1.6rem + 4.2vw, ${typo['--fs-display-xl-max']})`);
    if (typo['--fs-display-lg-max'])
      root.style.setProperty('--fs-display-lg', `clamp(2rem, 1.4rem + 2.8vw, ${typo['--fs-display-lg-max']})`);

    // CSS vars: radius
    const btns = CFG.buttons || {};
    ['--radius','--radius-sm','--radius-lg','--radius-xl'].forEach(k => {
      if (btns[k]) root.style.setProperty(k, btns[k]);
    });

    // Textos via data-cms
    const copy = CFG.copy || {};
    fWin.document.querySelectorAll('[data-cms]').forEach(el => {
      const key = el.dataset.cms;
      if (copy[key] !== undefined) el.innerHTML = copy[key];
    });

    // Botões CTA
    const ctaTexts = btns['cta-texts'] || [];
    fWin.document.querySelectorAll('[data-cms-cta]').forEach(el => {
      const idx = parseInt(el.dataset.cmsCta, 10);
      if (ctaTexts[idx] !== undefined) el.textContent = ctaTexts[idx];
    });

    // WhatsApp text
    if (btns['whatsapp-btn-text'])
      fWin.document.querySelectorAll('[data-cms="whatsapp-btn-text"]').forEach(el => {
        el.textContent = btns['whatsapp-btn-text'];
      });

    // Links WhatsApp
    if (btns['whatsapp-url'])
      fWin.document.querySelectorAll('[data-cms-href="whatsapp-url"]').forEach(el => { el.href = btns['whatsapp-url']; });
    if (btns['whatsapp-fab-url'])
      fWin.document.querySelectorAll('[data-cms-href="whatsapp-fab-url"]').forEach(el => { el.href = btns['whatsapp-fab-url']; });

    // Imagens
    Object.entries(CFG.images || {}).forEach(([key, path]) => {
      if (!path) return;
      fWin.document.querySelectorAll(`[data-cms-img="${key}"]`).forEach(el => {
        if (el.tagName === 'IMG')         el.src    = path;
        else if (el.tagName === 'SOURCE') el.srcset = path;
      });
    });
  } catch {
    // Cross-origin ou frame ainda carregando — silencioso
  }
}

// ── Salvar ────────────────────────────────────────────────────────────────────
async function saveConfig() {
  try {
    await api('POST', '/api/config', CFG);
    toast('Configurações salvas com sucesso!');
    $('#preview-frame').src = $('#preview-frame').src; // reload preview
  } catch (err) { toast('Erro ao salvar: ' + err.message, 'err'); }
}

// ── Resetar ───────────────────────────────────────────────────────────────────
async function resetConfig() {
  if (!confirm('Restaurar todas as configurações para o padrão original?')) return;
  try {
    await api('POST', '/api/reset');
    await loadConfig();
    buildUI();
    toast('Configurações restauradas!');
    $('#preview-frame').src = $('#preview-frame').src;
  } catch (err) { toast('Erro ao resetar: ' + err.message, 'err'); }
}

// ── Build UI ─────────────────────────────────────────────────────────────────
function buildUI() {
  buildColors();
  buildButtons();
  buildTypography();
  buildCopy();
  buildImages();
  buildVideo();
  buildSeo();
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setupNav();

  $('#login-btn').addEventListener('click', login);
  $('#pwd-input').addEventListener('keydown', e => { if (e.key === 'Enter') login(); });
  $('#save-btn').addEventListener('click', saveConfig);
  $('#reset-btn').addEventListener('click', resetConfig);
  $('#logout-btn').addEventListener('click', logout);

  // Atualiza applyToPreview quando o iframe termina de carregar
  $('#preview-frame').addEventListener('load', () => {
    setTimeout(applyToPreview, 300);
  });

  // Se já tem token salvo, tenta entrar direto
  if (TOKEN) showApp().catch(logout);
});
