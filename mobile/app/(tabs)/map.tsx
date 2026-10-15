import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { getAllReports } from '../../src/services/reports';
import { useTheme, type ThemeColors } from '../../src/contexts/ThemeContext';
import {
  Report,
  ReportCategory,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
  BRAMPTON_CENTER,
} from '../../src/types';

const ALL_CATEGORIES: ReportCategory[] = [
  'pothole', 'streetlight', 'graffiti', 'garbage', 'sidewalk',
  'traffic_sign', 'water', 'noise', 'park', 'other',
];

const BRAMPTON_BOUNDS = {
  minLat: 43.60, maxLat: 43.85,
  minLng: -79.87, maxLng: -79.58,
};

function isInBrampton(lat: number, lng: number) {
  return lat >= BRAMPTON_BOUNDS.minLat && lat <= BRAMPTON_BOUNDS.maxLat &&
         lng >= BRAMPTON_BOUNDS.minLng && lng <= BRAMPTON_BOUNDS.maxLng;
}

function escapeJS(str: string) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, ' ');
}

function buildMarkerJS(reports: Report[], selectedCategory: ReportCategory | null) {
  const filtered = selectedCategory
    ? reports.filter((r) => r.category === selectedCategory)
    : reports;

  return filtered.map((r) => {
    const color = CATEGORY_COLORS[r.category] || '#8b5cf6';
    const icon = CATEGORY_ICONS[r.category] || '📋';
    const title = escapeJS(r.title);
    const address = escapeJS(r.location.address);
    const cat = escapeJS(CATEGORY_LABELS[r.category]);
    return `addMarker(${r.location.latitude}, ${r.location.longitude}, '${color}', '${icon}', '${title}', '${cat}', ${r.upvoteCount}, ${r.commentCount}, '${address}', '${r.id}');`;
  }).join('\n');
}

function buildMapHTML(centerLat: number, centerLng: number) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
  <script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"><\/script>
  <style>
    * { margin: 0; padding: 0; }
    html, body, #map { width: 100%; height: 100%; }
    .leaflet-popup-content-wrapper { border-radius: 10px; }
    .marker-cluster-small, .marker-cluster-medium, .marker-cluster-large {
      background: rgba(233, 69, 96, 0.3);
    }
    .marker-cluster-small div, .marker-cluster-medium div, .marker-cluster-large div {
      background: #e94560;
      color: #fff;
      font-weight: 700;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: true }).setView([${centerLat}, ${centerLng}], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 19
    }).addTo(map);

    L.circleMarker([${centerLat}, ${centerLng}], {
      radius: 8, fillColor: '#4285F4', color: '#fff', weight: 3, fillOpacity: 1
    }).addTo(map).bindPopup('You are here');

    var clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: function(cluster) {
        var count = cluster.getChildCount();
        var size = count < 10 ? 40 : count < 50 ? 48 : 56;
        return L.divIcon({
          html: '<div style="width:'+size+'px;height:'+size+'px;background:#e94560;border:3px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.4);">'+count+'</div>',
          className: '',
          iconSize: [size, size],
          iconAnchor: [size/2, size/2]
        });
      }
    });
    map.addLayer(clusterGroup);

    function clearMarkers() {
      clusterGroup.clearLayers();
    }

    function addMarker(lat, lng, color, icon, title, cat, upvotes, comments, address, id) {
      var m = L.marker([lat, lng], {
        icon: L.divIcon({
          className: '',
          html: '<div style="width:44px;height:44px;background:'+color+';border:2px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 2px 6px rgba(0,0,0,0.4);">'+icon+'</div>',
          iconSize: [44, 44],
          iconAnchor: [22, 22]
        })
      });
      m.bindPopup(
        '<div style="min-width:160px">' +
        '<b style="font-size:13px">'+title+'</b><br>' +
        '<span style="font-size:11px;color:#666">'+cat+' \\u00b7 \\ud83d\\udc4d '+upvotes+'</span><br>' +
        '<span style="font-size:11px;color:#888">'+address+'</span><br>' +
        '<button onclick="window.ReactNativeWebView.postMessage(\\x27'+id+'\\x27)" style="margin-top:6px;width:100%;padding:6px;background:#e94560;color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer">View Details</button>' +
        '</div>'
      );
      clusterGroup.addLayer(m);
    }

    window.ReactNativeWebView.postMessage('MAP_READY');
  <\/script>
