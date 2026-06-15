# Dziennik Diety

Statyczna aplikacja webowa do śledzenia kalorii, makro, wagi, wody i własnej bazy produktów.

## Co jest w środku

- Trzy profile: Wiktor, Magda i Agnieszka.
- Dziennik dnia z sekcjami: śniadanie, lunch, obiad i przekąska.
- Cele kalorii, białka, węglowodanów, tłuszczu i wody per profil.
- Baza produktów per profil.
- Pomiary wagi i wypitej wody.
- Wykresy kalorii, makro i trendu wagi.
- Import z Excela albo CSV z mapowaniem kolumn.
- Eksport JSON i CSV.
- Synchronizacja między urządzeniami przez Supabase po zalogowaniu.
- Tryb AI: opisujesz posiłek tekstem, backend zwraca JSON z estymacją kcal/makro, a aplikacja zapisuje wynik do dziennika po zatwierdzeniu.

## Przechowywanie danych

Aplikacja ma dwa tryby:

- Bez konfiguracji Supabase: dane są tylko lokalnie w przeglądarce przez `localStorage`.
- Z Supabase: dane są lokalnie cache'owane i synchronizowane do tabeli `diet_profiles`.

GitHub Pages może hostować frontend, ale nie jest bazą danych i nie może bezpiecznie trzymać klucza OpenAI. Dlatego:

- frontend: GitHub Pages,
- baza + logowanie: Supabase,
- AI: Supabase Edge Function `analyze-meal`,
- klucz OpenAI: sekret funkcji, nigdy w `app.js`.

## Konfiguracja Supabase

1. Utwórz projekt w Supabase.
2. W SQL Editor uruchom [supabase/schema.sql](supabase/schema.sql).
3. W Authentication włącz email/password.
4. Utwórz jedno rodzinne konto albo zarejestruj je z poziomu aplikacji.
5. Skopiuj `config.example.js` do `config.js` i wpisz:

```js
window.DIET_APP_CONFIG = {
  supabaseUrl: 'https://YOUR_PROJECT_REF.supabase.co',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY',
  aiEndpoint: ''
};
```

Supabase anon key może być publiczny, jeśli RLS jest włączone. Bezpieczeństwo robią polityki z `schema.sql`, które ograniczają odczyt i zapis do zalogowanego użytkownika.

Możesz też wygenerować `config.js` skryptem:

```powershell
.\scripts\configure_frontend.ps1 `
  -SupabaseUrl "https://YOUR_PROJECT_REF.supabase.co" `
  -SupabaseAnonKey "YOUR_SUPABASE_ANON_KEY"
```

## Konfiguracja AI

Funkcja jest w [supabase/functions/analyze-meal/index.ts](supabase/functions/analyze-meal/index.ts).

Deployment przykładowo:

```bash
supabase functions deploy analyze-meal
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set OPENAI_MODEL=gpt-5.4-mini
```

W tym repo jest gotowy skrypt:

```powershell
.\.tools\supabase\supabase.exe login
$env:OPENAI_API_KEY = "sk-..."
.\scripts\deploy_supabase.ps1 -ProjectRef "YOUR_PROJECT_REF"
```

`OPENAI_MODEL` możesz zmienić na tańszy model dostępny na Twoim koncie, jeśli jakość estymacji będzie wystarczająca.

## Uruchomienie lokalne

Otwórz `index.html` bezpośrednio w przeglądarce. Synchronizacja i AI będą działać dopiero po wpisaniu danych Supabase w `config.js`.

Tryb instalacji/offline działa najlepiej, gdy folder jest serwowany przez HTTP, np. z prostego statycznego serwera.

Lokalny serwer:

```powershell
.\scripts\serve.ps1
```

Kontrola projektu:

```powershell
.\scripts\check.ps1
```

## Deployment na GitHub Pages

Tak, aplikację można wdrożyć na GitHub Pages, bo frontend jest statyczny.

Wrzuć do repozytorium:

- `index.html`
- `styles.css`
- `app.js`
- `config.js`
- `manifest.webmanifest`
- `sw.js`
- `icon.svg`

Folder `supabase/` nie musi być publikowany jako strona, ale trzymaj go w repo jako infrastrukturę projektu.

W GitHubie wejdź w `Settings -> Pages`, ustaw źródło na branch z tymi plikami, np. `main`, i folder `/root`.

Albo użyj przygotowanego skryptu:

```powershell
.\.tools\gh\bin\gh.exe auth login
.\scripts\deploy_github_pages.ps1 -RepoName "diet-app"
```
