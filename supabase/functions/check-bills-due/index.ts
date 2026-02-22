import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Edge Function: check-bills-due
 *
 * Checks for unpaid bills/expenses due within the next 3 days
 * and sends push notifications to users who have bills_due enabled.
 *
 * Should be invoked daily via:
 * - pg_cron: SELECT cron.schedule('check-bills', '0 9 * * *', $$SELECT ...$$)
 * - OR Vercel Cron: vercel.json crons config
 * - OR manual invocation via Supabase dashboard
 */
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const today = new Date()
    const threeDaysFromNow = new Date(today)
    threeDaysFromNow.setDate(today.getDate() + 3)

    const todayStr = today.toISOString().split('T')[0]
    const futureStr = threeDaysFromNow.toISOString().split('T')[0]

    // Find unpaid bills/expenses due in the next 3 days
    // These are transactions of type 'bill' or 'expense' that:
    // - have is_paid = false
    // - have date between today and 3 days from now
    const { data: dueBills, error: billsError } = await supabase
      .from('transactions')
      .select('id, description, amount, date, payer_id, profiles!payer_id(user_id)')
      .in('type', ['bill', 'expense'])
      .eq('is_paid', false)
      .gte('date', todayStr)
      .lte('date', futureStr)

    if (billsError) throw billsError

    if (!dueBills || dueBills.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No bills due', checked: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Group bills by user_id
    const billsByUser: Record<string, typeof dueBills> = {}
    for (const bill of dueBills) {
      const userId = (bill as any).profiles?.user_id
      if (!userId) continue
      if (!billsByUser[userId]) billsByUser[userId] = []
      billsByUser[userId].push(bill)
    }

    let notificationsSent = 0

    // For each user with due bills, check preferences and send notification
    for (const [userId, userBills] of Object.entries(billsByUser)) {
      // Check if user has bills_due notifications enabled
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('enabled, bills_due')
        .eq('user_id', userId)
        .single()

      if (!prefs?.enabled || !prefs?.bills_due) continue

      // Build notification message
      const count = userBills.length
      const totalAmount = userBills.reduce((sum, b) => sum + Number(b.amount), 0)
      const firstBill = userBills[0]

      const title = count === 1
        ? `Conta a vencer: ${firstBill.description}`
        : `${count} contas a vencer`

      const body = count === 1
        ? `R$ ${Number(firstBill.amount).toFixed(2).replace('.', ',')} vence em ${formatDateBr(firstBill.date)}`
        : `Total de R$ ${totalAmount.toFixed(2).replace('.', ',')} vencendo nos próximos 3 dias`

      // Call send-push-notification function
      const { error: pushError } = await supabase.functions.invoke('send-push-notification', {
        body: {
          user_id: userId,
          title,
          body,
          url: '/bills',
          tag: `bills-due-${todayStr}`,
          type: 'bills_due',
        },
      })

      if (pushError) {
        console.error(`Error sending push to ${userId}:`, pushError)
      } else {
        notificationsSent++
      }
    }

    return new Response(
      JSON.stringify({
        checked: dueBills.length,
        users: Object.keys(billsByUser).length,
        notificationsSent,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Check bills due error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function formatDateBr(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}
