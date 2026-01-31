import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.0.0?target=deno'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    // CORS handling
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
        const proPrice = Deno.env.get('STRIPE_PRO_PRICE_ID')
        const enterprisePrice = Deno.env.get('STRIPE_ENTERPRISE_PRICE_ID')

        if (!stripeKey) throw new Error('STRIPE_SECRET_KEY não está configurada no Supabase')

        const stripe = new Stripe(stripeKey, {
            apiVersion: '2023-10-16',
        })

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const body = await req.json()
        const { action, userId, plan } = body
        console.log(`[STRIPE] Ação: ${action}, Usuário: ${userId}, Plano: ${plan}`)

        if (!userId) throw new Error('ID do usuário não enviado pelo frontend')

        // 1. Criar Checkout Session
        if (action === 'create-checkout') {
            const priceIds: Record<string, string> = {
                'PRO': proPrice || '',
                'ENTERPRISE': enterprisePrice || ''
            }

            const priceId = priceIds[plan]
            if (!priceId) throw new Error(`Price ID não encontrado para o plano: ${plan}. Verifique as secrets do Supabase.`)

            const { data: user, error: userError } = await supabaseClient.from('users').select('email').eq('id', userId).single()
            if (userError || !user) throw new Error(`Usuário ${userId} não encontrado no banco de dados`)

            console.log(`[STRIPE] Criando checkout para ${user.email} com o preço ${priceId}`)

            const session = await stripe.checkout.sessions.create({
                customer_email: user.email,
                line_items: [{ price: priceId, quantity: 1 }],
                mode: 'subscription',
                success_url: `${req.headers.get('origin') || 'https://jhgestor-2.vercel.app'}/billing?success=true`,
                cancel_url: `${req.headers.get('origin') || 'https://jhgestor-2.vercel.app'}/billing?canceled=true`,
                metadata: { userId, plan }
            })

            return new Response(JSON.stringify({ url: session.url }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // 2. Criar Portal Session
        if (action === 'create-portal') {
            const { data: user } = await supabaseClient.from('users').select('stripe_customer_id').eq('id', userId).single()

            if (!user?.stripe_customer_id) {
                throw new Error('Este usuário ainda não possui um ID de cliente no Stripe (precisa assinar primeiro)')
            }

            const session = await stripe.billingPortal.sessions.create({
                customer: user.stripe_customer_id,
                return_url: `${req.headers.get('origin') || 'https://jhgestor-2.vercel.app'}/billing`,
            })

            return new Response(JSON.stringify({ url: session.url }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        throw new Error('Ação inválida')

    } catch (error) {
        console.error('[STRIPE ERROR]', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
