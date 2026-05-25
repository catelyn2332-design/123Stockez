// Powered by OnSpace.AI — MOCK AUTH
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types';
import { DEFAULT_CREDENTIALS } from '@/constants/config';

const AUTH_KEY = 'photovault_auth';

export async function mockLogin(email: string, password: string): Promise<User> {
  if (email.trim().toLowerCase() === DEFAULT_CREDENTIALS.email && password === DEFAULT_CREDENTIALS.password) {
    const user: User = { id: `user_${email}`, email: email.trim().toLowerCase(), name: email.split('@')[0] };
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(user));
    return user;
  }
  throw new Error('Identifiants incorrects. Utilisez test@example.com / 123456');
}

export async function getCurrentUser(): Promise<User | null> {
  const raw = await AsyncStorage.getItem(AUTH_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_KEY);
}
