// Powered by OnSpace.AI — Login / Splash
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Redirect } from 'expo-router';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/template';
import { Button, Input } from '@/components';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';

export default function LoginScreen() {
  const { user, isLoading, login } = useAuth();
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('123456');
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && user) return <Redirect href="/(tabs)" />;
  if (isLoading) return <View style={styles.splash}><Text style={styles.splashText}>PhotoVault</Text></View>;

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      showAlert('Champs manquants', 'Veuillez remplir tous les champs.');
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (e: any) {
      showAlert('Erreur de connexion', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="light" />
      <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Image source={require('@/assets/images/hero-gallery.png')} style={styles.hero} contentFit="cover" transition={300} />
        <View style={styles.card}>
          {/* MOCK LOGIN badge */}
          <View style={styles.mockBadge}>
            <Text style={styles.mockText}>🔐 CONNEXION SIMULÉE</Text>
          </View>
          <Text style={styles.title}>PhotoVault</Text>
          <Text style={styles.subtitle}>Organisez vos souvenirs en groupes et albums</Text>
          <View style={styles.form}>
            <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="test@example.com" accessibilityLabel="Email" />
            <Input label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry placeholder="123456" accessibilityLabel="Mot de passe" />
            <Text style={styles.hint}>Identifiants de démo : test@example.com / 123456</Text>
            <Button label="Se connecter" onPress={handleLogin} loading={submitting} style={styles.btn} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  splashText: { color: Colors.primary, fontSize: Typography.sizes.xxxl, fontWeight: Typography.weights.bold },
  root: { flex: 1, backgroundColor: Colors.background },
  content: { alignItems: 'center', paddingHorizontal: Spacing.lg },
  hero: { width: 220, height: 300, borderRadius: Radius.xl, marginBottom: Spacing.xl },
  card: { width: '100%', backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, gap: Spacing.md },
  mockBadge: { backgroundColor: Colors.warning + '22', borderWidth: 1, borderColor: Colors.warning, borderRadius: Radius.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, alignSelf: 'center' },
  mockText: { color: Colors.warning, fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold },
  title: { color: Colors.textPrimary, fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, textAlign: 'center', includeFontPadding: false },
  subtitle: { color: Colors.textSecondary, fontSize: Typography.sizes.sm, textAlign: 'center', includeFontPadding: false },
  form: { gap: Spacing.md },
  hint: { color: Colors.textMuted, fontSize: Typography.sizes.xs, textAlign: 'center', includeFontPadding: false },
  btn: { marginTop: Spacing.xs },
});
