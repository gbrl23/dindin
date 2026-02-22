-- ============================================
-- Epic 4: Push Notifications - Database Setup
-- ============================================

-- 1. Push Subscriptions (browser push endpoints)
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);

-- RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push subscriptions"
    ON push_subscriptions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Auto-update trigger
CREATE TRIGGER set_push_subscriptions_updated_at
    BEFORE UPDATE ON push_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2. Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    enabled BOOLEAN DEFAULT true,
    bills_due BOOLEAN DEFAULT true,
    budget_exceeded BOOLEAN DEFAULT true,
    group_activity BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notification_prefs_user ON notification_preferences(user_id);

-- RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notification preferences"
    ON notification_preferences FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER set_notification_prefs_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3. Budget Notifications Sent (prevent duplicate 90% alerts)
CREATE TABLE IF NOT EXISTS budget_notifications_sent (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    month TEXT NOT NULL,
    threshold INTEGER NOT NULL DEFAULT 90,
    sent_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(budget_id, month, threshold)
);

CREATE INDEX idx_budget_notif_sent_budget ON budget_notifications_sent(budget_id, month);

-- RLS
ALTER TABLE budget_notifications_sent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own budget notification records"
    ON budget_notifications_sent FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
