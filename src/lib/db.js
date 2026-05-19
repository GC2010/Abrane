import { supabase, USE_CLOUD } from './supabase.js';

// ── Projects ──────────────────────────────────────────────────

export async function loadProjects(userId) {
  if (!USE_CLOUD) return [];
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, created_at, template_id, data')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function upsertProject(userId, projectId, name, stateData) {
  if (!USE_CLOUD) return null;
  // Strip non-serialisable / user-specific fields before saving
  const { sigUrl: _sig, _dirty: _d, ...dataToSave } = stateData;
  if (projectId) {
    const { data, error } = await supabase
      .from('projects')
      .update({ name, data: dataToSave })
      .eq('id', projectId)
      .eq('user_id', userId)
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  } else {
    const { data, error } = await supabase
      .from('projects')
      .insert({ user_id: userId, name, data: dataToSave })
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

// ── Templates ─────────────────────────────────────────────────

export async function loadTemplates() {
  if (!USE_CLOUD) return [];
  const { data, error } = await supabase
    .from('templates')
    .select('id, name, created_at, created_by, data')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function upsertTemplate(userId, templateId, name, stateData) {
  if (!USE_CLOUD) return null;
  // Templates store only the "setup" — no content files or user-specific data
  const {
    sigUrl: _sig, _dirty: _d,
    files: _f, contentOrder: _co, annotations: _an, annotSnaps: _as, pageNotes: _pn,
    ...dataToSave
  } = stateData;
  if (templateId) {
    const { data, error } = await supabase
      .from('templates')
      .update({ name, data: dataToSave })
      .eq('id', templateId)
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  } else {
    const { data, error } = await supabase
      .from('templates')
      .insert({ name, data: dataToSave, created_by: userId })
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  }
}

export async function deleteTemplate(templateId) {
  if (!USE_CLOUD) return;
  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('id', templateId);
  if (error) throw error;
}

export async function findTemplateByName(name) {
  if (!USE_CLOUD) return null;
  const { data } = await supabase
    .from('templates')
    .select('id, name')
    .ilike('name', name.trim())
    .maybeSingle();
  return data || null;
}

// ── Helpers ───────────────────────────────────────────────────

export function projectToDisplay(row) {
  const d = row.data || {};
  return {
    id:             row.id,
    name:           row.name,
    client:         d.client || '',
    subtitle:       d.subtitle || '',
    pageFormat:     d.pageFormat || 'h-full',
    palette:        [d.palette?.c1||'#E8DCC8', d.palette?.c2||'#C8A96E', d.palette?.c3||'#2B2B2B'],
    clientLogoUrl:  d.clientLogoUrl || '',
    rev:            d.rev || 'REV 01',
    pages:          0,
    createdAt:      row.created_at ? new Date(row.created_at).toLocaleDateString('fr-FR') : '',
    updated:        row.created_at ? formatRelative(new Date(row.created_at)) : '',
    basedOn:        d.basedOn || '',
    templateUpdateAvailable: false,
    _raw: row,
  };
}

export function templateToDisplay(row) {
  const d = row.data || {};
  return {
    id:             row.id,
    name:           row.name,
    kind:           'client',
    desc:           `Modèle client — ${d.client || row.name}`,
    palette:        [d.palette?.c1||'#E8DCC8', d.palette?.c2||'#C8A96E', d.palette?.c3||'#2B2B2B'],
    pageFormat:     d.pageFormat || 'h-full',
    clientLogoUrl:  d.clientLogoUrl || '',
    badges:         ['Client'],
    author:         d.client || '',
    updated:        row.created_at ? formatRelative(new Date(row.created_at)) : '',
    uses:           0,
    lastAdminNote:  null,
    _raw: row,
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
