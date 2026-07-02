# Nouria iOS / TestFlight checklist

## Wymagania

- MacBook z Xcode.
- Apple Developer Program.
- Bundle ID: `pl.laxytt.nouria`.
- Supabase redirect URL: `nouria://auth-callback`.
- W `config.js` ustaw:
  - `revenueCatIosApiKey`,
  - `admobIosBannerId`.

## Build lokalny

```powershell
npm ci
npm run build:web
npm run mobile:sync
npx cap open ios
```

W Xcode:

1. Wybierz target `App`.
2. Ustaw Team w `Signing & Capabilities`.
3. Upewnij sie, ze Bundle Identifier to `pl.laxytt.nouria`.
4. Dodaj capability `Sign in with Apple`, jesli włączasz Google login w buildzie iOS.
5. Uruchom na fizycznym iPhonie.

## TestFlight

1. W App Store Connect utworz aplikacje `Nouria`.
2. Dodaj privacy labels: konto, email, dane zywieniowe, waga, aktywnosc, AI, RevenueCat, AdMob, Supabase.
3. Dodaj demo account dla review.
4. W Xcode: `Product -> Archive`.
5. Po archive: `Distribute App -> App Store Connect -> Upload`.
6. W App Store Connect wlacz build w `TestFlight`.
7. Zapros wewnetrznych testerow.

## Smoke test iOS

- Email login i utrzymanie sesji po zamknieciu aplikacji.
- Google login wraca przez `nouria://auth-callback`.
- Sign in with Apple dziala, jesli Google login jest aktywny.
- Dodanie i edycja posilku.
- AI z opisu i, dla Premium, AI ze zdjecia.
- RevenueCat offerings i restore purchases.
- Avatar z aparatu/galerii.
- Usuniecie konta w ustawieniach.
