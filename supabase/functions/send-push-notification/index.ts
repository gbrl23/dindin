import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || ''
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || ''
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:contato@dindin.app'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushPayload {
  user_id: string
  title: string
  body: string
  url?: string
  tag?: string
  type?: string
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const payload: PushPayload = await req.json()

    if (!payload.user_id || !payload.title) {
      return new Response(
        JSON.stringify({ error: 'user_id and title are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check user notification preferences
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('enabled')
      .eq('user_id', payload.user_id)
      .single()

    if (!prefs?.enabled) {
      return new Response(
        JSON.stringify({ message: 'Notifications disabled for user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get all push subscriptions for this user
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', payload.user_id)

    if (subError) throw subError
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || '/dashboard',
      tag: payload.tag || 'dindin-server',
      type: payload.type || 'general',
    })

    // Send to each subscription using Web Push
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        }

        const response = await sendWebPush(
          pushSubscription,
          notificationPayload,
          VAPID_PUBLIC_KEY,
          VAPID_PRIVATE_KEY,
          VAPID_SUBJECT,
        )

        // If subscription expired (410 Gone), remove it
        if (response.status === 410) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', sub.endpoint)
        }

        return { endpoint: sub.endpoint, status: response.status }
      })
    )

    const sent = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return new Response(
      JSON.stringify({ sent, failed, total: subscriptions.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Push notification error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Send a Web Push notification using the Web Push protocol.
 * Uses the web-push library pattern with VAPID authentication.
 */
async function sendWebPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string,
): Promise<Response> {
  // Import web-push compatible crypto for Deno
  const { default: webpush } = await import('https://esm.sh/web-push@3.6.7')

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

  const result = await webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
    },
    payload,
  )

  return new Response(null, { status: result.statusCode })
}
