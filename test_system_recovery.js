
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
    // Try to get profile
    let { data: profile } = await client.from('profiles').select('id').eq('user_id', userId).single();
    if (!profile) {
        // Create manually if trigger didn't
        const { data: newProfile, error } = await client.from('profiles').insert([{
            user_id: userId,
            email: email,
            full_name: name
        }]).select('id').single();
        if (error) {
            console.error("Profile Create Error:", error);
            return null;
        }
        return newProfile;
    }
    return profile;
}

async function runTest() {
    console.log('--- Starting FINAL Phase 3 Verification ---');

    // 1. Owner
    const ownerClient = createSupabaseClient();
    const emailOwner = `owner_${Date.now()}@test.com`;
    console.log(`Creating Owner: ${emailOwner}`);
    const { data: authOwner } = await ownerClient.auth.signUp({
        email: emailOwner,
        password: 'password123',
        options: { data: { full_name: 'Owner User' } }
    });
    await ownerClient.auth.signInWithPassword({ email: emailOwner, password: 'password123' });
    const ownerId = authOwner.user?.id;

    // 2. Member
    const memberClient = createSupabaseClient();
    const emailMember = `member_${Date.now()}@test.com`;
    console.log(`Creating Member: ${emailMember}`);
    const { data: authMember } = await memberClient.auth.signUp({
        email: emailMember,
        password: 'password123',
        options: { data: { full_name: 'Member User' } }
    });
    // Wait for async actions
    await new Promise(r => setTimeout(r, 1000));

    // ENSURE PROFILES EXIST (Since triggers are off/flaky)
    const ownerProfile = await ensureProfile(ownerClient, ownerId, emailOwner, 'Owner User');
    const memberProfile = await ensureProfile(memberClient, authMember.user.id, emailMember, 'Member User');

    if (!ownerProfile || !memberProfile) {
        console.error("Profiles missing even after manual check.");
        return;
    }

    // 3. Create Group (Owner)
    console.log('Testing RPC: create_group_with_creator...');
    const { data: groupData, error: groupError } = await ownerClient
        .rpc('create_group_with_creator', {
            p_name: 'Viagem Teste',
            p_description: 'Testando tudo',
            p_icon: '✈️',
            p_color: '#FF0000'
        });

    if (groupError) { console.error('Create Group Failed:', groupError); return; }
    const groupId = groupData.id;
    console.log('Group Created:', groupId);

    // 4. Invite Member (Owner)
    console.log('Testing RPC: invite_user_by_email...');
    const { data: inviteData, error: inviteError } = await ownerClient
        .rpc('invite_user_by_email', {
            p_group_id: groupId,
            p_email: emailMember
        });

    if (inviteError) { console.error('Invite Failed:', inviteError); return; }
    console.log('Invite Sent:', inviteData);

    // 5. Accept Invite (Member)
    console.log('Testing RPC: accept_invite...');
    await memberClient.auth.signInWithPassword({ email: emailMember, password: 'password123' });

    const { data: acceptData, error: acceptError } = await memberClient
        .rpc('accept_invite', { p_invite_id: inviteData.id });

    if (acceptError) {
        console.error('Accept Invite Failed:', acceptError);
        return;
    } else {
        console.log('Invite Accepted:', acceptData);
    }

    // 6. Create Expense Atomic (Owner)
    console.log('Testing RPC: create_expense_atomic...');
    const splits = [
        { profile_id: ownerProfile.id, amount: 50.00 },
        { profile_id: memberProfile.id, amount: 50.00 }
    ];

    const { data: expenseData, error: expenseError } = await ownerClient
        .rpc('create_expense_atomic', {
            p_group_id: groupId,
            p_description: 'Jantar Top',
            p_amount: 100.00,
            p_payer_id: ownerProfile.id,
            p_date: new Date().toISOString(),
            p_splits: splits
        });

    if (expenseError) {
        console.error('Create Expense Atomic Failed:', expenseError);
    } else {
        console.log('Atomic Expense Created:', expenseData);
    }

    // 7. Check Balances
    console.log('Testing RPC: get_group_balances...');
    const { data: balances, error: balanceError } = await ownerClient
        .rpc('get_group_balances', { p_group_id: groupId });

    if (balanceError) {
        console.error('Get Balances Failed:', balanceError);
    } else {
        console.log('Balances:', balances);
        // Expect: Owner +50, Member -50
    }
    console.log('--- FINAL VERIFICATION COMPLETE ---');
}

runTest();
