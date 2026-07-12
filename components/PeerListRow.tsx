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
};

function skillTags(peer: RoomPeer, mode: IntentMode): string[] {
  const modeTag = mode.charAt(0).toUpperCase() + mode.slice(1);
  const extra =
    mode === 'networking' && peer.networking_skills?.length
      ? peer.networking_skills.slice(0, 2)
      : mode === 'friends' && peer.friends_interests?.length
        ? peer.friends_interests.slice(0, 2)
        : mode === 'dating' && peer.dating_aesthetic
          ? [peer.dating_aesthetic]
          : [];
  return [modeTag, ...extra].slice(0, 3);
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function PeerListRow({ peer, mode, onConnect, onBlock, onReport, onChat, loading }: Props) {
  const tags = skillTags(peer, mode);
  const displayName = peer.display_name ?? 'Someone here';
  const connected = peer.connection_status === 'connected';
  const outgoingPending = peer.i_want && !peer.they_want;
  const incomingPending = peer.they_want && !peer.i_want;

  return (
    <Card style={styles.row} padded>
      <View style={styles.main}>
        <View style={styles.avatarWrap}>
          {peer.avatar_url ? (
            <Image source={{ uri: peer.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{initials(displayName)}</Text>
            </View>
          )}
          <ModePhotoTag mode={peer.mode} size="medium" />
        </View>
        <View style={styles.copy}>
          <Text style={styles.name}>{displayName}</Text>
          <TagRow tags={tags} />
        </View>
      </View>
      <View style={styles.actions}>
        {connected && onChat ? (
          <Button title="Chat" onPress={onChat} style={styles.primaryBtn} />
        ) : (
          <Button
            title={incomingPending ? 'Connect back' : 'Connect'}
            onPress={onConnect}
            disabled={loading || !!outgoingPending}
            style={styles.primaryBtn}
          />
        )}
        <Button title="Block" variant="danger" onPress={onBlock} style={styles.dangerBtn} />
        {onReport ? (
          <Button title="Report" variant="ghost" onPress={onReport} style={styles.dangerBtn} />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: spacing.sm },
  main: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  avatarWrap: { position: 'relative', width: 64, height: 64 },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.accentDark, fontWeight: '800' },
  copy: { flex: 1 },
  name: { color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.sm },
  primaryBtn: { flex: 1 },
  dangerBtn: { flex: 1 },
});
