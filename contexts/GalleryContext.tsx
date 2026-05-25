// Powered by OnSpace.AI
import React, { createContext, useState, useCallback, ReactNode } from 'react';
import { Group, Album, Photo } from '@/types';
import {
  getGroups, saveGroup, deleteGroup,
  getAlbums, saveAlbum, deleteAlbum,
  getPhotos, savePhoto, deletePhoto, updatePhoto, getAllPhotos,
  updatePhotoCountForAlbum, updateAlbumCountForGroup, movePhotoToAlbum,
} from '@/services/storage';
import { Colors } from '@/constants/theme';

interface GalleryContextType {
  groups: Group[];
  albums: Album[];
  photos: Photo[];
  allPhotos: Photo[];
  loadGroups: (userId: string) => Promise<void>;
  loadAlbums: (groupId: string) => Promise<void>;
  loadPhotos: (albumId: string) => Promise<void>;
  loadAllPhotos: (userId: string) => Promise<void>;
  addGroup: (userId: string, name: string, description?: string) => Promise<Group>;
  updateGroup: (group: Group) => Promise<void>;
  removeGroup: (groupId: string, userId: string) => Promise<void>;
  addAlbum: (userId: string, groupId: string, name: string, description?: string) => Promise<Album>;
  updateAlbum: (album: Album) => Promise<void>;
  removeAlbum: (albumId: string, groupId: string) => Promise<void>;
  addPhoto: (userId: string, albumId: string, groupId: string, uri: string, name: string) => Promise<Photo>;
  renamePhoto: (photo: Photo, newName: string) => Promise<void>;
  movePhoto: (photo: Photo, targetAlbum: Album) => Promise<void>;
  removePhoto: (photoId: string, albumId: string) => Promise<void>;
}

export const GalleryContext = createContext<GalleryContextType | undefined>(undefined);

export function GalleryProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);

  const loadGroups = useCallback(async (userId: string) => {
    const data = await getGroups(userId);
    setGroups(data);
  }, []);

  const loadAlbums = useCallback(async (groupId: string) => {
    const data = await getAlbums(groupId);
    setAlbums(data);
  }, []);

  const loadPhotos = useCallback(async (albumId: string) => {
    const data = await getPhotos(albumId);
    setPhotos(data);
  }, []);

  const loadAllPhotos = useCallback(async (userId: string) => {
    const data = await getAllPhotos(userId);
    setAllPhotos(data);
  }, []);

  const addGroup = useCallback(async (userId: string, name: string, description?: string): Promise<Group> => {
    const colorIdx = Math.floor(Math.random() * Colors.groupPalette.length);
    const group: Group = {
      id: `group_${Date.now()}`,
      name,
      description,
      color: Colors.groupPalette[colorIdx],
      albumCount: 0,
      createdAt: new Date().toISOString(),
      userId,
    };
    await saveGroup(group);
    setGroups((prev) => [group, ...prev]);
    return group;
  }, []);

  const updateGroup = useCallback(async (group: Group) => {
    await saveGroup(group);
    setGroups((prev) => prev.map((g) => (g.id === group.id ? group : g)));
  }, []);

  const removeGroup = useCallback(async (groupId: string, userId: string) => {
    await deleteGroup(groupId);
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    const remaining = await getGroups(userId);
    setGroups(remaining);
  }, []);

  const addAlbum = useCallback(async (userId: string, groupId: string, name: string, description?: string): Promise<Album> => {
    const album: Album = {
      id: `album_${Date.now()}`,
      groupId,
      name,
      description,
      photoCount: 0,
      createdAt: new Date().toISOString(),
      userId,
    };
    await saveAlbum(album);
    await updateAlbumCountForGroup(groupId);
    setAlbums((prev) => [album, ...prev]);
    setGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, albumCount: g.albumCount + 1 } : g));
    return album;
  }, []);

  const updateAlbum = useCallback(async (album: Album) => {
    await saveAlbum(album);
    setAlbums((prev) => prev.map((a) => (a.id === album.id ? album : a)));
  }, []);

  const removeAlbum = useCallback(async (albumId: string, groupId: string) => {
    await deleteAlbum(albumId);
    setAlbums((prev) => prev.filter((a) => a.id !== albumId));
    await updateAlbumCountForGroup(groupId);
    setGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, albumCount: Math.max(0, g.albumCount - 1) } : g));
  }, []);

  const addPhoto = useCallback(async (userId: string, albumId: string, groupId: string, uri: string, name: string): Promise<Photo> => {
    const photo: Photo = {
      id: `photo_${Date.now()}`,
      albumId,
      groupId,
      uri,
      name,
      createdAt: new Date().toISOString(),
      userId,
    };
    await savePhoto(photo);
    await updatePhotoCountForAlbum(albumId);
    setPhotos((prev) => [photo, ...prev]);
    setAllPhotos((prev) => [photo, ...prev]);
    setAlbums((prev) => prev.map((a) => a.id === albumId ? { ...a, photoCount: a.photoCount + 1, coverPhoto: photo.uri } : a));
    return photo;
  }, []);

  const movePhoto = useCallback(async (photo: Photo, targetAlbum: Album) => {
    await movePhotoToAlbum(photo.id, photo.albumId, targetAlbum.id, targetAlbum.groupId);
    const updated = { ...photo, albumId: targetAlbum.id, groupId: targetAlbum.groupId };
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    setAllPhotos((prev) => prev.map((p) => p.id === photo.id ? updated : p));
    setAlbums((prev) =>
      prev.map((a) =>
        a.id === photo.albumId
          ? { ...a, photoCount: Math.max(0, a.photoCount - 1) }
          : a
      )
    );
  }, []);

  const renamePhoto = useCallback(async (photo: Photo, newName: string) => {
    const updated = { ...photo, name: newName };
    await updatePhoto(updated);
    setPhotos((prev) => prev.map((p) => p.id === photo.id ? updated : p));
    setAllPhotos((prev) => prev.map((p) => p.id === photo.id ? updated : p));
  }, []);

  const removePhoto = useCallback(async (photoId: string, albumId: string) => {
    await deletePhoto(photoId);
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    setAllPhotos((prev) => prev.filter((p) => p.id !== photoId));
    await updatePhotoCountForAlbum(albumId);
    setAlbums((prev) => prev.map((a) => a.id === albumId ? { ...a, photoCount: Math.max(0, a.photoCount - 1) } : a));
  }, []);

  return (
    <GalleryContext.Provider value={{ groups, albums, photos, allPhotos, loadGroups, loadAlbums, loadPhotos, loadAllPhotos, addGroup, updateGroup, removeGroup, addAlbum, updateAlbum, removeAlbum, addPhoto, renamePhoto, movePhoto, removePhoto }}>
      {children}
    </GalleryContext.Provider>
  );
}
