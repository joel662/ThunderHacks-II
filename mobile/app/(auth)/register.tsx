import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme, type ThemeColors } from '../../src/contexts/ThemeContext';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const { colors } = useTheme();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const s = makeStyles(colors);

  const handleRegister = async () => {
    const name = displayName.trim();
    if (name.length < 3 || name.length > 20) {
      Alert.alert('Error', 'Username must be 3–20 characters.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await signUp(email.trim(), password, name);
    } catch (err: any) {
      Alert.alert('Sign Up Failed', err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={s.inner} keyboardShouldPersistTaps="handled">
        <Text style={s.logo}>311.2Brampton</Text>
        <Text style={s.subtitle}>Choose an anonymous username</Text>

        <TextInput
          style={s.input}
          placeholder="Username (e.g. SideWalkHero99)"
          placeholderTextColor={colors.placeholder}
          autoCapitalize="none"
          maxLength={20}
          value={displayName}
          onChangeText={setDisplayName}
        />
        <Text style={s.hint}>This is how others will see you. Stay anonymous!</Text>

        <TextInput
          style={s.input}
          placeholder="Email"
          placeholderTextColor={colors.placeholder}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={s.input}
          placeholder="Password (6+ characters)"
          placeholderTextColor={colors.placeholder}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={[s.button, loading && s.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <Link href="/(auth)/login" asChild>
          <TouchableOpacity style={s.linkWrap}>
            <Text style={s.linkText}>
              Already have an account? <Text style={s.linkAccent}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    inner: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 40 },
    logo: { fontSize: 42, fontWeight: '800', color: c.accent, textAlign: 'center', marginBottom: 8 },
    subtitle: { fontSize: 14, color: c.textSecondary, textAlign: 'center', marginBottom: 32 },
    input: {
      backgroundColor: c.inputBg, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
      fontSize: 16, color: c.text, marginBottom: 14, borderWidth: 1, borderColor: c.inputBorder,
    },
    hint: { color: c.placeholder, fontSize: 12, marginTop: -8, marginBottom: 14, paddingHorizontal: 4 },
    button: { backgroundColor: c.accent, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    linkWrap: { marginTop: 24, alignItems: 'center' },
    linkText: { color: c.textSecondary, fontSize: 14 },
    linkAccent: { color: c.accent, fontWeight: '600' },
  });
}
