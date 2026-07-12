import { AppTextInput, Card } from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/constants/theme';
import {
    fetchPlaceSuggestions,
    isGooglePlacesConfigured,
    type PlaceSuggestion,
} from '@/lib/googlePlaces';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  onSelectPlace: (placeId: string, label: string) => void;
  style?: object;
};

export function MapSearchBar({ onSelectPlace, style }: Props) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const sessionToken = useRef(String(Date.now()));
  const configured = isGooglePlacesConfigured();

  const search = useCallback(async (text: string) => {
    if (!configured || text.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const results = await fetchPlaceSuggestions(text, sessionToken.current);
      setSuggestions(results);
      setOpen(results.length > 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [configured]);

  useEffect(() => {
    const id = setTimeout(() => search(query), 320);
    return () => clearTimeout(id);
  }, [query, search]);

  const pick = (item: PlaceSuggestion) => {
    Keyboard.dismiss();
    setQuery(item.mainText);
    setOpen(false);
    setSuggestions([]);
    sessionToken.current = String(Date.now());
    onSelectPlace(item.placeId, item.mainText);
  };

  return (
    <View style={[styles.wrap, style]}>
      <Card style={styles.bar} padded={false}>
        <Text style={styles.searchIcon}>⌕</Text>
        <AppTextInput
          style={styles.input}
          placeholder={configured ? 'Search places' : 'Search unavailable'}
          value={query}
          onChangeText={(t) => {
            setQuery(t);
            setOpen(true);
          }}
          editable={configured}
          onFocus={() => setOpen(suggestions.length > 0)}
          accessibilityLabel="Search map locations"
        />
        {loading ? <ActivityIndicator size="small" color={colors.accentDark} /> : null}
      </Card>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {open && suggestions.length > 0 ? (
        <Card style={styles.results} padded={false}>
          {suggestions.slice(0, 5).map((item) => (
            <Pressable
              key={item.placeId}
              style={styles.resultRow}
              onPress={() => pick(item)}
              accessibilityRole="button"
              accessibilityLabel={`Go to ${item.description}`}
            >
              <Text style={styles.resultMain}>{item.mainText}</Text>
              <Text style={styles.resultSub} numberOfLines={1}>
                {item.description}
              </Text>
            </Pressable>
          ))}
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { zIndex: 10 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: 0,
    borderRadius: radius.full,
    ...shadows.card,
  },
  searchIcon: { fontSize: 18, color: colors.textMuted },
  input: {
    flex: 1,
    marginBottom: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingVertical: spacing.xs,
    paddingHorizontal: 0,
  },
  error: { color: colors.dangerDark, fontSize: 12, marginTop: spacing.xs, marginLeft: spacing.sm },
  results: {
    marginTop: spacing.xs,
    marginBottom: 0,
    maxHeight: 220,
    overflow: 'hidden',
    borderRadius: radius.md,
    ...shadows.soft,
  },
  resultRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  resultMain: { color: colors.text, fontWeight: '700', fontSize: 14 },
  resultSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
});
