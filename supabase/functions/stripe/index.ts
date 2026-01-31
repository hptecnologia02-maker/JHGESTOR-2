import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
    apiVersion: '2022-11-15',
    httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { action, userId, plan } = await req.json()

        // 1. Criar Checkout Session
        if (action === 'create-checkout') {
            const priceIds: Record<string, string> = {
                'PRO': Deno.env.get('STRIPE_PRO_PRICE_ID') || '',
                'ENTERPRISE': Deno.env.get('STRIPE_ENTERPRISE_PRICE_ID') || ''
            }

            const session = await stripe.checkout.sessions.create({
                customer_email: (await supabase.from('users').select('email').eq('id', userId).single()).data?.email,
                line_items: [{ price: priceIds[plan], quantity: 1 }],
                mode: 'subscription',
                success_url: `${req.headers.get('origin')}/billing?success=true`,
                cancel_url: `${req.headers.get('origin')}/billing?canceled=true`,
                metadata: { userId, plan }
            })

            return new Response(JSON.stringify({ url: session.url }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // 2. Criar Portal Session
        if (action === 'create-portal') {
            const { data: user } = await supabase.from('users').select('stripe_customer_id').eq('id', userId).single()

            const session = await stripe.billingPortal.sessions.create({
                customer: user?.stripe_customer_id,
                return_url: `${req.headers.get('origin')}/billing`,
            })

            return new Response(JSON.stringify({ url: session.url }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // 3. Webhook Handling (Opcional se for a mesma função, mas geralmente webhooks usam outra rota)
        // Para simplificar, focamos no Checkout e Portal.

        return new Response(JSON.stringify({ error: 'Ação inválida' }), { status: 400 })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
