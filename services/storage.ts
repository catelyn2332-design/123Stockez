// Powered by OnSpace.AI — Supabase Storage Service
import { getSupabaseClient } from '@/template';
import { Group, Album, Photo, Carnet, CarnetEntry, CarnetField } from '@/types';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { Colors } from '@/constants/theme';

const sb = () => getSupabaseClient();

// ── Helpers ──────────────────────────────────────────────────────────────────
async function uploadImage(uri: string, userId: string, prefix: string): Promise<string> {
  const ext = uri.split('.').pop()?.split('?')[0] ?? 'jpg';
  const path = `${userId}/${prefix}_${Date.now()}.${ext}`;
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  const { error } = await sb().storage.from('photos').upload(path, decode(base64), {
    contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return path;
}

export function getPublicUrl(storagePath: string): string {
  if (!storagePath) return '';
  if (storagePath.startsWith('http')) return storagePath;
  const { data } = sb().storage.from('photos').getPublicUrl(storagePath);
  return data.publicUrl;
}

// ── Groups ───────────────────────────────────────────────────────────────────
export async function getGroups(userId: string): Promise<Group[]> {
  const { data, error } = await sb()
    .from('groups')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToGroup);
}

export async function saveGroup(group: Group): Promise<Group> {
  const row = {
    id: group.id.startsWith('group_') ? undefined : group.id,
    user_id: group.userId,
    name: group.name,
    description: group.description ?? null,
    color: group.color,
    cover_photo: group.coverPhoto ?? null,
    album_count: group.albumCount,
  };
  if (group.id.startsWith('group_') || !group.id) {
    const { data, error } = await sb().from('groups').insert(row).select().single();
    if (error) throw new Error(error.message);
    return rowToGroup(data);
  }
  const { data, error } = await sb().from('groups').upsert({ ...row, id: group.id }).select().single();
  if (error) throw new Error(error.message);
  return rowToGroup(data);
}

export async function deleteGroup(groupId: string): Promise<void> {
  const { error } = await sb().from('groups').delete().eq('id', groupId);
  if (error) throw new Error(error.message);
}

function rowToGroup(r: any): Group {
  return {
    id: r.id,
    userId: r.user_id,
    name: r.name,
    description: r.description ?? undefined,
    color: r.color,
    coverPhoto: r.cover_photo ? getPublicUrl(r.cover_photo) : undefined,
    albumCount: r.album_count,
    createdAt: r.created_at,
  };
}

// ── Albums ───────────────────────────────────────────────────────────────────
export async function getAlbums(groupId: string): Promise<Album[]> {
  const { data, error } = await sb()
    .from('albums')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToAlbum);
}

export async function getAllAlbums(userId: string): Promise<Album[]> {
  const { data, error } = await sb()
    .from('albums')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToAlbum);
}

export async function saveAlbum(album: Album): Promise<Album> {
  const row = {
    user_id: album.userId,
    group_id: album.groupId,
    name: album.name,
    description: album.description ?? null,
    cover_photo: album.coverPhoto ?? null,
    photo_count: album.photoCount,
  };
  if (!album.id || album.id.startsWith('album_')) {
    const { data, error } = await sb().from('albums').insert(row).select().single();
    if (error) throw new Error(error.message);
    return rowToAlbum(data);
  }
  const { data, error } = await sb().from('albums').upsert({ ...row, id: album.id }).select().single();
  if (error) throw new Error(error.message);
  return rowToAlbum(data);
}

export async function deleteAlbum(albumId: string): Promise<void> {
  const { error } = await sb().from('albums').delete().eq('id', albumId);
  if (error) throw new Error(error.message);
}

function rowToAlbum(r: any): Album {
  return {
    id: r.id,
    userId: r.user_id,
    groupId: r.group_id,
    name: r.name,
    description: r.description ?? undefined,
    coverPhoto: r.cover_photo ? getPublicUrl(r.cover_photo) : undefined,
    photoCount: r.photo_count,
    createdAt: r.created_at,
  };
}

// ── Photos ───────────────────────────────────────────────────────────────────
export async function getPhotos(albumId: string): Promise<Photo[]> {
  const { data, error } = await sb()
    .from('photos')
    .select('*')
    .eq('album_id', albumId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToPhoto);
}

