import { ModePhotoTag } from '@/components/ModePhotoTag';
import { Button, Card, TagRow } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import type { IntentMode, RoomPeer } from '@/types/database';
import { Image, StyleSheet, Text, View } from 'react-native';

type Props = {
  peer: RoomPeer;
  mode: IntentMode;
  onConnect: () => void;
  onBlock: () => void;
  onReport?: () => void;
  onChat?: () => void;
  loading?: boolean;
  stackIndex?: number;
};

function skillTags(peer: RoomPeer, mode: IntentMode): string[] {
  const modeTag = mode.charAt(0).toUpperCase() + mode.slice(1);
  const extra =
    mode === 'networking' && peer.networking_skills?.length
      ? peer.networking_skills.slice(0, 3)
      : mode === 'friends' && peer.friends_interests?.length
        ? peer.friends_interests.slice(0, 3)
        : mode === 'dating' && peer.dating_aesthetic
          ? [peer.dating_aesthetic]
          : [];
  return [modeTag, ...extra].slice(0, 4);
}

function bioLine(peer: RoomPeer, mode: IntentMode): string {
  if (mode === 'networking') {
    const parts = [peer.networking_role, peer.networking_industry].filter(Boolean);
    return parts.length ? parts.join(' · ') : 'Open to networking';
  }
  if (mode === 'friends' && peer.friends_interests?.length) {
    return peer.friends_interests.slice(0, 3).join(' · ');
  }
  if (mode === 'dating') {
    return peer.dating_chemistry_notes ?? peer.dating_aesthetic ?? 'Open to dating';
  }
  return 'In the room now';
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function PeerStackCard({
  peer,
  mode,
  onConnect,
  onBlock,
  onReport,
  onChat,
  loading,
  stackIndex = 0,
}: Props) {
  const tags = skillTags(peer, mode);
  const displayName = peer.display_name ?? 'Someone here';
  const connected = peer.connection_status === 'connected';
  const outgoingPending = peer.i_want && !peer.they_want;
  const incomingPending = peer.they_want && !peer.i_want;
  const connectTitle = incomingPending ? 'Connect back' : 'Connect';
  const connectDisabled = loading || !!outgoingPending;

  return (
    <Card
      style={[
        styles.card,
        stackIndex === 1 && styles.cardBehind1,
        stackIndex === 2 && styles.cardBehind2,
        stackIndex > 0 && styles.cardBehindBase,
      ]}
      padded
    >
      {stackIndex === 0 ? (
        <>
          <View style={styles.hero}>
            <View style={styles.avatarWrap}>
              {peer.avatar_url ? (
                <Image source={{ uri: peer.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarText}>{initials(displayName)}</Text>
                </View>
              )}
              <ModePhotoTag mode={peer.mode} />
            </View>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.bio}>{bioLine(peer, mode)}</Text>
            <TagRow tags={tags} />
          </View>

          {connected ? (
            <Text style={styles.connected}>Connected</Text>
          ) : outgoingPending ? (
            <Text style={styles.pending}>Waiting for them to connect back</Text>
          ) : incomingPending ? (
            <Text style={styles.incoming}>Wants to connect</Text>
          ) : null}

          <View style={styles.actions}>
            {connected && onChat ? (
              <Button
                title="Open chat"
                onPress={onChat}
                accessibilityLabel={`Chat with ${displayName}`}
              />
            ) : !connected ? (
              <Button
                title={connectTitle}
                onPress={onConnect}
                disabled={connectDisabled}
                accessibilityLabel={`Connect with ${displayName}`}
              />
            ) : null}
            <Button
              title="Block instantly"
              variant="danger"
              onPress={onBlock}
              accessibilityLabel={`Block ${displayName}`}
            />
            {onReport ? (
              <Button
                title="Report"
                variant="ghost"
                onPress={onReport}
                accessibilityLabel={`Report ${displayName}`}
              />
            ) : null}
          </View>
        </>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 0, minHeight: 360 },
  cardBehindBase: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    opacity: 0.5,
  },
  cardBehind1: { top: 12, transform: [{ scale: 0.96 }], zIndex: 0 },
  cardBehind2: { top: 24, transform: [{ scale: 0.92 }], zIndex: -1 },
  hero: { alignItems: 'center', marginBottom: spacing.lg },
  avatarWrap: { position: 'relative', alignItems: 'center', marginBottom: spacing.md },
  avatar: { width: 112, height: 112, borderRadius: 56 },
  avatarFallback: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.accentDark, fontWeight: '800', fontSize: 32 },
  name: { color: colors.text, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  bio: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: spacing.xs,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
  connected: { color: colors.success, fontWeight: '700', textAlign: 'center', marginBottom: spacing.sm },
  pending: { color: colors.warning, textAlign: 'center', marginBottom: spacing.sm, fontSize: 14 },
  incoming: { color: colors.accentDark, fontWeight: '700', textAlign: 'center', marginBottom: spacing.sm },
  actions: { gap: spacing.sm },
});
