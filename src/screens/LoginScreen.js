import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { supabase } from '../config/supabase';
import { hashPassword } from '../utils/helpers';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [iconScale] = useState(new Animated.Value(1));

  useEffect(() => {
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(iconScale, { toValue: 1.1, duration: 1500, useNativeDriver: true }),
        Animated.timing(iconScale, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    );
    breathe.start();
    return () => breathe.stop();
  }, []);

  const handleLogin = async () => {
    const u = username.trim(), p = password.trim();
    if (!u || !p) { setErrorMessage('Lütfen kullanıcı adı ve şifreyi doldurun.'); return; }
    setIsLoading(true); setErrorMessage('');
    try {
      const { data: row, error } = await supabase
        .from('users').select('id, name, password_hash, role, is_approved')
        .eq('name', u).maybeSingle();
      if (error) throw error;
      if (!row) { setErrorMessage('Kullanıcı adı veya şifre hatalı.'); return; }
      const storedHash = (row.password_hash || '').toString();
      if (!storedHash) { setErrorMessage('Bu hesap için şifre ayarlanmamış.'); return; }
      const inputHash = hashPassword(p);
      if (inputHash !== storedHash && p !== storedHash) { setErrorMessage('Kullanıcı adı veya şifre hatalı.'); return; }
      navigation.replace('Dashboard', {
        user: { id: row.id, name: row.name || '', role: row.role || '', isApproved: row.is_approved || false, serverUrl: 'https://akillikapisistemi.onrender.com' },
      });
    } catch (e) {
      setErrorMessage(`Giriş hatası: ${e.message || e}`);
    } finally { setIsLoading(false); }
  };

  return (
    <View style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.header}>
            <Animated.View style={[s.iconWrap, { transform: [{ scale: iconScale }] }]}>
              <Ionicons name="shield-checkmark" size={56} color={Colors.primary} />
            </Animated.View>
            <Text style={s.title}>Akıllı Kapı</Text>
            <Text style={s.subtitle}>Güvenli Geçiş Sistemi</Text>
          </View>
          <View style={s.card}>
            {errorMessage !== '' && (
              <View style={s.errBox}>
                <Ionicons name="warning" size={18} color={Colors.danger} />
                <Text style={s.errText}>{errorMessage}</Text>
              </View>
            )}
            <View style={s.inputWrap}>
              <Ionicons name="person-outline" size={20} color={Colors.textMuted} style={s.inputIcon} />
              <TextInput style={s.input} placeholder="Kullanıcı Adı" placeholderTextColor={Colors.textMuted} value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} />
            </View>
            <View style={s.inputWrap}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} style={s.inputIcon} />
              <TextInput style={[s.input, { flex: 1 }]} placeholder="Şifre" placeholderTextColor={Colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 6 }}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[s.btn, isLoading && { opacity: 0.7 }]} onPress={handleLogin} disabled={isLoading} activeOpacity={0.8}>
              {isLoading ? <ActivityIndicator color="#FFF" /> : (
                <><Ionicons name="log-in-outline" size={20} color="#FFF" style={{ marginRight: 8 }} /><Text style={s.btnText}>GİRİŞ YAP</Text></>
              )}
            </TouchableOpacity>
          </View>
          <Text style={s.footer}>Akıllı Kapı Sistemi v1.0</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  iconWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(99,102,241,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)' },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, letterSpacing: 1 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 6 },
  card: { backgroundColor: 'rgba(30,41,59,0.8)', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: Colors.border },
  errBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.errorBg, borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: Colors.errorBorder },
  errText: { color: '#FCA5A5', fontSize: 13, marginLeft: 8, flex: 1 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: 12, marginBottom: 16, paddingHorizontal: 14, height: 52, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: Colors.textPrimary, fontSize: 15 },
  btn: { backgroundColor: Colors.primary, borderRadius: 12, height: 52, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8, elevation: 6 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '700', letterSpacing: 1.2 },
  footer: { textAlign: 'center', color: Colors.textMuted, fontSize: 12, marginTop: 32 },
});
