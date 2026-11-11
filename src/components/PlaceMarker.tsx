import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Marker } from 'react-native-maps';
import { categoryOf } from '@/data/catalog';
import type { Place } from '@/data/types';
import { categoryColors } from '@/theme';
import { Icon } from './ui';

export function PlaceMarker({ place, selected, onPress }: { place: Place; selected?: boolean; onPress?: () => void }) {
  const cat = place.categories[0];
  const color = categoryColors[cat];
  // En Android, los marcadores con vistas propias deben dejar de "trackear" tras pintarse
  const [paintedFor, setPaintedFor] = useState<boolean | null>(null);
  const track = paintedFor !== !!selected;
  useEffect(() => {
    const id = setTimeout(() => setPaintedFor(!!selected), 600);
    return () => clearTimeout(id);
  }, [selected]);

  const size = selected ? 46 : 36;
  return (
    <Marker
      coordinate={place.coords}
      onPress={onPress}
      tracksViewChanges={track}
      anchor={{ x: 0.5, y: 1 }}
      title={place.name}
      zIndex={selected ? 10 : 1}
    >
      <View style={{ alignItems: 'center' }}>
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            borderWidth: 3,
            borderColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={categoryOf(cat).icon} size={selected ? 22 : 18} color="#FFF" />
        </View>
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: 6,
            borderRightWidth: 6,
            borderTopWidth: 8,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderTopColor: '#FFFFFF',
            marginTop: -1,
          }}
        />
      </View>
    </Marker>
  );
}
