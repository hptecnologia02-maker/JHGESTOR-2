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
| `VITE_STRIPE_PUBLISHABLE_KEY` | *Sua Chave Pública do Stripe* | Ex: `pk_test_...` |
| `VITE_SUPABASE_FUNC_URL` | *URL das suas Edge Functions* | Ex: `https://xyz.supabase.co/functions/v1` |

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

## 5. Configurar Stripe e Edge Functions (Backend)

Para que os pagamentos e o trial de 7 dias funcionem em produção:

1. **Dashboard do Stripe**:
   - Crie seus produtos (Essencial, Profissional, Corporativo) e copie os **ID do Preço** (ex: `price_123...`).
   - Obtenha sua **Secret Key** (`sk_test_...`).
   - Crie um Webhook apontando para `https://xyz.supabase.co/functions/v1/stripe-webhook` e obtenha o **Webhook Secret** (`whsec_...`).

2. **Supabase Edge Functions**:
   - Use o CLI do Supabase para configurar os segredos:
     ```bash
     supabase secrets set STRIPE_SECRET_KEY=sua_sk_aqui
     supabase secrets set STRIPE_WEBHOOK_SECRET=seu_whsec_aqui
     supabase secrets set STRIPE_PRO_PRICE_ID=price_id_do_plano_pro
     supabase secrets set STRIPE_ENTERPRISE_PRICE_ID=price_id_do_plano_ent
     ```
   - Faça o deploy das funções:
     ```bash
     supabase functions deploy stripe
     supabase functions deploy stripe-webhook
     ```

---

## 6. Banco de Dados (Passo Final)

Execute o arquivo [NEW_SUPABASE_SCHEMA.sql](file:///c:/Users/heric/Downloads/jhgestor---sistema-saas/NEW_SUPABASE_SCHEMA.sql) no Editor SQL do Supabase. Ele contém todas as tabelas, RLS e colunas de trial/Stripe necessárias.

---

## ✅ Conclusão

Após realizar esses passos, faça um novo **Deploy** na Vercel. O JHGESTOR estará 100% pronto para vender assinaturas e gerenciar tenants automaticamente!

