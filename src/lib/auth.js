import { supabase, USE_CLOUD } from './supabase.js';

// ── Sign in ───────────────────────────────────────────────────
export async function signIn(email, password) {
  if (!USE_CLOUD) throw new Error('Cloud auth disabled');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

// ── Sign up + create profile ──────────────────────────────────
export async function signUp(email, password, role = 'user') {
  if (!USE_CLOUD) throw new Error('Cloud auth disabled');
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  const { error: profileError } = await supabase.from('profiles').insert({
    id: data.user.id,
    email,
    role,
  });
  if (profileError) throw profileError;
  return data.user;
}

// ── Get current session user ──────────────────────────────────
export async function getSession() {
  if (!USE_CLOUD) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}

// ── Fetch profile row ─────────────────────────────────────────
export async function getProfile(userId) {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

// ── Update profile ────────────────────────────────────────────
export async function updateProfile(userId, patch) {
  const { error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', userId);
  if (error) throw error;
}

// ── Sign out ──────────────────────────────────────────────────
export async function signOut() {
  if (!USE_CLOUD) return;
  await supabase.auth.signOut();
}

// ── Listen to auth state changes ──────────────────────────────
export function onAuthChange(callback) {
  if (!USE_CLOUD) return () => {};
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return () => subscription.unsubscribe();
}

// ── Map Supabase user + profile → app user object ─────────────
export function toAppUser(sbUser, profile) {
  return {
    id:               sbUser.id,
    name:             profile?.name || sbUser.email,
    email:            sbUser.email,
    role:             profile?.role || 'user',
    initials:         (profile?.name || sbUser.email).slice(0,2).toUpperCase(),
    hasSig:           !!profile?.firma_url,
    sigUrl:           profile?.firma_url || '',
    team:             'ABRANE FR',
    requiresPassword: false,
  };
}