</body>
</html>
`;
}

export default function MapScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const webViewRef = useRef<WebView>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLat, setUserLat] = useState(BRAMPTON_CENTER.latitude);
  const [userLng, setUserLng] = useState(BRAMPTON_CENTER.longitude);
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const mapHTML = useMemo(() => buildMapHTML(userLat, userLng), [userLat, userLng]);
  const s = makeStyles(colors);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllReports();
      setReports(data);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let lat = BRAMPTON_CENTER.latitude;
      let lng = BRAMPTON_CENTER.longitude;
      if (status === 'granted') {
        try {
          const loc = await Location.getCurrentPositionAsync({});
          if (isInBrampton(loc.coords.latitude, loc.coords.longitude)) {
            lat = loc.coords.latitude;
            lng = loc.coords.longitude;
          }
        } catch {}
      }
      setUserLat(lat);
      setUserLng(lng);
      fetchData();
    })();
  }, []);

  useEffect(() => {
    setMapReady(false);
  }, [mapHTML]);

  useEffect(() => {
    if (mapReady && webViewRef.current) {
      const js = `clearMarkers();\n${buildMarkerJS(reports, selectedCategory)}`;
      webViewRef.current.injectJavaScript(js + '; true;');
    }
  }, [reports, selectedCategory, mapReady]);

  const handleMessage = (event: any) => {
    const data = event.nativeEvent.data;
    if (data === 'MAP_READY') {
      setMapReady(true);
    } else if (data) {
      router.push(`/report/${data}`);
    }
  };

  const filteredReports = selectedCategory
    ? reports.filter((r) => r.category === selectedCategory)
    : reports;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Nearby Issues</Text>
        <Text style={s.count}>{filteredReports.length} reports in Brampton</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.filterBar}
        contentContainerStyle={s.filterContent}
      >
        <TouchableOpacity
          style={[s.chip, !selectedCategory && s.chipActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[s.chipText, !selectedCategory && s.chipTextActive]}>All</Text>
        </TouchableOpacity>
        {ALL_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[s.chip, selectedCategory === cat && s.chipActive]}
            onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
          >
            <Text style={s.chipIcon}>{CATEGORY_ICONS[cat]}</Text>
            <Text style={[s.chipText, selectedCategory === cat && s.chipTextActive]}>
              {CATEGORY_LABELS[cat].split(' ')[0]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={s.mapWrap}>
        <WebView
          ref={webViewRef}
          source={{ html: mapHTML }}
          style={s.map}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
        />

        {loading && !mapReady && (
          <View style={s.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        )}

        <TouchableOpacity style={s.fab} onPress={() => {
          if (webViewRef.current) {
            webViewRef.current.injectJavaScript(
              `map.setView([${userLat}, ${userLng}], 14); true;`
            );
          }
        }}>
          <Text style={{ fontSize: 22 }}>🎯</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[s.fab, s.fabRefresh]} onPress={fetchData}>
          <Text style={{ fontSize: 22 }}>🔄</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 8 },
    title: { fontSize: 24, fontWeight: '800', color: c.text },
    count: { fontSize: 13, color: c.textSecondary, marginTop: 2 },
    filterBar: { maxHeight: 44, paddingHorizontal: 16, marginBottom: 8 },
    filterContent: { alignItems: 'center', gap: 8 },
    chip: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: c.chipBg,
      borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
      marginRight: 8, borderWidth: 1, borderColor: c.inputBorder,
    },
    chipActive: { backgroundColor: c.chipActiveBg, borderColor: c.chipActiveBg },
    chipIcon: { fontSize: 14, marginRight: 4 },
    chipText: { color: c.chipText, fontSize: 13, fontWeight: '600' },
    chipTextActive: { color: c.chipActiveText },
    mapWrap: { flex: 1 },
    map: { flex: 1 },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject, justifyContent: 'center',
      alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)',
    },
    fab: {
      position: 'absolute', bottom: 20, right: 20, width: 48, height: 48,
      borderRadius: 24, backgroundColor: c.secondary, justifyContent: 'center',
      alignItems: 'center', elevation: 4,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4,
    },
    fabRefresh: { bottom: 80 },
  });
}
