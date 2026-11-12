import { useNetInfo } from '@react-native-community/netinfo';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { WebView, type WebViewMessageEvent, type WebViewProps } from 'react-native-webview';
import type { Coords } from '@/data/types';
import { LEAFLET_CSS, LEAFLET_JS } from '@/lib/leafletBundle';
import { DARK_MAP_STYLE, MAP_PROVIDER } from '@/lib/maps';
import { TILES_URL_TEMPLATE, useOfflineZones } from '@/lib/offlineMaps';
import { useTheme } from '@/theme';
import { USE_FREE_BASEMAP } from './BaseMapLayer';
import { OfflineTileLayer } from './OfflineTileLayer';
import { Icon } from './ui';

/**
 * Mapa único de la app.
 * - Expo Go / builds con API key → Google Maps (react-native-maps).
 * - APK sin API key → Leaflet + OpenStreetMap/CARTO dentro de un WebView
 *   (Google no dibuja nada sin key). Leaflet va empaquetado: no depende de un CDN,
 *   y las zonas descargadas en "Mapas sin conexión" se muestran sin internet.
 */

export type MapMarker = {
  id: string;
  coords: Coords;
  color: string;
  icon?: string;
  title?: string;
  selected?: boolean;
};
export type MapLine = { coords: Coords[]; color: string; width?: number; dashed?: boolean };
export type MapRegion = { latitude: number; longitude: number; latitudeDelta: number };
export type Padding = { top: number; right: number; bottom: number; left: number };
export type AppMapHandle = {
  fitToCoordinates: (coords: Coords[], padding?: Padding) => void;
  animateTo: (center: Coords, latitudeDelta?: number) => void;
};

type Props = {
  style?: StyleProp<ViewStyle>;
  initialRegion: MapRegion;
  /** Región controlada: se aplica cada vez que cambia */
  region?: MapRegion | null;
  /** Encuadra estas coordenadas al cargar y cuando cambian */
  fitCoords?: Coords[];
  fitPadding?: Padding;
  markers: MapMarker[];
  lines?: MapLine[];
  userLocation?: Coords | null;
  interactive?: boolean;
  onMarkerPress?: (id: string) => void;
  onMapPress?: () => void;
  onReady?: () => void;
};

// Los tipos de clase de react-native-webview no encajan con @types/react 19: lo tipamos como componente
const WebViewC = WebView as unknown as React.ComponentType<WebViewProps & { ref?: React.Ref<WebView> }>;

const DEFAULT_PAD: Padding = { top: 40, right: 40, bottom: 40, left: 40 };

export const AppMap = forwardRef<AppMapHandle, Props>(function AppMap(props, ref) {
  return USE_FREE_BASEMAP ? <LeafletMap {...props} ref={ref} /> : <GoogleMap {...props} ref={ref} />;
});

