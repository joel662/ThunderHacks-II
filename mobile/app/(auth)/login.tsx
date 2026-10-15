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
} from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme, type ThemeColors } from '../../src/contexts/ThemeContext';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const s = makeStyles(colors);

  const handleDemo = async () => {
    setDemoLoading(true);
    try {
      await signIn('demo@311brampton.ca', 'demo123');
    } catch (err: any) {
      Alert.alert('Demo Failed', err.message || 'Something went wrong.');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={s.inner}>
        <Text style={s.logo}>311.2Brampton</Text>
        <Text style={s.subtitle}>Report. Upvote. Fix your neighbourhood.</Text>

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
          placeholder="Password"
          placeholderTextColor={colors.placeholder}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={[s.button, loading && s.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <Link href="/(auth)/register" asChild>
          <TouchableOpacity style={s.linkWrap}>
            <Text style={s.linkText}>
              Don't have an account? <Text style={s.linkAccent}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </Link>

        <View style={s.dividerRow}>
          <View style={s.dividerLine} />
          <Text style={s.dividerText}>or</Text>
          <View style={s.dividerLine} />
        </View>

        <TouchableOpacity
          style={[s.demoButton, demoLoading && s.buttonDisabled]}
          onPress={handleDemo}
          disabled={demoLoading || loading}
        >
          {demoLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.demoButtonText}>Try Demo</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
    logo: { fontSize: 42, fontWeight: '800', color: c.accent, textAlign: 'center', marginBottom: 8 },
    subtitle: { fontSize: 14, color: c.textSecondary, textAlign: 'center', marginBottom: 48 },
    input: {
      backgroundColor: c.inputBg, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
      fontSize: 16, color: c.text, marginBottom: 14, borderWidth: 1, borderColor: c.inputBorder,
    },
    button: { backgroundColor: c.accent, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    linkWrap: { marginTop: 24, alignItems: 'center' },
    linkText: { color: c.textSecondary, fontSize: 14 },
    linkAccent: { color: c.accent, fontWeight: '600' },
    dividerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24 },
    dividerLine: { flex: 1, height: 1, backgroundColor: c.border },
    dividerText: { marginHorizontal: 12, color: c.textSecondary, fontSize: 13 },
    demoButton: {
      backgroundColor: c.secondary, borderRadius: 12, paddingVertical: 16,
      alignItems: 'center', marginTop: 16,
    },
    demoButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  });
}
