// One-off bootstrap for curl smoke tests. Creates two confirmed users
// (one employer, one talent) via the Supabase admin client so we bypass
// the email validation + rate limits the public /auth/register hits.
//
// Run with: node -r module-alias/register -r dotenv/config build-dev/scripts/test-bootstrap.js
//
// Outputs IDs + tokens to /tmp/gigify-test-creds.env so the curl harness
// can source them.

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY');
    process.exit(1);
}

const admin = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
const anon = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });

async function ensureUser(label: string, email: string, password: string, role: 'employer' | 'talent') {
    console.log(`[${label}] ensure ${email} (${role})`);

    let userId: string | undefined;

    // Try to create. If already exists, fetch.
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role },
    });

    if (createErr) {
        if (!/already.*registered|already exists/i.test(createErr.message)) {
            console.error(`[${label}] createUser failed:`, createErr.message);
            process.exit(1);
        }
        // Already exists, find the auth user via the listUsers API.
        const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
        if (listErr) {
            console.error(`[${label}] listUsers failed:`, listErr.message);
            process.exit(1);
        }
        userId = list.users.find((u) => u.email === email)?.id;
        if (!userId) {
            console.error(`[${label}] could not locate existing auth user`);
            process.exit(1);
        }
    } else {
        userId = created.user!.id;
    }

    // Make sure the public.users row exists with the desired role.
    // Some triggers may already insert the row; idempotent upsert is safe.
    const { error: upsertErr } = await admin.from('users').upsert(
        {
            id: userId,
            email,
            role,
            status: 'active',
            is_verified: true,
        } as never,
        { onConflict: 'id' },
    );
    if (upsertErr) {
        console.error(`[${label}] users upsert failed:`, upsertErr.message);
        process.exit(1);
    }

    // Seed the role-specific profile row so /talent/:id, /employer/:id/profile,
    // talent search etc. find this user. set-role would normally do this, but
    // the bootstrap already wrote role to public.users so set-role 409s.
    if (role === 'talent') {
        const { error: tpErr } = await admin
            .from('talent_profiles')
            .upsert({ user_id: userId, stage_name: 'QA Talent', min_rate: 0, rate_currency: 'NGN' } as never, { onConflict: 'user_id' });
        if (tpErr) {
            console.error(`[${label}] talent_profiles upsert failed:`, tpErr.message);
            process.exit(1);
        }
    } else if (role === 'employer') {
        const { error: epErr } = await admin.from('employer_profiles').upsert({ user_id: userId } as never, { onConflict: 'user_id' });
        if (epErr) {
            console.error(`[${label}] employer_profiles upsert failed:`, epErr.message);
            process.exit(1);
        }
    }

    // Sign in to get an access token the curl harness can use.
    const { data: signin, error: signinErr } = await anon.auth.signInWithPassword({ email, password });
    if (signinErr || !signin.session) {
        console.error(`[${label}] signin failed:`, signinErr?.message);
        process.exit(1);
    }

    return {
        userId: userId!,
        token: signin.session.access_token,
        refresh: signin.session.refresh_token,
    };
}

async function main() {
    const stamp = Date.now();
    const PASS = 'Password123!';
    // gigify.com is the actual brand domain, Supabase tends to allow it.
    const empEmail = `qa.emp.${stamp}@gigify.com`;
    const talEmail = `qa.tal.${stamp}@gigify.com`;

    const employer = await ensureUser('employer', empEmail, PASS, 'employer');
    const talent = await ensureUser('talent', talEmail, PASS, 'talent');

    const out = [
        `EMP_EMAIL=${empEmail}`,
        `TAL_EMAIL=${talEmail}`,
        `PASS=${PASS}`,
        `EMP_ID=${employer.userId}`,
        `TAL_ID=${talent.userId}`,
        `EMP_TOKEN=${employer.token}`,
        `TAL_TOKEN=${talent.token}`,
        `BASE=http://localhost:8000/api/v1`,
        '',
    ].join('\n');

    writeFileSync('/tmp/gigify-test-creds.env', out);
    console.log('---');
    console.log('Wrote /tmp/gigify-test-creds.env');
    console.log(`employer_id=${employer.userId}`);
    console.log(`talent_id=${talent.userId}`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
