# Google Play beta checklist

## Create app

Na ekranie `Utwórz aplikację` wpisz:

- Nazwa aplikacji: `Nouria`
- Nazwa pakietu: `pl.laxytt.nouria`
- Język domyślny: `polski (Polska) - pl-PL`
- Aplikacja czy gra: `Aplikacja`
- Bezpłatna czy płatna: `Bezpłatne`

Zaznacz deklaracje zgodności, podpisywania aplikacji Google Play i przepisów eksportowych USA, a potem kliknij `Utwórz aplikację`.

## App signing

Przy pierwszym uploadzie AAB włącz Google Play App Signing. Pozwól Google zarządzać kluczem podpisywania aplikacji. Lokalny `android/upload-keystore.jks` jest upload key do podpisywania kolejnych wersji.

Nie commituj i nie gub tych plików:

- `android/upload-keystore.jks`
- `android/keystore.properties`

Zapisz je w menedżerze haseł albo bezpiecznym backupie. Bez nich kolejne aktualizacje mogą być problematyczne.

## Build do uploadu

```powershell
npm run android:bundle
```

Plik do uploadu:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

Aktualny package id w AAB: `pl.laxytt.nouria`.

## Konto testowe dla reviewera

Google może odrzucić build, jeśli nie da się wejść za ekran logowania. Utwórz osobne konto testowe, np. `nouria.review+play@gmail.com`, z hasłem zapisanym w Play Console w sekcji `App access`.

Po utworzeniu konta w Supabase dodaj przypisanie profilu:

```sql
insert into public.profile_assignments (email, profile_id, name, status, updated_at)
values ('nouria.review+play@gmail.com', 'agnieszka', 'Reviewer', 'active', now())
on conflict (email) do update
set profile_id = excluded.profile_id,
    name = excluded.name,
    status = excluded.status,
    updated_at = now();
```

Ten reviewer dostanie własny wiersz `diet_profiles` po swoim `user_id`, więc nie musi widzieć prywatnych danych Agnieszki.

## Konfiguracja przed wysłaniem closed beta

- `Dashboard -> Skonfiguruj aplikację -> Dostęp do aplikacji`: jeśli aplikacja wymaga logowania, podaj konto testowe reviewera albo instrukcję rejestracji.
- `Konfiguracja -> Zasady -> Polityka prywatności`: użyj `https://laxytt.github.io/diet-app/privacy.html`.
- `App content / Zawartość aplikacji`: wypełnij Data safety, Ads, Content rating, Target audience.
- Reklamy: zaznacz, że aplikacja zawiera reklamy, jeśli AdMob zostaje włączony.
- Advertising ID: zaznacz, że aplikacja używa Advertising ID, jeśli AdMob/UMP jest aktywny.
- Grupa docelowa: nie kieruj aplikacji do dzieci; rekomendowane 18+ dla MVP z wagą, kaloriami i AI.
- Data safety: zadeklaruj email/konto, dane zdrowotne/fitness, wagę, aktywność, posiłki, zdjęcia użytkownika/kodu kreskowego, zakupy w aplikacji, diagnostykę/usage counters.

## Store listing draft

Krótki opis:

```text
Nouria pomaga prosto notować posiłki, kalorie, wodę, wagę i postępy.
```

Długi opis:

```text
Nouria to prywatny dziennik żywienia dla osób, które chcą spokojniej kontrolować codzienne posiłki, kalorie i nawyki.

W aplikacji możesz szybko dodawać posiłki, korzystać z własnych produktów i przepisów, planować dzień, śledzić wodę, wagę, aktywność oraz podstawowe trendy. Funkcje AI pomagają oszacować kalorie i makro z opisu posiłku, a wynik można edytować przed zapisem.

Aplikacja synchronizuje dane między urządzeniami po zalogowaniu. Obliczenia kalorii, BMI, spalania i sugestie AI są orientacyjne i nie zastępują porady lekarza ani dietetyka.
```

## Closed testing

Utwórz zamknięty test, dodaj listę testerów, wrzuć `app-release.aab`, opisz release notes i wyślij do sprawdzenia.

Release notes v0.1:

```text
Pierwsza beta Nouria: dziennik posiłków, produkty, przepisy, plan dnia, trendy, synchronizacja, AI do analizy posiłków, skan kodów i podstawowy model Premium.
```

## RevenueCat / produkty

Przed testem zakupów utwórz produkty w Play Console, potem zaimportuj je w RevenueCat i podepnij do offeringu. Dopóki produkty nie istnieją, aplikacja może pokazywać błąd konfiguracji RevenueCat w logach, ale darmowe funkcje powinny działać.

Produkty:

- `dd_premium_monthly`
- `dd_premium_yearly`
- `dd_recipe_pack_standard_001`
- `dd_recipe_pack_personalized_001`

Entitlementy:

- `premium_access`
- `standard_recipes_pack`
- `personalized_recipes_pack`
