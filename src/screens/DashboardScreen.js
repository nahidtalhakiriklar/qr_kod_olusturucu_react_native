import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Animated, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '../theme/colors';
import { supabase } from '../config/supabase';
import { generateQRPayload } from '../utils/qrGenerator';
import { formatTime, normalizeServerUrl } from '../utils/helpers';

export default function DashboardScreen({ route, navigation }) {
  const { user } = route.params;
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [qrPayload, setQrPayload] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isApproved, setIsApproved] = useState(user.isApproved);
  const timerRef = useRef(null);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (qrPayload) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.03, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [qrPayload]);

  const startTimer = (seconds) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRemainingSeconds(seconds);
    timerRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          setQrPayload(null);
          setErrorMessage('QR kod süresi doldu. Lütfen yenisini üretin.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const checkApproval = async () => {
    setIsLoading(true);
    try {
      const { data: row } = await supabase.from('users').select('is_approved').eq('id', user.id).maybeSingle();
      if (row) {
        setIsApproved(row.is_approved || false);
        if (row.is_approved) Alert.alert('Başarılı', 'Hesabınız onaylanmış!');
      }
    } catch (_) {}
    setIsLoading(false);
  };

  const generateQR = () => {
    setIsLoading(true); setErrorMessage(''); setQrPayload(null);
    try {
      const result = generateQRPayload(user.id);
      setQrPayload(result.payload);
      startTimer(result.expiresIn);
    } catch (e) {
      setErrorMessage(`QR üretilemedi: ${e.message || e}`);
    }
    setIsLoading(false);
  };

  const triggerBackdoor = async () => {
    setIsLoading(true); setErrorMessage('');
    try {
      const url = normalizeServerUrl(user.serverUrl);
      const resp = await fetch(`${url}/api/door/backdoor`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });
      if (resp.ok) {
        Alert.alert('✅ Kapı Açıldı', 'Arka kapı başarıyla açıldı!');
      } else {
        const data = await resp.json();
        setErrorMessage(data.error || 'Arka kapı hatası!');
      }
    } catch (_) {
      setErrorMessage('Arka kapı bağlantı hatası.');
    }
    setIsLoading(false);
  };

  const handleLogout = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    navigation.replace('Login');
  };

  // ─── ONAY BEKLENİYOR ─────────────────────────────
  if (!isApproved) {
    return (
      <View style={s.container}>
        <View style={s.topBar}>
          <Text style={s.topBarTitle}>Akıllı Kapı</Text>
          <TouchableOpacity onPress={handleLogout}><Ionicons name="exit-outline" size={24} color={Colors.textSecondary} /></TouchableOpacity>
        </View>
        <View style={s.pendingCenter}>
          <View style={s.pendingIconWrap}>
            <Ionicons name="hourglass-outline" size={72} color={Colors.warning} />
          </View>
          <Text style={s.pendingTitle}>ONAY BEKLENİYOR</Text>
          <Text style={s.pendingDesc}>Hesabınız sistem yöneticisinin onayına sunulmuştur. Lütfen yetkilinin hesabınızı aktif etmesini bekleyin.</Text>
          <TouchableOpacity style={s.checkBtn} onPress={checkApproval} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#FFF" size="small" /> : (
              <><Ionicons name="refresh" size={20} color="#FFF" style={{ marginRight: 8 }} /><Text style={s.checkBtnText}>Durumumu Kontrol Et</Text></>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── ANA DASHBOARD ───────────────────────────────
  return (
    <View style={s.container}>
      <View style={s.topBar}>
        <Text style={s.topBarTitle}>Akıllı Kapı Geçiş</Text>
        <TouchableOpacity onPress={handleLogout}><Ionicons name="exit-outline" size={24} color={Colors.textSecondary} /></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.scrollContent}>
        {/* Hoş geldin */}
        <Text style={s.welcome}>Hoş Geldin, {user.name}</Text>
        {user.role === 'Admin' && (
          <View style={s.adminBadge}><Text style={s.adminBadgeText}>Yönetici</Text></View>
        )}

        {/* QR Üret butonu */}
        <TouchableOpacity style={s.generateBtn} onPress={generateQR} disabled={isLoading} activeOpacity={0.8}>
          {isLoading ? <ActivityIndicator color="#FFF" /> : (
            <><Ionicons name="qr-code" size={24} color="#FFF" style={{ marginRight: 10 }} /><Text style={s.generateBtnText}>GÜVENLİ QR ÜRET</Text></>
          )}
        </TouchableOpacity>

        {/* Admin Backdoor */}
        {user.role === 'Admin' && (
          <TouchableOpacity style={s.backdoorBtn} onPress={triggerBackdoor} disabled={isLoading} activeOpacity={0.8}>
            <Ionicons name="key" size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={s.backdoorBtnText}>ACİL KAPI AÇ (ARKA KAPI) 🛡️</Text>
          </TouchableOpacity>
        )}

        {/* Hata */}
        {errorMessage !== '' && (
          <View style={s.errBox}>
            <Ionicons name="warning" size={20} color={Colors.danger} />
            <Text style={s.errText}>{errorMessage}</Text>
          </View>
        )}

        {/* QR Kod Gösterimi */}
        {qrPayload && (
          <Animated.View style={[s.qrCard, { transform: [{ scale: pulseAnim }] }]}>
            <View style={s.qrBadge}><Text style={s.qrBadgeText}>Giriş İzni Onaylandı</Text></View>
            <View style={s.qrWrap}>
              <QRCode value={qrPayload} size={300} backgroundColor="#FFFFFF" color="#000000" />
            </View>
            <View style={s.timerRow}>
              <Ionicons name="hourglass" size={20} color={Colors.secondary} />
              <Text style={s.timerText}>{formatTime(remainingSeconds)}</Text>
            </View>
            <Text style={s.timerHint}>Kalan süre</Text>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 12 },
  topBarTitle: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },
  scrollContent: { padding: 24, paddingBottom: 60 },
  // Hoşgeldin
  welcome: { fontSize: 20, color: Colors.textSecondary, textAlign: 'center' },
  adminBadge: { alignSelf: 'center', marginTop: 8, backgroundColor: 'rgba(185,28,28,0.6)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  adminBadgeText: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  // QR Üret
  generateBtn: { backgroundColor: Colors.primary, borderRadius: 16, height: 60, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 32, elevation: 8 },
  generateBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700', letterSpacing: 1.2 },
  // Backdoor
  backdoorBtn: { backgroundColor: Colors.dangerDark, borderRadius: 12, height: 50, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  backdoorBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  // Hata
  errBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.errorBg, borderRadius: 16, padding: 16, marginTop: 20, borderWidth: 1, borderColor: Colors.errorBorder },
  errText: { color: Colors.textSecondary, marginLeft: 12, flex: 1, fontSize: 13 },
  // QR Kart
  qrCard: { marginTop: 24, marginBottom: 40, backgroundColor: Colors.surface, borderRadius: 32, borderWidth: 1.5, borderColor: Colors.qrCardBorder, padding: 32, alignItems: 'center', shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.15, shadowRadius: 30, elevation: 10 },
  qrBadge: { backgroundColor: Colors.qrCardBadgeBg, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 24 },
  qrBadgeText: { color: Colors.secondary, fontWeight: '600', fontSize: 14 },
  qrWrap: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  timerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 28 },
  timerText: { fontSize: 36, fontWeight: '800', color: Colors.textPrimary, marginLeft: 8 },
  timerHint: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  // Pending
  pendingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  pendingIconWrap: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(245,158,11,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  pendingTitle: { fontSize: 22, fontWeight: '800', color: Colors.warning, marginBottom: 16 },
  pendingDesc: { color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  checkBtn: { backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14, flexDirection: 'row', alignItems: 'center' },
  checkBtnText: { color: '#FFF', fontWeight: '600' },
});
