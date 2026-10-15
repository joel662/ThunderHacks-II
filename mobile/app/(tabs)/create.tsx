import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme, type ThemeColors } from '../../src/contexts/ThemeContext';
import { createReport } from '../../src/services/reports';
import {
  ReportCategory,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
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

type LocationMode = 'gps' | 'map' | 'manual';

const BRAMPTON_LOCATIONS = [
  'Queen St E & Main St, Brampton',
  'Queen St W & Main St, Brampton',
  'Bovaird Dr & Main St, Brampton',
  'Bovaird Dr & Hurontario St, Brampton',
  'Bovaird Dr & McLaughlin Rd, Brampton',
  'Williams Pkwy & Hurontario St, Brampton',
  'Williams Pkwy & McLaughlin Rd, Brampton',
  'Steeles Ave & Hurontario St, Brampton',
  'Sandalwood Pkwy & Dixie Rd, Brampton',
  'Sandalwood Pkwy & Bramalea Rd, Brampton',
  'Mayfield Rd & Airport Rd, Brampton',
  'Mayfield Rd & Hurontario St, Brampton',
  'Vodden St & Main St, Brampton',
  'Nelson St & Church St, Brampton',
  'Elgin Dr & Nelson St, Brampton',
  'Rutherford Rd & Hurontario St, Brampton',
  'Dixie Rd & Queen St, Brampton',
  'Bramalea Rd & Clark Blvd, Brampton',
  'Torbram Rd & Williams Pkwy, Brampton',
  'Airport Rd & Bovaird Dr, Brampton',
  'Gage Park, Brampton',
  'Chinguacousy Park, Brampton',
  'Gage Park Splash Pad, Brampton',
  'Heart Lake Conservation Area, Brampton',
  'Bramalea City Centre, Brampton',
  'Shoppers World Brampton',
  'Brampton City Hall, Brampton',
  'Brampton GO Station, Brampton',
  'Bramalea GO Station, Brampton',
  'Mount Pleasant GO Station, Brampton',
  'Peel Memorial Hospital, Brampton',
  'Brampton Civic Hospital, Brampton',
  'Garden Square, Brampton',
  'Professor\'s Lake, Brampton',
  'Hurontario LRT Construction Zone, Brampton',
  'Ken Whillans Square, Brampton',
  'Flower City Community Campus, Brampton',
  'Cassie Campbell Community Centre, Brampton',
  'Gore Meadows Community Centre, Brampton',
  'Chris Gibson Recreation Centre, Brampton',
];

interface SelectedMedia {
  uri: string;
  type: 'image' | 'video';
}

function buildPickerMapHTML(lat: number, lng: number) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        * { margin: 0; padding: 0; }
        #map { width: 100vw; height: 100vh; }
        .info-banner {
          position: fixed; top: 12px; left: 50%; transform: translateX(-50%);
          z-index: 1000; background: rgba(0,0,0,0.75); color: #fff;
          padding: 8px 16px; border-radius: 20px; font-size: 13px;
          font-family: -apple-system, sans-serif; pointer-events: none;
        }
        .crosshair {
          position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
          z-index: 999; font-size: 32px; pointer-events: none;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
      </style>
    </head>
    <body>
      <div class="info-banner">Tap to place pin or drag the map</div>
      <div id="map"></div>
      <script>
        var map = L.map('map').setView([${lat}, ${lng}], 16);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap', maxZoom: 19,
        }).addTo(map);

        var marker = L.marker([${lat}, ${lng}], { draggable: true }).addTo(map);

        function sendLocation(lat, lng) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ lat: lat, lng: lng }));
        }

        marker.on('dragend', function(e) {
          var pos = e.target.getLatLng();
          sendLocation(pos.lat, pos.lng);
        });

        map.on('click', function(e) {
          marker.setLatLng(e.latlng);
          sendLocation(e.latlng.lat, e.latlng.lng);
        });
      </script>
    </body>
    </html>
  `;
}

export default function CreateScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [media, setMedia] = useState<SelectedMedia[]>([]);
  const [latitude, setLatitude] = useState(BRAMPTON_CENTER.latitude);
  const [longitude, setLongitude] = useState(BRAMPTON_CENTER.longitude);
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [locationMode, setLocationMode] = useState<LocationMode>('gps');
  const [detectingGPS, setDetectingGPS] = useState(true);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const s = makeStyles(colors);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        try {
          const loc = await Location.getCurrentPositionAsync({});
          let lat = loc.coords.latitude;
          let lng = loc.coords.longitude;
          if (!isInBrampton(lat, lng)) {
            lat = BRAMPTON_CENTER.latitude;
            lng = BRAMPTON_CENTER.longitude;
          }
          setLatitude(lat);
          setLongitude(lng);
          const [geo] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
          if (geo) {
            const parts = [geo.street, geo.city, geo.region].filter(Boolean);
            setAddress(parts.join(', '));
          }
        } catch {}
      }
      setDetectingGPS(false);
    })();
  }, []);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const [geo] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (geo) {
        const parts = [geo.street, geo.city, geo.region].filter(Boolean);
        return parts.join(', ');
      }
    } catch {}
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  const handleMapMessage = async (event: any) => {
    try {
      const { lat, lng } = JSON.parse(event.nativeEvent.data);
      setLatitude(lat);
      setLongitude(lng);
      const addr = await reverseGeocode(lat, lng);
      setAddress(addr);
    } catch {}
  };

  const handleConfirmMapLocation = () => {
    setShowMapPicker(false);
  };

  const handleManualAddressChange = (text: string) => {
    setManualAddress(text);
    if (text.trim().length >= 2) {
      const query = text.toLowerCase();
      const filtered = BRAMPTON_LOCATIONS.filter((loc) => loc.toLowerCase().includes(query)).slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = async (suggestion: string) => {
    setManualAddress(suggestion);
    setAddress(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
    try {
      const results = await Location.geocodeAsync(suggestion);
      if (results.length > 0) {
        setLatitude(results[0].latitude);
        setLongitude(results[0].longitude);
      }
    } catch {}
  };

  const handleManualAddressSubmit = async () => {
    if (!manualAddress.trim()) return;
    setAddress(manualAddress.trim());
    setShowSuggestions(false);
    try {
      const results = await Location.geocodeAsync(manualAddress.trim() + ', Brampton, ON');
      if (results.length > 0) {
        setLatitude(results[0].latitude);
        setLongitude(results[0].longitude);
      }
    } catch {}
  };

  const handleRedetectGPS = async () => {
    setLocationMode('gps');
    setDetectingGPS(true);
    try {
      const loc = await Location.getCurrentPositionAsync({});
      let lat = loc.coords.latitude;
      let lng = loc.coords.longitude;
      if (!isInBrampton(lat, lng)) {
        lat = BRAMPTON_CENTER.latitude;
        lng = BRAMPTON_CENTER.longitude;
      }
      setLatitude(lat);
      setLongitude(lng);
      const addr = await reverseGeocode(lat, lng);
      setAddress(addr);
    } catch {
      Alert.alert('Error', 'Could not detect your location.');
    } finally {
      setDetectingGPS(false);
    }
  };

  const pickFromGallery = async () => {
    if (media.length >= 3) { Alert.alert('Limit', 'Maximum 3 media items per report.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
      videoMaxDuration: 60,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setMedia((prev) => [...prev, { uri: asset.uri, type: asset.type === 'video' ? 'video' : 'image' }]);
    }
  };

  const takePhoto = async () => {
    if (media.length >= 3) { Alert.alert('Limit', 'Maximum 3 media items per report.'); return; }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setMedia((prev) => [...prev, { uri: result.assets[0].uri, type: 'image' }]);
    }
  };

  const recordVideo = async () => {
    if (media.length >= 3) { Alert.alert('Limit', 'Maximum 3 media items per report.'); return; }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: 60,
    });
    if (!result.canceled && result.assets[0]) {
      setMedia((prev) => [...prev, { uri: result.assets[0].uri, type: 'video' }]);
    }
  };

  const removeMedia = (index: number) => setMedia((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    if (!title.trim()) { Alert.alert('Error', 'Please add a title.'); return; }
    if (!category) { Alert.alert('Error', 'Please select a category.'); return; }
    if (!address.trim()) { Alert.alert('Error', 'Please set a location.'); return; }
    if (!user) return;
    setSubmitting(true);
    try {
      await createReport(
        { title: title.trim(), description: description.trim(), category, latitude, longitude, address: address || 'Unknown location', authorId: user.uid, authorName: user.displayName },
        media.map((m) => ({ uri: m.uri, type: m.type }))
      );
      Alert.alert('Success', 'Report submitted!', [{ text: 'OK', onPress: () => router.replace('/(tabs)/feed') }]);
      setTitle(''); setDescription(''); setCategory(null); setMedia([]); setAddress(''); setManualAddress('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.inner} keyboardShouldPersistTaps="handled">
        <Text style={s.heading}>Report an Issue</Text>
        <Text style={s.subtitle}>Help improve your neighbourhood</Text>

        <Text style={s.label}>Title</Text>
        <TextInput style={s.input} placeholder="e.g. Large pothole on Queen St" placeholderTextColor={colors.placeholder} value={title} onChangeText={setTitle} maxLength={100} />

        <Text style={s.label}>Description</Text>
        <TextInput style={[s.input, s.textArea]} placeholder="Describe the issue..." placeholderTextColor={colors.placeholder} value={description} onChangeText={setDescription} multiline numberOfLines={4} maxLength={500} />

        <Text style={s.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.categoryBar}>
          {ALL_CATEGORIES.map((cat) => (
            <TouchableOpacity key={cat} style={[s.catChip, category === cat && s.catChipActive]} onPress={() => setCategory(cat)}>
              <Text style={s.catIcon}>{CATEGORY_ICONS[cat]}</Text>
              <Text style={[s.catText, category === cat && s.catTextActive]}>{CATEGORY_LABELS[cat]}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={s.label}>Photos / Video</Text>
        <View style={s.mediaRow}>
          {media.map((item, i) => (
            <View key={i} style={s.mediaThumbnail}>
              <Image source={{ uri: item.uri }} style={s.mediaImage} />
              {item.type === 'video' && (
                <View style={s.videoBadge}><Text style={{ fontSize: 12 }}>🎬</Text></View>
              )}
              <TouchableOpacity style={s.mediaRemove} onPress={() => removeMedia(i)}>
                <Text style={{ fontSize: 20 }}>❌</Text>
              </TouchableOpacity>
            </View>
          ))}
          {media.length < 3 && (
            <View style={s.addMediaRow}>
              <TouchableOpacity style={s.addMediaBtn} onPress={pickFromGallery}>
                <Text style={{ fontSize: 24 }}>🖼️</Text>
                <Text style={s.addMediaText}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.addMediaBtn} onPress={takePhoto}>
                <Text style={{ fontSize: 24 }}>📷</Text>
                <Text style={s.addMediaText}>Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.addMediaBtn} onPress={recordVideo}>
                <Text style={{ fontSize: 24 }}>🎥</Text>
                <Text style={s.addMediaText}>Video</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={s.label}>Location</Text>

        {/* Location mode tabs */}
        <View style={s.locationTabs}>
          <TouchableOpacity
            style={[s.locationTab, locationMode === 'gps' && s.locationTabActive]}
            onPress={handleRedetectGPS}
          >
            <Text style={[s.locationTabText, locationMode === 'gps' && s.locationTabTextActive]}>📍 GPS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.locationTab, locationMode === 'map' && s.locationTabActive]}
            onPress={() => { setLocationMode('map'); setShowMapPicker(true); }}
          >
            <Text style={[s.locationTabText, locationMode === 'map' && s.locationTabTextActive]}>🗺️ Pick on Map</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.locationTab, locationMode === 'manual' && s.locationTabActive]}
            onPress={() => setLocationMode('manual')}
          >
            <Text style={[s.locationTabText, locationMode === 'manual' && s.locationTabTextActive]}>✏️ Type</Text>
          </TouchableOpacity>
        </View>

        {/* Current location display */}
        {locationMode === 'gps' && (
          <View style={s.locationRow}>
            <Text style={{ fontSize: 18 }}>📍</Text>
            <Text style={s.locationText}>
              {detectingGPS ? 'Detecting location...' : address || 'Location not available'}
            </Text>
            {detectingGPS && <ActivityIndicator size="small" color={colors.accent} />}
          </View>
        )}

        {locationMode === 'map' && (
          <TouchableOpacity style={s.locationRow} onPress={() => setShowMapPicker(true)}>
            <Text style={{ fontSize: 18 }}>🗺️</Text>
            <Text style={s.locationText}>{address || 'Tap to pick location on map'}</Text>
            <Text style={{ fontSize: 14 }}>›</Text>
          </TouchableOpacity>
        )}

        {locationMode === 'manual' && (
          <View>
            <View style={s.manualInputRow}>
              <TextInput
                style={[s.input, { flex: 1 }]}
                placeholder="Search Brampton location..."
                placeholderTextColor={colors.placeholder}
                value={manualAddress}
                onChangeText={handleManualAddressChange}
                onSubmitEditing={handleManualAddressSubmit}
                returnKeyType="search"
              />
              <TouchableOpacity style={s.searchBtn} onPress={handleManualAddressSubmit}>
                <Text style={{ fontSize: 16 }}>🔍</Text>
              </TouchableOpacity>
            </View>
            {showSuggestions && suggestions.length > 0 && (
              <View style={s.suggestionsContainer}>
                {suggestions.map((suggestion, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[s.suggestionItem, i < suggestions.length - 1 && s.suggestionBorder]}
                    onPress={() => selectSuggestion(suggestion)}
                  >
                    <Text style={{ fontSize: 14 }}>📍</Text>
                    <Text style={s.suggestionText} numberOfLines={1}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {address && !showSuggestions ? (
              <View style={[s.locationRow, { marginTop: 8 }]}>
                <Text style={{ fontSize: 14 }}>✅</Text>
                <Text style={s.locationText}>{address}</Text>
              </View>
            ) : null}
          </View>
        )}

        <TouchableOpacity style={[s.submitBtn, submitting && s.submitBtnDisabled]} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Submit Report</Text>}
        </TouchableOpacity>
      </ScrollView>

      {/* Map Picker Modal */}
      <Modal visible={showMapPicker} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => setShowMapPicker(false)}>
              <Text style={s.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={s.modalTitle}>Pick Location</Text>
            <TouchableOpacity onPress={handleConfirmMapLocation}>
              <Text style={s.modalDone}>Done</Text>
            </TouchableOpacity>
          </View>
          <WebView
            source={{ html: buildPickerMapHTML(latitude, longitude) }}
            style={{ flex: 1 }}
            onMessage={handleMapMessage}
            javaScriptEnabled
            domStorageEnabled
          />
          {address ? (
            <View style={s.modalFooter}>
              <Text style={{ fontSize: 16 }}>📍</Text>
              <Text style={s.modalAddress} numberOfLines={2}>{address}</Text>
            </View>
          ) : null}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    inner: { padding: 20, paddingTop: 56, paddingBottom: 40 },
    heading: { fontSize: 24, fontWeight: '800', color: c.text },
    subtitle: { fontSize: 13, color: c.textSecondary, marginTop: 2, marginBottom: 24 },
    label: { fontSize: 14, fontWeight: '700', color: c.text, marginBottom: 8, marginTop: 16, opacity: 0.8 },
    input: {
      backgroundColor: c.inputBg, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
      fontSize: 16, color: c.text, borderWidth: 1, borderColor: c.inputBorder,
    },
    textArea: { height: 100, textAlignVertical: 'top' },
    categoryBar: { maxHeight: 44 },
    catChip: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: c.chipBg,
      borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8,
      marginRight: 8, borderWidth: 1, borderColor: c.inputBorder,
    },
    catChipActive: { backgroundColor: c.chipActiveBg, borderColor: c.chipActiveBg },
    catIcon: { fontSize: 14, marginRight: 4 },
    catText: { color: c.chipText, fontSize: 12, fontWeight: '600' },
    catTextActive: { color: c.chipActiveText },
    mediaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    mediaThumbnail: { width: 90, height: 90, borderRadius: 12, overflow: 'hidden', position: 'relative' },
    mediaImage: { width: '100%', height: '100%' },
    videoBadge: { position: 'absolute', bottom: 4, left: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 4, padding: 2 },
    mediaRemove: { position: 'absolute', top: -4, right: -4 },
    addMediaRow: { flexDirection: 'row', gap: 10 },
    addMediaBtn: {
      width: 90, height: 90, borderRadius: 12, backgroundColor: c.inputBg,
      borderWidth: 1, borderColor: c.inputBorder, borderStyle: 'dashed',
      justifyContent: 'center', alignItems: 'center',
    },
    addMediaText: { color: c.textSecondary, fontSize: 11, marginTop: 4 },
    locationTabs: {
      flexDirection: 'row', backgroundColor: c.inputBg, borderRadius: 12,
      padding: 4, marginBottom: 12, borderWidth: 1, borderColor: c.inputBorder,
    },
    locationTab: {
      flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10,
    },
    locationTabActive: { backgroundColor: c.accent },
    locationTabText: { fontSize: 13, fontWeight: '600', color: c.textSecondary },
    locationTabTextActive: { color: '#fff' },
    locationRow: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: c.inputBg,
      borderRadius: 12, padding: 14, borderWidth: 1, borderColor: c.inputBorder, gap: 8,
    },
    locationText: { color: c.text, fontSize: 14, flex: 1, opacity: 0.8 },
    manualInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    searchBtn: {
      width: 48, height: 48, borderRadius: 12, backgroundColor: c.accent,
      justifyContent: 'center', alignItems: 'center',
    },
    suggestionsContainer: {
      backgroundColor: c.card, borderRadius: 12, marginTop: 4,
      borderWidth: 1, borderColor: c.inputBorder, overflow: 'hidden',
    },
    suggestionItem: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 14, paddingVertical: 12,
    },
    suggestionBorder: { borderBottomWidth: 1, borderBottomColor: c.inputBorder },
    suggestionText: { flex: 1, fontSize: 14, color: c.text },
    submitBtn: { backgroundColor: c.accent, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 32 },
    submitBtnDisabled: { opacity: 0.6 },
    submitText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    modalContainer: { flex: 1, backgroundColor: c.bg },
    modalHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 16, paddingBottom: 12,
      backgroundColor: c.card, borderBottomWidth: 1, borderBottomColor: c.inputBorder,
    },
    modalCancel: { fontSize: 16, color: c.textSecondary },
    modalTitle: { fontSize: 17, fontWeight: '700', color: c.text },
    modalDone: { fontSize: 16, fontWeight: '700', color: c.accent },
    modalFooter: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      padding: 16, backgroundColor: c.card,
      borderTopWidth: 1, borderTopColor: c.inputBorder,
    },
    modalAddress: { flex: 1, fontSize: 14, color: c.text },
  });
}
