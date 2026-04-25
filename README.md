# Akıllı Kapı QR Kod Oluşturucu — React Native

Akıllı Kapı Sistemi için mobil QR kod üretici uygulaması. React Native (Expo) ile geliştirilmiştir.

## Özellikler

- 🔐 Supabase üzerinden güvenli giriş (SHA-256 hash)
- 📱 Lokal Ed25519 imzalı QR kod üretimi
- ⏱️ 5 dakika geçerlilik süresi ile geri sayım
- 🛡️ Admin kullanıcılar için acil kapı açma (backdoor)
- 🎨 Dark theme, modern UI tasarım

## Kurulum

```bash
npm install
npx expo start
```

## Expo Go ile Kullanım

1. Telefonuna **Expo Go** uygulamasını indir
2. `npx expo start --tunnel` komutunu çalıştır
3. Terminaldeki QR kodu telefonla tara

## Teknolojiler

- React Native + Expo
- Supabase (Auth & DB)
- TweetNaCl (Ed25519 imzalama)
- React Navigation
