# 🚀 Guia de Deploy na Vercel (Produção)

Este guia contém todos os passos necessários para configurar seu projeto **JHGESTOR** no domínio `https://jhgestor.vercel.app/`.

> **⚠️ IMPORTANTE**: O código já foi adaptado para ler as variáveis de ambiente. Você NÃO precisa alterar o código, apenas configurar os serviços externos.

---

## 1. Configurar Variáveis de Ambiente na Vercel

No painel do seu projeto na Vercel, vá em **Settings > Environment Variables** e adicione as seguintes chaves.

| Chave (Key) | Valor (Value) | Descrição |
|---|---|---|
| `VITE_SUPABASE_URL` | *Sua URL do Supabase* | Ex: `https://xyz.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | *Sua Anon Key* | A chave pública do Supabase |
| `GEMINI_API_KEY` | *Sua API Key do Google Gemini* | Para IA (se usado) |
| `VITE_FACEBOOK_APP_ID` | `748657001200436` | ID do App Meta (ou outro se criar novo) |
| `VITE_GOOGLE_CLIENT_ID` | *Seu Client ID do Google* | Ex: `171...apps.googleusercontent.com` |

> *Dica: Você pode copiar os valores atuais do arquivo `supabaseClient.ts` e `constants.tsx` antes de subir, ou usar os que já estão funcionando localmente.*

---

## 2. Configurar Autenticação do Supabase

Para que o Login funcione em produção, você precisa autorizar o domínio da Vercel.

1. Acesse seu painel no [Supabase](https://supabase.com/dashboard).
2. Vá em **Authentication > URL Configuration**.
3. Em **Site URL**, coloque:
   `https://jhgestor.vercel.app/`
4. Em **Redirect URLs**, adicione:
   `https://jhgestor.vercel.app/`
   `https://jhgestor.vercel.app/**`

---

## 3. Configurar Google Calendar (Google Cloud Console)

Para que a sincronização de agenda funcione:

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. Vá em **APIs e Serviços > Credenciais**.
3. Edite seu **ID do cliente OAuth 2.0**.
4. Em **Origens JavaScript autorizadas**, ADICIONE:
   `https://jhgestor.vercel.app`
   `https://jhgestor.vercel.app/`
5. **Salve**.
   
> *Nota: Pode levar alguns minutos para propagar.*

---

## 4. Configurar Meta Ads (Facebook Developers)

Para conectar o gerenciador de anúncios:

1. Acesse [developers.facebook.com](https://developers.facebook.com/).
2. Selecione seu App (**JHGestor SaaS**).
3. No menu lateral, vá em **Configurações > Básico**.
4. Em **Domínios do Aplicativo**, adicione:
   `jhgestor.vercel.app`
5. Role até o final da página. Se houver plataforma "Website", verifique a **URL do Site**.
   - Mude para: `https://jhgestor.vercel.app/`
6. **Salve as alterações**.
7. Vá em **Login do Facebook > Configurações**.
8. Em **URIs de Redirecionamento do OAuth Válidos**, adicione:
   `https://jhgestor.vercel.app/`
   `https://jhgestor.vercel.app/ads`
9. **IMPORTANTE (Correção do Erro JSSDK):**
   - Na mesma tela, procure a opção **"Login com o SDK do JavaScript"**.
   - Mude para **SIM**.
   - Em **"Domínios permitidos para o SDK do JavaScript"**, adicione:
     `https://jhgestor.vercel.app/`
   - **Salve as alterações**.

---

## ✅ Conclusão

Após realizar esses passos, faça um novo **Deploy** na Vercel (ou aguarde o deploy automático do Git) e o sistema estará 100% funcional no novo domínio.
