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

// ── Sign up with name only (auto-génère un email interne) ─────
export async function signUpWithName(fullName, password) {
  if (!USE_CLOUD) throw new Error('Cloud auth disabled');
  const slug = fullName.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
  const email = `${slug}.${Date.now().toString(36)}@abrane.internal`;

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  if (!data?.user) throw new Error('Compte non créé. Désactivez la confirmation email dans Supabase Auth → Settings.');

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: data.user.id,
    email,
    name: fullName,
    role: 'user',
  }, { onConflict: 'id' });
  if (profileError) throw profileError;
  return data.user;
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
