import { supabase, USE_CLOUD } from './supabase.js';

// ── Projects ──────────────────────────────────────────────────

export async function loadProjects(userId) {
  if (!USE_CLOUD) return [];
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, created_at, updated_at, template_id, data')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false, nullsFirst: false });
  if (error) throw error;
  return data || [];
}

export async function upsertProject(userId, projectId, name, stateData) {
  if (!USE_CLOUD) return null;
  // Never persist the user's signature inside the project row
  const { sigUrl: _sig, ...dataToSave } = stateData;
  const now = new Date().toISOString();
  if (projectId) {
    const { data, error } = await supabase
      .from('projects')
      .update({ name, data: dataToSave, updated_at: now })
      .eq('id', projectId)
      .eq('user_id', userId)
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  } else {
    const { data, error } = await supabase
      .from('projects')
      .insert({ user_id: userId, name, data: dataToSave, updated_at: now })
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  }
}

export async function deleteProject(projectId, userId) {
  if (!USE_CLOUD) return;
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', userId);
  if (error) throw error;
}

// ── Helpers ───────────────────────────────────────────────────

// Convert Supabase project row → Dashboard display shape
export function projectToDisplay(row) {
  const d = row.data || {};
  return {
    id:         row.id,
    name:       row.name,
    client:     d.client || '',
    subtitle:   d.subtitle || '',
    pageFormat: d.pageFormat || 'h-full',
    palette:    [d.palette?.c1||'#E8DCC8', d.palette?.c2||'#C8A96E', d.palette?.c3||'#2B2B2B'],
    rev:        d.rev || 'REV 01',
    pages:      0,
    createdAt:  row.created_at ? new Date(row.created_at).toLocaleDateString('fr-FR') : '',
    updated:    row.updated_at
                  ? formatRelative(new Date(row.updated_at))
                  : row.created_at ? formatRelative(new Date(row.created_at)) : '',
    basedOn:    d.basedOn || '',
    templateUpdateAvailable: false,
    _raw: row,   // keep full row for opening
  };
}

function formatRelative(date) {
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Hier';
  if (d < 7)  return `Il y a ${d} j`;
  return date.toLocaleDateString('fr-FR');
}
