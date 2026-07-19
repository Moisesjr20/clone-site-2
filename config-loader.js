(async () => {
  let cfg;
  try { cfg = await fetch('/api/config').then(r => r.json()); }
  catch { return; }

  const root = document.documentElement;

  // ── 1. CSS VARS: cores ────────────────────────────────────────────────────
  Object.entries(cfg.colors || {}).forEach(([k, v]) => root.style.setProperty(k, v));

  // ── 2. CSS VARS: tipografia ───────────────────────────────────────────────
  const typo = cfg.typography || {};
  ['--font-body','--font-display','--fs-body'].forEach(k => {
    if (typo[k]) root.style.setProperty(k, typo[k]);
  });
  // Clamp overrides para display-xl e display-lg
  if (typo['--fs-display-xl-max'])
    root.style.setProperty('--fs-display-xl',
      `clamp(2.5rem, 1.6rem + 4.2vw, ${typo['--fs-display-xl-max']})`);
  if (typo['--fs-display-lg-max'])
    root.style.setProperty('--fs-display-lg',
      `clamp(2rem, 1.4rem + 2.8vw, ${typo['--fs-display-lg-max']})`);

  // ── 3. CSS VARS: botões / radius ──────────────────────────────────────────
  const btns = cfg.buttons || {};
  ['--radius','--radius-sm','--radius-lg','--radius-xl'].forEach(k => {
    if (btns[k]) root.style.setProperty(k, btns[k]);
  });

  // ── 4. TEXTOS via data-cms ────────────────────────────────────────────────
  const copy = cfg.copy || {};
  document.querySelectorAll('[data-cms]').forEach(el => {
    const key = el.dataset.cms;
    if (copy[key] !== undefined) el.innerHTML = copy[key];
  });

  // ── 5. TEXTOS DOS BOTÕES CTA ──────────────────────────────────────────────
  const ctaTexts = btns['cta-texts'] || [];
  document.querySelectorAll('[data-cms-cta]').forEach(el => {
    const idx = parseInt(el.dataset.cmsCta, 10);
    if (ctaTexts[idx] !== undefined) el.textContent = ctaTexts[idx];
  });

  // Botão WhatsApp inline
  if (btns['whatsapp-btn-text']) {
    document.querySelectorAll('[data-cms="whatsapp-btn-text"]').forEach(el => {
      el.textContent = btns['whatsapp-btn-text'];
    });
  }

  // ── 6. LINKS WhatsApp ─────────────────────────────────────────────────────
  if (btns['whatsapp-url']) {
    document.querySelectorAll('[data-cms-href="whatsapp-url"]').forEach(el => {
      el.href = btns['whatsapp-url'];
    });
  }
  if (btns['whatsapp-fab-url']) {
    document.querySelectorAll('[data-cms-href="whatsapp-fab-url"]').forEach(el => {
      el.href = btns['whatsapp-fab-url'];
    });
  }
  if (copy['footer-terms-url']) {
    document.querySelectorAll('[data-cms-href="footer-terms-url"]').forEach(el => {
      el.href = copy['footer-terms-url'];
    });
  }
  if (copy['footer-email']) {
    document.querySelectorAll('[data-cms-href="footer-email"]').forEach(el => {
      el.href = 'mailto:' + copy['footer-email'];
    });
  }

  // ── 7. IMAGENS ────────────────────────────────────────────────────────────
  const images = cfg.images || {};
  document.querySelectorAll('[data-cms-img]').forEach(el => {
    const key = el.dataset.cmsImg;
    if (!images[key]) return;
    if (el.tagName === 'IMG')        el.src = images[key];
    else if (el.tagName === 'SOURCE') el.srcset = images[key];
    else                              el.style.backgroundImage = `url('${images[key]}')`;
  });

  // ── 8. VÍDEO YouTube ─────────────────────────────────────────────────────
  const ytId = (cfg.video || {})['youtube-id'];
  if (ytId) {
    document.querySelectorAll('[data-video-id]').forEach(el => {
      el.dataset.videoId = ytId;
      // Atualiza thumbnail do facade
      const img = el.querySelector('img');
      if (img) img.src = `https://i.ytimg.com/vi_webp/${ytId}/maxresdefault.webp`;
    });
  }

  // ── 9. SEO ────────────────────────────────────────────────────────────────
  const seo = cfg.seo || {};
  if (seo.title)          document.title = seo.title;
  if (seo.description)    _setMeta('description', seo.description);
  if (seo['og-title'])    _setMeta('og:title', seo['og-title'], true);
  if (seo['og-description']) _setMeta('og:description', seo['og-description'], true);
  if (seo['og-image'])    _setMeta('og:image', seo['og-image'], true);
  if (seo.favicon) {
    const link = document.querySelector("link[rel='icon']") || document.createElement('link');
    link.rel = 'icon'; link.href = seo.favicon;
    if (!link.parentNode) document.head.appendChild(link);
  }

  function _setMeta(name, content, isOg = false) {
    const sel = isOg ? `meta[property="${name}"]` : `meta[name="${name}"]`;
    let el = document.querySelector(sel);
    if (!el) {
      el = document.createElement('meta');
      if (isOg) el.setAttribute('property', name);
      else      el.setAttribute('name', name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }
})();
