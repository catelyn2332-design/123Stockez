// Powered by OnSpace.AI — Profile Screen
import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useGallery } from '@/hooks/useGallery';
import { useAlert } from '@/template';
import { Button } from '@/components';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { groups } = useGallery();
  const { showAlert } = useAlert();

  const totalAlbums = groups.reduce((acc, g) => acc + g.albumCount, 0);

  const handleSignOut = () => {
    showAlert('Se déconnecter ?', 'Vos données resteront sauvegardées.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <ScrollView style={[styles.root, { paddingTop: insets.top }]} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profil</Text>
      </View>

      {/* Avatar card */}
      <View style={styles.avatarCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.email?.[0]?.toUpperCase() ?? 'U'}</Text>
        </View>
        <Text style={styles.emailText}>{user?.email}</Text>
        <View style={styles.mockBadge}>
          <Text style={styles.mockText}>🔐 Connexion simulée</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{groups.length}</Text>
          <Text style={styles.statLabel}>Groupes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalAlbums}</Text>
          <Text style={styles.statLabel}>Albums</Text>
        </View>
      </View>

      {/* Menu items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Application</Text>
        <MenuItem icon="info-outline" label="Version 1.0.0 (Demo)" />
        <MenuItem icon="storage" label="Stockage local (mocked)" />
        <MenuItem icon="email" label="Partage par email disponible dans les albums" />
      </View>

      <View style={styles.logoutContainer}>
        <Button label="Se déconnecter" onPress={handleSignOut} variant="danger" />
      </View>
    </ScrollView>
  );
}

function MenuItem({ icon, label }: { icon: any; label: string }) {
  return (
    <View style={menuStyles.item}>
      <MaterialIcons name={icon} size={20} color={Colors.textSecondary} />
      <Text style={menuStyles.label}>{label}</Text>
    </View>
  );
}

const menuStyles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  label: { color: Colors.textSecondary, fontSize: Typography.sizes.base, flex: 1, includeFontPadding: false },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  title: { color: Colors.textPrimary, fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, includeFontPadding: false },
  avatarCard: { margin: Spacing.lg, backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.textPrimary, fontSize: Typography.sizes.xxxl, fontWeight: Typography.weights.bold },
  emailText: { color: Colors.textPrimary, fontSize: Typography.sizes.lg, fontWeight: Typography.weights.medium, includeFontPadding: false },
  mockBadge: { backgroundColor: Colors.warning + '22', borderWidth: 1, borderColor: Colors.warning, borderRadius: Radius.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  mockText: { color: Colors.warning, fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold },
  statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.md, marginBottom: Spacing.lg },
  statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center' },
  statNumber: { color: Colors.primary, fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, includeFontPadding: false },
  statLabel: { color: Colors.textMuted, fontSize: Typography.sizes.sm, includeFontPadding: false },
  section: { marginHorizontal: Spacing.lg, backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, gap: 0 },
  sectionTitle: { color: Colors.textMuted, fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold, marginBottom: Spacing.sm, includeFontPadding: false },
  logoutContainer: { margin: Spacing.lg, marginTop: Spacing.xl },
});
