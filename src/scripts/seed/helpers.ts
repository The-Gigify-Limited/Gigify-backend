import { supabaseAdmin } from '@/core';

export const SEED_PASSWORD = 'Password123!';

export function log(section: string, message: string) {
    // eslint-disable-next-line no-console
    console.log(`[seed:${section}] ${message}`);
}

// Upsert keyed by primary key. Seeds are idempotent, re-running the script
// must not mutate rows the operator touched after the first seed. `onConflict`
// with `ignoreDuplicates: true` is the cheapest way to express "skip if
// present" across every table, and works for both single and composite PKs.
// The helper takes `string` / `unknown[]` by design, each caller already
// shapes its own rows against the correct `Insert` type, and narrowing here
// would force every caller to re-cast.
export async function upsertIfAbsent(table: string, rows: Record<string, unknown>[], conflictTarget: string): Promise<void> {
    if (rows.length === 0) return;
    const { error } = await (
        supabaseAdmin.from(table as never) as unknown as {
            upsert: (rows: unknown, options: { onConflict: string; ignoreDuplicates: boolean }) => Promise<{ error: { message: string } | null }>;
        }
    ).upsert(rows, { onConflict: conflictTarget, ignoreDuplicates: true });
    if (error) {
        throw new Error(`[seed] failed to upsert into ${table}: ${error.message}`);
    }
}

// Creates an auth.users row via the Supabase admin API and assigns a stable
// id. If an auth user with this id already exists we treat it as a skip ,
// the "email_exists" / "already_registered" paths also short-circuit cleanly.
export async function ensureAuthUser(input: { id: string; email: string; password: string }): Promise<void> {
    const existing = await supabaseAdmin.auth.admin.getUserById(input.id);
    if (existing.data?.user) return;

    const { error } = await supabaseAdmin.auth.admin.createUser({
        id: input.id,
        email: input.email,
        password: input.password,
        email_confirm: true,
    });

    if (!error) return;

    // Race/legacy: if an auth user was created out-of-band with a different id,
    // we don't rewrite it, just surface the collision so the operator can
    // decide whether to wipe and reseed.
    if (/already.*registered|email_exists|duplicate/i.test(error.message)) {
        throw new Error(
            `[seed] auth email "${input.email}" is already in use under a different id. ` +
                `Drop the existing auth.users row or change the seeded email.`,
        );
    }
    throw new Error(`[seed] failed to create auth user "${input.email}": ${error.message}`);
}