// ---------------------------------------------------------------------------
// Google / Apple (react-native-maps)
// ---------------------------------------------------------------------------
const GoogleMap = forwardRef<AppMapHandle, Props>(function GoogleMap(
  { style, initialRegion, region, fitCoords, fitPadding, markers, lines, userLocation, interactive = true, onMarkerPress, onMapPress, onReady },
  ref,
) {
  const { isDark } = useTheme();
  const map = useRef<MapView>(null);
  const [ready, setReady] = useState(false);
  const delta = (d: number) => ({ latitudeDelta: d, longitudeDelta: d });

  useImperativeHandle(ref, () => ({
    fitToCoordinates: (coords, padding = DEFAULT_PAD) => map.current?.fitToCoordinates(coords, { edgePadding: padding, animated: true }),
    animateTo: (center, d = 0.08) => map.current?.animateToRegion({ ...center, ...delta(d) }, 500),
  }));

  const fitKey = fitCoords?.map((c) => `${c.latitude.toFixed(4)},${c.longitude.toFixed(4)}`).join('|');
  useEffect(() => {
    if (!ready || !fitCoords?.length) return;
    if (fitCoords.length === 1) map.current?.animateToRegion({ ...fitCoords[0], ...delta(0.04) }, 400);
    else map.current?.fitToCoordinates(fitCoords, { edgePadding: fitPadding ?? DEFAULT_PAD, animated: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, fitKey]);

  return (
    <MapView
      ref={map}
      provider={MAP_PROVIDER}
      style={style ?? StyleSheet.absoluteFill}
      initialRegion={{ ...initialRegion, longitudeDelta: initialRegion.latitudeDelta }}
      region={region ? { ...region, longitudeDelta: region.latitudeDelta } : undefined}
      showsUserLocation={!!userLocation}
      showsMyLocationButton={false}
      showsCompass={false}
      toolbarEnabled={false}
      scrollEnabled={interactive}
      zoomEnabled={interactive}
      rotateEnabled={interactive}
      pitchEnabled={false}
      customMapStyle={isDark ? DARK_MAP_STYLE : []}
      mapType="terrain"
      onMapReady={() => {
        setReady(true);
        onReady?.();
      }}
      onPress={(e) => e.nativeEvent.action !== 'marker-press' && onMapPress?.()}
    >
      <OfflineTileLayer provider={MAP_PROVIDER} />
      {markers.map((m) => (
        <GoogleMarker key={m.id} m={m} onPress={() => onMarkerPress?.(m.id)} />
      ))}
      {lines?.map((l, i) => (
        <Polyline key={i} coordinates={l.coords} strokeColor={l.color} strokeWidth={l.width ?? 4} lineDashPattern={l.dashed ? [10, 8] : undefined} />
      ))}
    </MapView>
  );
});

function GoogleMarker({ m, onPress }: { m: MapMarker; onPress: () => void }) {
  const [paintedFor, setPaintedFor] = useState<boolean | null>(null);
  const track = paintedFor !== !!m.selected;
  useEffect(() => {
    const id = setTimeout(() => setPaintedFor(!!m.selected), 600);
    return () => clearTimeout(id);
  }, [m.selected]);
  const size = m.selected ? 46 : 36;
  return (
    <Marker coordinate={m.coords} onPress={onPress} tracksViewChanges={track} anchor={{ x: 0.5, y: 1 }} title={m.title} zIndex={m.selected ? 10 : 1}>
      <View style={{ alignItems: 'center' }}>
        <View style={[styles.pin, { width: size, height: size, borderRadius: size / 2, backgroundColor: m.color }]}>
          {m.icon ? <Icon name={m.icon} size={m.selected ? 22 : 18} color="#FFF" /> : null}
        </View>
        <View style={styles.tail} />
      </View>
    </Marker>
  );
}

// ---------------------------------------------------------------------------
// Leaflet (WebView) — sin API key
// ---------------------------------------------------------------------------
const zoomFor = (latitudeDelta: number) => Math.max(3, Math.min(18, Math.round(Math.log2(360 / Math.max(latitudeDelta, 0.0005)))));

function buildHtml(dark: boolean, center: MapRegion, offlineTemplate: string | null) {
  // Esri World Topo Map: sin API key, con curvas de nivel (útil para caminatas).
  // (CARTO ahora exige key y los servidores de OpenStreetMap bloquean apps.)
  const base = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
<style>${LEAFLET_CSS}
html,body,#map{margin:0;padding:0;height:100%;width:100%;background:${dark ? '#1f1b18' : '#efe9e1'}}
.pin{border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.35)}
.me{width:16px;height:16px;border-radius:50%;background:#2F7DF6;border:3px solid #fff;box-shadow:0 0 0 6px rgba(47,125,246,.25)}
.leaflet-control-attribution{font-size:10px}
${dark ? '.leaflet-tile-pane{filter:brightness(.62) contrast(1.1) saturate(.8)}' : ''}
</style></head><body><div id="map"></div>
<script>${LEAFLET_JS}</script>
<script>
var send=function(o){window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify(o))};
var map=L.map('map',{zoomControl:false,attributionControl:true,zoomSnap:0.25}).setView([${center.latitude},${center.longitude}],${zoomFor(center.latitudeDelta)});
map.attributionControl.setPrefix('');
L.tileLayer('${base}',{maxZoom:19,attribution:'Tiles © Esri — Esri, HERE, Garmin, USGS, NGA'}).addTo(map);
${offlineTemplate ? `L.tileLayer('${offlineTemplate}',{maxZoom:16,maxNativeZoom:16,errorTileUrl:'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='}).addTo(map);` : ''}
var layer=L.layerGroup().addTo(map),lines=L.layerGroup().addTo(map),me=null,interactive=true;
map.on('click',function(){send({type:'map'})});
window.setData=function(d){
  layer.clearLayers();lines.clearLayers();
  (d.lines||[]).forEach(function(l){L.polyline(l.c,{color:l.color,weight:l.w||4,dashArray:l.dashed?'10 8':null}).addTo(lines)});
  (d.markers||[]).forEach(function(m){
    var s=m.sel?30:22;
    var ic=L.divIcon({className:'',html:'<div class="pin" style="width:'+s+'px;height:'+s+'px;background:'+m.color+'"></div>',iconSize:[s+6,s+6],iconAnchor:[(s+6)/2,(s+6)/2]});
    var mk=L.marker(m.c,{icon:ic,zIndexOffset:m.sel?1000:0}).addTo(layer);
    if(m.t)mk.bindTooltip(m.t,{direction:'top',offset:[0,-s/2]});
    mk.on('click',function(e){L.DomEvent.stopPropagation(e);send({type:'marker',id:m.id})});
  });
  if(d.me){if(!me){me=L.marker(d.me,{icon:L.divIcon({className:'',html:'<div class="me"></div>',iconSize:[22,22],iconAnchor:[11,11]}),interactive:false}).addTo(map)}else{me.setLatLng(d.me)}}
  else if(me){map.removeLayer(me);me=null}
};
window.setInteractive=function(on){var f=on?'enable':'disable';['dragging','touchZoom','doubleClickZoom','scrollWheelZoom','boxZoom','keyboard'].forEach(function(k){map[k]&&map[k][f]()})};
window.fit=function(c,p){if(!c.length)return;if(c.length===1){map.setView(c[0],14,{animate:true});return}map.fitBounds(c,{paddingTopLeft:[p.left,p.top],paddingBottomRight:[p.right,p.bottom],animate:true})};
window.flyTo=function(c,z){map.flyTo(c,z,{duration:.5})};
send({type:'ready'});
</script></body></html>`;
}

const LeafletMap = forwardRef<AppMapHandle, Props>(function LeafletMap(
  { style, initialRegion, region, fitCoords, fitPadding, markers, lines, userLocation, interactive = true, onMarkerPress, onMapPress, onReady },
  ref,
) {
  const { isDark } = useTheme();
  const web = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const { zones } = useOfflineZones();
  const net = useNetInfo();
  const offline = net.isConnected === false || net.isInternetReachable === false;
  const hasZones = zones.length > 0 && !!TILES_URL_TEMPLATE;

  // El HTML solo se regenera si cambia el tema o si aparecen zonas descargadas
  const html = useMemo(
    () => buildHtml(isDark, initialRegion, hasZones ? TILES_URL_TEMPLATE : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDark, hasZones],
  );

  const run = (js: string) => web.current?.injectJavaScript(`try{${js}}catch(e){};true;`);
  const ll = (c: Coords) => [c.latitude, c.longitude];

  useImperativeHandle(ref, () => ({
    fitToCoordinates: (coords, padding = DEFAULT_PAD) => run(`fit(${JSON.stringify(coords.map(ll))},${JSON.stringify(padding)})`),
    animateTo: (center, d = 0.08) => run(`flyTo(${JSON.stringify(ll(center))},${zoomFor(d)})`),
  }));

  const data = JSON.stringify({
    markers: markers.map((m) => ({ id: m.id, c: ll(m.coords), color: m.color, t: m.title, sel: !!m.selected })),
    lines: (lines ?? []).map((l) => ({ c: l.coords.map(ll), color: l.color, w: l.width, dashed: l.dashed })),
    me: userLocation ? ll(userLocation) : null,
  });
  useEffect(() => {
    if (ready) run(`setData(${data})`);
     
  }, [ready, data]);
  useEffect(() => {
    if (ready) run(`setInteractive(${interactive})`);
     
  }, [ready, interactive]);

  const fitKey = fitCoords?.map((c) => `${c.latitude.toFixed(4)},${c.longitude.toFixed(4)}`).join('|');
  useEffect(() => {
    if (ready && fitCoords?.length) run(`fit(${JSON.stringify(fitCoords.map(ll))},${JSON.stringify(fitPadding ?? DEFAULT_PAD)})`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, fitKey]);
  const regionKey = region ? `${region.latitude},${region.longitude},${region.latitudeDelta}` : '';
  useEffect(() => {
    if (ready && region) run(`flyTo(${JSON.stringify([region.latitude, region.longitude])},${zoomFor(region.latitudeDelta)})`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, regionKey]);

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'ready') {
        setReady(true);
        onReady?.();
      } else if (msg.type === 'marker') onMarkerPress?.(msg.id);
      else if (msg.type === 'map') onMapPress?.();
    } catch {
      // ignorar
    }
  };

  return (
    <View style={style ?? StyleSheet.absoluteFill}>
      <WebViewC
        ref={web}
        key={html.length + (isDark ? 'd' : 'l')}
        originWhitelist={['*']}
        source={{ html, baseUrl: 'file:///' }}
        onMessage={onMessage}
        onLoadStart={() => setReady(false)}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        mixedContentMode="always"
        cacheEnabled
        cacheMode={offline ? 'LOAD_CACHE_ELSE_NETWORK' : 'LOAD_DEFAULT'}
        setBuiltInZoomControls={false}
        overScrollMode="never"
        style={{ flex: 1, backgroundColor: 'transparent' }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  pin: { borderWidth: 3, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
    marginTop: -1,
  },
});
