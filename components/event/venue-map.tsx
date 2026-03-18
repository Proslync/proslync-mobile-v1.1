import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Linking } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useAppTheme } from '@/hooks/use-app-theme';

const isExpoGo = Constants.appOwnership === 'expo';

let Mapbox: any = null;
let MapView: any = null;
let Camera: any = null;
let MarkerView: any = null;

if (!isExpoGo) {
  const mapModule = require('@rnmapbox/maps');
  Mapbox = mapModule.default;
  MapView = mapModule.MapView;
  Camera = mapModule.Camera;
  MarkerView = mapModule.MarkerView;

  const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
  if (token) Mapbox.setAccessToken(token);
}

interface VenueMapProps {
  latitude: number;
  longitude: number;
  venueName?: string;
  address?: string;
}

export function openDirections(lat: number, lng: number, label?: string) {
  const encodedLabel = encodeURIComponent(label || 'Venue');
  const url = Platform.select({
    ios: `maps:0,0?q=${encodedLabel}@${lat},${lng}`,
    default: `geo:${lat},${lng}?q=${lat},${lng}(${encodedLabel})`,
  });
  if (url) Linking.openURL(url);
}

export function openRideShare(lat: number, lng: number, label?: string) {
  const encodedLabel = encodeURIComponent(label || 'Venue');
  // Try Uber first, fallback to web
  const uberUrl = `uber://?action=setPickup&dropoff[latitude]=${lat}&dropoff[longitude]=${lng}&dropoff[nickname]=${encodedLabel}`;
  Linking.canOpenURL(uberUrl).then((supported) => {
    if (supported) {
      Linking.openURL(uberUrl);
    } else {
      Linking.openURL(`https://m.uber.com/ul/?dropoff[latitude]=${lat}&dropoff[longitude]=${lng}&dropoff[nickname]=${encodedLabel}`);
    }
  });
}

export function VenueMap({ latitude, longitude, venueName, address }: VenueMapProps) {
  const { colors, isDark } = useAppTheme();
  const glassColor = isDark ? 'rgba(255,255,255,' : 'rgba(0,0,0,';
  const styleURL = isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11';

  if (isExpoGo || !MapView) {
    return (
      <View style={[styles.fallback, { overflow: 'hidden', borderColor: `${glassColor}0.1)` }]}>
        <GlassView {...liquidGlass.surface} borderRadius={12} style={StyleSheet.absoluteFillObject} />
        <Ionicons name="map-outline" size={32} color={colors.textTertiary} />
        <Text style={[styles.fallbackText, { color: colors.textTertiary }]}>
          Map not available in Expo Go
        </Text>
        <TouchableOpacity onPress={() => openDirections(latitude, longitude, venueName)}>
          <Text style={[styles.fallbackLink, { color: colors.text }]}>Open in Maps</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => openDirections(latitude, longitude, venueName)}
    >
      <View style={[styles.mapContainer, { borderColor: `${glassColor}0.1)` }]}>
        <MapView
          style={styles.map}
          styleURL={styleURL}
          logoEnabled={false}
          attributionEnabled={false}
          compassEnabled={false}
          scaleBarEnabled={false}
          scrollEnabled={false}
          zoomEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
        >
          <Camera
            defaultSettings={{
              centerCoordinate: [longitude, latitude],
              zoomLevel: 14,
            }}
          />
          <MarkerView coordinate={[longitude, latitude]}>
            <View style={[styles.marker, { borderColor: `${glassColor}0.3)`, backgroundColor: `${glassColor}0.2)` }]}>
              <Ionicons name="location" size={28} color={colors.text} />
            </View>
          </MarkerView>
        </MapView>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  map: {
    height: 200,
    borderRadius: 12,
  },
  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallback: {
    height: 180,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  fallbackText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  fallbackLink: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    textDecorationLine: 'underline',
  },
});
