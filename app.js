(function () {
  'use strict';

  const LEGACY_STORAGE_KEY = 'diet-studio:v1';
  const STORAGE_PREFIX = 'diet-studio:v2';
  const CURRENT_PROFILE_KEY = 'diet-studio:current-profile';
  const REMOTE_REVISION_PREFIX = 'diet-studio:remote-revision';
  const REMOTE_TABLE = 'diet_profiles';
  const ASSIGNMENTS_TABLE = 'profile_assignments';
  const DEFAULT_PROFILE_ID = 'agnieszka';
  const PROFILES = [
    { id: 'agnieszka', name: 'Agnieszka' }
  ];
  const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
  const MEAL_LABELS = {
    Breakfast: 'Śniadanie',
    Lunch: 'Lunch',
    Dinner: 'Obiad',
    Snack: 'Przekąska'
  };
  const UNIT_OPTIONS = [
    { value: 'g', label: 'g' },
    { value: 'szt', label: 'szt.' },
    { value: 'porcja', label: 'porcja' },
    { value: 'paczka', label: 'paczka' },
    { value: 'lyzka', label: 'łyżka' },
    { value: 'lyzeczka', label: 'łyżeczka' },
    { value: 'kromka', label: 'kromka' }
  ];
  const IMPORT_FIELDS = [
    { key: 'date', label: 'Data', aliases: ['date', 'day', 'data', 'dzien'] },
    { key: 'meal', label: 'Posiłek', aliases: ['meal', 'posilek', 'pora', 'type'] },
    { key: 'food', label: 'Produkt', aliases: ['food', 'product', 'produkt', 'nazwa', 'jedzenie', 'dish', 'item'] },
    { key: 'grams', label: 'Gramy', aliases: ['grams', 'gram', 'gramy', 'g', 'ilosc', 'masa', 'amount'] },
    { key: 'calories', label: 'Kalorie', aliases: ['kcal', 'calorie', 'calories', 'kalorie', 'energia'] },
    { key: 'protein', label: 'Białko', aliases: ['protein', 'bialko', 'prot'] },
    { key: 'carbs', label: 'Węglowodany', aliases: ['carb', 'carbs', 'wegle', 'weglowodany'] },
    { key: 'fat', label: 'Tłuszcz', aliases: ['fat', 'tluszcz', 'fats'] },
    { key: 'weight', label: 'Waga', aliases: ['weight', 'waga', 'masa ciala'] }
  ];

  const seedFoods = [
    foodSeed('Pierś z kurczaka, gotowana', 100, 165, 31, 0, 3.6, 0),
    foodSeed('Jajko całe', 50, 72, 6.3, 0.4, 4.8, 0),
    foodSeed('Jogurt grecki 2%', 100, 73, 9.7, 3.9, 2, 0),
    foodSeed('Płatki owsiane, suche', 100, 389, 16.9, 66.3, 6.9, 10.6),
    foodSeed('Ryż gotowany', 100, 130, 2.7, 28, 0.3, 0.4),
    foodSeed('Ziemniaki gotowane', 100, 87, 1.9, 20, 0.1, 1.8),
    foodSeed('Łosoś, gotowany', 100, 206, 22.1, 0, 12.4, 0),
    foodSeed('Tuńczyk w wodzie', 100, 116, 25.5, 0, 0.8, 0),
    foodSeed('Banan', 100, 89, 1.1, 22.8, 0.3, 2.6),
    foodSeed('Jabłko', 100, 52, 0.3, 13.8, 0.2, 2.4),
    foodSeed('Awokado', 100, 160, 2, 8.5, 14.7, 6.7),
    foodSeed('Oliwa z oliwek', 10, 88, 0, 0, 10, 0),
    foodSeed('Masło orzechowe', 32, 188, 7.2, 6.3, 16.1, 1.9),
    foodSeed('Serek wiejski', 100, 98, 11.1, 3.4, 4.3, 0),
    foodSeed('Odżywka białkowa', 30, 120, 24, 3, 1.5, 0)
  ];

  const defaultState = {
    version: 1,
    settings: {
      calories: 2200,
      protein: 160,
      carbs: 230,
      fat: 70,
      water: 2500
    },
    foods: seedFoods,
    entries: [],
    weights: [],
    water: [],
    dailyCoach: {},
    deletedEntryIds: []
  };

  let currentProfileId = loadCurrentProfileId();
  migrateLegacyState();
  let state = loadState(currentProfileId);
  let currentDate = todayISO();
  let manualMode = true;
  let importState = null;
  let aiDraft = null;
  let chartTimer = 0;
  let chartTooltip = null;
  let remoteSaveTimer = 0;
  let remoteSaveInFlight = null;
  let pendingRemoteSave = false;
  let profileLoadPromise = null;
  let supabaseClient = null;
  let syncSession = null;
  let currentProfileAssignment = null;
  let isRemoteLoading = false;
  let remoteReady = false;
  let lastRemoteRevision = loadRemoteRevision(currentProfileId);

  const $ = (id) => document.getElementById(id);

  init();

  async function init() {
    bindEvents();
    initSupabaseClient();
    updateManualControls();
    $('selected-date').value = currentDate;
    $('xlsx-status').textContent = window.XLSX ? 'Parser Excela gotowy' : 'CSV gotowe';
    updateSyncUI();
    render();
    await refreshSupabaseSession();
    if (canSync()) await loadAssignedProfile();
    registerServiceWorker();
  }

  function bindEvents() {
    document.querySelectorAll('.tab-button').forEach((button) => {
      button.addEventListener('click', () => switchView(button.dataset.view));
    });

    $('prev-day').addEventListener('click', () => shiftDate(-1));
    $('next-day').addEventListener('click', () => shiftDate(1));
    $('today-button').addEventListener('click', () => {
      currentDate = todayISO();
      render();
    });
    $('selected-date').addEventListener('change', (event) => {
      currentDate = event.target.value || todayISO();
      render();
    });

    $('toggle-manual').addEventListener('click', () => {
      manualMode = !manualMode;
      updateManualControls();
      updateEntryPreview();
    });

    $('entry-form').addEventListener('submit', addDiaryEntry);
    $('ai-analyze-button').addEventListener('click', analyzeMealFromText);
    $('ai-result').addEventListener('click', handleAIResultAction);
    $('gate-auth-form').addEventListener('submit', loginUser);
    $('gate-signup-button').addEventListener('click', signUpUser);
    ['entry-food', 'entry-grams', 'entry-unit', 'entry-calories', 'entry-protein', 'entry-carbs', 'entry-fat'].forEach((id) => {
      $(id).addEventListener('input', updateEntryPreview);
    });
    $('entry-unit').addEventListener('change', updateEntryPreview);
    ['entry-calories', 'entry-protein', 'entry-carbs', 'entry-fat'].forEach((id) => {
      $(id).addEventListener('input', () => {
        if (!manualMode) {
          manualMode = true;
          updateManualControls();
        }
      });
    });

    $('meal-groups').addEventListener('click', (event) => {
      const deleteButton = event.target.closest('[data-delete-entry]');
      if (!deleteButton) return;
      markEntryDeleted(deleteButton.dataset.deleteEntry);
      state.entries = state.entries.filter((entry) => entry.id !== deleteButton.dataset.deleteEntry);
      saveState();
      render();
      toast('Wpis usunięty.');
    });

    $('copy-yesterday').addEventListener('click', copyYesterday);
    $('body-form').addEventListener('submit', saveBodyLog);

    $('food-search').addEventListener('input', renderFoods);
    $('food-form').addEventListener('submit', saveFood);
    $('reset-food-form').addEventListener('click', resetFoodForm);
    $('food-list').addEventListener('click', handleFoodAction);

    $('trend-range').addEventListener('change', () => renderCharts());
    $('settings-form').addEventListener('submit', saveSettings);
    $('auth-form').addEventListener('submit', loginUser);
    $('signup-button').addEventListener('click', signUpUser);
    $('logout-button').addEventListener('click', logoutUser);
    $('export-json').addEventListener('click', exportJSON);
    $('export-csv').addEventListener('click', exportCSV);
    $('reset-app').addEventListener('click', resetApp);

    $('import-file').addEventListener('change', handleImportFile);
    $('import-button').addEventListener('click', commitImport);
    $('clear-import').addEventListener('click', clearImport);

    window.addEventListener('resize', () => {
      clearTimeout(chartTimer);
      chartTimer = window.setTimeout(renderCharts, 120);
    });
  }

  function render() {
    $('selected-date').value = currentDate;
    renderProfileBadge();
    renderSummary();
    renderDailyCoach();
    renderDatalist();
    renderDiary();
    renderBodyInputs();
    renderFoods();
    renderSettings();
    renderStorageNote();
    renderAIResult();
    updateSyncUI();
    updateEntryPreview();
    renderCharts();
    refreshIcons();
  }

  function updateManualControls() {
    const manualFields = $('manual-fields');
    const toggle = $('toggle-manual');
    if (manualFields) manualFields.classList.toggle('collapsed', !manualMode);
    if (toggle) toggle.classList.toggle('is-active', manualMode);
  }

  function switchView(view) {
    document.querySelectorAll('.tab-button').forEach((button) => {
      button.classList.toggle('active', button.dataset.view === view);
    });
    document.querySelectorAll('.view').forEach((panel) => {
      panel.classList.toggle('active', panel.id === `view-${view}`);
    });
    window.requestAnimationFrame(() => {
      renderCharts();
      refreshIcons();
    });
  }

  async function switchProfile(profileId) {
    const profile = profileById(profileId);
    if (!profile || profile.id === currentProfileId) return;

    saveState();
    currentProfileId = profile.id;
    localStorage.setItem(CURRENT_PROFILE_KEY, currentProfileId);
    state = loadState(currentProfileId);
    aiDraft = null;
    clearImport();
    render();

    if (canSync()) await loadRemoteProfile(currentProfileId);
    toast(`Aktywny profil: ${profile.name}.`);
  }

  function profileById(profileId) {
    return PROFILES.find((profile) => profile.id === profileId) || PROFILES[0];
  }

  function isKnownProfileId(profileId) {
    return PROFILES.some((profile) => profile.id === profileId);
  }

  function profileName(profileId = currentProfileId) {
    if (currentProfileAssignment && currentProfileAssignment.profile_id === profileId) {
      return currentProfileAssignment.name || profileById(profileId).name;
    }
    return profileById(profileId).name;
  }

  function renderProfileBadge() {
    const badge = $('profile-badge');
    const nameNode = $('profile-name');
    if (!badge || !nameNode) return;

    const visible = Boolean(syncSession && currentProfileAssignment);
    badge.hidden = !visible;
    if (visible) nameNode.textContent = profileName();
  }

  function withTimeout(promise, milliseconds, message) {
    let timeoutId = 0;
    const timeout = new Promise((_, reject) => {
      timeoutId = window.setTimeout(() => reject(new Error(message)), milliseconds);
    });
    return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timeoutId));
  }

  function loadCurrentProfileId() {
    const stored = localStorage.getItem(CURRENT_PROFILE_KEY);
    return profileById(stored).id;
  }

  function initSupabaseClient() {
    const config = window.DIET_APP_CONFIG || {};
    if (!config.supabaseUrl || !config.supabaseAnonKey || !window.supabase) return;

    supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'diet-studio:supabase-auth'
      }
    });
    supabaseClient.auth.onAuthStateChange(async (_event, session) => {
      syncSession = session;
      if (canSync() && !currentProfileAssignment) {
        await loadAssignedProfile();
      } else {
        if (!canSync()) currentProfileAssignment = null;
        updateSyncUI();
        renderProfileBadge();
      }
    });
  }

  async function refreshSupabaseSession() {
    if (!supabaseClient) return;
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) {
      toast('Nie udało się odczytać sesji Supabase.');
      return;
    }
    syncSession = data.session;
    updateSyncUI();
  }

  function canSync() {
    return Boolean(supabaseClient && syncSession && syncSession.user);
  }

  function updateSyncUI() {
    const syncStatus = $('sync-status');
    const authState = $('auth-state');
    const syncNote = $('sync-note');
    const todaySummary = $('today-summary');
    if (!syncStatus || !authState || !syncNote) return;
    const appShell = document.querySelector('.app-shell');
    const authGate = $('auth-gate');
    renderProfileBadge();

    syncStatus.classList.remove('online', 'error');
    authState.classList.remove('online', 'error');
    const locked = Boolean(supabaseClient && (!syncSession || !currentProfileAssignment));
    if (appShell) appShell.classList.toggle('locked', locked);
    if (appShell) appShell.classList.toggle('auth-mode', locked);
    if (authGate) authGate.hidden = !locked;
    if (locked && todaySummary) todaySummary.textContent = 'Zaloguj się, żeby zobaczyć dane profilu';

    if (!supabaseClient) {
      syncStatus.textContent = 'Lokalnie';
      authState.textContent = 'Brak konfiguracji';
      syncNote.textContent = 'Dodaj dane Supabase w config.js, żeby synchronizować dane między urządzeniami.';
      return;
    }

    if (!syncSession) {
      syncStatus.textContent = 'Lokalnie';
      authState.textContent = 'Niezalogowano';
      syncNote.textContent = 'Zaloguj się do rodzinnego konta, żeby zapisywać dane w chmurze.';
      return;
    }

    if (!currentProfileAssignment) {
      syncStatus.textContent = isRemoteLoading ? 'Synchronizacja' : 'Brak profilu';
      authState.textContent = syncSession.user.email || 'Zalogowano';
      syncStatus.classList.add('error');
      authState.classList.add('error');
      syncNote.textContent = 'Ten email nie ma przypisanego profilu diety. Dane Agnieszki są dostępne tylko dla przypisanego konta.';
      return;
    }

    syncStatus.textContent = isRemoteLoading ? 'Synchronizacja' : 'Online';
    authState.textContent = syncSession.user.email || 'Zalogowano';
    syncStatus.classList.add('online');
    authState.classList.add('online');
    syncNote.textContent = `Synchronizacja aktywna dla profilu ${profileName()}.`;
  }

  async function loginUser(event) {
    event.preventDefault();
    if (!supabaseClient) {
      toast('Najpierw skonfiguruj Supabase w config.js.');
      return;
    }

    const source = event.target && event.target.id === 'gate-auth-form' ? 'gate' : 'settings';
    const credentials = readAuthCredentials(source);
    const email = credentials.email;
    const password = credentials.password;
    if (!email || !password) {
      toast('Podaj email i hasło.');
      return;
    }

    setAuthBusy(source, true);
    const { data, error } = await withTimeout(
      supabaseClient.auth.signInWithPassword({ email, password }),
      12000,
      'Logowanie trwa za długo. Spróbuj ponownie.'
    ).catch((timeoutError) => ({ data: null, error: timeoutError }));
    if (error) {
      toast(`Logowanie nieudane: ${error.message}`);
      setAuthBusy(source, false);
      return;
    }
    syncSession = data.session;
    updateSyncUI();
    await loadAssignedProfile();
    setAuthBusy(source, false);
    if (!currentProfileAssignment) return;
    toast('Zalogowano i włączono synchronizację.');
  }

  async function signUpUser(event) {
    if (event) event.preventDefault();
    if (!supabaseClient) {
      toast('Najpierw skonfiguruj Supabase w config.js.');
      return;
    }

    const source = event && event.currentTarget && event.currentTarget.id === 'gate-signup-button' ? 'gate' : 'settings';
    const credentials = readAuthCredentials(source);
    const email = credentials.email;
    const password = credentials.password;
    const username = sanitizeProfileName(credentials.username, email);
    if (!email || !password || !username) {
      toast('Podaj email, hasło i nazwę użytkownika.');
      return;
    }

    setAuthBusy(source, true, 'Tworzę...', 'signup');
    const { data, error } = await withTimeout(
      supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: { username },
          emailRedirectTo: authRedirectUrl()
        }
      }),
      12000,
      'Rejestracja trwa za długo. Spróbuj ponownie.'
    ).catch((timeoutError) => ({ data: null, error: timeoutError }));
    if (error) {
      toast(`Nie udało się utworzyć konta: ${error.message}`);
      setAuthBusy(source, false);
      return;
    }
    syncSession = data.session;
    if (data.session) {
      await loadAssignedProfile();
    }
    setAuthBusy(source, false);
    updateSyncUI();
    if (data.session && !currentProfileAssignment) {
      toast('Konto utworzone, ale ten email nie ma przypisanego profilu diety.');
      return;
    }
    toast(data.session ? 'Konto utworzone i zalogowane.' : 'Konto utworzone. Sprawdź email, jeśli Supabase wymaga potwierdzenia.');
  }

  function readAuthCredentials(source) {
    const prefix = source === 'gate' ? 'gate-' : '';
    const usernameInput = $(`${prefix}auth-username`);
    return {
      email: $(`${prefix}auth-email`).value.trim(),
      password: $(`${prefix}auth-password`).value,
      username: usernameInput ? usernameInput.value.trim() : ''
    };
  }

  function setAuthBusy(source, busy, label = 'Loguję...', action = 'login') {
    const loginButton = source === 'gate' ? $('gate-login-button') : $('login-button');
    const signupButton = source === 'gate' ? $('gate-signup-button') : $('signup-button');
    if (loginButton) {
      loginButton.disabled = busy;
      loginButton.innerHTML = busy && action === 'login'
        ? `<i data-lucide="loader-circle"></i> ${label}`
        : '<i data-lucide="log-in"></i> Zaloguj';
    }
    if (signupButton) {
      signupButton.disabled = busy;
      signupButton.innerHTML = busy && action === 'signup'
        ? `<i data-lucide="loader-circle"></i> ${label}`
        : '<i data-lucide="user-plus"></i> Utwórz konto';
    }
    refreshIcons();
  }

  function authRedirectUrl() {
    const url = new URL(window.location.href);
    url.hash = '';
    url.search = '';
    return url.toString();
  }

  function sanitizeProfileName(value, email = '') {
    const explicit = String(value || '').trim().replace(/\s+/g, ' ');
    if (explicit) return explicit.slice(0, 60);
    const localPart = String(email || '').split('@')[0].replace(/[._-]+/g, ' ').trim();
    if (!localPart) return profileById(DEFAULT_PROFILE_ID).name;
    return localPart
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
      .slice(0, 60);
  }

  async function logoutUser() {
    if (!supabaseClient) return;
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      toast(`Wylogowanie nieudane: ${error.message}`);
      return;
    }
    syncSession = null;
    currentProfileAssignment = null;
    remoteReady = false;
    updateSyncUI();
    toast('Wylogowano. Dane lokalne nadal są na tym urządzeniu.');
  }

  async function loadAssignedProfile() {
    if (!canSync()) return;
    if (profileLoadPromise) return profileLoadPromise;

    profileLoadPromise = loadAssignedProfileInternal().finally(() => {
      profileLoadPromise = null;
    });
    return profileLoadPromise;
  }

  async function loadAssignedProfileInternal() {
    isRemoteLoading = true;
    remoteReady = false;
    updateSyncUI();

    try {
      const { data, error } = await withTimeout(
        supabaseClient
          .from(ASSIGNMENTS_TABLE)
          .select('profile_id, name')
          .maybeSingle(),
        12000,
        'Nie udało się pobrać przypisanego profilu. Sprawdź połączenie i spróbuj ponownie.'
      );

      if (error) throw error;
      const assignment = data;
      if (!assignment || !isKnownProfileId(assignment.profile_id)) {
        throw new Error('Ten email nie ma przypisanego profilu. Poproś właściciela aplikacji o dostęp.');
      }

      currentProfileAssignment = assignment;
      currentProfileId = assignment.profile_id;
      localStorage.setItem(CURRENT_PROFILE_KEY, currentProfileId);
      lastRemoteRevision = loadRemoteRevision(currentProfileId);
      state = loadState(currentProfileId);
      aiDraft = null;
      clearImport();
      updateSyncUI();

      await loadRemoteProfile(currentProfileId).catch((error) => {
        toast(`Synchronizacja: ${error.message}`);
        render();
      });
    } catch (error) {
      currentProfileAssignment = null;
      toast(`Profil: ${error.message}`);
    } finally {
      isRemoteLoading = false;
      updateSyncUI();
    }
  }

  async function loadRemoteProfile(profileId) {
    if (!canSync()) return;
    if (!currentProfileAssignment || currentProfileAssignment.profile_id !== profileId) return;

    isRemoteLoading = true;
    remoteReady = false;
    updateSyncUI();
    const profile = profileById(profileId);
    const { data, error } = await withTimeout(
      supabaseClient
        .from(REMOTE_TABLE)
        .select('data, updated_at, revision')
        .eq('user_id', syncSession.user.id)
        .eq('profile_id', profile.id)
        .maybeSingle(),
      12000,
      'Nie udało się pobrać danych profilu.'
    );

    isRemoteLoading = false;
    if (error) {
      remoteReady = false;
      updateSyncUI();
      toast(`Błąd synchronizacji: ${error.message}`);
      return;
    }

    if (data && data.data) {
      const remoteState = normalizeState(data.data);
      const localState = normalizeState(state);
      const mergedState = mergeStates(remoteState, localState, { preferSettings: 'base' });
      const remoteChanged = stableStringify(mergedState) !== stableStringify(remoteState);
      state = mergedState;
      localStorage.setItem(storageKey(profile.id), JSON.stringify(state));
      setRemoteRevision(profile.id, numberValue(data.revision, 0));
      remoteReady = true;
      const beforeCoach = stableStringify(state.dailyCoach);
      ensureDailyCoach(currentDate);
      localStorage.setItem(storageKey(profile.id), JSON.stringify(state));
      render();
      if (remoteChanged || beforeCoach !== stableStringify(state.dailyCoach)) scheduleRemoteSave();
      return;
    }

    remoteReady = true;
    setRemoteRevision(profile.id, 0);
    await saveRemoteProfile(profile.id, state);
    render();
    updateSyncUI();
  }

  function scheduleRemoteSave() {
    if (!canSync() || !currentProfileAssignment || isRemoteLoading || !remoteReady) return;
    clearTimeout(remoteSaveTimer);
    const profileId = currentProfileId;
    const snapshot = structuredCloneSafe(state);
    remoteSaveTimer = window.setTimeout(() => {
      saveRemoteProfile(profileId, snapshot);
    }, 700);
  }

  async function saveRemoteProfile(profileId, snapshot) {
    if (!canSync()) return;
    if (!currentProfileAssignment || currentProfileAssignment.profile_id !== profileId) return;
    if (!remoteReady) return;

    if (remoteSaveInFlight) {
      pendingRemoteSave = true;
      return remoteSaveInFlight;
    }

    remoteSaveInFlight = saveRemoteProfileInternal(profileId, snapshot)
      .finally(() => {
        remoteSaveInFlight = null;
        if (pendingRemoteSave) {
          pendingRemoteSave = false;
          scheduleRemoteSave();
        }
      });
    return remoteSaveInFlight;
  }

  async function saveRemoteProfileInternal(profileId, snapshot, attempt = 0) {
    const profile = profileById(profileId);
    const { data: remote, error: fetchError } = await supabaseClient
      .from(REMOTE_TABLE)
      .select('data, revision')
      .eq('user_id', syncSession.user.id)
      .eq('profile_id', profile.id)
      .maybeSingle();

    if (fetchError) {
      toast(`Nie udało się pobrać aktualnej chmury: ${fetchError.message}`);
      return;
    }

    const remoteState = normalizeState(remote && remote.data ? remote.data : {});
    const remoteRevision = remote ? numberValue(remote.revision, 0) : 0;
    const merged = mergeStates(remoteState, snapshot, { preferSettings: 'incoming' });
    const nextRevision = remoteRevision + 1;

    if (!remote) {
      const { data, error } = await supabaseClient
        .from(REMOTE_TABLE)
        .upsert({
          user_id: syncSession.user.id,
          profile_id: profile.id,
          name: profileName(profile.id),
          data: merged,
          revision: nextRevision,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,profile_id' })
        .select('revision')
        .maybeSingle();

      if (error) {
        toast(`Nie udało się zapisać w chmurze: ${error.message}`);
        return;
      }

      setRemoteRevision(profile.id, numberValue(data && data.revision, nextRevision));
      syncLocalStateAfterRemoteSave(profile.id, snapshot, merged);
      return;
    }

    const { data: updated, error } = await supabaseClient
      .from(REMOTE_TABLE)
      .update({
        name: profileName(profile.id),
        data: merged,
        revision: nextRevision,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', syncSession.user.id)
      .eq('profile_id', profile.id)
      .eq('revision', remoteRevision)
      .select('revision')
      .maybeSingle();

    if (error) {
      toast(`Nie udało się zapisać w chmurze: ${error.message}`);
      return;
    }

    if (!updated) {
      if (attempt < 1) return saveRemoteProfileInternal(profileId, merged, attempt + 1);
      toast('Synchronizacja wykryła konflikt. Odświeżam dane przed kolejnym zapisem.');
      await loadRemoteProfile(profileId);
      return;
    }

    setRemoteRevision(profile.id, numberValue(updated.revision, nextRevision));
    syncLocalStateAfterRemoteSave(profile.id, snapshot, merged);
  }

  function syncLocalStateAfterRemoteSave(profileId, snapshot, merged) {
    if (profileId !== currentProfileId) return;
    if (stableStringify(state) === stableStringify(snapshot)) {
      state = normalizeState(merged);
      localStorage.setItem(storageKey(profileId), JSON.stringify(state));
    }
  }

  function mergeStates(baseState, incomingState, options = {}) {
    const base = normalizeState(baseState);
    const incoming = normalizeState(incomingState);
    const deletedEntryIds = uniqueStrings([
      ...base.deletedEntryIds,
      ...incoming.deletedEntryIds
    ]);

    return normalizeState({
      version: Math.max(numberValue(base.version, 1), numberValue(incoming.version, 1)),
      settings: options.preferSettings === 'base'
        ? { ...defaultState.settings, ...base.settings }
        : { ...defaultState.settings, ...incoming.settings },
      foods: mergeFoods(base.foods, incoming.foods),
      entries: mergeEntries(base.entries, incoming.entries, deletedEntryIds),
      weights: mergeByDate(base.weights, incoming.weights),
      water: mergeByDate(base.water, incoming.water),
      dailyCoach: { ...base.dailyCoach, ...incoming.dailyCoach },
      deletedEntryIds
    });
  }

  function mergeEntries(baseEntries, incomingEntries, deletedEntryIds) {
    const deleted = new Set(deletedEntryIds);
    const byId = new Map();
    [...baseEntries, ...incomingEntries].forEach((entry) => {
      if (!entry || !entry.id || deleted.has(entry.id)) return;
      byId.set(entry.id, { ...(byId.get(entry.id) || {}), ...entry });
    });
    return [...byId.values()].sort((a, b) => {
      const dateCompare = String(a.date || '').localeCompare(String(b.date || ''));
      if (dateCompare !== 0) return dateCompare;
      return String(a.createdAt || '').localeCompare(String(b.createdAt || ''));
    });
  }

  function mergeFoods(baseFoods, incomingFoods) {
    const byKey = new Map();
    [...baseFoods, ...incomingFoods].forEach((food) => {
      if (!food || !food.name) return;
      const key = normalize(food.name) || food.id;
      byKey.set(key, { ...(byKey.get(key) || {}), ...food });
    });
    return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  function mergeByDate(baseItems, incomingItems) {
    const byDate = new Map();
    [...baseItems, ...incomingItems].forEach((item) => {
      if (!item || !item.date) return;
      byDate.set(item.date, { ...(byDate.get(item.date) || {}), ...item });
    });
    return [...byDate.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }

  function uniqueStrings(values) {
    return [...new Set(values.filter((value) => typeof value === 'string' && value.trim()).map((value) => value.trim()))];
  }

  function markEntryDeleted(entryId) {
    if (!entryId) return;
    if (!Array.isArray(state.deletedEntryIds)) state.deletedEntryIds = [];
    if (!state.deletedEntryIds.includes(entryId)) state.deletedEntryIds.push(entryId);
  }

  function stableStringify(value) {
    return JSON.stringify(value);
  }

  function remoteRevisionKey(profileId) {
    return `${REMOTE_REVISION_PREFIX}:${profileId}`;
  }

  function loadRemoteRevision(profileId) {
    return numberValue(localStorage.getItem(remoteRevisionKey(profileId)), 0);
  }

  function setRemoteRevision(profileId, revision) {
    lastRemoteRevision = numberValue(revision, 0);
    localStorage.setItem(remoteRevisionKey(profileId), String(lastRemoteRevision));
  }

  function renderSummary() {
    const totals = totalsForDate(currentDate);
    const targets = state.settings;
    $('today-summary').textContent = `${formatDateLabel(currentDate)} · zapisano ${Math.round(totals.calories)} kcal`;

    updateMetric('calories', totals.calories, targets.calories, 'kcal');
    updateMetric('protein', totals.protein, targets.protein, 'g');
    updateMetric('carbs', totals.carbs, targets.carbs, 'g');
    updateMetric('fat', totals.fat, targets.fat, 'g');
  }

  function renderDailyCoach() {
    const note = $('daily-coach-note');
    const list = $('daily-coach-suggestions');
    const stamp = $('daily-coach-stamp');
    if (!note || !list || !stamp) return;

    const coach = getDailyCoach(currentDate, false);
    note.textContent = coach.note;
    list.innerHTML = coach.suggestions.map((item) => `<li>${escapeHTML(item)}</li>`).join('');
    stamp.textContent = 'Raz dziennie';
  }

  function getDailyCoach(date, persist = true) {
    if (!state.dailyCoach || typeof state.dailyCoach !== 'object' || Array.isArray(state.dailyCoach)) {
      state.dailyCoach = {};
    }

    if (state.dailyCoach[date]) return state.dailyCoach[date];

    const coach = buildDailyCoach(date);
    if (persist) state.dailyCoach[date] = coach;
    return coach;
  }

  function ensureDailyCoach(date) {
    return getDailyCoach(date, true);
  }

  function buildDailyCoach(date) {
    const totals = totalsForDate(date);
    const targets = state.settings;
    const water = state.water.find((item) => item.date === date);
    const seed = seededIndex(`${date}:${currentProfileId}`, 1000);
    const name = profileName();
    const notes = [
      `${name}, dziś wygrywa prostota: białko, warzywa i jeden spokojny wybór naraz.`,
      `${name}, nie musisz mieć idealnego dnia. Wystarczy dzień, który da się powtórzyć jutro.`,
      `${name}, trzymaj się planu posiłek po posiłku. Małe decyzje robią dużą różnicę.`,
      `${name}, najpierw sytość i nawodnienie, potem reszta robi się łatwiejsza.`,
      `${name}, cel to nie kara. To mapa, która ma pomagać wybierać spokojniej.`
    ];

    const suggestions = [];
    const caloriesLeft = targets.calories - totals.calories;
    if (totals.calories <= 0) {
      suggestions.push('Zaplanuj pierwszy posiłek wokół 25-35 g białka, żeby łatwiej kontrolować głód.');
    } else if (caloriesLeft < -150) {
      suggestions.push('Jesteś ponad celem. Postaw dalej na wodę, spacer i lekką kolację bez dokładek.');
    } else if (caloriesLeft < 250) {
      suggestions.push('Zostało mało kalorii. Wybierz coś objętościowego: warzywa, chudy nabiał albo zupę.');
    } else {
      suggestions.push(`Masz jeszcze około ${Math.max(0, Math.round(caloriesLeft))} kcal. Zaplanuj je świadomie, zanim pojawi się głód.`);
    }

    if (targets.protein > 0 && totals.protein < targets.protein * 0.7) {
      suggestions.push('Dodaj porcję białka: skyr, jajka, kurczak, tuńczyk, tofu albo serek wiejski.');
    } else {
      suggestions.push('Utrzymaj talerz w rytmie: połowa warzyw, ćwiartka białka, ćwiartka węglowodanów.');
    }

    if (!water || numberValue(water.ml, 0) < targets.water * 0.7) {
      suggestions.push('Wypij szklankę wody teraz i następną do kolejnego posiłku.');
    } else {
      suggestions.push('Masz dobry rytm nawodnienia. Dopilnuj jeszcze warzyw lub owocu w kolejnym posiłku.');
    }

    const rotating = [
      'Przygotuj jedną gotową przekąskę ratunkową: owoc + skyr albo warzywa + hummus.',
      'Jeśli masz ochotę na słodkie, zjedz porcję po normalnym posiłku, nie zamiast niego.',
      'Zrób 10 minut spaceru po największym posiłku. To prosty bonus dla apetytu i glukozy.',
      'Nie tnij kalorii agresywnie. Lepszy jest deficyt, który da się utrzymać przez tygodnie.'
    ];
    suggestions.push(rotating[seed % rotating.length]);

    return {
      date,
      note: notes[seed % notes.length],
      suggestions: suggestions.slice(0, 3),
      createdAt: new Date().toISOString()
    };
  }

  function seededIndex(value, modulo) {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = (hash * 31 + value.charCodeAt(index)) % 2147483647;
    }
    return modulo ? hash % modulo : hash;
  }

  function updateMetric(key, value, target, unit) {
    const roundedValue = unit === 'kcal' ? Math.round(value) : round1(value);
    const roundedTarget = unit === 'kcal' ? Math.round(target) : round1(target);
    const remaining = round1(target - value);
    const percent = target > 0 ? Math.max(0, Math.min(120, (value / target) * 100)) : 0;
    $(`${key}-value`).textContent = `${roundedValue}${unit === 'kcal' ? '' : unit} / ${roundedTarget}${unit === 'kcal' ? '' : unit}`;
    $(`${key}-meter`).style.width = `${percent}%`;

    const detailId = key === 'calories' ? 'calories-remaining' : `${key}-detail`;
    const prefix = remaining >= 0
      ? `pozostało ${remaining}${unit === 'kcal' ? '' : unit}`
      : `${Math.abs(remaining)}${unit === 'kcal' ? '' : unit} ponad cel`;
    $(detailId).textContent = prefix;
  }

  function renderDatalist() {
    const options = [...state.foods]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((food) => `<option value="${escapeHTML(food.name)}"></option>`)
      .join('');
    $('food-options').innerHTML = options;
  }

  function mealLabel(meal) {
    return MEAL_LABELS[meal] || meal || MEAL_LABELS.Snack;
  }

  function unitLabel(unit) {
    return (UNIT_OPTIONS.find((item) => item.value === unit) || UNIT_OPTIONS[0]).label;
  }

  function selectedEntryUnit() {
    const unit = $('entry-unit') ? $('entry-unit').value : 'g';
    return UNIT_OPTIONS.some((item) => item.value === unit) ? unit : 'g';
  }

  function foodServingUnit(food) {
    return food && food.servingUnit ? food.servingUnit : 'g';
  }

  function foodServingAmount(food) {
    return numberValue(food && food.servingGram, 100) || 100;
  }

  function formatAmount(amount, unit) {
    return `${round1(amount)} ${unitLabel(unit || 'g')}`;
  }

  function formatFoodServing(food) {
    return formatAmount(foodServingAmount(food), foodServingUnit(food));
  }

  function formatEntryAmount(entry) {
    if (entry.amount !== undefined && entry.amount !== null) return formatAmount(entry.amount, entry.unit || 'g');
    return formatAmount(numberValue(entry.grams, 0), 'g');
  }

  function equivalentGrams(food, amount, unit) {
    if (unit === 'g') return amount;
    if (food && foodServingUnit(food) === 'g') return amount * foodServingAmount(food);
    return amount;
  }

  function renderDiary() {
    const entries = entriesForDate(currentDate);
    const html = MEALS.map((meal) => {
      const mealEntries = entries.filter((entry) => entry.meal === meal);
      const totals = sumEntries(mealEntries);
      const rows = mealEntries.length
        ? mealEntries.map(renderDiaryRow).join('')
        : '<div class="empty-state">Brak wpisów</div>';
      return `
        <section class="meal-section">
          <div class="meal-title">
            <span>${mealLabel(meal)}</span>
            <small>${Math.round(totals.calories)} kcal · ${round1(totals.protein)}b / ${round1(totals.carbs)}w / ${round1(totals.fat)}t</small>
          </div>
          ${rows}
        </section>
      `;
    }).join('');

    $('meal-groups').innerHTML = html;
  }

  function renderDiaryRow(entry) {
    return `
      <div class="entry-row">
        <div>
          <strong title="${escapeHTML(entry.foodName)}">${escapeHTML(entry.foodName)}</strong>
          <small>${formatEntryAmount(entry)}</small>
        </div>
        <span class="macro-number">${Math.round(entry.calories)}</span>
        <span class="macro-number">${round1(entry.protein)}b</span>
        <span class="macro-number hide-sm">${round1(entry.carbs)}w</span>
        <span class="macro-number hide-sm">${round1(entry.fat)}t</span>
        <button class="icon-button" type="button" data-delete-entry="${entry.id}" aria-label="Usuń ${escapeHTML(entry.foodName)}" title="Usuń">
          <i data-lucide="x"></i>
        </button>
      </div>
    `;
  }

  function updateEntryPreview() {
    const foodName = $('entry-food').value.trim();
    const amount = numberValue($('entry-grams').value, 100);
    const unit = selectedEntryUnit();
    const nutrition = entryNutritionFromForm(foodName, amount, unit);
    const values = [
      `${Math.round(nutrition.calories)} kcal`,
      `${round1(nutrition.protein)}g białka`,
      `${round1(nutrition.carbs)}g węglowodanów`,
      `${round1(nutrition.fat)}g tłuszczu`
    ];
    $('entry-preview').innerHTML = values.map((value) => `<span>${value}</span>`).join('');
  }

  function addDiaryEntry(event) {
    event.preventDefault();

    const foodName = $('entry-food').value.trim();
    const amount = numberValue($('entry-grams').value, 100);
    const unit = selectedEntryUnit();
    if (!foodName) {
      toast('Dodaj nazwę produktu.');
      return;
    }

    const matchedFood = findFoodByName(foodName);
    const nutrition = entryNutritionFromForm(foodName, amount, unit);
    const hasNutrition = nutrition.calories > 0 || nutrition.protein > 0 || nutrition.carbs > 0 || nutrition.fat > 0;

    if (!matchedFood && !hasNutrition) {
      manualMode = true;
      updateManualControls();
      toast('Dodaj kalorie albo makro dla tego produktu.');
      return;
    }

    const entry = {
      id: uid(),
      date: currentDate,
      meal: $('entry-meal').value,
      foodId: matchedFood ? matchedFood.id : null,
      foodName: matchedFood ? matchedFood.name : foodName,
      amount,
      unit,
      grams: equivalentGrams(matchedFood, amount, unit),
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      createdAt: new Date().toISOString()
    };

    if (!matchedFood && hasNutrition) {
      const createdFood = addImportedFoodIfMissing({
        name: foodName,
        servingGram: amount || 100,
        servingUnit: unit,
        calories: nutrition.calories,
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fat: nutrition.fat,
        fiber: 0
      });
      entry.foodId = createdFood ? createdFood.id : null;
    }

    state.entries.push(entry);

    saveState();
    $('entry-food').value = '';
    $('entry-grams').value = '100';
    $('entry-unit').value = 'g';
    ['entry-calories', 'entry-protein', 'entry-carbs', 'entry-fat'].forEach((id) => {
      $(id).value = '';
    });
    render();
    toast('Produkt dodany do dziennika.');
  }

  async function analyzeMealFromText() {
    const text = $('ai-meal-text').value.trim();
    if (!text) {
      toast('Opisz, co było w posiłku.');
      return;
    }

    const button = $('ai-analyze-button');
    button.disabled = true;
    button.innerHTML = '<i data-lucide="loader-circle"></i> Liczę...';
    refreshIcons();

    try {
      const result = await requestMealAnalysis(text);
      aiDraft = normalizeAIResult(result, text);
      renderAIResult();
      toast('AI przygotowało wyliczenie. Sprawdź i zapisz.');
    } catch (error) {
      console.error(error);
      toast(error.message || 'Nie udało się przeliczyć posiłku.');
    } finally {
      button.disabled = false;
      button.innerHTML = '<i data-lucide="sparkles"></i> Przelicz z opisu';
      refreshIcons();
    }
  }

  async function requestMealAnalysis(text) {
    const config = window.DIET_APP_CONFIG || {};

    if (config.aiEndpoint) {
      const response = await fetch(config.aiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, profile: profileName(), date: currentDate })
      });
      if (!response.ok) throw new Error(`Backend AI zwrócił błąd ${response.status}.`);
      return response.json();
    }

    if (supabaseClient && syncSession) {
      const { data, error } = await supabaseClient.functions.invoke('analyze-meal', {
        body: { text, profile: profileName(), date: currentDate }
      });
      if (error) throw new Error(error.message || 'Funkcja AI zwróciła błąd.');
      return data;
    }

    throw new Error('Skonfiguruj Supabase i zaloguj się albo ustaw aiEndpoint w config.js.');
  }

  function normalizeAIResult(result, sourceText) {
    const payload = result && result.result ? result.result : result;
    const totalsPayload = payload && payload.totals ? payload.totals : {};
    const rawItems = Array.isArray(payload && payload.items) ? payload.items : [];
    const items = rawItems.map((item) => ({
      name: String(item.name || item.product || 'Składnik').trim(),
      grams: Math.max(0, numberValue(item.grams, item.amount_grams !== undefined ? item.amount_grams : 100)),
      calories: Math.max(0, numberValue(item.calories, item.kcal !== undefined ? item.kcal : 0)),
      protein: Math.max(0, numberValue(item.protein, 0)),
      carbs: Math.max(0, numberValue(item.carbs, 0)),
      fat: Math.max(0, numberValue(item.fat, 0))
    })).filter((item) => item.name);

    const fallbackTotals = {
      calories: numberValue(totalsPayload.calories, payload && payload.calories !== undefined ? payload.calories : 0),
      protein: numberValue(totalsPayload.protein, payload && payload.protein !== undefined ? payload.protein : 0),
      carbs: numberValue(totalsPayload.carbs, payload && payload.carbs !== undefined ? payload.carbs : 0),
      fat: numberValue(totalsPayload.fat, payload && payload.fat !== undefined ? payload.fat : 0)
    };

    const finalItems = items.length ? items : [{
      name: payload && payload.meal_name ? payload.meal_name : 'Opisany posiłek',
      grams: numberValue(payload && payload.grams !== undefined ? payload.grams : 100, 100),
      ...fallbackTotals
    }];

    const totals = sumEntries(finalItems);
    return {
      sourceText,
      mealName: payload && payload.meal_name ? payload.meal_name : 'Opisany posiłek',
      confidence: Math.max(0, Math.min(1, numberValue(payload && payload.confidence !== undefined ? payload.confidence : 0.6, 0.6))),
      notes: String(payload && payload.notes ? payload.notes : ''),
      items: finalItems,
      totals
    };
  }

  function renderAIResult() {
    const target = $('ai-result');
    if (!target) return;
    if (!aiDraft) {
      target.innerHTML = '';
      return;
    }

    const confidence = Math.round(aiDraft.confidence * 100);
    target.innerHTML = `
      <div class="ai-summary">
        <strong>${escapeHTML(aiDraft.mealName)} · ${Math.round(aiDraft.totals.calories)} kcal</strong>
        <span>${round1(aiDraft.totals.protein)}g białka / ${round1(aiDraft.totals.carbs)}g węglowodanów / ${round1(aiDraft.totals.fat)}g tłuszczu · pewność ${confidence}%</span>
        ${aiDraft.notes ? `<span>${escapeHTML(aiDraft.notes)}</span>` : ''}
      </div>
      <div class="ai-items">
        ${aiDraft.items.map((item) => `
          <div class="ai-item">
            <div>
              <strong>${escapeHTML(item.name)}</strong>
              <small>${round1(item.grams)}g · ${Math.round(item.calories)} kcal · ${round1(item.protein)}b / ${round1(item.carbs)}w / ${round1(item.fat)}t</small>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="button-row">
        <button class="primary-button" type="button" data-save-ai>
          <i data-lucide="check"></i>
          Zapisz do dziennika
        </button>
        <button class="ghost-button" type="button" data-clear-ai>Odrzuć</button>
      </div>
    `;
    refreshIcons();
  }

  function handleAIResultAction(event) {
    if (event.target.closest('[data-clear-ai]')) {
      aiDraft = null;
      renderAIResult();
      return;
    }

    if (!event.target.closest('[data-save-ai]') || !aiDraft) return;
    const meal = $('entry-meal').value || 'Snack';
    aiDraft.items.forEach((item) => {
      const existingFood = findFoodByName(item.name);
      const food = existingFood || addImportedFoodIfMissing({
        name: item.name,
        servingGram: item.grams || 100,
        servingUnit: 'g',
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        fiber: 0
      });

      state.entries.push({
        id: uid(),
        date: currentDate,
        meal,
        foodId: food ? food.id : null,
        foodName: item.name,
        amount: item.grams || 100,
        unit: 'g',
        grams: item.grams || 100,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        createdAt: new Date().toISOString(),
        source: 'ai'
      });
    });

    aiDraft = null;
    $('ai-meal-text').value = '';
    saveState();
    render();
    toast('Wynik AI zapisany w dzienniku.');
  }

  function entryNutritionFromForm(foodName, amount, unit) {
    const hasManualValues = ['entry-calories', 'entry-protein', 'entry-carbs', 'entry-fat']
      .some((id) => $(id).value !== '');
    if (manualMode && hasManualValues) {
      return {
        calories: numberValue($('entry-calories').value, 0),
        protein: numberValue($('entry-protein').value, 0),
        carbs: numberValue($('entry-carbs').value, 0),
        fat: numberValue($('entry-fat').value, 0)
      };
    }

    const food = findFoodByName(foodName);
    if (food) return nutritionForFood(food, amount, unit);

    return {
      calories: numberValue($('entry-calories').value, 0),
      protein: numberValue($('entry-protein').value, 0),
      carbs: numberValue($('entry-carbs').value, 0),
      fat: numberValue($('entry-fat').value, 0)
    };
  }

  function renderBodyInputs() {
    const weight = state.weights.find((item) => item.date === currentDate);
    const water = state.water.find((item) => item.date === currentDate);
    $('weight-input').value = weight ? weight.weight : '';
    $('water-input').value = water ? water.ml : '';
  }

  function saveBodyLog(event) {
    event.preventDefault();
    const weight = numberValue($('weight-input').value, null);
    const water = numberValue($('water-input').value, null);

    if (weight !== null) {
      upsertByDate(state.weights, currentDate, { id: uid(), date: currentDate, weight });
    }
    if (water !== null) {
      upsertByDate(state.water, currentDate, { id: uid(), date: currentDate, ml: water });
    }

    saveState();
    render();
    toast('Pomiary zapisane.');
  }

  function copyYesterday() {
    const yesterday = addDays(currentDate, -1);
    const source = entriesForDate(yesterday);
    if (!source.length) {
      toast('Wczoraj nie ma żadnych wpisów.');
      return;
    }

    const todayEntries = entriesForDate(currentDate);
    if (todayEntries.length && !window.confirm('Zastąpić dzisiejszy dziennik wpisami z wczoraj?')) return;

    todayEntries.forEach((entry) => markEntryDeleted(entry.id));
    state.entries = state.entries.filter((entry) => entry.date !== currentDate);
    source.forEach((entry) => {
      state.entries.push({
        ...entry,
        id: uid(),
        date: currentDate,
        createdAt: new Date().toISOString()
      });
    });
    saveState();
    render();
    toast('Skopiowano wczorajsze wpisy.');
  }

  function renderFoods() {
    const query = normalize($('food-search').value || '');
    const foods = [...state.foods]
      .filter((food) => normalize(food.name).includes(query))
      .sort((a, b) => Number(b.favorite || false) - Number(a.favorite || false) || a.name.localeCompare(b.name));

    $('food-list').innerHTML = foods.length
      ? foods.map(renderFoodRow).join('')
      : '<div class="empty-state">Nie znaleziono produktów</div>';
    refreshIcons();
  }

  function renderFoodRow(food) {
    return `
      <div class="food-row">
        <div>
          <strong title="${escapeHTML(food.name)}">${food.favorite ? '<i data-lucide="star"></i> ' : ''}${escapeHTML(food.name)}</strong>
          <small>${formatFoodServing(food)}</small>
        </div>
        <span class="macro-number">${Math.round(food.calories)}</span>
        <span class="macro-number">${round1(food.protein)}b</span>
        <span class="macro-number hide-sm">${round1(food.carbs)}w</span>
        <span class="macro-number hide-sm">${round1(food.fat)}t</span>
        <div class="row-actions">
          <button class="icon-button" type="button" data-food-add="${food.id}" aria-label="Dodaj ${escapeHTML(food.name)}" title="Dodaj">
            <i data-lucide="plus"></i>
          </button>
          <button class="icon-button" type="button" data-food-edit="${food.id}" aria-label="Edytuj ${escapeHTML(food.name)}" title="Edytuj">
            <i data-lucide="pencil"></i>
          </button>
          <button class="icon-button" type="button" data-food-favorite="${food.id}" aria-label="Ulubione ${escapeHTML(food.name)}" title="Ulubione">
            <i data-lucide="star"></i>
          </button>
          <button class="icon-button" type="button" data-food-delete="${food.id}" aria-label="Usuń ${escapeHTML(food.name)}" title="Usuń">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </div>
    `;
  }

  function saveFood(event) {
    event.preventDefault();
    const id = $('food-id').value || uid();
    const food = {
      id,
      name: $('food-name').value.trim(),
      servingGram: numberValue($('food-serving').value, 100),
      servingUnit: $('food-unit').value || 'g',
      calories: numberValue($('food-calories').value, 0),
      protein: numberValue($('food-protein').value, 0),
      carbs: numberValue($('food-carbs').value, 0),
      fat: numberValue($('food-fat').value, 0),
      fiber: numberValue($('food-fiber').value, 0),
      custom: true,
      favorite: Boolean((state.foods.find((item) => item.id === id) || {}).favorite)
    };

    if (!food.name) {
      toast('Dodaj nazwę produktu.');
      return;
    }

    const existingIndex = state.foods.findIndex((item) => item.id === id);
    if (existingIndex >= 0) {
      state.foods[existingIndex] = food;
    } else {
      state.foods.push(food);
    }

    saveState();
    resetFoodForm();
    render();
    toast('Produkt zapisany.');
  }

  function resetFoodForm() {
    $('food-id').value = '';
    $('food-form').reset();
    $('food-serving').value = '100';
    $('food-unit').value = 'g';
    $('food-fiber').value = '0';
  }

  function handleFoodAction(event) {
    const add = event.target.closest('[data-food-add]');
    const edit = event.target.closest('[data-food-edit]');
    const favorite = event.target.closest('[data-food-favorite]');
    const remove = event.target.closest('[data-food-delete]');

    if (add) {
      const food = state.foods.find((item) => item.id === add.dataset.foodAdd);
      if (!food) return;
      $('entry-food').value = food.name;
      $('entry-grams').value = String(foodServingAmount(food));
      $('entry-unit').value = foodServingUnit(food);
      switchView('diary');
      updateEntryPreview();
      $('entry-grams').focus();
      return;
    }

    if (edit) {
      const food = state.foods.find((item) => item.id === edit.dataset.foodEdit);
      if (!food) return;
      $('food-id').value = food.id;
      $('food-name').value = food.name;
      $('food-serving').value = foodServingAmount(food);
      $('food-unit').value = foodServingUnit(food);
      $('food-calories').value = food.calories;
      $('food-protein').value = food.protein;
      $('food-carbs').value = food.carbs;
      $('food-fat').value = food.fat;
      $('food-fiber').value = food.fiber || 0;
      $('food-name').focus();
      return;
    }

    if (favorite) {
      const food = state.foods.find((item) => item.id === favorite.dataset.foodFavorite);
      if (!food) return;
      food.favorite = !food.favorite;
      saveState();
      renderFoods();
      return;
    }

    if (remove) {
      const food = state.foods.find((item) => item.id === remove.dataset.foodDelete);
      if (!food || !window.confirm(`Usunąć ${food.name}?`)) return;
      state.foods = state.foods.filter((item) => item.id !== food.id);
      state.entries.forEach((entry) => {
        if (entry.foodId === food.id) entry.foodId = null;
      });
      saveState();
      render();
      toast('Produkt usunięty.');
    }
  }

  function renderSettings() {
    $('target-calories').value = state.settings.calories;
    $('target-protein').value = state.settings.protein;
    $('target-carbs').value = state.settings.carbs;
    $('target-fat').value = state.settings.fat;
    $('target-water').value = state.settings.water;
  }

  function saveSettings(event) {
    event.preventDefault();
    state.settings = {
      calories: numberValue($('target-calories').value, 2200),
      protein: numberValue($('target-protein').value, 160),
      carbs: numberValue($('target-carbs').value, 230),
      fat: numberValue($('target-fat').value, 70),
      water: numberValue($('target-water').value, 2500)
    };
    saveState();
    render();
    toast('Cele zapisane.');
  }

  function renderStorageNote() {
    const entryCount = state.entries.length;
    const foodCount = state.foods.length;
    const weightCount = state.weights.length;
    $('storage-note').textContent = `Profil ${profileName()}: ${entryCount} wpisów w dzienniku, ${foodCount} produktów i ${weightCount} pomiarów wagi zapisanych lokalnie w tej przeglądarce.`;
  }

  function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    $('import-file-name').textContent = file.name;

    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = () => prepareImport(parseCSV(String(reader.result || '')));
      reader.onerror = () => toast('Nie udało się odczytać pliku CSV.');
      reader.readAsText(file);
      return;
    }

    if (!window.XLSX) {
      toast('Import Excela wymaga parsera XLSX. Import CSV jest dostępny.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const workbook = window.XLSX.read(reader.result, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames.find((name) => {
          const rows = window.XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: '', raw: false });
          return rows.length > 1;
        }) || workbook.SheetNames[0];
        const rows = window.XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '', raw: false });
        prepareImport(rows);
        toast(`Wczytano arkusz: ${sheetName}.`);
      } catch (error) {
        console.error(error);
        toast('Nie udało się odczytać pliku Excela.');
      }
    };
    reader.onerror = () => toast('Nie udało się wczytać pliku Excela.');
    reader.readAsArrayBuffer(file);
  }

  function prepareImport(rawRows) {
    const rows = rawRows
      .map((row) => Array.from(row || []).map((cell) => String(cell === null || cell === undefined ? '' : cell).trim()))
      .filter((row) => row.some((cell) => cell !== ''));

    if (!rows.length) {
      clearImport();
      toast('Nie znaleziono wierszy.');
      return;
    }

    const headerIndex = detectHeaderRow(rows);
    const headers = rows[headerIndex].map((header, index) => header || `Kolumna ${index + 1}`);
    const body = rows.slice(headerIndex + 1).map((row) => {
      const record = {};
      headers.forEach((header, index) => {
        record[header] = row[index] || '';
      });
      return record;
    }).filter((record) => Object.values(record).some((value) => String(value).trim() !== ''));

    importState = {
      headers,
      rows: body,
      mapping: guessMapping(headers)
    };

    renderMapping();
    renderImportPreview();
    $('import-button').disabled = body.length === 0;
    toast(`Gotowe do importu: ${body.length} wierszy.`);
  }

  function detectHeaderRow(rows) {
    let best = 0;
    let bestScore = -1;
    rows.slice(0, 15).forEach((row, index) => {
      const text = row.join(' ').toLowerCase();
      const keywordScore = IMPORT_FIELDS.reduce((score, field) => {
        return score + (field.aliases.some((alias) => text.includes(alias)) ? 2 : 0);
      }, 0);
      const filledScore = row.filter(Boolean).length / Math.max(1, row.length);
      const score = keywordScore + filledScore;
      if (score > bestScore) {
        best = index;
        bestScore = score;
      }
    });
    return best;
  }

  function guessMapping(headers) {
    const mapping = {};
    IMPORT_FIELDS.forEach((field) => {
      const found = headers.find((header) => {
        const normalized = normalize(header);
        return field.aliases.some((alias) => normalized.includes(normalize(alias)));
      });
      mapping[field.key] = found || '';
    });
    return mapping;
  }

  function renderMapping() {
    if (!importState) {
      $('mapping-grid').innerHTML = '';
      return;
    }

    const options = ['<option value="">Pomiń</option>']
      .concat(importState.headers.map((header) => `<option value="${escapeHTML(header)}">${escapeHTML(header)}</option>`))
      .join('');

    $('mapping-grid').innerHTML = IMPORT_FIELDS.map((field) => `
      <label>
        <span>${field.label}</span>
        <select id="map-${field.key}">
          ${options}
        </select>
      </label>
    `).join('');

    IMPORT_FIELDS.forEach((field) => {
      $(`map-${field.key}`).value = importState.mapping[field.key] || '';
      $(`map-${field.key}`).addEventListener('change', renderImportPreview);
    });
  }

  function renderImportPreview() {
    if (!importState) {
      $('import-preview-table').querySelector('thead').innerHTML = '';
      $('import-preview-table').querySelector('tbody').innerHTML = '';
      $('import-preview-count').textContent = '0 wierszy';
      return;
    }

    const mapping = currentMapping();
    const preview = importState.rows.slice(0, 20).map((row) => projectedImportRow(row, mapping));
    const headers = ['date', 'meal', 'food', 'grams', 'calories', 'protein', 'carbs', 'fat', 'weight'];
    $('import-preview-count').textContent = `${importState.rows.length} wierszy`;
    $('import-preview-table').querySelector('thead').innerHTML = `<tr>${headers.map((header) => `<th>${importHeaderLabel(header)}</th>`).join('')}</tr>`;
    $('import-preview-table').querySelector('tbody').innerHTML = preview.map((row) => `
      <tr>
        ${headers.map((header) => `<td>${escapeHTML(row[header] === null || row[header] === undefined ? '' : row[header])}</td>`).join('')}
      </tr>
    `).join('');
  }

  function importHeaderLabel(header) {
    const labels = {
      date: 'data',
      meal: 'posiłek',
      food: 'produkt',
      grams: 'gramy',
      calories: 'kalorie',
      protein: 'białko',
      carbs: 'węglowodany',
      fat: 'tłuszcz',
      weight: 'waga'
    };
    return labels[header] || header;
  }

  function projectedImportRow(row, mapping) {
    const get = (key) => mapping[key] ? row[mapping[key]] : '';
    return {
      date: parseDateValue(get('date')) || currentDate,
      meal: normalizeMeal(get('meal')),
      food: get('food'),
      grams: parseNumber(get('grams')),
      calories: parseNumber(get('calories')),
      protein: parseNumber(get('protein')),
      carbs: parseNumber(get('carbs')),
      fat: parseNumber(get('fat')),
      weight: parseNumber(get('weight'))
    };
  }

  function commitImport() {
    if (!importState) return;

    const mapping = currentMapping();
    let entryCount = 0;
    let weightCount = 0;

    importState.rows.forEach((rawRow) => {
      const row = projectedImportRow(rawRow, mapping);
      const hasWeight = row.weight !== null && row.weight > 0;
      const hasDiaryNutrition = [row.calories, row.protein, row.carbs, row.fat].some((value) => value !== null && value > 0);
      const foodName = String(row.food || '').trim();

      if (hasWeight) {
        upsertByDate(state.weights, row.date, { id: uid(), date: row.date, weight: row.weight });
        weightCount += 1;
      }

      if (foodName || hasDiaryNutrition) {
        const entry = {
          id: uid(),
          date: row.date || currentDate,
          meal: normalizeMeal(row.meal),
          foodId: null,
          foodName: foodName || 'Importowany produkt',
          amount: row.grams || 100,
          unit: 'g',
          grams: row.grams || 100,
          calories: row.calories || 0,
          protein: row.protein || 0,
          carbs: row.carbs || 0,
          fat: row.fat || 0,
          createdAt: new Date().toISOString()
        };

        const existingFood = findFoodByName(entry.foodName);
        if (existingFood) {
          entry.foodId = existingFood.id;
        } else if (hasDiaryNutrition) {
          const importedFood = addImportedFoodIfMissing({
            name: entry.foodName,
            servingGram: entry.grams,
            servingUnit: 'g',
            calories: entry.calories,
            protein: entry.protein,
            carbs: entry.carbs,
            fat: entry.fat,
            fiber: 0
          });
          entry.foodId = importedFood ? importedFood.id : null;
        }

        state.entries.push(entry);
        entryCount += 1;
      }
    });

    saveState();
    clearImport(false);
    render();
    toast(`Zaimportowano ${entryCount} wpisów i ${weightCount} pomiarów wagi.`);
  }

  function clearImport(clearFileInput = true) {
    importState = null;
    $('mapping-grid').innerHTML = '';
    $('import-button').disabled = true;
    $('import-preview-count').textContent = '0 wierszy';
    $('import-preview-table').querySelector('thead').innerHTML = '';
    $('import-preview-table').querySelector('tbody').innerHTML = '';
    $('import-file-name').textContent = 'Nie wybrano pliku';
    if (clearFileInput) $('import-file').value = '';
  }

  function currentMapping() {
    const mapping = {};
    IMPORT_FIELDS.forEach((field) => {
      const select = $(`map-${field.key}`);
      mapping[field.key] = select ? select.value : '';
    });
    return mapping;
  }

  function exportJSON() {
    downloadFile(`dziennik-diety-${todayISO()}.json`, JSON.stringify(state, null, 2), 'application/json');
  }

  function exportCSV() {
    const rows = [
      ['data', 'posilek', 'produkt', 'ilosc', 'jednostka', 'gramy', 'kalorie', 'bialko', 'weglowodany', 'tluszcz'],
      ...state.entries
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((entry) => [
          entry.date,
          entry.meal,
          entry.foodName,
          entry.amount ?? entry.grams,
          entry.unit || 'g',
          entry.grams,
          entry.calories,
          entry.protein,
          entry.carbs,
          entry.fat
        ])
    ];
    downloadFile(`dziennik-diety-wpisy-${todayISO()}.csv`, toCSV(rows), 'text/csv');
  }

  function resetApp() {
    if (!window.confirm(`Usunąć dane profilu ${profileName()}?`)) return;
    const deletedEntryIds = uniqueStrings([
      ...((state && state.deletedEntryIds) || []),
      ...((state && state.entries) || []).map((entry) => entry.id)
    ]);
    localStorage.removeItem(storageKey(currentProfileId));
    state = normalizeState({ ...structuredCloneSafe(defaultState), deletedEntryIds });
    currentDate = todayISO();
    clearImport();
    saveState();
    render();
    toast(`Profil ${profileName()} zresetowany.`);
  }

  function renderCharts() {
    renderWeekChart();
    renderCalorieChart();
    renderWeightChart();
    renderMacroChart();
  }

  function renderWeekChart() {
    const canvas = $('week-chart');
    if (!isVisible(canvas)) return;
    const dates = lastNDates(7, currentDate);
    const points = dates.map((date) => ({
      label: shortDate(date),
      value: totalsForDate(date).calories
    }));
    drawBarChart(canvas, points, state.settings.calories, {
      label: 'Kalorie',
      unit: 'kcal',
      color: '#2f7d59',
      targetColor: '#c75a3b',
      emptyLabel: 'Brak zapisanych kalorii'
    });
  }

  function renderCalorieChart() {
    const canvas = $('calorie-chart');
    if (!isVisible(canvas)) return;
    const range = Number($('trend-range').value || 7);
    const dates = lastNDates(range, currentDate);
    const points = dates.map((date) => ({
      label: range > 14 ? shortDay(date) : shortDate(date),
      value: totalsForDate(date).calories
    }));
    drawBarChart(canvas, points, state.settings.calories, {
      label: 'Kalorie',
      unit: 'kcal',
      color: '#2f7d59',
      targetColor: '#c75a3b',
      emptyLabel: 'Brak zapisanych kalorii'
    });
  }

  function renderWeightChart() {
    const canvas = $('weight-chart');
    if (!isVisible(canvas)) return;
    const sorted = [...state.weights].sort((a, b) => a.date.localeCompare(b.date));
    const range = Number($('trend-range').value || 7);
    const cutoff = addDays(currentDate, -(range - 1));
    const points = sorted
      .filter((item) => item.date >= cutoff && item.date <= currentDate)
      .map((item) => ({ label: shortDate(item.date), value: item.weight }));

    if (points.length >= 2) {
      const delta = round1(points[points.length - 1].value - points[0].value);
      $('weight-trend-label').textContent = delta === 0 ? 'Stabilnie' : `${delta > 0 ? '+' : ''}${delta} kg`;
    } else {
      $('weight-trend-label').textContent = 'Brak trendu';
    }

    drawLineChart(canvas, points, {
      label: 'Waga',
      unit: 'kg',
      color: '#1f7a8c',
      emptyLabel: 'Brak pomiarów wagi'
    });
  }

  function renderMacroChart() {
    const canvas = $('macro-chart');
    if (!isVisible(canvas)) return;
    const totals = totalsForDate(currentDate);
    const proteinCalories = totals.protein * 4;
    const carbCalories = totals.carbs * 4;
    const fatCalories = totals.fat * 9;
    drawDonutChart(canvas, [
      { label: 'Białko', value: proteinCalories, color: '#c75a3b' },
      { label: 'Węglowodany', value: carbCalories, color: '#b8872f' },
      { label: 'Tłuszcz', value: fatCalories, color: '#1f7a8c' }
    ], 'Brak makro');
    $('macro-split-label').textContent = formatDateLabel(currentDate);
  }

  function drawBarChart(canvas, points, target, options) {
    const ctx = setupCanvas(canvas);
    if (!ctx) return;
    const { width, height } = canvas.__chartSize;
    clearChart(ctx, width, height);
    canvas.__chartHitboxes = [];
    const values = points.map((point) => point.value);
    const maxValue = Math.max(target || 0, ...values, 1);
    const hasData = values.some((value) => value > 0);
    const pad = { left: 42, right: 16, top: 34, bottom: 36 };
    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;

    drawChartLegend(ctx, width, [
      { label: options.label || 'Wartość', color: options.color || '#2f7d59' },
      ...(target ? [{ label: 'Cel', color: options.targetColor || '#c75a3b', dashed: true }] : [])
    ]);
    drawGrid(ctx, pad, chartW, chartH, maxValue);

    if (target) {
      const y = pad.top + chartH - (target / maxValue) * chartH;
      ctx.strokeStyle = options.targetColor || '#c75a3b';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + chartW, y);
      ctx.stroke();
      ctx.setLineDash([]);
      canvas.__chartHitboxes.push({
        type: 'rect',
        x: pad.left,
        y: y - 6,
        width: chartW,
        height: 12,
        label: 'Cel',
        value: `${Math.round(target)} ${options.unit || ''}`.trim(),
        color: options.targetColor || '#c75a3b'
      });
    }

    const gap = Math.max(4, Math.min(12, chartW / Math.max(points.length, 1) * 0.18));
    const barW = Math.max(4, (chartW - gap * (points.length - 1)) / Math.max(points.length, 1));

    points.forEach((point, index) => {
      const x = pad.left + index * (barW + gap);
      const h = (point.value / maxValue) * chartH;
      const y = pad.top + chartH - h;
      ctx.fillStyle = options.color || '#2f7d59';
      roundRect(ctx, x, y, barW, h, 4);
      ctx.fill();
      canvas.__chartHitboxes.push({
        type: 'rect',
        x,
        y,
        width: barW,
        height: Math.max(h, 3),
        label: point.label,
        value: `${Math.round(point.value)} ${options.unit || ''}`.trim(),
        color: options.color || '#2f7d59'
      });

      if (points.length <= 14 || index % Math.ceil(points.length / 8) === 0) {
        ctx.fillStyle = '#65706d';
        ctx.font = '11px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(point.label, x + barW / 2, height - 12);
      }
    });

    if (!hasData) drawEmptyLabel(ctx, width, height, options.emptyLabel || 'Brak danych');
  }

  function drawLineChart(canvas, points, options) {
    const ctx = setupCanvas(canvas);
    if (!ctx) return;
    const { width, height } = canvas.__chartSize;
    clearChart(ctx, width, height);
    canvas.__chartHitboxes = [];
    if (!points.length) {
      drawEmptyLabel(ctx, width, height, options.emptyLabel || 'Brak danych');
      return;
    }

    const values = points.map((point) => point.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const spread = Math.max(1, maxValue - minValue);
    const low = minValue - spread * 0.12;
    const high = maxValue + spread * 0.12;
    const pad = { left: 46, right: 18, top: 34, bottom: 36 };
    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;

    drawChartLegend(ctx, width, [
      { label: options.label || 'Wartość', color: options.color || '#1f7a8c' }
    ]);
    drawGrid(ctx, pad, chartW, chartH, high, low);

    if (points.length < 2) {
      drawEmptyLabel(ctx, width, height, options.emptyLabel || 'Brak danych');
      return;
    }

    const xFor = (index) => pad.left + (index / Math.max(1, points.length - 1)) * chartW;
    const yFor = (value) => pad.top + chartH - ((value - low) / (high - low)) * chartH;

    ctx.strokeStyle = options.color || '#1f7a8c';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    points.forEach((point, index) => {
      const x = xFor(index);
      const y = yFor(point.value);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    points.forEach((point, index) => {
      const x = xFor(index);
      const y = yFor(point.value);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = options.color || '#1f7a8c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      canvas.__chartHitboxes.push({
        type: 'circle',
        x,
        y,
        radius: 12,
        label: point.label,
        value: `${round1(point.value)} ${options.unit || ''}`.trim(),
        color: options.color || '#1f7a8c'
      });

      if (points.length <= 14 || index % Math.ceil(points.length / 8) === 0) {
        ctx.fillStyle = '#65706d';
        ctx.font = '11px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(point.label, x, height - 12);
      }
    });
  }

  function drawDonutChart(canvas, segments, emptyLabel) {
    const ctx = setupCanvas(canvas);
    if (!ctx) return;
    const { width, height } = canvas.__chartSize;
    clearChart(ctx, width, height);
    canvas.__chartHitboxes = [];
    const total = segments.reduce((sum, item) => sum + item.value, 0);
    if (total <= 0) {
      drawEmptyLabel(ctx, width, height, emptyLabel);
      return;
    }

    const radius = Math.min(width, height) * 0.28;
    const centerX = width * 0.34;
    const centerY = height * 0.5;
    let angle = -Math.PI / 2;

    segments.forEach((segment) => {
      const slice = (segment.value / total) * Math.PI * 2;
      const lineWidth = Math.max(18, radius * 0.34);
      ctx.beginPath();
      ctx.strokeStyle = segment.color;
      ctx.lineWidth = lineWidth;
      ctx.arc(centerX, centerY, radius, angle, angle + slice);
      ctx.stroke();
      canvas.__chartHitboxes.push({
        type: 'arc',
        cx: centerX,
        cy: centerY,
        innerRadius: radius - lineWidth / 2,
        outerRadius: radius + lineWidth / 2,
        startAngle: angle,
        endAngle: angle + slice,
        label: segment.label,
        value: `${Math.round(segment.value)} kcal (${Math.round((segment.value / total) * 100)}%)`,
        color: segment.color
      });
      angle += slice;
    });

    ctx.fillStyle = '#202625';
    ctx.font = '700 22px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(total)}`, centerX, centerY - 2);
    ctx.fillStyle = '#65706d';
    ctx.font = '12px system-ui';
    ctx.fillText('kcal z makro', centerX, centerY + 17);

    const legendX = width * 0.64;
    const legendY = centerY - 44;
    segments.forEach((segment, index) => {
      const y = legendY + index * 30;
      ctx.fillStyle = segment.color;
      roundRect(ctx, legendX, y - 10, 12, 12, 3);
      ctx.fill();
      ctx.fillStyle = '#202625';
      ctx.font = '13px system-ui';
      ctx.textAlign = 'left';
      const percent = Math.round((segment.value / total) * 100);
      ctx.fillText(`${segment.label} ${percent}%`, legendX + 20, y);
    });
  }

  function drawChartLegend(ctx, width, items) {
    const visibleItems = items.filter(Boolean);
    if (!visibleItems.length) return;

    let x = width - 16;
    const y = 15;
    ctx.font = '12px system-ui';
    ctx.textAlign = 'right';
    [...visibleItems].reverse().forEach((item) => {
      const labelWidth = ctx.measureText(item.label).width;
      ctx.fillStyle = '#202625';
      ctx.fillText(item.label, x, y);
      const swatchX = x - labelWidth - 18;
      ctx.strokeStyle = item.color;
      ctx.fillStyle = item.color;
      ctx.lineWidth = 2;
      if (item.dashed) {
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(swatchX, y - 4);
        ctx.lineTo(swatchX + 12, y - 4);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        roundRect(ctx, swatchX, y - 10, 12, 12, 3);
        ctx.fill();
      }
      x = swatchX - 14;
    });
  }

  function bindChartTooltip(canvas) {
    if (canvas.__tooltipBound) return;
    canvas.__tooltipBound = true;
    canvas.addEventListener('mousemove', (event) => {
      const hit = findChartHit(canvas, event);
      if (!hit) {
        hideChartTooltip();
        return;
      }
      showChartTooltip(event, hit);
    });
    canvas.addEventListener('mouseleave', hideChartTooltip);
  }

  function findChartHit(canvas, event) {
    const hitboxes = canvas.__chartHitboxes || [];
    if (!hitboxes.length) return null;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    for (let index = hitboxes.length - 1; index >= 0; index -= 1) {
      const hit = hitboxes[index];
      if (hit.type === 'rect' && x >= hit.x && x <= hit.x + hit.width && y >= hit.y && y <= hit.y + hit.height) return hit;
      if (hit.type === 'circle' && Math.hypot(x - hit.x, y - hit.y) <= hit.radius) return hit;
      if (hit.type === 'arc' && isPointInArc(x, y, hit)) return hit;
    }
    return null;
  }

  function isPointInArc(x, y, hit) {
    const dx = x - hit.cx;
    const dy = y - hit.cy;
    const radius = Math.hypot(dx, dy);
    if (radius < hit.innerRadius || radius > hit.outerRadius) return false;

    const angle = normalizeAngle(Math.atan2(dy, dx));
    const start = normalizeAngle(hit.startAngle);
    const end = normalizeAngle(hit.endAngle);
    return start <= end ? angle >= start && angle <= end : angle >= start || angle <= end;
  }

  function normalizeAngle(angle) {
    const full = Math.PI * 2;
    return ((angle % full) + full) % full;
  }

  function showChartTooltip(event, hit) {
    if (!chartTooltip) {
      chartTooltip = document.createElement('div');
      chartTooltip.className = 'chart-tooltip';
      document.body.appendChild(chartTooltip);
    }
    chartTooltip.innerHTML = `
      <strong>${escapeHTML(hit.label)}</strong>
      <span>${escapeHTML(hit.value)}</span>
    `;
    chartTooltip.style.borderColor = hit.color || '#dfe5dc';
    chartTooltip.hidden = false;

    const offset = 14;
    const rect = chartTooltip.getBoundingClientRect();
    const left = Math.min(window.innerWidth - rect.width - 8, event.clientX + offset);
    const top = Math.max(8, event.clientY - rect.height - offset);
    chartTooltip.style.left = `${left}px`;
    chartTooltip.style.top = `${top}px`;
  }

  function hideChartTooltip() {
    if (chartTooltip) chartTooltip.hidden = true;
  }

  function setupCanvas(canvas) {
    if (!canvas) return null;
    bindChartTooltip(canvas);
    const rect = canvas.getBoundingClientRect();
    const parentWidth = canvas.parentElement ? canvas.parentElement.clientWidth : 0;
    const width = Math.max(280, Math.floor(rect.width || parentWidth || canvas.width));
    const height = Math.max(180, Math.floor(rect.height || canvas.height || 260));
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.__chartSize = { width, height };
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return ctx;
  }

  function clearChart(ctx, width, height) {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }

  function drawGrid(ctx, pad, chartW, chartH, maxValue, minValue = 0) {
    ctx.strokeStyle = '#e6ece3';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#65706d';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'right';

    for (let i = 0; i <= 4; i += 1) {
      const y = pad.top + (chartH / 4) * i;
      const value = maxValue - ((maxValue - minValue) / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + chartW, y);
      ctx.stroke();
      ctx.fillText(Math.round(value), pad.left - 8, y + 4);
    }
  }

  function drawEmptyLabel(ctx, width, height, text) {
    ctx.fillStyle = '#65706d';
    ctx.font = '700 14px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(text, width / 2, height / 2);
  }

  function roundRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function storageKey(profileId) {
    return `${STORAGE_PREFIX}:${profileId}`;
  }

  function migrateLegacyState() {
    const targetKey = storageKey(DEFAULT_PROFILE_ID);
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);

    if (!localStorage.getItem(targetKey) && legacy) {
      localStorage.setItem(targetKey, legacy);
    }

    localStorage.setItem(CURRENT_PROFILE_KEY, DEFAULT_PROFILE_ID);
  }

  function normalizeState(rawState) {
    return {
      ...structuredCloneSafe(defaultState),
      ...(rawState || {}),
      settings: { ...defaultState.settings, ...((rawState && rawState.settings) || {}) },
      foods: Array.isArray(rawState && rawState.foods) && rawState.foods.length ? rawState.foods : structuredCloneSafe(seedFoods),
      entries: Array.isArray(rawState && rawState.entries) ? rawState.entries : [],
      weights: Array.isArray(rawState && rawState.weights) ? rawState.weights : [],
      water: Array.isArray(rawState && rawState.water) ? rawState.water : [],
      dailyCoach: rawState && rawState.dailyCoach && typeof rawState.dailyCoach === 'object' && !Array.isArray(rawState.dailyCoach)
        ? rawState.dailyCoach
        : {},
      deletedEntryIds: Array.isArray(rawState && rawState.deletedEntryIds) ? uniqueStrings(rawState.deletedEntryIds) : []
    };
  }

  function loadState(profileId = currentProfileId) {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey(profileId)) || 'null');
      return normalizeState(stored);
    } catch (error) {
      console.warn('Nie udało się wczytać zapisanych danych', error);
      return structuredCloneSafe(defaultState);
    }
  }

  function saveState() {
    ensureDailyCoach(currentDate);
    state = normalizeState(state);
    localStorage.setItem(storageKey(currentProfileId), JSON.stringify(state));
    scheduleRemoteSave();
  }

  function entriesForDate(date) {
    return state.entries.filter((entry) => entry.date === date);
  }

  function totalsForDate(date) {
    return sumEntries(entriesForDate(date));
  }

  function sumEntries(entries) {
    return entries.reduce((sum, entry) => ({
      calories: sum.calories + numberValue(entry.calories, 0),
      protein: sum.protein + numberValue(entry.protein, 0),
      carbs: sum.carbs + numberValue(entry.carbs, 0),
      fat: sum.fat + numberValue(entry.fat, 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }

  function foodSeed(name, servingGram, calories, protein, carbs, fat, fiber) {
    return {
      id: `seed-${normalize(name).replace(/[^a-z0-9]+/g, '-')}`,
      name,
      servingGram,
      servingUnit: 'g',
      calories,
      protein,
      carbs,
      fat,
      fiber,
      custom: false,
      favorite: false
    };
  }

  function nutritionForFood(food, amount, unit = 'g') {
    const servingAmount = foodServingAmount(food);
    const servingUnit = foodServingUnit(food);
    const normalizedAmount = unit === servingUnit
      ? numberValue(amount, 0)
      : (unit === 'g' && servingUnit !== 'g' ? numberValue(amount, 0) : numberValue(amount, 0) * servingAmount);
    const factor = normalizedAmount / Math.max(1, servingAmount);
    return {
      calories: numberValue(food.calories, 0) * factor,
      protein: numberValue(food.protein, 0) * factor,
      carbs: numberValue(food.carbs, 0) * factor,
      fat: numberValue(food.fat, 0) * factor
    };
  }

  function addImportedFoodIfMissing(food) {
    if (!food.name || findFoodByName(food.name)) return findFoodByName(food.name);
    const item = {
      id: uid(),
      name: food.name,
      servingGram: numberValue(food.servingGram, 100) || 100,
      servingUnit: food.servingUnit || 'g',
      calories: numberValue(food.calories, 0),
      protein: numberValue(food.protein, 0),
      carbs: numberValue(food.carbs, 0),
      fat: numberValue(food.fat, 0),
      fiber: numberValue(food.fiber, 0),
      custom: true,
      favorite: false
    };
    state.foods.push(item);
    return item;
  }

  function findFoodByName(name) {
    const normalized = normalize(name);
    return state.foods.find((food) => normalize(food.name) === normalized);
  }

  function upsertByDate(collection, date, value) {
    const index = collection.findIndex((item) => item.date === date);
    if (index >= 0) collection[index] = { ...collection[index], ...value, date };
    else collection.push(value);
  }

  function normalizeMeal(value) {
    const normalized = normalize(value);
    if (!normalized) return 'Snack';
    const match = MEALS.find((meal) => normalize(meal) === normalized);
    if (match) return match;
    if (['sniadanie', 'breakfast'].some((item) => normalized.includes(normalize(item)))) return 'Breakfast';
    if (['lunch', 'drugie sniadanie'].some((item) => normalized.includes(normalize(item)))) return 'Lunch';
    if (['dinner', 'obiad', 'kolacja'].some((item) => normalized.includes(normalize(item)))) return 'Dinner';
    if (['snack', 'przekaska', 'podwieczorek'].some((item) => normalized.includes(normalize(item)))) return 'Snack';
    return 'Snack';
  }

  function parseCSV(text) {
    const delimiter = detectCSVDelimiter(text);
    const rows = [];
    let row = [];
    let cell = '';
    let quoted = false;

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      const next = text[i + 1];

      if (char === '"' && quoted && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === delimiter && !quoted) {
        row.push(cell);
        cell = '';
      } else if ((char === '\n' || char === '\r') && !quoted) {
        if (char === '\r' && next === '\n') i += 1;
        row.push(cell);
        rows.push(row);
        row = [];
        cell = '';
      } else {
        cell += char;
      }
    }

    if (cell || row.length) {
      row.push(cell);
      rows.push(row);
    }
    return rows;
  }

  function detectCSVDelimiter(text) {
    const lines = text.split(/\r?\n/).slice(0, 10).filter(Boolean);
    const counts = lines.reduce((score, line) => {
      score.commas += countUnquoted(line, ',');
      score.semicolons += countUnquoted(line, ';');
      score.tabs += countUnquoted(line, '\t');
      return score;
    }, { commas: 0, semicolons: 0, tabs: 0 });

    if (counts.tabs > counts.semicolons && counts.tabs > counts.commas) return '\t';
    if (counts.semicolons > counts.commas) return ';';
    return ',';
  }

  function countUnquoted(line, character) {
    let count = 0;
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      const next = line[index + 1];
      if (char === '"' && quoted && next === '"') {
        index += 1;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === character && !quoted) {
        count += 1;
      }
    }
    return count;
  }

  function toCSV(rows) {
    return rows.map((row) => row.map((cell) => {
      const value = String(cell === null || cell === undefined ? '' : cell);
      return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
    }).join(',')).join('\n');
  }

  function parseDateValue(value) {
    if (value === null || value === undefined || value === '') return null;
    if (value instanceof Date && !Number.isNaN(value.valueOf())) return toISODate(value);

    const text = String(value).trim();
    if (!text) return null;

    const serial = Number(text);
    if (Number.isFinite(serial) && serial > 20000 && serial < 80000) {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      excelEpoch.setUTCDate(excelEpoch.getUTCDate() + serial);
      return excelEpoch.toISOString().slice(0, 10);
    }

    const dotMatch = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
    if (dotMatch) {
      const day = Number(dotMatch[1]);
      const month = Number(dotMatch[2]);
      const year = Number(dotMatch[3].length === 2 ? `20${dotMatch[3]}` : dotMatch[3]);
      return toISODate(new Date(year, month - 1, day));
    }

    const parsed = new Date(text);
    if (!Number.isNaN(parsed.valueOf())) return toISODate(parsed);
    return null;
  }

  function parseNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const cleaned = String(value)
      .trim()
      .replace(/\s/g, '')
      .replace(',', '.')
      .replace(/[^\d.-]/g, '');
    if (!cleaned) return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function numberValue(value, fallback) {
    const parsed = parseNumber(value);
    return parsed === null ? fallback : parsed;
  }

  function todayISO() {
    return toISODate(new Date());
  }

  function toISODate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function addDays(isoDate, delta) {
    const date = parseLocalDate(isoDate);
    date.setDate(date.getDate() + delta);
    return toISODate(date);
  }

  function parseLocalDate(isoDate) {
    const [year, month, day] = isoDate.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  function lastNDates(count, endDate) {
    const dates = [];
    for (let index = count - 1; index >= 0; index -= 1) {
      dates.push(addDays(endDate, -index));
    }
    return dates;
  }

  function formatDateLabel(isoDate) {
    return parseLocalDate(isoDate).toLocaleDateString('pl-PL', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  function shortDate(isoDate) {
    return parseLocalDate(isoDate).toLocaleDateString('pl-PL', {
      month: 'short',
      day: 'numeric'
    });
  }

  function shortDay(isoDate) {
    return parseLocalDate(isoDate).toLocaleDateString('pl-PL', { day: 'numeric' });
  }

  function shiftDate(delta) {
    currentDate = addDays(currentDate, delta);
    render();
  }

  function normalize(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function round1(value) {
    const rounded = Math.round((Number(value) || 0) * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : String(rounded);
  }

  function uid() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function escapeHTML(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 400);
  }

  function toast(message) {
    const toastNode = document.createElement('div');
    toastNode.className = 'toast';
    toastNode.textContent = message;
    $('toast-area').appendChild(toastNode);
    window.setTimeout(() => {
      toastNode.remove();
    }, 2600);
  }

  function refreshIcons() {
    if (window.lucide) window.lucide.createIcons();
  }

  function isVisible(element) {
    return Boolean(element && element.offsetParent !== null);
  }

  function structuredCloneSafe(value) {
    if (window.structuredClone) return window.structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (!/^https?:$/.test(window.location.protocol)) return;
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
