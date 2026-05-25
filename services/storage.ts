// Powered by OnSpace.AI
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Group, Album, Photo, Carnet, CarnetEntry } from '@/types';


const KEYS = {
  groups: 'photovault_groups',
  albums: 'photovault_albums',
  photos: 'photovault_photos',
  user: 'photovault_user',
};

// ── Groups ──
export async function getGroups(userId: string): Promise<Group[]> {
  const raw = await AsyncStorage.getItem(KEYS.groups);
  const all: Group[] = raw ? JSON.parse(raw) : [];
  return all.filter((g) => g.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveGroup(group: Group): Promise<void> {
  const raw = await AsyncStorage.getItem(KEYS.groups);
  const all: Group[] = raw ? JSON.parse(raw) : [];
  const idx = all.findIndex((g) => g.id === group.id);
  if (idx >= 0) all[idx] = group;
  else all.push(group);
  await AsyncStorage.setItem(KEYS.groups, JSON.stringify(all));
}

export async function deleteGroup(groupId: string): Promise<void> {
  const raw = await AsyncStorage.getItem(KEYS.groups);
  const all: Group[] = raw ? JSON.parse(raw) : [];
  await AsyncStorage.setItem(KEYS.groups, JSON.stringify(all.filter((g) => g.id !== groupId)));

  // cascade delete albums and photos
  await deleteAlbumsByGroup(groupId);
}

// ── Albums ──
export async function getAlbums(groupId: string): Promise<Album[]> {
  const raw = await AsyncStorage.getItem(KEYS.albums);
  const all: Album[] = raw ? JSON.parse(raw) : [];
  return all.filter((a) => a.groupId === groupId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveAlbum(album: Album): Promise<void> {
  const raw = await AsyncStorage.getItem(KEYS.albums);
  const all: Album[] = raw ? JSON.parse(raw) : [];
  const idx = all.findIndex((a) => a.id === album.id);
  if (idx >= 0) all[idx] = album;
  else all.push(album);
  await AsyncStorage.setItem(KEYS.albums, JSON.stringify(all));
}

export async function deleteAlbum(albumId: string): Promise<void> {
  const raw = await AsyncStorage.getItem(KEYS.albums);
  const all: Album[] = raw ? JSON.parse(raw) : [];
  await AsyncStorage.setItem(KEYS.albums, JSON.stringify(all.filter((a) => a.id !== albumId)));
  await deletePhotosByAlbum(albumId);
}

async function deleteAlbumsByGroup(groupId: string): Promise<void> {
  const raw = await AsyncStorage.getItem(KEYS.albums);
  const all: Album[] = raw ? JSON.parse(raw) : [];
  const toDelete = all.filter((a) => a.groupId === groupId);
  await AsyncStorage.setItem(KEYS.albums, JSON.stringify(all.filter((a) => a.groupId !== groupId)));
  for (const album of toDelete) {
    await deletePhotosByAlbum(album.id);
  }
}

// ── Photos ──
export async function getPhotos(albumId: string): Promise<Photo[]> {
  const raw = await AsyncStorage.getItem(KEYS.photos);
  const all: Photo[] = raw ? JSON.parse(raw) : [];
  return all.filter((p) => p.albumId === albumId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function savePhoto(photo: Photo): Promise<void> {
  const raw = await AsyncStorage.getItem(KEYS.photos);
  const all: Photo[] = raw ? JSON.parse(raw) : [];
  const idx = all.findIndex((p) => p.id === photo.id);
  if (idx >= 0) all[idx] = photo;
  else all.push(photo);
  await AsyncStorage.setItem(KEYS.photos, JSON.stringify(all));
}

export async function updatePhoto(photo: Photo): Promise<void> {
  const raw = await AsyncStorage.getItem(KEYS.photos);
  const all: Photo[] = raw ? JSON.parse(raw) : [];
  const idx = all.findIndex((p) => p.id === photo.id);
  if (idx >= 0) all[idx] = photo;
  await AsyncStorage.setItem(KEYS.photos, JSON.stringify(all));
}

export async function getAllPhotos(userId: string): Promise<Photo[]> {
  const raw = await AsyncStorage.getItem(KEYS.photos);
  const all: Photo[] = raw ? JSON.parse(raw) : [];
  return all.filter((p) => p.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function movePhotoToAlbum(photoId: string, fromAlbumId: string, toAlbumId: string, toGroupId: string): Promise<void> {
  const raw = await AsyncStorage.getItem(KEYS.photos);
  const all: Photo[] = raw ? JSON.parse(raw) : [];
  const idx = all.findIndex((p) => p.id === photoId);
  if (idx >= 0) {
    all[idx] = { ...all[idx], albumId: toAlbumId, groupId: toGroupId };
    await AsyncStorage.setItem(KEYS.photos, JSON.stringify(all));
  }
  await updatePhotoCountForAlbum(fromAlbumId);
  await updatePhotoCountForAlbum(toAlbumId);
}

export async function deletePhoto(photoId: string): Promise<void> {
  const raw = await AsyncStorage.getItem(KEYS.photos);
  const all: Photo[] = raw ? JSON.parse(raw) : [];
  await AsyncStorage.setItem(KEYS.photos, JSON.stringify(all.filter((p) => p.id !== photoId)));
}

async function deletePhotosByAlbum(albumId: string): Promise<void> {
  const raw = await AsyncStorage.getItem(KEYS.photos);
  const all: Photo[] = raw ? JSON.parse(raw) : [];
  await AsyncStorage.setItem(KEYS.photos, JSON.stringify(all.filter((p) => p.albumId !== albumId)));
}

export async function updatePhotoCountForAlbum(albumId: string): Promise<void> {
  const photosRaw = await AsyncStorage.getItem(KEYS.photos);
  const photos: Photo[] = photosRaw ? JSON.parse(photosRaw) : [];
  const count = photos.filter((p) => p.albumId === albumId).length;

  const albumsRaw = await AsyncStorage.getItem(KEYS.albums);
  const albums: Album[] = albumsRaw ? JSON.parse(albumsRaw) : [];
  const idx = albums.findIndex((a) => a.id === albumId);
  if (idx >= 0) {
    const firstPhoto = photos.filter((p) => p.albumId === albumId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    albums[idx].photoCount = count;
    if (firstPhoto) albums[idx].coverPhoto = firstPhoto.uri;
    await AsyncStorage.setItem(KEYS.albums, JSON.stringify(albums));

    // update group albumCount and cover
    await updateAlbumCountForGroup(albums[idx].groupId);
  }
}

// ── Carnets ──────────────────────────────────────────────────────────────────
const CARNET_KEY = 'photovault_carnets';
const CARNET_ENTRY_KEY = 'photovault_carnet_entries';

export async function getCarnets(userId: string): Promise<Carnet[]> {
  const raw = await AsyncStorage.getItem(CARNET_KEY);
  const all: Carnet[] = raw ? JSON.parse(raw) : [];
  return all.filter((c) => c.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveCarnet(carnet: Carnet): Promise<void> {
  const raw = await AsyncStorage.getItem(CARNET_KEY);
  const all: Carnet[] = raw ? JSON.parse(raw) : [];
  const idx = all.findIndex((c) => c.id === carnet.id);
  if (idx >= 0) all[idx] = carnet; else all.push(carnet);
  await AsyncStorage.setItem(CARNET_KEY, JSON.stringify(all));
}

export async function deleteCarnet(carnetId: string): Promise<void> {
  const raw = await AsyncStorage.getItem(CARNET_KEY);
  const all: Carnet[] = raw ? JSON.parse(raw) : [];
  await AsyncStorage.setItem(CARNET_KEY, JSON.stringify(all.filter((c) => c.id !== carnetId)));
  // cascade
  const er = await AsyncStorage.getItem(CARNET_ENTRY_KEY);
  const entries: CarnetEntry[] = er ? JSON.parse(er) : [];
  await AsyncStorage.setItem(CARNET_ENTRY_KEY, JSON.stringify(entries.filter((e) => e.carnetId !== carnetId)));
}

export async function getCarnetEntries(carnetId: string): Promise<CarnetEntry[]> {
  const raw = await AsyncStorage.getItem(CARNET_ENTRY_KEY);
  const all: CarnetEntry[] = raw ? JSON.parse(raw) : [];
  return all.filter((e) => e.carnetId === carnetId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveCarnetEntry(entry: CarnetEntry): Promise<void> {
  const raw = await AsyncStorage.getItem(CARNET_ENTRY_KEY);
  const all: CarnetEntry[] = raw ? JSON.parse(raw) : [];
  const idx = all.findIndex((e) => e.id === entry.id);
  if (idx >= 0) all[idx] = entry; else all.push(entry);
  await AsyncStorage.setItem(CARNET_ENTRY_KEY, JSON.stringify(all));
  await _syncCarnetMeta(entry.carnetId);
}

export async function deleteCarnetEntry(entryId: string, carnetId: string): Promise<void> {
  const raw = await AsyncStorage.getItem(CARNET_ENTRY_KEY);
  const all: CarnetEntry[] = raw ? JSON.parse(raw) : [];
  await AsyncStorage.setItem(CARNET_ENTRY_KEY, JSON.stringify(all.filter((e) => e.id !== entryId)));
  await _syncCarnetMeta(carnetId);
}

async function _syncCarnetMeta(carnetId: string): Promise<void> {
  const er = await AsyncStorage.getItem(CARNET_ENTRY_KEY);
  const entries: CarnetEntry[] = er ? JSON.parse(er) : [];
  const mine = entries.filter((e) => e.carnetId === carnetId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const cr = await AsyncStorage.getItem(CARNET_KEY);
  const carnets: Carnet[] = cr ? JSON.parse(cr) : [];
  const idx = carnets.findIndex((c) => c.id === carnetId);
  if (idx >= 0) {
    carnets[idx].entryCount = mine.length;
    if (mine[0]) carnets[idx].coverPhoto = mine[0].uri;
    await AsyncStorage.setItem(CARNET_KEY, JSON.stringify(carnets));
  }
}

export async function updateAlbumCountForGroup(groupId: string): Promise<void> {
  const albumsRaw = await AsyncStorage.getItem(KEYS.albums);
  const albums: Album[] = albumsRaw ? JSON.parse(albumsRaw) : [];
  const groupAlbums = albums.filter((a) => a.groupId === groupId);
  const count = groupAlbums.length;

  const groupsRaw = await AsyncStorage.getItem(KEYS.groups);
  const groups: Group[] = groupsRaw ? JSON.parse(groupsRaw) : [];
  const idx = groups.findIndex((g) => g.id === groupId);
  if (idx >= 0) {
    groups[idx].albumCount = count;
    const albumWithCover = groupAlbums.find((a) => a.coverPhoto);
    if (albumWithCover) groups[idx].coverPhoto = albumWithCover.coverPhoto;
    await AsyncStorage.setItem(KEYS.groups, JSON.stringify(groups));
  }
}