export async function getAllPhotos(userId: string): Promise<Photo[]> {
  const { data, error } = await sb()
    .from('photos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToPhoto);
}

export async function addPhotoToAlbum(userId: string, albumId: string, groupId: string, localUri: string, name: string): Promise<Photo> {
  const storagePath = await uploadImage(localUri, userId, 'photo');
  const publicUrl = getPublicUrl(storagePath);
  const { data, error } = await sb().from('photos').insert({
    user_id: userId,
    album_id: albumId,
    group_id: groupId,
    storage_path: storagePath,
    name,
  }).select().single();
  if (error) throw new Error(error.message);
  // update album cover + count
  await sb().from('albums').update({ photo_count: sb().rpc as any, cover_photo: storagePath })
    .eq('id', albumId);
  await _syncAlbumMeta(albumId, groupId);
  return rowToPhoto(data);
}

export async function updatePhoto(photo: Photo): Promise<void> {
  const { error } = await sb().from('photos').update({ name: photo.name, caption: photo.caption }).eq('id', photo.id);
  if (error) throw new Error(error.message);
}

export async function deletePhoto(photoId: string, albumId: string, groupId: string): Promise<void> {
  const { data } = await sb().from('photos').select('storage_path').eq('id', photoId).single();
  await sb().from('photos').delete().eq('id', photoId);
  if (data?.storage_path) {
    await sb().storage.from('photos').remove([data.storage_path]);
  }
  await _syncAlbumMeta(albumId, groupId);
}

export async function movePhotoToAlbum(photoId: string, fromAlbumId: string, toAlbumId: string, toGroupId: string): Promise<void> {
  const { data: photo } = await sb().from('photos').select('group_id').eq('id', photoId).single();
  const fromGroupId = photo?.group_id;
  const { error } = await sb().from('photos').update({ album_id: toAlbumId, group_id: toGroupId }).eq('id', photoId);
  if (error) throw new Error(error.message);
  await _syncAlbumMeta(fromAlbumId, fromGroupId);
  await _syncAlbumMeta(toAlbumId, toGroupId);
}

async function _syncAlbumMeta(albumId: string, groupId: string): Promise<void> {
  const { data: photos } = await sb().from('photos').select('storage_path, created_at').eq('album_id', albumId).order('created_at', { ascending: false });
  const count = photos?.length ?? 0;
  const cover = photos?.[0]?.storage_path ?? null;
  await sb().from('albums').update({ photo_count: count, cover_photo: cover }).eq('id', albumId);
  // sync group album count
  const { data: albums } = await sb().from('albums').select('id, cover_photo').eq('group_id', groupId).order('created_at', { ascending: false });
  const albumCount = albums?.length ?? 0;
  const groupCover = albums?.find((a: any) => a.cover_photo)?.cover_photo ?? null;
  await sb().from('groups').update({ album_count: albumCount, cover_photo: groupCover }).eq('id', groupId);
}

function rowToPhoto(r: any): Photo {
  return {
    id: r.id,
    userId: r.user_id,
    albumId: r.album_id,
    groupId: r.group_id,
    uri: getPublicUrl(r.storage_path),
    storagePath: r.storage_path,
    name: r.name,
    caption: r.caption ?? undefined,
    createdAt: r.created_at,
  };
}

// Legacy compat
export async function savePhoto(photo: Photo): Promise<void> { /* no-op, use addPhotoToAlbum */ }
export async function updatePhotoCountForAlbum(albumId: string): Promise<void> { /* handled server-side */ }
export async function updateAlbumCountForGroup(groupId: string): Promise<void> { /* handled server-side */ }
export async function deleteAlbum2(albumId: string): Promise<void> { await deleteAlbum(albumId); }

// ── Carnets ──────────────────────────────────────────────────────────────────
export async function getCarnets(userId: string): Promise<Carnet[]> {
  const { data, error } = await sb()
    .from('carnets')
    .select('*, carnet_fields(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToCarnet);
}

export async function saveCarnet(carnet: Carnet): Promise<Carnet> {
  const row = {
    user_id: carnet.userId,
    name: carnet.name,
    description: carnet.description ?? null,
    emoji: carnet.emoji,
    entry_count: carnet.entryCount,
    cover_photo: carnet.coverPhoto ?? null,
  };
  let carnetId: string;
  if (!carnet.id || carnet.id.startsWith('carnet_')) {
    const { data, error } = await sb().from('carnets').insert(row).select().single();
    if (error) throw new Error(error.message);
    carnetId = data.id;
    // insert fields
    if (carnet.fields.length > 0) {
      const fieldRows = carnet.fields.map((f, i) => ({
        carnet_id: carnetId,
        label: f.label,
        type: f.type,
        position: i,
      }));
      const { data: fData, error: fErr } = await sb().from('carnet_fields').insert(fieldRows).select();
      if (fErr) throw new Error(fErr.message);
      // return with real field IDs
      return {
        ...carnet,
        id: carnetId,
        fields: (fData ?? []).map((f: any) => ({ id: f.id, label: f.label, type: f.type as 'text' | 'number' })),
      };
    }
    return { ...carnet, id: carnetId, fields: [] };
  }
  const { error } = await sb().from('carnets').update(row).eq('id', carnet.id);
  if (error) throw new Error(error.message);
  return carnet;
}

export async function deleteCarnet(carnetId: string): Promise<void> {
  const { error } = await sb().from('carnets').delete().eq('id', carnetId);
  if (error) throw new Error(error.message);
}

function rowToCarnet(r: any): Carnet {
  const fields: CarnetField[] = (r.carnet_fields ?? [])
    .sort((a: any, b: any) => a.position - b.position)
    .map((f: any) => ({ id: f.id, label: f.label, type: f.type as 'text' | 'number' }));
  return {
    id: r.id,
    userId: r.user_id,
    name: r.name,
    description: r.description ?? undefined,
    emoji: r.emoji,
    fields,
    entryCount: r.entry_count,
    coverPhoto: r.cover_photo ? getPublicUrl(r.cover_photo) : undefined,
    createdAt: r.created_at,
  };
}

// ── Carnet Entries ────────────────────────────────────────────────────────────
export async function getCarnetEntries(carnetId: string): Promise<CarnetEntry[]> {
  const { data, error } = await sb()
    .from('carnet_entries')
    .select('*, carnet_entry_values(*)')
    .eq('carnet_id', carnetId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToEntry);
}

export async function saveCarnetEntry(entry: CarnetEntry): Promise<CarnetEntry> {
  const row = {
    carnet_id: entry.carnetId,
    user_id: entry.userId,
    name: entry.name,
    description: entry.description,
  };

  let entryId: string;
  if (!entry.id || entry.id.startsWith('entry_')) {
    // upload image first
    const storagePath = await uploadImage(entry.uri, entry.userId, 'carnet');
    const { data, error } = await sb().from('carnet_entries').insert({ ...row, storage_path: storagePath }).select().single();
    if (error) throw new Error(error.message);
    entryId = data.id;
    // insert field values
    if (entry.fieldValues.length > 0) {
      const valRows = entry.fieldValues.map((fv) => ({ entry_id: entryId, field_id: fv.fieldId, value: fv.value }));
      await sb().from('carnet_entry_values').insert(valRows);
    }
    await _syncCarnetMeta(entry.carnetId, storagePath);
    return { ...entry, id: entryId, uri: getPublicUrl(storagePath) };
  }
  // update
  const { error } = await sb().from('carnet_entries').update({ name: entry.name, description: entry.description }).eq('id', entry.id);
  if (error) throw new Error(error.message);
  entryId = entry.id;
  // upsert field values
  for (const fv of entry.fieldValues) {
    await sb().from('carnet_entry_values').upsert({ entry_id: entryId, field_id: fv.fieldId, value: fv.value });
  }
  return entry;
}

export async function deleteCarnetEntry(entryId: string, carnetId: string): Promise<void> {
  const { data } = await sb().from('carnet_entries').select('storage_path').eq('id', entryId).single();
  await sb().from('carnet_entries').delete().eq('id', entryId);
  if (data?.storage_path) {
    await sb().storage.from('photos').remove([data.storage_path]);
  }
  await _syncCarnetMeta(carnetId, null);
}

async function _syncCarnetMeta(carnetId: string, newCover: string | null): Promise<void> {
  const { data: entries } = await sb()
    .from('carnet_entries')
    .select('storage_path, created_at')
    .eq('carnet_id', carnetId)
    .order('created_at', { ascending: false });
  const count = entries?.length ?? 0;
  const cover = entries?.[0]?.storage_path ?? newCover ?? null;
  await sb().from('carnets').update({ entry_count: count, cover_photo: cover }).eq('id', carnetId);
}

function rowToEntry(r: any): CarnetEntry {
  const fieldValues = (r.carnet_entry_values ?? []).map((v: any) => ({ fieldId: v.field_id, value: v.value }));
  return {
    id: r.id,
    carnetId: r.carnet_id,
    userId: r.user_id,
    uri: getPublicUrl(r.storage_path),
    storagePath: r.storage_path,
    name: r.name,
    description: r.description,
    fieldValues,
    createdAt: r.created_at,
  };
}
