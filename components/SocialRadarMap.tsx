import { AppIcon } from '@/components/AppIcon';
import { radius, shadows } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { Coordinates } from '@/lib/geo';
import { buildHeatLayers } from '@/lib/mapHeat';
import type { Venue } from '@/types/database';
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_DEFAULT, type Region } from 'react-native-maps';

type VenueWithCount = Venue & { count: number; checkInEligible?: boolean };

export type SocialRadarMapHandle = {
  recenter: (coords: Coordinates, delta?: number) => void;
  animateTo: (coords: Coordinates, delta?: number) => void;
};

type Props = {
  initialCenter: Coordinates;
  venues: VenueWithCount[];
  selectedVenueId: string | null;
  onSelectVenue: (venue: Venue) => void;
  onUserInteraction?: () => void;
};

function regionFromCenter(center: Coordinates, delta = 0.04): Region {
  return {
    latitude: center.latitude,
    longitude: center.longitude,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };
}

function VenuePin({
  venue,
  selected,
  checkInEligible,
  onPress,
}: {
  venue: VenueWithCount;
  selected: boolean;
  checkInEligible?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        pinPress: { alignItems: 'center', maxWidth: 96 },
        pinBubble: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.purple,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: colors.card,
          ...shadows.soft,
        },
        pinBubbleEligible: {
          backgroundColor: colors.coral,
          borderColor: colors.onPurple,
          borderWidth: 3,
        },
        pinBubbleSelected: {
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: colors.coral,
        },
        pinTail: {
          width: 0,
          height: 0,
          borderLeftWidth: 7,
          borderRightWidth: 7,
          borderTopWidth: 10,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: colors.purple,
          marginTop: -2,
        },
        pinTailEligible: { borderTopColor: colors.coral },
        pinTailSelected: { borderTopColor: colors.coral },
        pinLabel: {
          marginTop: 2,
          fontSize: 10,
          fontWeight: '800',
          color: colors.text,
          backgroundColor: 'rgba(255,255,255,0.92)',
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: radius.sm,
          overflow: 'hidden',
          maxWidth: 92,
          textAlign: 'center',
        },
        pinLabelEligible: {
          backgroundColor: colors.coral,
          color: colors.onPurple,
        },
        pinLabelSelected: {
          color: colors.purpleDark,
          borderWidth: 1,
          borderColor: colors.coral,
        },
      }),
    [colors],
  );

  const eligible = checkInEligible && !selected;

  return (
    <Pressable onPress={onPress} style={styles.pinPress} hitSlop={8}>
      <View
        style={[
          styles.pinBubble,
          eligible && styles.pinBubbleEligible,
          selected && styles.pinBubbleSelected,
        ]}
      >
        <AppIcon
          name={eligible ? 'mapPin' : venue.count >= 5 ? 'fire' : 'location'}
          size={18}
          color={eligible || selected ? colors.onPurple : colors.iconMuted}
        />
      </View>
      <View
        style={[
          styles.pinTail,
          eligible && styles.pinTailEligible,
          selected && styles.pinTailSelected,
        ]}
      />
      <Text
        style={[
          styles.pinLabel,
          eligible && styles.pinLabelEligible,
          selected && styles.pinLabelSelected,
        ]}
        numberOfLines={1}
      >
        {eligible ? 'Check in · ' : ''}
        {venue.name}
      </Text>
    </Pressable>
  );
}

export const SocialRadarMap = forwardRef<SocialRadarMapHandle, Props>(function SocialRadarMap(
  { initialCenter, venues, selectedVenueId, onSelectVenue, onUserInteraction },
  ref,
) {
  const { colors } = useTheme();
  const mapRef = useRef<MapView>(null);
  const initialRegion = useRef(regionFromCenter(initialCenter)).current;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        map: { ...StyleSheet.absoluteFill },
        webFallback: {
          ...StyleSheet.absoluteFill,
          backgroundColor: colors.borderLight,
        },
      }),
    [colors],
  );

  useImperativeHandle(ref, () => ({
    recenter: (coords, delta = 0.04) => {
      mapRef.current?.animateToRegion(regionFromCenter(coords, delta), 450);
    },
    animateTo: (coords, delta = 0.035) => {
      mapRef.current?.animateToRegion(regionFromCenter(coords, delta), 500);
    },
  }));

  if (Platform.OS === 'web') {
    return <View style={styles.webFallback} />;
  }

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      provider={PROVIDER_DEFAULT}
      initialRegion={initialRegion}
      showsUserLocation
      showsMyLocationButton={false}
      showsCompass={false}
      userInterfaceStyle="light"
      mapType="standard"
      onPanDrag={() => onUserInteraction?.()}
      onRegionChangeComplete={(_region, details) => {
        if (details?.isGesture) onUserInteraction?.();
      }}
    >
      {venues.flatMap((venue) =>
        buildHeatLayers(venue.count).map((layer, i) => (
          <Circle
            key={`heat-${venue.id}-${i}`}
            center={{ latitude: venue.latitude, longitude: venue.longitude }}
            radius={layer.radius}
            fillColor={layer.fillColor}
            strokeColor="transparent"
          />
        )),
      )}
      {venues.map((venue) => {
        const selected = selectedVenueId === venue.id;
        const checkInEligible = venue.checkInEligible ?? false;
        return (
          <Marker
            key={venue.id}
            identifier={venue.id}
            coordinate={{ latitude: venue.latitude, longitude: venue.longitude }}
            onPress={(e) => {
              e.stopPropagation?.();
              onSelectVenue(venue);
            }}
            tracksViewChanges={false}
            zIndex={selected ? 999 : checkInEligible ? 500 + venue.count : venue.count}
          >
            <VenuePin
              venue={venue}
              selected={selected}
              checkInEligible={checkInEligible}
              onPress={() => onSelectVenue(venue)}
            />
          </Marker>
        );
      })}
    </MapView>
  );
});
