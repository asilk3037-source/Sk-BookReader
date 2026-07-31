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

## Gerar o app Android (.apk)

O projeto já vem com [Capacitor](https://capacitorjs.com) configurado, empacotando o app web dentro de um projeto Android nativo (pasta `android/`), com ícone e splash screen já gerados a partir da marca do app.

Isso precisa ser feito na sua máquina (não dá pra compilar um `.apk` num ambiente sem o Android SDK instalado):

1. Instale o [Android Studio](https://developer.android.com/studio) (ele já vem com o Android SDK).
2. Na raiz do projeto: `npm install`
3. Sempre que mudar algo no código web, gere o build e sincronize com o projeto Android:
   ```bash
   npm run android:sync
   ```
4. Abra o projeto no Android Studio:
   ```bash
   npm run android:open
   ```
   (ou abra a pasta `android/` manualmente pelo Android Studio)
5. Espere o Gradle sincronizar (primeira vez demora, baixa o SDK/dependências) e depois:
   - Pra testar rápido no celular: conecte o aparelho via USB (modo desenvolvedor + depuração USB ativados) e clique em **Run ▶**.
   - Pra gerar um `.apk` instalável: menu **Build → Build App Bundle(s) / APK(s) → Build APK(s)**. O arquivo sai em `android/app/build/outputs/apk/`.
   - Pra publicar na Play Store: **Build → Generate Signed Bundle / APK**, criando sua própria keystore de assinatura.

Se mudar o ícone/splash, troque as imagens em `assets/` (`icon.png`, `icon-foreground.png`, `icon-background.png`, `splash.png`, `splash-dark.png`) e rode `npm run android:assets`.
