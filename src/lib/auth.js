import { supabase, USE_CLOUD } from './supabase.js';

// ── Sign in (email + password) ────────────────────────────────
export async function signIn(email, password) {
  if (!USE_CLOUD) throw new Error('Cloud auth disabled');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

// ── Sign in by name (nom → email interne → signIn) ────────────
export async function signInByName(name, password) {
  if (!USE_CLOUD) throw new Error('Cloud auth disabled');
  const { data: email, error } = await supabase.rpc('get_email_by_name', { p_name: name });
  if (error) throw error;
  if (!email) throw new Error('Utilisateur introuvable. Vérifiez le nom saisi.');
  return signIn(email, password);
}

// ── Sign up with name only (via RPC — bypasse signUp et le rate-limit email) ──
export async function signUpWithName(fullName, password) {
  if (!USE_CLOUD) throw new Error('Cloud auth disabled');
  // create_user_by_name insère directement dans auth.users (email confirmé, pas d'envoi email)
  const { error: rpcError } = await supabase.rpc('create_user_by_name', {
    p_name: fullName.trim(),
    p_password: password,
  });
  if (rpcError) throw new Error(rpcError.message || 'Erreur création compte.');
  // Connexion immédiate avec le nom
  return signInByName(fullName.trim(), password);
}

// ── Liste des utilisateurs (login screen public) ──────────────
export async function listUsers() {
  if (!USE_CLOUD) return [];
  const { data, error } = await supabase.rpc('list_users');
  if (error) return [];
  return data || [];
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
  const displayName = profile?.name || sbUser.email?.split('@')[0] || 'Utilisateur';
  const parts = displayName.trim().split(/\s+/);
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : displayName.slice(0, 2).toUpperCase();
  return {
    id:               sbUser.id,
    name:             displayName,
    email:            sbUser.email,
    role:             profile?.role || 'user',
    initials,
    hasSig:           !!profile?.firma_url,
    sigUrl:           profile?.firma_url || '',
    team:             'ABRANE FR',
    requiresPassword: false,
  };
}
