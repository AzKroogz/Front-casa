export function readRuntimeConfig(source = globalThis) {
  const config = source.__APP_CONFIG__ || {};
  return {
    url: String(config.SUPABASE_URL || '').trim(),
    publishableKey: String(config.SUPABASE_PUBLISHABLE_KEY || '').trim(),
  };
}

export function validateRuntimeConfig(config) {
  if (!config?.url) throw new Error('Falta SUPABASE_URL en la configuración.');
  if (!config?.publishableKey) throw new Error('Falta SUPABASE_PUBLISHABLE_KEY en la configuración.');
  return config;
}

export function createSupabaseBrowserClient(source = globalThis) {
  const config = validateRuntimeConfig(readRuntimeConfig(source));
  const factory = source.supabase?.createClient;
  if (typeof factory !== 'function') throw new Error('No se pudo cargar el cliente de Supabase.');

  return factory(config.url, config.publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export async function ensureOwnProfile(client, user) {
  const fallback = user?.email?.split('@')[0] || 'Integrante';
  const displayName = String(user?.user_metadata?.display_name || fallback).trim().slice(0, 80) || fallback;
  const { error } = await client.from('profiles').upsert({
    user_id: user.id,
    display_name: displayName,
  }, { onConflict: 'user_id' });
  if (error) throw error;
  return displayName;
}

export async function loadHouseholdContext(client, user) {
  const { data: memberships, error: membershipError } = await client
    .from('household_members')
    .select('household_id, role')
    .limit(1);
  if (membershipError) throw membershipError;
  const membership = memberships?.[0];
  if (!membership) return null;

  const { data: members, error: membersError } = await client
    .from('household_members')
    .select('user_id, role')
    .eq('household_id', membership.household_id);
  if (membersError) throw membersError;

  const ids = (members || []).map(item => item.user_id);
  let profiles = [];
  if (ids.length) {
    const { data, error } = await client.from('profiles').select('user_id, display_name').in('user_id', ids);
    if (error) throw error;
    profiles = data || [];
  }

  const profileById = new Map(profiles.map(profile => [profile.user_id, profile.display_name]));
  return {
    householdId: membership.household_id,
    role: membership.role,
    members: (members || []).map(member => ({
      userId: member.user_id,
      role: member.role,
      displayName: profileById.get(member.user_id) || (member.user_id === user.id ? (user.email?.split('@')[0] || 'Yo') : 'Integrante'),
    })),
  };
}
