# Site de arquivos

Site em Next.js (App Router) que serve **qualquer tipo de arquivo** por URL
direta, guardando tudo num repositório público do GitHub (o Vercel só roda o
código do site, não guarda os arquivos).

## Como cada tipo de arquivo se comporta

O servidor primeiro **olha os bytes reais do arquivo** (assinatura/magic
number) pra descobrir o tipo verdadeiro — só cai pra extensão do nome se não
reconhecer nada nos bytes (o caso de arquivos de texto: html, css, js, json,
csv, código-fonte, que não têm assinatura binária). Ou seja: se você subir
uma foto chamada `foto.enc`, ela é detectada como imagem de verdade e
**aparece**, não baixa — a extensão erra, os bytes não.

O navegador então decide o que fazer com o tipo detectado:

| Tipo real | O que acontece ao abrir |
|---|---|
| `.html` | Vira página de verdade (renderiza HTML/CSS/JS que ela referenciar) |
| PDF | Abre no leitor de PDF do navegador |
| Imagem (`png/jpg/gif/webp/bmp/ico`) | Mostra a imagem, não importa a extensão do nome |
| Áudio/vídeo (`mp3/wav/ogg/mp4/webm`) | Toca |
| `.css .js` | Servidos com o tipo certo — funcionam normalmente quando referenciados por um `.html` |
| `.ts .tsx .jsx .php .py .csv .json .md .sql ...` (texto puro) | Mostrados como **texto** (não existe "rodar" isso num navegador; `.php` precisaria de um servidor com PHP, que esse projeto não tem) |
| Zip/7z/rar (mesmo se renomeado) | Baixa como arquivo compactado |
| Qualquer outra coisa desconhecida (`.xod`, binários sem assinatura reconhecida, ...) | Baixa como arquivo binário |

### Ver o código-fonte de qualquer arquivo

Prefixe a URL com `/raw/` pra forçar ver como texto puro, mesmo que seja um
`.html`:

```
seusite.vercel.app/site/index.html       -> a página renderizada
seusite.vercel.app/raw/site/index.html   -> o código-fonte, como texto
```

### Sites inteiros (HTML + CSS + JS)

Como a estrutura de pastas é preservada, dá pra subir um site inteiro (ex:
`index.html`, `css/estilo.css`, `js/script.js`) numa pasta e ele funciona
normal — o `index.html` referencia os outros arquivos com caminho relativo, e
cada um é servido com o Content-Type certo.

## Passo a passo

### 1. Criar o repositório de arquivos

Crie um repositório **público** no GitHub (ex: `meus-arquivos`). Pode
começar vazio.

### 2. Gerar um token do GitHub

**GitHub → Settings → Developer settings → Fine-grained tokens → Generate
new token**

- Repository access: apenas o repositório do passo 1.
- Permissions → Contents: **Read and write**.

### 3. Configurar as variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```
ADMIN_PASSWORD=sua-senha
GITHUB_TOKEN=o-token-do-passo-2
GITHUB_OWNER=seu-usuario-do-github
GITHUB_REPO=meus-arquivos
GITHUB_BRANCH=main
GITHUB_FILES_PATH=files
```

### 4. Rodar localmente (opcional)

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000/admin`.

### 5. Deploy na Vercel

1. Suba este projeto (o código do site) para um repositório no GitHub —
   pode ser um repo diferente do repo de arquivos.
2. Importe na Vercel.
3. Em **Project Settings → Environment Variables**, adicione as mesmas
   variáveis do passo 3.
4. Deploy.

## No `/admin`

- **Login único**: uma senha só, guardada em `ADMIN_PASSWORD`.
- **Enviar arquivos avulsos**: seleciona um ou vários de qualquer tipo.
- **Enviar pasta inteira**: mantém a estrutura de subpastas — é o que você
  usa pra subir um site com `index.html` + `css/` + `js/`.
- **Apagar**: remove o arquivo do repositório (é um commit de remoção).
- Ao lado de cada arquivo tem o link **"ver código"**, que abre a versão
  `/raw/...` (texto puro) daquele arquivo.

## Limitações a saber

- **Repositório público** = qualquer pessoa com o link consegue abrir o
  arquivo. Isso é esperado, já que o objetivo é servir arquivos publicamente.
- **`.php` e outras linguagens server-side não executam.** Esse projeto não
  tem — e o Vercel não oferece — um interpretador PHP. O arquivo `.php`
  aparece como texto, não roda.
- **Formatos proprietários sem suporte do navegador** (ex: `.xod` do
  PDF-XChange) baixam como arquivo binário; não há como "abrir" isso sem
  converter para um formato que o navegador entenda (ex: PDF).
- **Arquivos muito grandes**: como o servidor baixa o arquivo inteiro na
  memória antes de checar os bytes (pra fazer o sniffing), arquivos enormes
  (centenas de MB) podem esbarrar no limite de memória/tempo das funções
  serverless da Vercel. Pra PDFs, imagens e a maioria dos arquivos de site
  isso não é problema.
