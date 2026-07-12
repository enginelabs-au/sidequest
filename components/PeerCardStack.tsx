import { PeerStackCard } from '@/components/PeerStackCard';
import { colors, spacing } from '@/constants/theme';
import type { IntentMode, RoomPeer } from '@/types/database';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  peers: RoomPeer[];
  mode: IntentMode;
  onConnect: (peer: RoomPeer) => void;
  onBlock: (peer: RoomPeer) => void;
  onReport?: (peer: RoomPeer) => void;
  onChat?: (peer: RoomPeer) => void;
  actionLoading: string | null;
};

export function PeerCardStack({
  peers,
  mode,
  onConnect,
  onBlock,
  onReport,
  onChat,
  actionLoading,
}: Props) {
  const [index, setIndex] = useState(0);
  const current = peers[index];

  if (!current) return null;

  const advance = () => setIndex((i) => (i + 1) % peers.length);

  const handleConnect = () => {
    onConnect(current);
  };

  const handleBlock = () => {
    onBlock(current);
    if (peers.length > 1) advance();
  };

  const visibleStack = peers.slice(index, index + 3);

  return (
    <View style={styles.wrap}>
      <View style={styles.stackArea}>
        {visibleStack
          .slice()
          .reverse()
          .map((peer, reverseIdx) => {
            const stackIndex = visibleStack.length - 1 - reverseIdx;
            return (
              <View
                key={peer.user_id}
                style={stackIndex > 0 ? styles.behindLayer : undefined}
                pointerEvents={stackIndex === 0 ? 'auto' : 'none'}
              >
                <PeerStackCard
                  peer={peer}
                  mode={mode}
                  onConnect={handleConnect}
                  onBlock={handleBlock}
                  onReport={onReport ? () => onReport(peer) : undefined}
                  onChat={onChat ? () => onChat(peer) : undefined}
                  loading={actionLoading === peer.user_id}
                  stackIndex={stackIndex}
                />
              </View>
            );
          })}
      </View>
      {peers.length > 1 ? (
        <View style={styles.nav}>
          <Pressable onPress={advance} accessibilityRole="button" accessibilityLabel="Next profile">
            <Text style={styles.navText}>Next in room ({index + 1}/{peers.length})</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minHeight: 320 },
  stackArea: {
    flex: 1,
    minHeight: 300,
    position: 'relative',
    paddingBottom: spacing.xl,
  },
  nav: { alignItems: 'center', marginTop: spacing.sm },
  navText: { color: colors.accentDark, fontWeight: '700', fontSize: 14 },
  behindLayer: { width: '100%' },
});
