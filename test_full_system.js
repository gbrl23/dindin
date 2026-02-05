
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env vars
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    process.exit(1);
}

function createSupabaseClient() {
    return createClient(supabaseUrl, supabaseKey);
}

async function ensureProfile(client, userId, email, name) {
    let { data: profile } = await client.from('profiles').select('id').eq('user_id', userId).single();
    if (!profile) {
        const { data: newProfile, error } = await client.from('profiles').insert([{
            user_id: userId,
            email: email,
            full_name: name
        }]).select('id').single();
        if (error) return null;
        return newProfile;
    }
    return profile;
}

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function logStep(step) {
    console.log(`\n${colors.blue}=== ${step} ===${colors.reset}`);
}

function logSuccess(msg) {
    console.log(`${colors.green}✓ ${msg}${colors.reset}`);
}

function logError(msg, err) {
    console.error(`${colors.red}✗ ${msg}${colors.reset}`, err || '');
}

async function runTest() {
    console.log('🚀 INITIALIZING FULL SYSTEM TEST...');

    const user1Client = createSupabaseClient();
    const user2Client = createSupabaseClient();

    // --- SCENARIO A: SOLO USER (Legacy Features) ---
    logStep('1. Signup & Login (User 1)');
    const email1 = `user1_${Date.now()}@test.com`;
    const pwd = 'password123';

    const { data: auth1, error: err1 } = await user1Client.auth.signUp({
        email: email1,
        password: pwd,
        options: { data: { full_name: 'Alice Solo' } }
    });

    if (err1) { logError('Signup failed', err1); return; }
    await user1Client.auth.signInWithPassword({ email: email1, password: pwd });
    const user1Id = auth1.user?.id;
    logSuccess(`User 1 Created: ${user1Id} (${email1})`);

    // Validate Profile Creation (Trigger or Manual)
    const profile1 = await ensureProfile(user1Client, user1Id, email1, 'Alice Solo');
    if (profile1) logSuccess('User 1 Profile Verified');
    else { logError('User 1 Profile Missing'); return; }

    logStep('2. Add Card (User 1)');
    const { data: card, error: cardErr } = await user1Client.from('cards').insert({
        name: 'Alice Nubank',
        limit: 5000,
        closing_day: 1,
        due_day: 10,
        owner_id: profile1.id,
        type: 'credit'
    }).select().single();

    if (cardErr) { logError('Add Card Failed', cardErr); }
    else logSuccess(`Card Created: ${card.name} (ID: ${card.id})`);

    logStep('3. Add Ghost Profile (User 1 adds "Mom")');
    // Legacy feature: User adds a profile manually that is linked to them via `created_by`
    // Note: requires RLS to allow inserting into profiles where created_by = auth.uid or similar?
    // Let's check schema. profiles has `created_by`. RLS policy `profiles_insert_new` allows if `created_by` is not null.
    const { data: ghostProfile, error: ghostErr } = await user1Client.from('profiles').insert({
        full_name: 'Mom',
        created_by: profile1.id, // Or user_id? Check RLS. usually created_by is a UUID FK to... profiles? or users?
        // In fix_profiles_schema.sql: created_by UUID REFERENCES profiles(id)
        // So we link to Alice's PROFILE ID.
        email: null // Optional for ghosts
    }).select().single();

    if (ghostErr) {
        // If this fails, it might be RLS expects `created_by` to be the AUTH ID?
        // Actually script said `created_by UUID REFERENCES profiles(id)`.
        // Let's try.
        logError('Add Ghost Profile Failed', ghostErr);
    } else {
        logSuccess(`Ghost Profile Created: ${ghostProfile.full_name} (ID: ${ghostProfile.id})`);
    }

    logStep('4. Create Personal Expense (User 1)');
    const { data: expense1, error: expErr1 } = await user1Client.from('transactions').insert({
        description: 'Coffee',
        amount: 15.50,
        date: new Date().toISOString(),
        payer_id: profile1.id,
        card_id: card?.id,
        created_by: user1Id
    }).select().single();

    if (expErr1) logError('Personal Expense Failed', expErr1);
    else logSuccess(`Expense Created: ${expense1.description} - $${expense1.amount}`);

    // --- SCENARIO B: GROUP WORKFLOW ---
    logStep('5. Signup User 2 (Bob)');
    const email2 = `user2_${Date.now()}@test.com`;
    const { data: auth2 } = await user2Client.auth.signUp({
        email: email2,
        password: pwd,
        options: { data: { full_name: 'Bob Friend' } }
    });
    // Bob needs to sign in? The client might hold session if not careful, but we used separate clients.
    // Wait for Bob's profile
    await new Promise(r => setTimeout(r, 500));
    const profile2 = await ensureProfile(user2Client, auth2.user.id, email2, 'Bob Friend');
    if (profile2) logSuccess(`User 2 Created & Profile Verified: ${profile2.id}`);

    logStep('6. Create Group (User 1)');
    const { data: group, error: grpErr } = await user1Client.rpc('create_group_with_creator', {
        p_name: 'Carnaval Test',
        p_description: 'Trip 2026',
        p_icon: '🎉',
        p_color: '#00FF00'
    });

    if (grpErr) { logError('Create Group Failed', grpErr); return; }
    const groupId = group.id;
    logSuccess(`Group Created: ${group.id}`);

    logStep('7. Invite Bob (User 1 -> User 2)');
    const { data: invite, error: invErr } = await user1Client.rpc('invite_user_by_email', {
        p_group_id: groupId,
        p_email: email2
    });

    if (invErr) { logError('Invite Failed', invErr); return; }
    logSuccess(`Invite Sent: ${invite.message}`);

    logStep('8. Accept Invite (Bob)');
    // Bob accepts
    await user2Client.auth.signInWithPassword({ email: email2, password: pwd });
    const { data: accept, error: accErr } = await user2Client.rpc('accept_invite', {
        p_invite_id: invite.id
    });

    if (accErr) { logError('Accept Failed', accErr); return; }
    logSuccess(`Bob Joined Group: ${accept.message}`);

    logStep('9. Create Group Expense (Atomic RPC)');
    // Alice pays 200, Split 50/50
    const splits = [
        { profile_id: profile1.id, amount: 100.00 },
        { profile_id: profile2.id, amount: 100.00 }
    ];

    const { data: grpExp, error: grpExpErr } = await user1Client.rpc('create_expense_atomic', {
        p_group_id: groupId,
        p_description: 'Airbnb',
        p_amount: 200.00,
        p_payer_id: profile1.id,
        p_date: new Date().toISOString(),
        p_splits: splits
    });

    if (grpExpErr) logError('Group Expense Failed', grpExpErr);
    else logSuccess(`Group Expense Created: ${grpExp.id}`);

    logStep('10. Check Balances');
    const { data: balances, error: balErr } = await user1Client.rpc('get_group_balances', {
        p_group_id: groupId
    });

    if (balErr) logError('Check Balances Failed', balErr);
    else {
        logSuccess('Balances Calculated:');
        console.table(balances);
        const alice = balances.find(b => b.profile_id === profile1.id);
        const bob = balances.find(b => b.profile_id === profile2.id);

        if (Number(alice.balance) === 100 && Number(bob.balance) === -100) {
            logSuccess('MATH IS CORRECT! (Alice receives 100, Bob owes 100)');
        } else {
            logError('Math Mismatch! Check table above.');
        }
    }

    console.log('\n🚀 SYSTEM TEST COMPLETE');
}

runTest();
