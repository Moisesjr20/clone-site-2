/* A Chave · lightweight interactions
   Mantido minimal para preservar Lighthouse score. */
(() => {
  'use strict';

  // Sinaliza pro CSS que JS carregou (só aí o reveal esconde conteúdo)
  document.body.classList.add('js-ready');

  // ---------- Reveal on scroll ----------
  const revealTargets = document.querySelectorAll(
    '.section-head, .pilar, .timeline__step, .inc-card, .premio, .resultados__grid img, .aluno, .two-comma__grid, .prova__logos'
  );
  revealTargets.forEach(el => el.setAttribute('data-reveal', ''));

  // Stagger índice para a timeline (jornada)
  document.querySelectorAll('.timeline__step').forEach((el, i) => {
    el.style.setProperty('--idx', i);
  });

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });

    revealTargets.forEach(el => io.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add('is-visible'));
  }

  // ---------- YouTube facade (lazy iframe) ----------
  // enablejsapi=1 + postMessage 'playVideo' no load = autoplay em 1 clique
  document.querySelectorAll('.yt-facade').forEach(facade => {
    facade.addEventListener('click', function () {
      const id = this.dataset.videoId;
      if (!id) return;
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${id}?enablejsapi=1&autoplay=1&playsinline=1&rel=0&modestbranding=1`;
      iframe.title = this.querySelector('img')?.alt || 'Vídeo';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      iframe.loading = 'eager';
      iframe.addEventListener('load', () => {
        try {
          iframe.contentWindow.postMessage(
            '{"event":"command","func":"playVideo","args":""}', '*'
          );
        } catch (e) { /* cross-origin: tudo bem, autoplay=1 ainda tenta */ }
      }, { once: true });
      this.innerHTML = '';
      this.appendChild(iframe);
      this.style.cursor = 'default';
    }, { once: true });
  });

  // ---------- Modal (form em pop-up) ----------
  const openModal = (modal) => {
    modal.hidden = false;
    document.body.classList.add('modal-open');
    setTimeout(() => {
      const firstInput = modal.querySelector('input:not([type=hidden]), select, textarea');
      if (firstInput) firstInput.focus({ preventScroll: true });
    }, 120);
  };
  const closeModal = (modal) => {
    modal.hidden = true;
    document.body.classList.remove('modal-open');
  };

  document.querySelectorAll('[data-open-modal]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const id = trigger.getAttribute('data-open-modal');
      const modal = document.getElementById(`${id}-modal`);
      if (modal) openModal(modal);
    });
  });

  document.querySelectorAll('[data-close-modal]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const modal = el.closest('.modal');
      if (modal) closeModal(modal);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal:not([hidden])').forEach(closeModal);
    }
  });

  // ---------- Form handling ----------
  const form = document.getElementById('apply');
  if (!form) return;

  const showError = (field, msg) => {
    field.classList.add('is-error');
    let err = field.querySelector('.field__error');
    if (!err) {
      err = document.createElement('span');
      err.className = 'field__error';
      field.appendChild(err);
    }
    err.textContent = msg;
  };

  const clearError = (field) => {
    field.classList.remove('is-error');
    const err = field.querySelector('.field__error');
    if (err) err.remove();
  };

  const validate = () => {
    let ok = true;
    form.querySelectorAll('.field').forEach(clearError);

    const nome = form.nome.value.trim();
    if (nome.length < 2) { showError(form.nome.closest('.field'), 'Informe seu nome completo.'); ok = false; }

    const email = form.email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError(form.email.closest('.field'), 'Email inválido.'); ok = false; }

    const phone = form.phone.value.trim();
    if (phone.replace(/\D/g, '').length < 10) { showError(form.phone.closest('.field'), 'Informe um WhatsApp válido.'); ok = false; }

    const instagram = form.instagram.value.trim();
    if (instagram.length < 2) { showError(form.instagram.closest('.field'), 'Informe seu Instagram.'); ok = false; }

    if (!form.faturamento_mensal.value) { showError(form.faturamento_mensal.closest('.field'), 'Selecione uma faixa.'); ok = false; }

    const dificuldade = form.maior_dificuldade.value.trim();
    if (dificuldade.length < 10) { showError(form.maior_dificuldade.closest('.field'), 'Conta pra gente em algumas linhas.'); ok = false; }

    return ok;
  };

  // Captura UTMs da URL atual
  const utmParams = (() => {
    const p = new URLSearchParams(window.location.search);
    const out = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(k => {
      const v = p.get(k);
      if (v) out[k] = v;
    });
    return out;
  })();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (form.website.value) return; // honeypot

    // Remove qualquer mensagem anterior
    form.querySelectorAll('.form__success, .form__fail').forEach(el => el.remove());

    form.classList.add('form--loading');
    const submitBtn = form.querySelector('button[type="submit"] span');
    const originalText = submitBtn ? submitBtn.textContent : null;
    if (submitBtn) submitBtn.textContent = 'Enviando…';

    const payload = {
      nome: form.nome.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      instagram: form.instagram.value.trim(),
      faturamento_mensal: form.faturamento_mensal.value,
      maior_dificuldade: form.maior_dificuldade.value.trim(),
      // path da landing atual — vira utm_page no payload do webhook
      landing_path: window.location.pathname,
      ...utmParams,
    };

    try {
      const r = await fetch('https://automate.georgesoares.com.br/webhook-test/funil_aplica', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await r.json().catch(() => ({}));

      form.classList.remove('form--loading');
      if (submitBtn && originalText) submitBtn.textContent = originalText;

      if (r.ok && data.success) {
        const msg = document.createElement('div');
        msg.className = 'form__success';
        msg.textContent = 'Aplicação recebida! Nosso time vai analisar seu caso e entrar em contato em até 48h.';
        form.appendChild(msg);
        form.reset();
      } else if (r.status === 400 && data.fields) {
        Object.entries(data.fields).forEach(([fieldName, errMsg]) => {
          const input = form.querySelector(`[name="${fieldName}"]`);
          if (input) showError(input.closest('.field'), errMsg);
        });
      } else {
        const msg = document.createElement('div');
        msg.className = 'form__fail';
        msg.textContent = data.error || 'Algo deu errado. Tenta novamente em alguns segundos.';
        form.appendChild(msg);
      }
    } catch (err) {
      form.classList.remove('form--loading');
      if (submitBtn && originalText) submitBtn.textContent = originalText;
      const msg = document.createElement('div');
      msg.className = 'form__fail';
      msg.textContent = 'Sem conexão. Verifica sua internet e tenta de novo.';
      form.appendChild(msg);
    }
  });

  // Clear error ao digitar
  form.querySelectorAll('input, select, textarea').forEach(input => {
    input.addEventListener('input', () => clearError(input.closest('.field')));
    input.addEventListener('change', () => clearError(input.closest('.field')));
  });
})();
