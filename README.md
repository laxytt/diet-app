# Nouria

Prywatny dziennik kalorii, makro, wagi, aktywności, produktów i przepisów. Frontend działa jako statyczna aplikacja webowa na GitHub Pages oraz jako aplikacja mobilna przez Capacitor.

## Stack

- Vanilla HTML/CSS/JS z bundlingiem Vite.
- Supabase Auth, tabele `profile_assignments`, `diet_profiles`, billing/usage oraz Edge Functions dla AI/admin/płatności.
- Capacitor dla Android/iOS.
- Natywne pluginy: App deep links, Browser OAuth, Camera, MLKit Barcode Scanning, RevenueCat Purchases, AdMob.

## Uruchomienie lokalne

```powershell
npm install
npm run build:web
npm run preview
```

Kontrola projektu:

```powershell
node --check app.js
.\scripts\check.ps1
git diff --check
```

## Konfiguracja Supabase

Skopiuj `config.example.js` do `config.js` i wpisz publiczny URL oraz anon key:

```js
window.DIET_APP_CONFIG = {
  supabaseUrl: 'https://YOUR_PROJECT_REF.supabase.co',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY',
  nativeRedirectUrl: 'nouria://auth-callback',
  revenueCatAndroidApiKey: '',
  revenueCatIosApiKey: '',
  admobAndroidBannerId: '',
  admobIosBannerId: '',
  admobTesting: true,
  aiEndpoint: ''
};
```

W Supabase Auth dodaj redirect URLs:

- `https://laxytt.github.io/diet-app/`
- `http://localhost:4173/`
- `nouria://auth-callback`

Dla Google OAuth dodaj osobne klienty OAuth dla web/Android/iOS zgodnie z konfiguracją Google Cloud. Dla iOS włącz też provider Apple w Supabase, bo build iOS pokazuje Sign in with Apple.

## Monetyzacja

Model v1 to freemium:

- darmowe: logowanie, sync, ręczny dziennik, szybki wpis, podstawowe trendy, produkty, skan kodu i podstawowe przepisy,
- Premium: brak reklam, 300 analiz posiłków AI / miesiąc, 30 generacji przepisów AI / miesiąc, zaawansowane insighty i pakiety przepisów,
- pakiety jednorazowe: `dd_recipe_pack_standard_001` i `dd_recipe_pack_personalized_001`.

Produkty sklepowe:

- `dd_premium_monthly`
- `dd_premium_yearly`
- `dd_recipe_pack_standard_001`
- `dd_recipe_pack_personalized_001`

RevenueCat entitlements:

- `premium_access`
- `standard_recipes_pack`
- `personalized_recipes_pack`

Edge Function `billing-api` obsługuje status premium, limity AI, webhook RevenueCat i ręczne grant/revoke w panelu admina. RevenueCat `appUserID` musi być równy `auth.user.id` z Supabase.

Opcjonalny secret webhooka:

```powershell
$env:REVENUECAT_WEBHOOK_SECRET = "losowy-sekret-z-dashboardu"
```

## Mobile

Pierwsze przygotowanie:

```powershell
npm run build:web
npm run android:add
npm run ios:add
npm run mobile:assets
npm run mobile:sync
```

Android:

```powershell
npm run android:open
```

Projekt Android ma `applicationId` `pl.laxytt.nouria`, `targetSdkVersion` 35 i deep link `nouria://auth-callback`. AAB do Google Play buduje się poleceniem `npm run android:bundle`.

iOS:

```powershell
npm run ios:open
```

Na Windowsie projekt iOS może zostać wygenerowany, ale finalny build wymaga macOS, Xcode, CocoaPods i Apple Developer Program. Na Macu uruchom `npm run mobile:sync`, otwórz projekt w Xcode, skonfiguruj signing i wyślij build do TestFlight/App Store.

## Store readiness

- `privacy.html` zawiera publiczną politykę prywatności.
- W ustawieniach aplikacji jest reset profilu oraz usunięcie konta.
- Funkcje AI są opisane jako estymacje, a wynik można edytować przed zapisem.
- Premium używa RevenueCat jako warstwy nad Apple/Google In-App Purchase. Web/GH Pages pokazuje paywall informacyjnie, bez natywnych dialogów sklepu.
- Reklamy w darmowym planie są ograniczone do bezpiecznych slotów i powinny używać reklam kontekstowych/non-personalized. Nie targetuj reklam danymi o zdrowiu, wadze, posiłkach ani celu.
- Admin panel jest ukryty w natywnym buildzie i zostaje web-only.

## Billing Edge Function

Nowa migracja dodaje:

- `ai_feedback` do zbierania oceny wynikow AI i poprawek uzytkownika.
- `promo_codes` i `promo_redemptions` dla kodow beta. Domyslny kod testowy to `NOURIA-BETA`, ktory nadaje `premium_access` na 90 dni.

W aplikacji admin widzi panel diagnostyki reklam: status `showAds`, plan uzytkownika, AdMob unit ID, tryb testowy i ostatni blad wrappera natywnego.

`billing-api` obsługuje status premium, liczniki AI, webhook RevenueCat i ręczne granty admina. Funkcje `analyze-meal` i `recommend-recipes` sprawdzają limity po stronie backendu przed wywołaniem OpenAI.

## Deployment GitHub Pages

Workflow `.github/workflows/pages.yml` buduje `dist/` i publikuje go na GitHub Pages.

Ręczny helper:

```powershell
.\.tools\gh\bin\gh.exe auth login
.\scripts\deploy_github_pages.ps1 -RepoName "diet-app"
```

Jeśli GitHub nie przełączy Pages automatycznie, ustaw w repo `Settings -> Pages -> Source: GitHub Actions`.

## Supabase Edge Functions

Deploy:

```powershell
.\.tools\supabase\supabase.exe login
$env:OPENAI_API_KEY = "sk-..."
.\scripts\deploy_supabase.ps1 -ProjectRef "YOUR_PROJECT_REF"
```

Funkcja `admin-api` obsługuje panel admina oraz samoobsługowe usunięcie konta. Funkcje AI korzystają z sekretów Supabase, więc klucz OpenAI nigdy nie trafia do frontendu.
