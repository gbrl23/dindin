import { createClient } from '@supabase/supabase-js';

// Environment variables validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Security: Validate environment variables
const isValidUrl = (url) => {
    if (!url) return false;
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:' && parsed.hostname.endsWith('.supabase.co');
    } catch {
        return false;
    }
};

const isValidKey = (key) => {
    // Supabase anon keys start with 'eyJ' (base64 encoded JWT)
    return key && typeof key === 'string' && key.startsWith('eyJ') && key.length > 100;
};

// Development warning for missing configuration
if (import.meta.env.DEV && (!supabaseUrl || !supabaseKey)) {
    console.warn(
        '⚠️ Supabase não configurado!\n' +
        'Copie .env.example para .env e preencha as variáveis:\n' +
        '  VITE_SUPABASE_URL\n' +
        '  VITE_SUPABASE_ANON_KEY'
    );
}

// Validate before creating client
const isConfigValid = isValidUrl(supabaseUrl) && isValidKey(supabaseKey);

export const supabase = isConfigValid
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    })
    : null;

export const isSupabaseConfigured = () => !!supabase;

// Export validation status for error handling
export const getConfigStatus = () => ({
    configured: isConfigValid,
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    urlValid: isValidUrl(supabaseUrl),
    keyValid: isValidKey(supabaseKey)
});
