import { Button, Card, TagRow } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
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
      ].filter(Boolean);
    case 'dating':
      return [
        peer.dating_aesthetic ? `Aesthetic: ${peer.dating_aesthetic}` : '',
        peer.dating_chemistry_notes ? peer.dating_chemistry_notes : '',
      ].filter(Boolean);
  }
}

function skillTags(peer: RoomPeer, mode: IntentMode): string[] {
  if (mode === 'networking' && peer.networking_skills?.length) {
    return peer.networking_skills.slice(0, 6);
  }
  if (mode === 'friends' && peer.friends_interests?.length) {
    return peer.friends_interests.slice(0, 6);
  }
  return [];
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
  const tags = skillTags(peer, mode);
  const connected = peer.connection_status === 'connected';
  const outgoingPending = peer.i_want && !peer.they_want;
  const incomingPending = peer.they_want && !peer.i_want;
  const displayName = peer.display_name ?? 'Someone here';

  const connectTitle = incomingPending ? 'Connect back' : 'Connect';
  const connectDisabled = loading || !!outgoingPending;

  return (
    <Card style={styles.cardWrap}>
      <Text style={styles.name}>{displayName}</Text>
      <Text style={styles.meta}>
        Group {peer.group_size} · {mode}
      </Text>
      <TagRow tags={tags} />
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
            variant="outline"
            onPress={onReport}
            accessibilityLabel={`Report ${displayName}`}
            style={styles.actionBtn}
          />
        ) : null}
        <Button
          title="Block"
          variant="ghost"
          onPress={onBlock}
          accessibilityLabel={`Block ${displayName}`}
          style={styles.actionBtn}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  cardWrap: { marginBottom: spacing.md },
  name: { color: colors.text, fontSize: 20, fontWeight: '800' },
  meta: { color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.sm, fontSize: 14 },
  field: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, marginTop: spacing.xs },
  connected: { color: colors.success, fontWeight: '700', marginTop: spacing.sm },
  pending: { color: colors.warning, marginTop: spacing.sm, fontSize: 14 },
  incoming: { color: colors.accentDark, fontWeight: '700', marginTop: spacing.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  actionBtn: { flexGrow: 1, minWidth: 110 },
});
