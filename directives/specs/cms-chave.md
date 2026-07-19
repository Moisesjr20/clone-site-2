# Spec Técnica — CMS Visual · A Chave (Outsider School)

> Versão: 2.0 · Status: Aguardando aprovação · Data: 2026-07-19

---

## 1. Objetivo

CMS leve embutido no site clonado (`clonar site 2/`), acessível via `/admin` com senha fixa, que permita customizar **todos** os elementos visuais e de conteúdo do site — cores, botões, tipografia, arredondamento, imagens, textos, links, vídeo, formulário e SEO — sem tocar em código.

---

## 2. Stack

| Camada | Tecnologia |
|---|---|
| Servidor | Node.js v24 + Express |
| Persistência | `config.json` (arquivo local) |
| Upload | `multer` → pasta `custom-assets/` |
| Auth | Senha fixa → JWT (1h) no servidor |
| Frontend site + CMS | HTML/CSS/JS puro (sem framework/build) |

---

## 3. Estrutura de Arquivos

```
clonar site 2/
├── server.js
├── package.json
├── config.json                  ← tema ativo
├── config-defaults.json         ← backup dos valores originais (readonly)
├── custom-assets/               ← uploads do usuário
├── admin/
│   ├── index.html               ← painel CMS
│   ├── admin.css
│   └── admin.js
├── config-loader.js             ← injeta config no site em runtime
└── directives/specs/cms-chave.md
```

---

## 4. Elementos Customizáveis (Mapeamento Completo)

### 4.1 Cores
| Variável CSS | Label | Onde aparece |
|---|---|---|
| `--bg` | Fundo principal | body, seções |
| `--bg-soft` | Fundo suave | seção depoimentos |
| `--surface` | Cards | cards de inclusão |
| `--surface-2` | Cards internos | subcards |
| `--text` | Texto principal | todo o corpo |
| `--text-muted` | Texto secundário | subtítulos |
| `--text-dim` | Texto terciário | labels menores |
| `--bg-light` | Fundo claro | seção alunos |
| `--bg-gray` | Fundo cinza | seção WhatsApp |
| `--accent` | Dourado destaque | italic/em nos títulos |
| `--accent-soft` | Dourado suave | variações |
| `--accent-deep` | Dourado escuro | hover/deep |
| `--line` | Bordas sutis | separadores |
| `--line-strong` | Bordas fortes | contornos |

### 4.2 Botões
| Variável/Campo | Label | Tipo |
|---|---|---|
| `--cta` | Cor fundo botão | color-picker |
| `--cta-hover` | Cor hover botão | color-picker |
| `--cta-fg` | Cor texto botão | color-picker |
| `--whatsapp` | Cor botão WhatsApp | color-picker |
| `--radius` | Arredondamento botão | slider 0–40px |
| Texto botão 1 | "Quero que analisem meu caso" | text input |
| Texto botão 2 | "Quero aplicar o mesmo método" | text input |
| Texto botão 3 | "Quero resultados como esses" | text input |
| Texto botão 4 | "Quero fazer essa jornada" | text input |
| Texto botão 5 | "Quero acesso ao sistema completo" | text input |
| Texto botão 6 | "Quero aplicar agora" | text input |
| Texto botão WhatsApp | "Falar no WhatsApp agora" | text input |
| URL WhatsApp | Número + mensagem pré-preenchida | text input |
| URL WhatsApp FAB | Botão flutuante (mesmo ou diferente) | text input |

### 4.3 Arredondamentos Globais
| Variável | Label | Tipo |
|---|---|---|
| `--radius-sm` | Raio pequeno (6px) | slider 0–20px |
| `--radius` | Raio padrão (12px) | slider 0–40px |
| `--radius-lg` | Raio grande (20px) | slider 0–60px |
| `--radius-xl` | Raio extra (28px) | slider 0–80px |

### 4.4 Tipografia
| Campo | Label | Tipo |
|---|---|---|
| `--font-body` | Fonte corpo | dropdown (Manrope, Inter, Open Sans, Roboto, Lato) |
| `--font-display` | Fonte títulos | dropdown (Fraunces, Playfair Display, Cormorant, Libre Baskerville) |
| `--fs-body` | Tamanho base | slider 0.875–1.25rem |
| `--fs-display-xl` | Título hero (max) | slider 3–6rem |
| `--fs-display-lg` | Subtítulos (max) | slider 2–4.5rem |

