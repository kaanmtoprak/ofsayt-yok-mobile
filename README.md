# First App (React Native + Expo)

Futbol odaklı mobil uygulama.  
Ana ekranlar: `Maçlar`, `Puan Durumu`, `Haberler`, `Ayarlar`.

## Kurulum

```bash
npm install
npx expo start
```

## Gerekli `.env` alanları

```env
EXPO_PUBLIC_API_BASE_URL=
EXPO_PUBLIC_LIVESCORE_API_KEY=
EXPO_PUBLIC_LIVESCORE_API_SECRET=
```

## Öne çıkan özellikler

- Maç listesi (tarih + canlı/bitmiş filtreleri)
- Maç detay ekranı (istatistik, olaylar, kadro, puan durumu)
- Takım detay ekranı (son maçlar, kadro, mini puan durumu)
- Puan durumu + gol krallığı

## Komutlar

```bash
npm run ios
npm run android
npm run web
npm run lint
```
