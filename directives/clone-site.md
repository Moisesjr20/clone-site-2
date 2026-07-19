# POP — Clone de Site Estático com Python

> Versão: 1.0 · Status: Ativo · Última atualização: 2026-07-19

---

## Objetivo

Fazer o download completo de um site estático (HTML + CSS + JS + imagens + fontes) e transformá-lo em um projeto local autocontido, com todos os caminhos de assets reescritos para relativos.

---

## Quando usar

- Você precisa criar uma versão customizável de uma landing page de terceiros
- O site-alvo não tem código-fonte disponível
- O objetivo final é montar um CMS sobre o clone (ver `cms-embed.md`)

---

## Stack

- Python 3.11+
- `requests`, `beautifulsoup4`, `brotli`

```bash
pip install requests beautifulsoup4 brotli
```

> **Por que `brotli`?** Servidores modernos retornam `Content-Encoding: br` mesmo quando o cliente pede `gzip`. Sem o pacote `brotli` instalado, o urllib3 não consegue descomprimir e os arquivos chegam corrompidos (CSS ilegível, SVG quebrado). Com o pacote instalado, a descompressão é automática e transparente.

---

## Estrutura do Script (`clone_site.py`)

```python
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import os, re

BASE_URL   = "https://site-alvo.com.br/pagina/"
OUTPUT_DIR = "pasta-destino"

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
# NÃO adicionar Accept-Encoding — deixar o requests/urllib3 negociar automaticamente

def fetch(url):
    return requests.get(url, headers=HEADERS, timeout=30)

def save(path, content, mode="wb"):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, mode) as f:
        f.write(content)
```

### Fluxo principal

1. Fetch do HTML da página principal
2. Parse com BeautifulSoup
3. Para cada `<link href>`, `<script src>`, `<img src>`, `<source srcset>`:
   - Montar URL absoluta via `urljoin(BASE_URL, href_relativo)`
   - Fazer download do asset
   - Calcular caminho relativo local
   - Salvar em `OUTPUT_DIR/`
4. Reescrever todos os atributos `href`/`src`/`srcset` no HTML para os caminhos locais relativos
5. Fazer o mesmo para URLs dentro dos arquivos CSS (`url("...")`)
6. Salvar `index.html` final

---

## Edge Cases Conhecidos

### Fontes do Google Fonts (`fonts.googleapis.com`)
- A requisição retorna um CSS com `@font-face` apontando para `fonts.gstatic.com`
- É necessário baixar o CSS de fontes e depois baixar cada `.woff2` individualmente
- Os `@font-face` no CSS de fontes também precisam ter as URLs reescritas para local

### SVGs inline vs externos
- SVGs como `<img src="logo.svg">` são baixados normalmente
- SVGs embutidos via `<svg>` no HTML não precisam de download

### Lazy loading / `data-src`
- Alguns frameworks usam `data-src` em vez de `src` para imagens lazy
- Verificar se o site usa esse padrão e incluir no parser se necessário

### Compressão Brotli
- **Problema:** servidor ignora `Accept-Encoding: gzip, deflate` e retorna `br` mesmo assim
- **Solução:** instalar `brotli` via pip — a descompressão vira automática no urllib3
- **Sintoma sem o fix:** CSS chega como bytes binários ilegíveis; SVG aparece corrompido

---

## Checklist de Execução

- [ ] Instalar dependências: `pip install requests beautifulsoup4 brotli`
- [ ] Definir `BASE_URL` e `OUTPUT_DIR` no script
- [ ] Rodar o script e verificar saída em `OUTPUT_DIR/`
- [ ] Abrir `index.html` diretamente no browser (file://) para validação visual
- [ ] Confirmar que CSS, fontes e imagens carregam sem erros no DevTools → Network
- [ ] Ajustar quaisquer caminhos quebrados manualmente se necessário

---

## Validação

Abrir o `index.html` **diretamente** via `file://` no browser (sem servidor) é o teste mais confiável. Diferenças visuais causadas por viewport diferente não são bugs do clone — são diferenças de resolução/zoom entre janelas.

---

## Referências

- Script base: `C:\Users\moise\OneDrive\...\Clonar Site\clone_site.py`
- Projeto de referência: `clone-site-2/` (clone de `https://p.outsiderschool.com.br/chave/`)