### 4.5 Textos (Copy)
| Campo | Localização | Tipo |
|---|---|---|
| Nome da marca | Header "A CHAVE" | text input |
| Eyebrow hero | "Mentoria de aceleração · 12 meses" | text input |
| Título hero (linha 1) | "Todo mundo te ensinou a..." | textarea |
| Título hero (em itálico) | '"vender todos os dias"' | text input |
| Subtítulo hero (muted) | "Mas alguém te ajudou..." | textarea |
| Parágrafo hero (lede) | "Seu conhecimento vale mais..." | textarea (rich text leve) |
| Título da modal | "Chegou a hora de fazer..." | textarea |
| Subtítulo da modal | "A Chave é um programa por curadoria..." | textarea |
| Nota do formulário | "Ao enviar, você concorda em..." | text input |
| Copyright | "Copyright © 2026 — todos os direitos..." | text input |
| CNPJ/Endereço | "CNPJ: 45.441.456/0001-25 — Fortaleza/CE" | text input |
| Email de contato | "contato@postarpravender.com" | text input |
| Link Termos | "#" | text input (URL) |

### 4.6 Imagens
| Campo | Arquivo original |
|---|---|
| Logo principal | `chave/assets/img/logo-chave.svg` |
| Logo footer | `chave/assets/img/OutsiderSchool-logo-completa.svg` |
| Hero desktop | `chave/assets/img/hero-2.webp` |
| Hero mobile | `chave/assets/img/hero-mobile.webp` |
| Two Comma Award | `chave/assets/img/two-comma.webp` |
| Depoimento 04 a 12 (9×) | `chave/assets/img/depoimento-0X.webp` |
| Premiação 1 a 6 (6×) | `chave/assets/img/premiacao-X.webp` |
| Fotos alunos (11×) | isadora, milena, talita, camila, julia, kau, maia, marcella, vika, bruno, adriel |
| Logos parceiros (5×) | anhanguera, universidade-de-fortaleza, eduzz, kiwify, onm |

### 4.7 Vídeo
| Campo | Label | Tipo |
|---|---|---|
| YouTube Video ID | ID do vídeo embutido | text input (ex: `27Q7dFhQdJo`) |

### 4.8 SEO / Meta
| Campo | Label | Tipo |
|---|---|---|
| `<title>` | Título da aba | text input |
| `meta description` | Descrição SEO | textarea |
| `og:title` | OG Title | text input |
| `og:description` | OG Descrição | textarea |
| OG Image | Imagem compartilhamento | upload |
| Favicon | Ícone do site | upload |

---

## 5. config.json — Estrutura Completa

