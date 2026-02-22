/**
 * Supabase Client Configuration
 * 
 * Security measures:
 * - Environment variables validated before use
 * - URL must be HTTPS and from supabase.co domain
 * - Key must match JWT format
 * - Dev warnings for missing configuration
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Security: Validate URL format
const isValidUrl = (url) => {
    if (!url) return false;
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:' && parsed.hostname.endsWith('.supabase.co');
    } catch {
        return false;
    }
};

// Security: Validate key format (JWT starts with 'eyJ')
const isValidKey = (key) => {
    return key && typeof key === 'string' && key.startsWith('eyJ') && key.length > 100;
};

// Development warning
if (import.meta.env.DEV && (!supabaseUrl || !supabaseAnonKey)) {
    console.warn(
        '⚠️ Supabase não configurado!\n' +
        'Copie .env.example para .env e preencha as variáveis.'
    );
}

// Only create client if config is valid
const isConfigValid = isValidUrl(supabaseUrl) && isValidKey(supabaseAnonKey);

if (!isConfigValid && import.meta.env.PROD) {
    console.error('❌ Configuração Supabase inválida em produção!');
}

// Use sessionStorage when user chose not to stay logged in
const rememberMe = typeof window !== 'undefined'
    ? localStorage.getItem('dindin_remember_me') !== 'false'
    : true;

const customStorage = !rememberMe && typeof window !== 'undefined'
    ? {
        getItem: (key) => sessionStorage.getItem(key),
        setItem: (key, value) => sessionStorage.setItem(key, value),
        removeItem: (key) => sessionStorage.removeItem(key),
    }
    : undefined;

export const supabase = isConfigValid
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            ...(customStorage && { storage: customStorage }),
        }
    })
    : null;
