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

serve(async (req) => {
    const signature = req.headers.get('Stripe-Signature')

    try {
        const body = await req.text()
        const event = stripe.webhooks.constructEvent(
            body,
            signature!,
            Deno.env.get('STRIPE_WEBHOOK_SECRET')!
        )

        console.log('Evento recebido:', event.type)

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session
            const userId = session.metadata?.userId
            const plan = session.metadata?.plan

            await supabase.from('users').update({
                stripe_customer_id: session.customer as string,
                stripe_subscription_id: session.subscription as string,
                plan: plan,
                status: 'ACTIVE'
            }).eq('id', userId)
        }

        if (event.type === 'customer.subscription.deleted') {
            const subscription = event.data.object as Stripe.Subscription
            await supabase.from('users').update({
                plan: 'FREE',
                status: 'BLOCKED'
            }).eq('stripe_subscription_id', subscription.id)
        }

        if (event.type === 'invoice.payment_failed') {
            const invoice = event.data.object as Stripe.Invoice
            await supabase.from('users').update({
                status: 'PAST_DUE'
            }).eq('stripe_customer_id', invoice.customer as string)
        }

        return new Response(JSON.stringify({ ok: true }), { status: 200 })
    } catch (err) {
        return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }
})
