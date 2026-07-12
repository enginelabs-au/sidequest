import { ModePhotoTag } from '@/components/ModePhotoTag';
import { WaveButton } from '@/components/WaveButton';
import { WavePhotoTag } from '@/components/WavePhotoTag';
import { TagRow } from '@/components/ui';
import { radius, shadows, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { DiscoveryProfile } from '@/lib/socialMock';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  profile: DiscoveryProfile;
  onWave: () => void;
  onUnWave: () => void;
  onAttemptWave?: () => boolean;
  onOpenProfile: () => void;
  loading?: boolean;
  waved?: boolean;
};

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function DiscoveryProfileCard({
  profile,
  onWave,
  onUnWave,
  onAttemptWave,
  onOpenProfile,
  loading,
  waved,
}: Props) {
  const { colors } = useTheme();
  const title = profile.age ? `${profile.display_name}, ${profile.age}` : profile.display_name;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          flex: 1,
          backgroundColor: colors.card,
          borderRadius: radius.xl,
          overflow: 'hidden',
          ...shadows.card,
        },
        photo: {
          flex: 1,
          minHeight: 320,
          backgroundColor: colors.purpleMuted,
          alignItems: 'center',
          justifyContent: 'center',
        },
        photoInitials: { fontSize: 72, fontWeight: '800', color: colors.text },
        info: {
          padding: spacing.lg,
          gap: spacing.sm,
          borderTopLeftRadius: radius.lg,
          borderTopRightRadius: radius.lg,
          marginTop: -spacing.lg,
          backgroundColor: colors.card,
        },
        name: { color: colors.text, fontSize: 22, fontWeight: '800' },
        bio: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
        actions: {
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: spacing.sm,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.card}>
      <Pressable
        style={styles.photo}
        onPress={onOpenProfile}
        accessibilityRole="button"
        accessibilityLabel={`View ${profile.display_name}'s public profile`}
      >
        <Text style={styles.photoInitials}>{initials(profile.display_name)}</Text>
        <ModePhotoTag mode={profile.mode} />
        {waved ? <WavePhotoTag size="large" /> : null}
      </Pressable>
      <View style={styles.info}>
        <Pressable
          onPress={onOpenProfile}
          accessibilityRole="button"
          accessibilityLabel={`View ${profile.display_name}'s public profile`}
        >
          <Text style={styles.name}>{title}</Text>
          <Text style={styles.bio}>{profile.bio}</Text>
          <TagRow tags={profile.tags} />
        </Pressable>
        <View style={styles.actions}>
          <WaveButton
            peerUserId={profile.user_id}
            waved={!!waved}
            onSendWave={onWave}
            onUnWave={onUnWave}
            onAttemptWave={onAttemptWave}
            disabled={loading}
          />
        </View>
      </View>
    </View>
  );
}
