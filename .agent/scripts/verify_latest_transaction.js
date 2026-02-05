import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function checkLatest() {
    console.log('Fetching latest transactions...');
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('--- LATEST 5 TRANSACTIONS ---');
    data.forEach(t => {
        console.log(`ID: ${t.id}`);
        console.log(`Desc: ${t.description}`);
        console.log(`Date: ${t.date}`);
        console.log(`Invoice Date: ${t.invoice_date}`);
        console.log(`Series ID: ${t.series_id}`);
        console.log(`Card ID: ${t.card_id}`);
        console.log('---------------------------');
    });
}

checkLatest();
