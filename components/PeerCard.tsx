import { Button } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import type { IntentMode, RoomPeer } from '@/types/database';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  peer: RoomPeer;
  mode: IntentMode;
  onConnect: () => void;
  onBlock: () => void;
  onChat?: () => void;
  onReport?: () => void;
  loading?: boolean;
};

function modeFields(peer: RoomPeer, mode: IntentMode): string[] {
  switch (mode) {
    case 'friends':
      return [
        peer.friends_interests?.length
          ? `Interests: ${peer.friends_interests.join(', ')}`
          : '',
        peer.friends_music?.length ? `Music: ${peer.friends_music.join(', ')}` : '',
        peer.friends_hobbies?.length ? `Hobbies: ${peer.friends_hobbies.join(', ')}` : '',
        peer.friends_fun_facts ? `Fun fact: ${peer.friends_fun_facts}` : '',
      ].filter(Boolean);
    case 'networking':
      return [
        peer.networking_role ? `Role: ${peer.networking_role}` : '',
        peer.networking_industry ? `Industry: ${peer.networking_industry}` : '',
        peer.networking_skills?.length
          ? `Skills: ${peer.networking_skills.join(', ')}`
          : '',
      ].filter(Boolean);
    case 'dating':
      return [
        peer.dating_aesthetic ? `Aesthetic: ${peer.dating_aesthetic}` : '',
        peer.dating_chemistry_notes ? peer.dating_chemistry_notes : '',
      ].filter(Boolean);
  }
}

function connectionStateLabel(peer: RoomPeer): string {
  if (peer.connection_status === 'connected') return 'connected';
  if (peer.i_want && !peer.they_want) return 'waiting for them to connect back';
  if (peer.they_want && !peer.i_want) return 'wants to connect';
  return 'not connected';
}

export function PeerCard({
  peer,
  mode,
  onConnect,
  onBlock,
  onChat,
  onReport,
  loading,
}: Props) {
  const fields = modeFields(peer, mode);
  const connected = peer.connection_status === 'connected';
  const outgoingPending = peer.i_want && !peer.they_want;
  const incomingPending = peer.they_want && !peer.i_want;
  const displayName = peer.display_name ?? 'Someone here';

  const connectTitle = incomingPending ? 'Connect back' : 'Connect';
  const connectDisabled = loading || !!outgoingPending;

  return (
    <View
      style={styles.card}
      accessibilityLabel={`${displayName}, group ${peer.group_size}, ${connectionStateLabel(peer)}`}
    >
      <Text style={styles.name}>{displayName}</Text>
      <Text style={styles.meta}>
        Group {peer.group_size} · {mode}
      </Text>
      {fields.map((line) => (
        <Text key={line} style={styles.field}>
          {line}
        </Text>
      ))}
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
            title="Chat"
            onPress={onChat}
            accessibilityLabel={`Chat with ${displayName}`}
            style={styles.actionBtn}
          />
        ) : !connected ? (
          <Button
            title={connectTitle}
            onPress={onConnect}
            disabled={connectDisabled}
            accessibilityLabel={
              incomingPending
                ? `Connect back with ${displayName}`
                : `Connect with ${displayName}`
            }
            style={styles.actionBtn}
          />
        ) : null}
        {onReport ? (
          <Button
            title="Report"
            variant="ghost"
            onPress={onReport}
            accessibilityLabel={`Report ${displayName}`}
            style={styles.actionBtn}
          />
        ) : null}
        <Button
          title="Block"
          variant="danger"
          onPress={onBlock}
          accessibilityLabel={`Block ${displayName}`}
          style={styles.actionBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: { color: colors.text, fontSize: 22, fontWeight: '700' },
  meta: { color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.md },
  field: { color: colors.text, fontSize: 15, lineHeight: 22, marginBottom: spacing.xs },
  connected: { color: colors.success, fontWeight: '600', marginBottom: spacing.sm },
  pending: { color: colors.warning, marginBottom: spacing.sm },
  incoming: { color: colors.accent, fontWeight: '600', marginBottom: spacing.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  actionBtn: { flexGrow: 1, minWidth: 120 },
});