```json
{
  "colors": {
    "--bg": "#0a0a0a",
    "--bg-soft": "#111111",
    "--surface": "#151515",
    "--surface-2": "#1e1e1e",
    "--text": "#f5f5f5",
    "--text-muted": "#a1a1a1",
    "--text-dim": "#6b6b6b",
    "--bg-light": "#f5f5f3",
    "--bg-gray": "#16181b",
    "--accent": "#ebd197",
    "--accent-soft": "#f4e1b5",
    "--accent-deep": "#c9ab6b",
    "--cta": "#22c55e",
    "--cta-hover": "#16a34a",
    "--cta-fg": "#02120a",
    "--whatsapp": "#25d366",
    "--line": "rgba(255,255,255,0.08)",
    "--line-strong": "rgba(255,255,255,0.16)"
  },
  "buttons": {
    "--radius": "12px",
    "--radius-sm": "6px",
    "--radius-lg": "20px",
    "--radius-xl": "28px",
    "cta-texts": [
      "Quero que analisem meu caso",
      "Quero aplicar o mesmo método",
      "Quero resultados como esses",
      "Quero fazer essa jornada",
      "Quero acesso ao sistema completo",
      "Quero aplicar agora"
    ],
    "whatsapp-btn-text": "Falar no WhatsApp agora",
    "whatsapp-url": "https://wa.me/5585936180489?text=Oi!%20Tenho%20d%C3%BAvidas%20sobre%20A%20Chave",
    "whatsapp-fab-url": "https://wa.me/5585936180489?text=Oi!%20Tenho%20d%C3%BAvidas%20sobre%20A%20Chave"
  },
  "typography": {
    "--font-body": "'Manrope', system-ui, sans-serif",
    "--font-display": "'Fraunces', Georgia, serif",
    "--fs-body": "1rem",
    "--fs-display-xl-max": "5rem",
    "--fs-display-lg-max": "3.5rem"
  },
  "copy": {
    "brand-name": "A CHAVE",
    "hero-eyebrow": "Mentoria de aceleração · 12 meses",
    "hero-h1-line1": "Todo mundo te ensinou a",
    "hero-h1-em": "\"vender todos os dias\"",
    "hero-h1-muted": "Mas alguém te ajudou a implementar na prática?",
    "hero-lede": "Seu conhecimento vale mais do que suas vendas mostram...",
    "modal-title": "Chegou a hora de fazer seus produtos digitais trabalharem para você",
    "modal-sub": "A Chave é um programa por curadoria. Preencha abaixo e nosso time vai analisar seu caso em até 48 horas.",
    "form-note": "Ao enviar, você concorda em receber contato do nosso time pelo email e WhatsApp informados.",
    "footer-copyright": "Copyright © 2026 — todos os direitos reservados.",
    "footer-cnpj": "CNPJ: 45.441.456/0001-25 — Fortaleza/CE",
    "footer-email": "contato@postarpravender.com",
    "footer-terms-url": "#"
  },
  "images": {
    "logo": null,
    "logo-footer": null,
    "hero-desktop": null,
    "hero-mobile": null,
    "two-comma": null,
    "depoimento-04": null,
    "depoimento-05": null,
    "depoimento-06": null,
    "depoimento-07": null,
    "depoimento-08": null,
    "depoimento-09": null,
    "depoimento-10": null,
    "depoimento-11": null,
    "depoimento-12": null,
    "premiacao-1": null,
    "premiacao-2": null,
    "premiacao-3": null,
    "premiacao-4": null,
    "premiacao-5": null,
    "premiacao-6": null,
    "isadora-duarte": null,
    "milena-nobrega": null,
    "talita-marques": null,
    "camila-nardi": null,
    "julia-pretti": null,
    "kau-miranda": null,
    "maia-santos": null,
    "marcella-estevs": null,
    "vika-ferrari": null,
    "bruno-rodrigues": null,
    "adriel-araujo-power-ppt": null,
    "anhanguera": null,
    "universidade-de-fortaleza": null,
    "eduzz": null,
    "kiwify": null,
    "onm": null
  },
  "video": {
    "youtube-id": "27Q7dFhQdJo"
  },
  "seo": {
    "title": "A Chave · Mentoria de aceleração digital | Outsider School",
    "description": "Mentoria de 12 meses com Bruno Gomes...",
    "og-title": "A Chave · Mentoria de aceleração digital | Outsider School",
    "og-description": "Acompanhamento individual de 12 meses...",
    "og-image": null,
    "favicon": null
  }
}
```

---

## 6. API REST

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| `POST` | `/api/auth` | Valida senha → JWT | ✗ |
| `GET` | `/api/config` | Retorna config.json | ✗ (site precisa ler) |
| `POST` | `/api/config` | Salva config.json completo | ✓ |
| `POST` | `/api/upload/:field` | Upload imagem → `custom-assets/` | ✓ |
| `POST` | `/api/reset` | Restaura config-defaults.json | ✓ |

---

## 7. config-loader.js — Aplica tudo no site

- CSS vars → `document.documentElement.style.setProperty()`
- Textos → `[data-cms="campo"]` nos elementos do HTML
- Imagens → `[data-cms-img="campo"]` com src swap
- Botões → texto via `data-cms` + links via `data-cms-href`
- Vídeo → substitui o `data-video-id` do facade do YouTube
- SEO → `document.title`, `meta[name="description"]`, etc.

---

## 8. Painel CMS — Seções

1. **Login** — campo senha, botão entrar
2. **Cores** — 18 color-pickers agrupados (Fundo | Texto | Destaque | CTA)
3. **Botões** — cores de CTA, textos dos 6 botões, URL WhatsApp, arredondamentos
4. **Tipografia** — 2 dropdowns de fonte + sliders de tamanho
5. **Textos** — todos os campos de copy do site (hero, modal, footer)
6. **Imagens** — 35 cards com thumbnail atual + botão trocar
7. **Vídeo** — campo ID YouTube
8. **SEO** — title, description, OG, favicon, OG image
9. **Preview** — iframe ao vivo atualizando em tempo real

---

## 9. Segurança

- Senha validada só no servidor, nunca exposta no JS
- JWT 1h, assinado com secret randômico no start
- POST `/api/config`, `/api/upload`, `/api/reset` exigem `Authorization: Bearer <token>`
- Uploads: validação MIME `image/*`, max 5 MB, nome sanitizado

---

## 10. Dependências

```json
{ "express": "^4", "multer": "^1", "jsonwebtoken": "^9", "bcryptjs": "^2" }
```
