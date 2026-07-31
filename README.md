# Sk Book Reader

App de leitura de livros em PDF por voz (Text-to-Speech). Importe um PDF, ouça em voz alta e retome de onde parou, em qualquer sessão.

## Stack

- React + Vite + TypeScript
- `pdfjs-dist` para extração de texto do PDF (carregado sob demanda na tela de upload)
- Web Speech API (`speechSynthesis`) para narração — nativa do navegador, sem custo
- Supabase (Auth, Postgres, Storage)

## Rodando localmente

```bash
npm install
cp .env.example .env   # já vem preenchido com o projeto Supabase configurado
npm run dev
```

## Supabase

O schema vive no schema `public` do projeto, com prefixo `br_` para não colidir com outras tabelas do mesmo projeto:

- `br_books` — livros importados (título, autor, arquivo, cor da capa, texto extraído por página)
- `br_reading_progress` — página/posição onde cada usuário parou em cada livro
- `br_user_settings` — voz escolhida, tamanho da fonte, tema de leitura, destaque de palavra

Todas com Row Level Security: cada usuário só enxerga e edita seus próprios dados (`auth.uid() = user_id`).

Bucket de Storage `book-files` (privado) guarda os PDFs originais, isolados por pasta `user_id/`.

## Telas

Login/Cadastro · Estante · Adicionar livro (upload + extração) · Detalhes do livro · Leitor (TTS) · Configurações.
