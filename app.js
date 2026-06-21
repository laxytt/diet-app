(function () {
  'use strict';

  const LEGACY_STORAGE_KEY = 'diet-studio:v1';
  const STORAGE_PREFIX = 'diet-studio:v2';
  const CURRENT_PROFILE_KEY = 'diet-studio:current-profile';
  const REMOTE_REVISION_PREFIX = 'diet-studio:remote-revision';
  const LAST_SYNC_PREFIX = 'diet-studio:last-sync';
  const BACKUP_PREFIX = 'diet-studio:backup';
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

  const seedRecipes = [
    recipeSeed(
      'Miska białkowa z kurczakiem',
      'Kurczak, kasza lub ryż, dużo warzyw, sos jogurtowy i odrobina oliwy.',
      520,
      42,
      48,
      16,
      20,
      ['Pierś z kurczaka', 'Kasza albo ryż', 'Warzywa', 'Jogurt naturalny', 'Oliwa']
    ),
    recipeSeed(
      'Skyr z owocami i chrupiącym dodatkiem',
      'Skyr, jagody lub maliny, płatki owsiane, orzechy i cynamon.',
      330,
      28,
      42,
      7,
      5,
      ['Skyr', 'Owoce jagodowe', 'Płatki owsiane', 'Orzechy', 'Cynamon']
    ),
    recipeSeed(
      'Łosoś z ziemniakami i sałatką',
      'Porcja ryby, gotowane ziemniaki, warzywa i lekki dressing cytrynowy.',
      610,
      36,
      54,
      27,
      25,
      ['Łosoś', 'Ziemniaki', 'Mix sałat', 'Cytryna', 'Jogurt lub oliwa']
    ),
    recipeSeed(
      'Zupa warzywna z soczewicą',
      'Duża objętość, dużo błonnika i wygodna porcja na dwa dni.',
      420,
      24,
      58,
      10,
      35,
      ['Soczewica', 'Marchew', 'Pomidory', 'Bulion', 'Przyprawy']
    )
  ];

  const defaultState = {
    version: 1,
    settings: {
      calories: 2200,
      protein: 160,
      carbs: 230,
      fat: 70,
      water: 2500,
      heightCm: 0,
      age: 35,
      sex: 'female',
      activityLevel: 'light',
      bodyGoal: ''
    },
    foods: seedFoods,
    recipes: seedRecipes,
    profile: {
      avatarDataUrl: '',
      avatarUpdatedAt: ''
    },
    entries: [],
    weights: [],
    water: [],
    activities: [],
    dailyCoach: {},
    deletedEntryIds: [],
    mealTemplates: [],
    plannedMeals: [],
    shoppingLists: [],
    weeklyReviews: {},
    habitGoals: {
      loggingDays: 5,
      waterDays: 5,
      weighDays: 3,
      proteinDays: 5,
      reminderMorning: false,
      reminderEvening: false
    },
    undoStack: [],
    backupMeta: null
  };

  let currentProfileId = loadCurrentProfileId();
  migrateLegacyState();
  let state = loadState(currentProfileId);
  let currentDate = todayISO();
  let manualMode = true;
  let importState = null;
  let aiDraft = null;
  let scannedProduct = null;
  let chartTimer = 0;
  let chartTooltip = null;
  let remoteSaveTimer = 0;
  let remoteSaveInFlight = null;
  let pendingRemoteSave = false;
  let remoteConflictCooldownUntil = 0;
  let remoteConflictCount = 0;
  let profileLoadPromise = null;
  let supabaseClient = null;
  let syncSession = null;
  let currentProfileAssignment = null;
  let isRemoteLoading = false;
  let remoteReady = false;
  let lastRemoteRevision = loadRemoteRevision(currentProfileId);
  let isAuthInitializing = true;
  let authMode = 'login';
  let passwordRecoveryMode = false;
  let sessionRefreshPromise = null;
  let reminderTimer = 0;
  let mobileAccordionPrepared = false;

  const $ = (id) => document.getElementById(id);

  init();

  async function init() {
    bindEvents();
    initSupabaseClient();
    setAuthMode('login');
    updateManualControls();
    setupMobileAccordions();
    $('selected-date').value = currentDate;
    $('xlsx-status').textContent = window.XLSX ? 'Parser Excela gotowy' : 'CSV gotowe';
    updateSyncUI();
    await refreshSupabaseSession();
    if (canSync()) await loadAssignedProfile();
    isAuthInitializing = false;
    updateSyncUI();
    render();
    scheduleLocalReminders();
    registerServiceWorker();
  }

  function bindEvents() {
    document.querySelectorAll('.tab-button[data-view], .mobile-more-menu [data-view]').forEach((button) => {
      button.addEventListener('click', () => {
        switchView(button.dataset.view);
        closeMobileMoreMenu();
      });
    });

    const mobileMoreButton = $('mobile-more-button');
    if (mobileMoreButton) {
      mobileMoreButton.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleMobileMoreMenu();
      });
    }
    document.addEventListener('click', (event) => {
      if (!event.target.closest('#mobile-more-menu') && !event.target.closest('#mobile-more-button')) closeMobileMoreMenu();
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
    $('gate-auth-form').addEventListener('submit', submitAuthForm);
    $('auth-login-tab').addEventListener('click', () => setAuthMode('login'));
    $('auth-register-tab').addEventListener('click', () => setAuthMode('register'));
    $('gate-google-button').addEventListener('click', loginWithGoogle);
    $('gate-forgot-button').addEventListener('click', () => setAuthMode('reset'));
    $('gate-auth-back-button').addEventListener('click', () => {
      passwordRecoveryMode = false;
      setAuthMode('login');
      updateSyncUI();
    });
    $('gate-resend-button').addEventListener('click', resendSignupEmail);
    $('quick-entry-form').addEventListener('submit', addQuickEntry);
    $('reset-entry-form').addEventListener('click', resetEntryFormWithUndo);
    $('undo-last-action').addEventListener('click', undoLastAction);
    $('recent-meals-list').addEventListener('click', handleQuickMealAction);
    $('meal-template-list').addEventListener('click', handleTemplateAction);
    $('planned-meal-form').addEventListener('submit', savePlannedMeal);
    $('reset-planned-meal').addEventListener('click', resetPlannedMealForm);
    $('planned-meal-title').addEventListener('change', hydratePlannedMealFromTitle);
    $('planned-meal-type').addEventListener('change', hydratePlannedMealFromTitle);
    $('planned-meals-list').addEventListener('click', handlePlannedMealAction);
    $('plan-tomorrow-button').addEventListener('click', planTomorrow);
    $('quick-add-meal').addEventListener('click', focusMealForm);
    $('dashboard-open-diary').addEventListener('click', () => switchView('diary'));
    $('diary-focus-add').addEventListener('click', focusMealForm);
    $('plan-snack-button').addEventListener('click', planSnack);
    $('dashboard-search').addEventListener('keydown', handleDashboardSearch);
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
      const repeatButton = event.target.closest('[data-repeat-entry]');
      const templateButton = event.target.closest('[data-template-from-entry]');
      const saveTemplateButton = event.target.closest('[data-save-template]');

      if (repeatButton) {
        const entry = state.entries.find((item) => item.id === repeatButton.dataset.repeatEntry);
        if (!entry) return;
        state.entries.push(duplicateEntryToDate(entry, currentDate));
        saveState();
        render();
        toast('Wpis dodany ponownie.');
        return;
      }

      if (templateButton) {
        const entry = state.entries.find((item) => item.id === templateButton.dataset.templateFromEntry);
        if (!entry) return;
        saveSingleEntryTemplate(entry);
        return;
      }

      if (saveTemplateButton) {
        saveMealTemplate(saveTemplateButton.dataset.saveTemplate);
        return;
      }

      if (!deleteButton) return;
      const deletedEntry = state.entries.find((entry) => entry.id === deleteButton.dataset.deleteEntry);
      if (deletedEntry) pushUndo({
        type: 'restore-entries',
        entries: [structuredCloneSafe(deletedEntry)],
        createdAt: new Date().toISOString()
      });
      markEntryDeleted(deleteButton.dataset.deleteEntry);
      state.entries = state.entries.filter((entry) => entry.id !== deleteButton.dataset.deleteEntry);
      saveState();
      render();
      toast('Wpis usunięty.');
    });

    $('copy-yesterday').addEventListener('click', copyYesterday);
    $('body-form').addEventListener('submit', saveBodyLog);
    $('activity-form').addEventListener('submit', saveActivity);
    $('activity-list').addEventListener('click', handleActivityAction);

    $('food-search').addEventListener('input', renderFoods);
    $('barcode-lookup').addEventListener('click', lookupBarcodeFromInput);
    $('barcode-file').addEventListener('change', scanBarcodeFile);
    $('barcode-result').addEventListener('click', handleBarcodeResultAction);
    $('food-form').addEventListener('submit', saveFood);
    $('reset-food-form').addEventListener('click', resetFoodForm);
    $('food-list').addEventListener('click', handleFoodAction);
    $('recipe-form').addEventListener('submit', saveRecipe);
    $('reset-recipe-form').addEventListener('click', resetRecipeForm);
    $('recipe-list').addEventListener('click', handleRecipeAction);
    $('recipe-premium-options').addEventListener('click', handlePaidRecipeAction);
    $('shopping-list-items').addEventListener('click', handleShoppingListAction);
    ['recipe-search', 'recipe-type-filter', 'recipe-max-calories', 'recipe-min-protein', 'recipe-max-time'].forEach((id) => {
      $(id).addEventListener('input', renderRecipes);
      $(id).addEventListener('change', renderRecipes);
    });
    $('clear-recipe-filters').addEventListener('click', clearRecipeFilters);
    $('clear-shopping-list').addEventListener('click', clearShoppingList);

    $('trend-range').addEventListener('change', () => {
      renderCharts();
      renderTrendSummary();
    });
    $('settings-form').addEventListener('submit', saveSettings);
    $('habit-goals-form').addEventListener('submit', saveHabitGoals);
    $('logout-button').addEventListener('click', logoutUser);
    $('avatar-input').addEventListener('change', handleAvatarUpload);
    $('remove-avatar').addEventListener('click', removeAvatar);
    $('export-json').addEventListener('click', exportJSON);
    $('export-csv').addEventListener('click', exportCSV);
    $('reset-app').addEventListener('click', resetApp);

    $('import-file').addEventListener('change', handleImportFile);
    $('import-button').addEventListener('click', commitImport);
    $('clear-import').addEventListener('click', clearImport);

    window.addEventListener('resize', () => {
      setupMobileAccordions();
      clearTimeout(chartTimer);
      chartTimer = window.setTimeout(renderCharts, 120);
    });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) refreshSessionAfterFocus();
    });
  }

  function render() {
    $('selected-date').value = currentDate;
    renderProfileBadge();
    renderSummary();
    renderProfileVisuals();
    renderDailyCoach();
    renderDashboardInsights();
    renderBodyForecast();
    renderHabitGoalProgress();
    renderDashboardMeals();
    renderDatalist();
    renderPlanOptions();
    renderDiary();
    renderQuickTools();
    renderPlannedMeals();
    renderBodyInputs();
    renderActivities();
    renderFoods();
    renderBarcodeResult();
    renderRecipes();
    renderShoppingList();
    renderSettings();
    renderStorageNote();
    renderSyncMeta();
    renderAIResult();
    renderTrendSummary();
    renderWeeklyReview();
    renderForecastPanel();
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
    const moreViews = ['recipes', 'trends', 'import', 'settings'];
    document.querySelectorAll('.tab-button[data-view]').forEach((button) => {
      button.classList.toggle('active', button.dataset.view === view);
    });
    const moreButton = $('mobile-more-button');
    if (moreButton) moreButton.classList.toggle('active', moreViews.includes(view));
    document.querySelectorAll('.view').forEach((panel) => {
      panel.classList.toggle('active', panel.id === `view-${view}`);
    });
    window.requestAnimationFrame(() => {
      renderCharts();
      refreshIcons();
    });
  }

  function toggleMobileMoreMenu() {
    const menu = $('mobile-more-menu');
    const button = $('mobile-more-button');
    if (!menu || !button) return;
    const willOpen = menu.hidden;
    menu.hidden = !willOpen;
    button.setAttribute('aria-expanded', String(willOpen));
  }

  function closeMobileMoreMenu() {
    const menu = $('mobile-more-menu');
    const button = $('mobile-more-button');
    if (!menu || !button) return;
    menu.hidden = true;
    button.setAttribute('aria-expanded', 'false');
  }

  function setupMobileAccordions() {
    const compact = window.matchMedia('(max-width: 699px)').matches;
    document.querySelectorAll('.mobile-accordion').forEach((details) => {
      if (!compact) {
        details.open = true;
        return;
      }
      if (!mobileAccordionPrepared) details.open = false;
    });
    mobileAccordionPrepared = compact;
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
    if (visible) {
      nameNode.textContent = profileName();
      renderProfileVisuals();
    }
  }

  function withTimeout(promise, milliseconds, message) {
    let timeoutId = 0;
    const timeout = new Promise((_, reject) => {
      timeoutId = window.setTimeout(() => reject(new Error(message)), milliseconds);
    });
    return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timeoutId));
  }

  function delay(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
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
      if (_event === 'PASSWORD_RECOVERY') {
        passwordRecoveryMode = true;
        setAuthMode('update-password');
      }
      if (isAuthInitializing) {
        updateSyncUI();
        renderProfileBadge();
        return;
      }
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
    await restoreSessionFromUrl();
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) {
      toast('Nie udało się odczytać sesji Supabase.');
      return;
    }
    syncSession = data.session;
    updateSyncUI();
  }

  async function restoreSessionFromUrl() {
    if (!window.location.hash || !window.location.hash.includes('access_token=')) return;
    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const type = params.get('type');
    if (!accessToken || !refreshToken) return;

    const { data, error } = await supabaseClient.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });
    if (error) {
      toast(`Nie udało się przywrócić sesji: ${error.message}`);
      return;
    }
    syncSession = data.session;
    if (type === 'recovery') {
      passwordRecoveryMode = true;
      setAuthMode('update-password');
    }
    window.history.replaceState(null, document.title, authRedirectUrl());
  }

  async function refreshSessionAfterFocus() {
    if (!supabaseClient || isAuthInitializing || sessionRefreshPromise) return;
    sessionRefreshPromise = (async () => {
      const { data, error } = await supabaseClient.auth.getSession();
      if (!error) syncSession = data.session;
      if (canSync() && !currentProfileAssignment) await loadAssignedProfile();
      updateSyncUI();
      renderProfileBadge();
    })().finally(() => {
      sessionRefreshPromise = null;
    });
    await sessionRefreshPromise;
  }

  function canSync() {
    return Boolean(supabaseClient && syncSession && syncSession.user);
  }

  function updateSyncUI() {
    const syncStatus = $('sync-status');
    const logoutButton = $('logout-button');
    const todaySummary = $('today-summary');
    if (!syncStatus) return;
    const appShell = document.querySelector('.app-shell');
    const authGate = $('auth-gate');
    renderProfileBadge();

    syncStatus.classList.remove('online', 'error');
    if (logoutButton) logoutButton.hidden = !syncSession;
    const locked = Boolean(supabaseClient && (isAuthInitializing || passwordRecoveryMode || !syncSession || !currentProfileAssignment));
    if (appShell) appShell.classList.toggle('locked', locked);
    if (appShell) appShell.classList.toggle('auth-mode', locked);
    if (appShell) appShell.classList.toggle('auth-loading', Boolean(supabaseClient && isAuthInitializing));
    if (authGate) authGate.hidden = !locked;
    if (locked && todaySummary) todaySummary.textContent = 'Zaloguj się, żeby zobaczyć dane profilu';
    if (!locked) window.requestAnimationFrame(renderCharts);

    if (!supabaseClient) {
      syncStatus.textContent = 'Lokalnie';
      return;
    }

    if (isAuthInitializing) {
      syncStatus.textContent = 'Sprawdzam sesję';
      return;
    }

    if (!syncSession) {
      syncStatus.textContent = 'Lokalnie';
      return;
    }

    if (!currentProfileAssignment) {
      syncStatus.textContent = isRemoteLoading ? 'Synchronizacja' : 'Brak profilu';
      syncStatus.classList.add('error');
      return;
    }

    syncStatus.textContent = isRemoteLoading ? 'Synchronizacja' : 'Online';
    syncStatus.classList.add('online');
  }

  function submitAuthForm(event) {
    if (authMode === 'reset') return requestPasswordReset(event);
    if (authMode === 'update-password') return updatePasswordFromRecovery(event);
    if (authMode === 'register') return signUpUser(event);
    return loginUser(event);
  }

  async function loginUser(event) {
    event.preventDefault();
    if (!supabaseClient) {
      toast('Najpierw skonfiguruj Supabase w config.js.');
      return;
    }

    const source = 'gate';
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
      if (isConfirmationError(error)) {
        setAuthMode('register');
        toast('Ten email nie jest jeszcze potwierdzony. Możesz wysłać mail potwierdzający ponownie.');
        setAuthBusy(source, false);
        return;
      }
      toast(`Logowanie nieudane: ${error.message}`);
      setAuthBusy(source, false);
      return;
    }
    syncSession = data.session;
    passwordRecoveryMode = false;
    updateSyncUI();
    await loadAssignedProfile();
    setAuthBusy(source, false);
    if (!currentProfileAssignment) return;
    setAuthMode('login');
    toast('Zalogowano i włączono synchronizację.');
  }

  async function loginWithGoogle(event) {
    if (event) event.preventDefault();
    if (!supabaseClient) {
      toast('Najpierw skonfiguruj Supabase w config.js.');
      return;
    }

    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: authRedirectUrl(),
        queryParams: {
          prompt: 'select_account'
        }
      }
    });

    if (error) {
      toast(`Google Auth: ${error.message}`);
    }
  }

  async function signUpUser(event) {
    if (event) event.preventDefault();
    if (!supabaseClient) {
      toast('Najpierw skonfiguruj Supabase w config.js.');
      return;
    }

    const source = 'gate';
    const credentials = readAuthCredentials(source);
    const email = credentials.email;
    const password = credentials.password;
    const username = sanitizeProfileName(credentials.username, email);
    if (!email || !password || !username) {
      toast('Podaj email, hasło i nazwę użytkownika.');
      return;
    }
    if (password.length < 6) {
      toast('Hasło musi mieć co najmniej 6 znaków.');
      return;
    }

    const signupProfile = readSignupProfile();
    const metadata = compactObject({
      username,
      age: signupProfile.age,
      height_cm: signupProfile.heightCm,
      weight_kg: signupProfile.weightKg,
      body_goal: signupProfile.bodyGoal
    });

    setAuthBusy(source, true, 'Tworzę konto...', 'signup');
    const { data, error } = await withTimeout(
      supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: authRedirectUrl()
        }
      }),
      12000,
      'Rejestracja trwa za długo. Spróbuj ponownie.'
    ).catch((timeoutError) => ({ data: null, error: timeoutError }));
    if (error) {
      if (isAlreadyRegisteredError(error)) {
        setAuthMode('register');
        toast('To konto może już istnieć. Jeśli mail nie przyszedł, wyślij potwierdzenie ponownie.');
        setAuthBusy(source, false);
        return;
      }
      toast(`Nie udało się utworzyć konta: ${error.message}`);
      setAuthBusy(source, false);
      return;
    }
    syncSession = data.session;
    if (data.session) {
      await loadAssignedProfile();
      applySignupProfileToState(signupProfile);
    }
    setAuthBusy(source, false);
    updateSyncUI();
    if (data.session && !currentProfileAssignment) {
      toast('Konto utworzone, ale ten email nie ma przypisanego profilu diety.');
      return;
    }
    toast(data.session ? 'Konto utworzone i zalogowane.' : 'Konto utworzone. Sprawdź skrzynkę, spam i oferty. Możesz też wysłać potwierdzenie ponownie.');
  }

  async function requestPasswordReset(event) {
    if (event) event.preventDefault();
    if (!supabaseClient) {
      toast('Najpierw skonfiguruj Supabase w config.js.');
      return;
    }

    const source = 'gate';
    const { email } = readAuthCredentials(source);
    if (!email) {
      toast('Wpisz email, na który wysłać link resetu hasła.');
      return;
    }

    setAuthBusy(source, true, 'Wysyłam link...', 'reset');
    const { error } = await withTimeout(
      supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: authRedirectUrl()
      }),
      12000,
      'Wysyłanie linku resetu trwa za długo. Spróbuj ponownie.'
    ).catch((timeoutError) => ({ error: timeoutError }));
    setAuthBusy(source, false);

    if (error) {
      toast(`Nie udało się wysłać resetu hasła: ${error.message}`);
      return;
    }
    toast('Wysłaliśmy link resetu hasła. Sprawdź skrzynkę, spam i oferty.');
  }

  async function updatePasswordFromRecovery(event) {
    if (event) event.preventDefault();
    if (!supabaseClient) {
      toast('Najpierw skonfiguruj Supabase w config.js.');
      return;
    }
    if (!syncSession) {
      toast('Link resetu wygasł albo nie został poprawnie otwarty. Wyślij reset hasła ponownie.');
      setAuthMode('reset');
      return;
    }

    const password = $('gate-new-password').value;
    const confirm = $('gate-new-password-confirm').value;
    if (!password || !confirm) {
      toast('Wpisz i powtórz nowe hasło.');
      return;
    }
    if (password.length < 6) {
      toast('Nowe hasło musi mieć co najmniej 6 znaków.');
      return;
    }
    if (password !== confirm) {
      toast('Hasła nie są takie same.');
      return;
    }

    const source = 'gate';
    setAuthBusy(source, true, 'Zapisuję hasło...', 'update-password');
    const { error } = await withTimeout(
      supabaseClient.auth.updateUser({ password }),
      12000,
      'Zmiana hasła trwa za długo. Spróbuj ponownie.'
    ).catch((timeoutError) => ({ error: timeoutError }));
    if (error) {
      setAuthBusy(source, false);
      toast(`Nie udało się zmienić hasła: ${error.message}`);
      return;
    }

    passwordRecoveryMode = false;
    $('gate-new-password').value = '';
    $('gate-new-password-confirm').value = '';
    if (canSync()) await loadAssignedProfile();
    setAuthBusy(source, false);
    setAuthMode('login');
    updateSyncUI();
    toast(currentProfileAssignment ? 'Hasło zmienione. Jesteś zalogowana.' : 'Hasło zmienione, ale ten email nie ma przypisanego profilu diety.');
  }

  async function resendSignupEmail(event) {
    if (event) event.preventDefault();
    if (!supabaseClient) {
      toast('Najpierw skonfiguruj Supabase w config.js.');
      return;
    }

    const source = 'gate';
    const { email } = readAuthCredentials(source);
    if (!email) {
      toast('Wpisz email, na który wysłać potwierdzenie.');
      return;
    }

    setAuthBusy(source, true, 'Wysyłam...', 'resend');
    const { error } = await withTimeout(
      supabaseClient.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: authRedirectUrl() }
      }),
      12000,
      'Wysyłanie maila trwa za długo. Spróbuj ponownie.'
    ).catch((timeoutError) => ({ error: timeoutError }));
    setAuthBusy(source, false);

    if (error) {
      toast(`Nie udało się wysłać potwierdzenia: ${error.message}`);
      return;
    }
    toast('Mail potwierdzający wysłany ponownie. Sprawdź też spam i oferty.');
  }

  function setAuthMode(mode) {
    authMode = ['register', 'reset', 'update-password'].includes(mode) ? mode : 'login';
    const isRegister = authMode === 'register';
    const isReset = authMode === 'reset';
    const isUpdatePassword = authMode === 'update-password';
    const isLogin = authMode === 'login';
    const prefix = 'gate-';
    const usernameInput = $(`${prefix}auth-username`);
    const passwordInput = $(`${prefix}auth-password`);
    const passwordField = $('gate-auth-password-field');
    const modeSwitch = document.querySelector('.auth-mode-switch');
    const loginTab = $('auth-login-tab');
    const registerTab = $('auth-register-tab');
    const title = $('auth-title');
    const subtitle = $('auth-subtitle');
    const note = $('gate-auth-note');
    const primaryButton = $('gate-login-button');
    const googleButton = $('gate-google-button');
    const forgotButton = $('gate-forgot-button');
    const backButton = $('gate-auth-back-button');
    const resendButton = $('gate-resend-button');
    document.querySelectorAll('.signup-field').forEach((element) => {
      element.hidden = !isRegister;
    });
    document.querySelectorAll('.recovery-field').forEach((element) => {
      element.hidden = !isUpdatePassword;
    });
    if (modeSwitch) modeSwitch.hidden = isReset || isUpdatePassword;
    if (usernameInput) {
      usernameInput.required = isRegister;
      usernameInput.setAttribute('autocomplete', 'name');
    }
    if (passwordField) passwordField.hidden = isReset || isUpdatePassword;
    if (passwordInput) {
      passwordInput.required = isLogin || isRegister;
      passwordInput.setAttribute('autocomplete', isRegister ? 'new-password' : 'current-password');
    }
    if (loginTab) {
      loginTab.classList.toggle('is-active', isLogin);
      loginTab.setAttribute('aria-selected', String(isLogin));
      loginTab.hidden = isUpdatePassword;
    }
    if (registerTab) {
      registerTab.classList.toggle('is-active', isRegister);
      registerTab.setAttribute('aria-selected', String(isRegister));
      registerTab.hidden = isUpdatePassword;
    }
    if (title) {
      title.textContent = isUpdatePassword
        ? 'Ustaw nowe hasło'
        : (isReset ? 'Reset hasła' : (isRegister ? 'Utwórz konto' : 'Zaloguj się'));
    }
    if (subtitle) {
      subtitle.textContent = isRegister
        ? 'Załóż konto i uzupełnij opcjonalnie podstawowe dane.'
        : (isReset
          ? 'Wyślemy link do ustawienia nowego hasła.'
          : (isUpdatePassword ? 'Wpisz nowe hasło do konta.' : 'Wróć do swojego profilu i synchronizacji.'));
    }
    if (note) {
      note.textContent = isRegister
        ? 'Po rejestracji wyślemy mail potwierdzający. Sprawdź też spam i oferty.'
        : (isReset
          ? 'Po kliknięciu linku z maila wrócisz tutaj, żeby ustawić nowe hasło.'
          : (isUpdatePassword ? 'Po zapisaniu hasła aplikacja wróci do profilu.' : 'Nie masz konta? Przełącz na rejestrację powyżej.'));
    }
    if (primaryButton) {
      primaryButton.innerHTML = isUpdatePassword
        ? '<i data-lucide="save"></i> Zapisz nowe hasło'
        : (isReset
          ? '<i data-lucide="mail"></i> Wyślij link resetu'
          : (isRegister ? '<i data-lucide="user-plus"></i> Zarejestruj' : '<i data-lucide="log-in"></i> Zaloguj'));
    }
    if (googleButton) {
      googleButton.hidden = isReset || isUpdatePassword;
      googleButton.innerHTML = isRegister
        ? '<span class="google-mark" aria-hidden="true">G</span> Zarejestruj przez Google'
        : '<span class="google-mark" aria-hidden="true">G</span> Zaloguj przez Google';
    }
    if (forgotButton) forgotButton.hidden = !isLogin;
    if (backButton) backButton.hidden = isLogin || isUpdatePassword;
    if (resendButton) {
      resendButton.hidden = !isRegister;
    }
    refreshIcons();
  }

  function readAuthCredentials(source) {
    const prefix = 'gate-';
    const usernameInput = $(`${prefix}auth-username`);
    return {
      email: $(`${prefix}auth-email`).value.trim(),
      password: $(`${prefix}auth-password`).value,
      username: usernameInput ? usernameInput.value.trim() : ''
    };
  }

  function readSignupProfile() {
    return {
      age: numberValue($('gate-auth-age').value, 0) || null,
      heightCm: numberValue($('gate-auth-height').value, 0) || null,
      weightKg: numberValue($('gate-auth-weight').value, 0) || null,
      bodyGoal: $('gate-auth-goal').value || ''
    };
  }

  function compactObject(object) {
    return Object.entries(object).reduce((result, [key, value]) => {
      if (value !== null && value !== undefined && value !== '') result[key] = value;
      return result;
    }, {});
  }

  function isConfirmationError(error) {
    return /not confirmed|confirm|potwierdz/i.test(String(error && error.message ? error.message : ''));
  }

  function isAlreadyRegisteredError(error) {
    return /already|registered|exists|istnieje/i.test(String(error && error.message ? error.message : ''));
  }

  function applySignupProfileToState(profile) {
    if (!profile || !currentProfileAssignment) return;
    let changed = false;
    if (profile.heightCm) {
      state.settings.heightCm = profile.heightCm;
      changed = true;
    }
    if (profile.age) {
      state.settings.age = profile.age;
      changed = true;
    }
    if (profile.bodyGoal) {
      state.settings.bodyGoal = profile.bodyGoal;
      changed = true;
    }
    if (profile.weightKg) {
      upsertByDate(state.weights, todayISO(), { id: uid(), date: todayISO(), weight: profile.weightKg });
      changed = true;
    }
    if (changed) saveState();
  }

  function setAuthBusy(source, busy, label = 'Loguję...', action = 'login') {
    const loginButton = $('gate-login-button');
    const googleButton = $('gate-google-button');
    const forgotButton = $('gate-forgot-button');
    const backButton = $('gate-auth-back-button');
    const resendButton = $('gate-resend-button');
    const loginTab = $('auth-login-tab');
    const registerTab = $('auth-register-tab');
    const defaultPrimary = authMode === 'update-password'
      ? '<i data-lucide="save"></i> Zapisz nowe hasło'
      : (authMode === 'reset'
        ? '<i data-lucide="mail"></i> Wyślij link resetu'
        : (authMode === 'register' ? '<i data-lucide="user-plus"></i> Zarejestruj' : '<i data-lucide="log-in"></i> Zaloguj'));
    if (loginButton) {
      loginButton.disabled = busy;
      loginButton.innerHTML = busy && action !== 'resend'
        ? `<i data-lucide="loader-circle"></i> ${label}`
        : defaultPrimary;
    }
    if (resendButton) {
      resendButton.disabled = busy;
      resendButton.innerHTML = busy && action === 'resend'
        ? `<i data-lucide="loader-circle"></i> ${label}`
        : '<i data-lucide="mail-check"></i> Wyślij ponownie mail potwierdzający';
    }
    if (googleButton) googleButton.disabled = busy;
    if (forgotButton) forgotButton.disabled = busy;
    if (backButton) backButton.disabled = busy;
    if (loginTab) loginTab.disabled = busy;
    if (registerTab) registerTab.disabled = busy;
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
    passwordRecoveryMode = false;
    setAuthMode('login');
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
    if (Date.now() < remoteConflictCooldownUntil) return;
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
    if (Date.now() < remoteConflictCooldownUntil) return;

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
      markRemoteSaveHealthy();
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

    if (!updated) return handleRemoteSaveConflict(profileId, merged, attempt);

    setRemoteRevision(profile.id, numberValue(updated.revision, nextRevision));
    markRemoteSaveHealthy();
    syncLocalStateAfterRemoteSave(profile.id, snapshot, merged);
  }

  async function handleRemoteSaveConflict(profileId, mergedSnapshot, attempt) {
    const profile = profileById(profileId);
    const { data, error } = await supabaseClient
      .from(REMOTE_TABLE)
      .select('data, revision')
      .eq('user_id', syncSession.user.id)
      .eq('profile_id', profile.id)
      .maybeSingle();

    if (error) {
      toast(`Nie udało się odświeżyć konfliktu synchronizacji: ${error.message}`);
      return;
    }

    const freshRemote = normalizeState(data && data.data ? data.data : {});
    const nextSnapshot = mergeStates(freshRemote, mergedSnapshot, { preferSettings: 'incoming' });
    if (data) setRemoteRevision(profile.id, numberValue(data.revision, lastRemoteRevision));

    if (profileId === currentProfileId) {
      state = mergeStates(state, nextSnapshot, { preferSettings: 'incoming' });
      localStorage.setItem(storageKey(profileId), JSON.stringify(state));
      render();
    }

    if (attempt < 3) {
      await delay(220 + attempt * 180);
      return saveRemoteProfileInternal(profileId, nextSnapshot, attempt + 1);
    }

    pauseRemoteConflictSaves();
    pendingRemoteSave = false;
    updateSyncUI();
  }

  function markRemoteSaveHealthy() {
    remoteConflictCount = 0;
    remoteConflictCooldownUntil = 0;
  }

  function pauseRemoteConflictSaves() {
    remoteConflictCount = Math.min(remoteConflictCount + 1, 5);
    const cooldown = Math.min(60000, 8000 * remoteConflictCount);
    remoteConflictCooldownUntil = Date.now() + cooldown;
    window.setTimeout(() => {
      if (Date.now() >= remoteConflictCooldownUntil && canSync() && remoteReady) {
        scheduleRemoteSave();
      }
    }, cooldown + 250);
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
      recipes: mergeRecipes(base.recipes, incoming.recipes),
      profile: mergeProfile(base.profile, incoming.profile),
      entries: mergeEntries(base.entries, incoming.entries, deletedEntryIds),
      weights: mergeByDate(base.weights, incoming.weights),
      water: mergeByDate(base.water, incoming.water),
      activities: mergeById(base.activities, incoming.activities),
      dailyCoach: { ...base.dailyCoach, ...incoming.dailyCoach },
      deletedEntryIds,
      mealTemplates: mergeById(base.mealTemplates, incoming.mealTemplates),
      plannedMeals: mergeById(base.plannedMeals, incoming.plannedMeals),
      shoppingLists: mergeById(base.shoppingLists, incoming.shoppingLists),
      weeklyReviews: { ...base.weeklyReviews, ...incoming.weeklyReviews },
      habitGoals: options.preferSettings === 'base'
        ? { ...defaultState.habitGoals, ...base.habitGoals }
        : { ...defaultState.habitGoals, ...incoming.habitGoals },
      undoStack: trimUndoStack([...(base.undoStack || []), ...(incoming.undoStack || [])]),
      backupMeta: latestByCreatedAt(base.backupMeta, incoming.backupMeta)
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

  function mergeRecipes(baseRecipes, incomingRecipes) {
    const byKey = new Map();
    [...baseRecipes, ...incomingRecipes].forEach((recipe) => {
      if (!recipe || !recipe.name) return;
      const key = recipe.id || normalize(recipe.name);
      byKey.set(key, { ...(byKey.get(key) || {}), ...recipe });
    });
    return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  function mergeById(baseItems, incomingItems) {
    const byId = new Map();
    [...baseItems, ...incomingItems].forEach((item) => {
      if (!item || !item.id) return;
      byId.set(item.id, { ...(byId.get(item.id) || {}), ...item });
    });
    return [...byId.values()].sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')));
  }

  function latestByCreatedAt(baseItem, incomingItem) {
    if (!baseItem) return incomingItem || null;
    if (!incomingItem) return baseItem || null;
    const baseTime = Date.parse(baseItem.createdAt || '') || 0;
    const incomingTime = Date.parse(incomingItem.createdAt || '') || 0;
    return incomingTime >= baseTime ? incomingItem : baseItem;
  }

  function mergeProfile(baseProfile = {}, incomingProfile = {}) {
    const baseTime = Date.parse(baseProfile.avatarUpdatedAt || '') || 0;
    const incomingTime = Date.parse(incomingProfile.avatarUpdatedAt || '') || 0;
    return {
      ...defaultState.profile,
      ...(incomingTime >= baseTime ? baseProfile : incomingProfile),
      ...(incomingTime >= baseTime ? incomingProfile : baseProfile)
    };
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

  function lastSyncKey(profileId) {
    return `${LAST_SYNC_PREFIX}:${profileId}`;
  }

  function backupKey(profileId) {
    return `${BACKUP_PREFIX}:${profileId}`;
  }

  function loadRemoteRevision(profileId) {
    return numberValue(localStorage.getItem(remoteRevisionKey(profileId)), 0);
  }

  function setRemoteRevision(profileId, revision) {
    lastRemoteRevision = numberValue(revision, 0);
    localStorage.setItem(remoteRevisionKey(profileId), String(lastRemoteRevision));
    localStorage.setItem(lastSyncKey(profileId), new Date().toISOString());
  }

  function renderSummary() {
    const totals = totalsForDate(currentDate);
    const targets = state.settings;
    const water = state.water.find((item) => item.date === currentDate);
    const waterMl = numberValue(water && water.ml, 0);
    const caloriesPercent = targets.calories > 0 ? Math.round((totals.calories / targets.calories) * 100) : 0;
    $('today-summary').textContent = `${formatDateLabel(currentDate)} · zapisano ${Math.round(totals.calories)} kcal`;
    $('dashboard-title').textContent = `Dzisiaj, ${profileName()}`;
    $('dashboard-subtitle').textContent = `${Math.max(0, Math.round(targets.calories - totals.calories))} kcal do celu · ${round1(totals.protein)} g białka · ${formatLiters(waterMl)} wody`;

    updateMetric('calories', totals.calories, targets.calories, 'kcal');
    updateMetric('protein', totals.protein, targets.protein, 'g');
    updateMetric('carbs', totals.carbs, targets.carbs, 'g');
    updateMetric('fat', totals.fat, targets.fat, 'g');
    updateMetric('water', waterMl / 1000, targets.water / 1000, 'L');
    $('calorie-ring').style.setProperty('--progress', `${Math.min(360, Math.max(0, caloriesPercent * 3.6))}deg`);
    $('calorie-ring-value').textContent = `${Math.max(0, Math.min(999, caloriesPercent))}%`;
    renderWaterDrops(waterMl, targets.water);
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
    const valueNode = $(`${key}-value`);
    const meterNode = $(`${key}-meter`);
    if (valueNode) valueNode.textContent = `${roundedValue}${unit === 'kcal' ? '' : unit} / ${roundedTarget}${unit === 'kcal' ? '' : unit}`;
    if (meterNode) meterNode.style.width = `${percent}%`;

    const detailId = key === 'calories' ? 'calories-remaining' : `${key}-detail`;
    const prefix = remaining >= 0
      ? `pozostało ${remaining}${unit === 'kcal' ? '' : unit}`
      : `${Math.abs(remaining)}${unit === 'kcal' ? '' : unit} ponad cel`;
    const detailNode = $(detailId);
    if (detailNode) detailNode.textContent = prefix;
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
      const meta = mealMeta(meal);
      const mealEntries = entries.filter((entry) => entry.meal === meal);
      const totals = sumEntries(mealEntries);
      const rows = mealEntries.length
        ? mealEntries.map(renderDiaryRow).join('')
        : '<div class="empty-state meal-empty">Brak wpisów</div>';
      return `
        <section class="meal-section meal-${meal.toLowerCase()}">
          <div class="meal-title">
            <span class="meal-title-main">
              <i data-lucide="${meta.icon}"></i>
              <span>
                <strong>${mealLabel(meal)}</strong>
                <em>${meta.time}</em>
              </span>
            </span>
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

  function renderDiary() {
    const entries = entriesForDate(currentDate);
    const html = MEALS.map((meal) => {
      const meta = mealMeta(meal);
      const mealEntries = entries.filter((entry) => entry.meal === meal);
      const totals = sumEntries(mealEntries);
      const rows = mealEntries.length
        ? mealEntries.map(renderDiaryRow).join('')
        : '<div class="empty-state meal-empty">Brak wpisow</div>';
      return `
        <section class="meal-section meal-${meal.toLowerCase()}">
          <div class="meal-title">
            <span class="meal-title-main">
              <i data-lucide="${meta.icon}"></i>
              <span>
                <strong>${mealLabel(meal)}</strong>
                <em>${meta.time}</em>
              </span>
            </span>
            <span class="meal-title-actions">
              <small>${Math.round(totals.calories)} kcal · ${round1(totals.protein)}b / ${round1(totals.carbs)}w / ${round1(totals.fat)}t</small>
              ${mealEntries.length ? `
                <button class="icon-button subtle" type="button" data-save-template="${meal}" aria-label="Zapisz ${mealLabel(meal)} jako szablon" title="Zapisz jako szablon">
                  <i data-lucide="bookmark-plus"></i>
                </button>
              ` : ''}
            </span>
          </div>
          ${rows}
        </section>
      `;
    }).join('');

    $('meal-groups').innerHTML = html;
  }

  function renderDiaryRow(entry) {
    const macroWarning = isMacroIncomplete(entry)
      ? '<small class="macro-warning">Makro niepelne</small>'
      : '';
    return `
      <div class="entry-row">
        <div>
          <strong title="${escapeHTML(entry.foodName)}">${escapeHTML(entry.foodName)}</strong>
          <small>${formatEntryAmount(entry)}</small>
          ${macroWarning}
        </div>
        <span class="macro-number">${Math.round(entry.calories)}</span>
        <span class="macro-number">${round1(entry.protein)}b</span>
        <span class="macro-number hide-sm">${round1(entry.carbs)}w</span>
        <span class="macro-number hide-sm">${round1(entry.fat)}t</span>
        <div class="row-actions">
          <button class="icon-button" type="button" data-repeat-entry="${entry.id}" aria-label="Dodaj ponownie ${escapeHTML(entry.foodName)}" title="Dodaj ponownie">
            <i data-lucide="repeat-2"></i>
          </button>
          <button class="icon-button" type="button" data-template-from-entry="${entry.id}" aria-label="Zapisz ${escapeHTML(entry.foodName)} jako szablon" title="Zapisz jako szablon">
            <i data-lucide="bookmark-plus"></i>
          </button>
          <button class="icon-button" type="button" data-delete-entry="${entry.id}" aria-label="Usun ${escapeHTML(entry.foodName)}" title="Usun">
            <i data-lucide="x"></i>
          </button>
        </div>
      </div>
    `;
  }

  function mealMeta(meal) {
    return {
      Breakfast: { icon: 'sunrise', time: '8:00' },
      Lunch: { icon: 'sun', time: '12:30' },
      Dinner: { icon: 'moon', time: '19:00' },
      Snack: { icon: 'apple', time: '15:30' }
    }[meal] || { icon: 'utensils', time: '' };
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

  function saveActivity(event) {
    event.preventDefault();
    const type = $('activity-type').value || 'other';
    const minutes = numberValue($('activity-minutes').value, 0);
    const intensity = $('activity-intensity').value || 'moderate';
    const manualCalories = numberValue($('activity-calories').value, null);
    if (minutes <= 0 && manualCalories === null) {
      toast('Podaj czas aktywnosci albo spalone kcal.');
      return;
    }

    const calories = manualCalories !== null
      ? manualCalories
      : estimateActivityCalories(type, intensity, minutes);
    state.activities.push({
      id: uid(),
      date: currentDate,
      type,
      intensity,
      minutes,
      calories: Math.max(0, Math.round(calories)),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    $('activity-minutes').value = '';
    $('activity-calories').value = '';
    saveState();
    render();
    toast('Aktywnosc zapisana.');
  }

  function handleActivityAction(event) {
    const remove = event.target.closest('[data-delete-activity]');
    if (!remove) return;
    state.activities = state.activities.filter((activity) => activity.id !== remove.dataset.deleteActivity);
    saveState();
    render();
    toast('Aktywnosc usunieta.');
  }

  function renderActivities() {
    const list = $('activity-list');
    if (!list) return;
    const activities = activitiesForDate(currentDate);
    const total = sumActivities(activities);
    $('activity-today-total').textContent = `${Math.round(total)} kcal`;
    list.innerHTML = activities.length
      ? activities.map((activity) => `
        <article class="activity-item">
          <div>
            <strong>${activityLabel(activity.type)}</strong>
            <span>${activity.minutes ? `${Math.round(activity.minutes)} min · ` : ''}${intensityLabel(activity.intensity)} · ${Math.round(activity.calories)} kcal</span>
          </div>
          <button class="icon-button" type="button" data-delete-activity="${activity.id}" aria-label="Usun aktywnosc" title="Usun">
            <i data-lucide="x"></i>
          </button>
        </article>
      `).join('')
      : '<div class="empty-state">Brak zapisanej aktywnosci dzisiaj.</div>';
  }

  function activitiesForDate(date) {
    return (state.activities || []).filter((activity) => activity.date === date);
  }

  function sumActivities(activities) {
    return (activities || []).reduce((sum, activity) => sum + numberValue(activity.calories, 0), 0);
  }

  function estimateActivityCalories(type, intensity, minutes) {
    const weight = numberValue((latestWeightBefore(currentDate) || {}).weight, 70);
    const met = activityMet(type, intensity);
    return (met * 3.5 * weight / 200) * numberValue(minutes, 0);
  }

  function activityMet(type, intensity) {
    const base = {
      walk: 3.5,
      run: 8.3,
      cycling: 7,
      gym: 5,
      swim: 6,
      other: 4
    }[type] || 4;
    const factor = {
      easy: 0.78,
      moderate: 1,
      hard: 1.28
    }[intensity] || 1;
    return base * factor;
  }

  function activityLabel(type) {
    return {
      walk: 'Spacer',
      run: 'Bieg',
      cycling: 'Rower',
      gym: 'Silownia',
      swim: 'Plywanie',
      other: 'Inne'
    }[type] || 'Aktywnosc';
  }

  function intensityLabel(intensity) {
    return {
      easy: 'lekka',
      moderate: 'srednia',
      hard: 'mocna'
    }[intensity] || 'srednia';
  }

  function bodyStats() {
    const weight = latestWeightBefore(currentDate);
    const weightKg = numberValue(weight && weight.weight, 0);
    const heightCm = numberValue(state.settings.heightCm, 0);
    const age = numberValue(state.settings.age, 35);
    const sex = state.settings.sex === 'male' ? 'male' : 'female';
    const bmi = weightKg > 0 && heightCm > 0 ? weightKg / ((heightCm / 100) ** 2) : 0;
    const bmr = weightKg > 0 && heightCm > 0
      ? (10 * weightKg) + (6.25 * heightCm) - (5 * age) + (sex === 'male' ? 5 : -161)
      : 0;
    const multiplier = activityMultiplier(state.settings.activityLevel);
    const tdee = bmr > 0 ? bmr * multiplier : 0;
    const forecast = forecastForDays(30, tdee);
    return { weight, weightKg, heightCm, age, sex, bmi, bmr, tdee, forecast };
  }

  function activityMultiplier(level) {
    return {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    }[level] || 1.375;
  }

  function forecastForDays(days, tdee) {
    const range = Math.min(14, days);
    const dates = lastNDates(range, currentDate);
    const logged = dates
      .map((date) => ({ date, calories: totalsForDate(date).calories, activity: sumActivities(activitiesForDate(date)) }))
      .filter((day) => day.calories > 0);
    const avgCalories = logged.length
      ? logged.reduce((sum, day) => sum + day.calories, 0) / logged.length
      : 0;
    const avgActivity = logged.length
      ? logged.reduce((sum, day) => sum + day.activity, 0) / logged.length
      : 0;
    const dailyDeficit = tdee > 0 && avgCalories > 0 ? (tdee + avgActivity) - avgCalories : 0;
    const totalDeficit = dailyDeficit * days;
    const weightChangeKg = totalDeficit / 7700;
    return {
      days,
      sampleDays: logged.length,
      avgCalories,
      avgActivity,
      dailyDeficit,
      totalDeficit,
      weightChangeKg
    };
  }

  function bmiLabel(bmi) {
    if (!bmi) return 'Brak danych';
    if (bmi < 18.5) return 'ponizej normy';
    if (bmi < 25) return 'w normie';
    if (bmi < 30) return 'nadwaga';
    return 'otylosc';
  }

  function renderBodyForecast() {
    const stats = bodyStats();
    const bmiValue = $('dashboard-bmi-value');
    const bmiNote = $('dashboard-bmi-note');
    const forecastNote = $('dashboard-forecast-note');
    if (!bmiValue || !bmiNote || !forecastNote) return;

    if (!stats.bmi) {
      bmiValue.textContent = '-';
      bmiNote.textContent = 'Dodaj wzrost i wage, zeby policzyc BMI.';
    } else {
      bmiValue.textContent = `${round1(stats.bmi)} BMI`;
      bmiNote.textContent = `${bmiLabel(stats.bmi)} · TDEE ok. ${Math.round(stats.tdee)} kcal/dzien`;
    }

    if (!stats.forecast.sampleDays || !stats.tdee) {
      forecastNote.textContent = 'Prognoza pojawi sie po wadze, wzroscie i wpisach kalorii.';
      return;
    }

    const sign = stats.forecast.totalDeficit >= 0 ? 'deficyt' : 'nadwyzka';
    forecastNote.textContent = `30 dni: ${sign} ok. ${Math.abs(Math.round(stats.forecast.totalDeficit))} kcal, czyli ok. ${Math.abs(round1(stats.forecast.weightChangeKg))} kg.`;
  }

  function renderForecastPanel() {
    const grid = $('forecast-grid');
    const note = $('forecast-note');
    if (!grid || !note) return;
    const stats = bodyStats();
    const forecast = stats.forecast;
    grid.innerHTML = [
      { label: 'BMI', value: stats.bmi ? round1(stats.bmi) : '-', detail: bmiLabel(stats.bmi) },
      { label: 'BMR', value: stats.bmr ? `${Math.round(stats.bmr)} kcal` : '-', detail: 'Spoczynkowo' },
      { label: 'TDEE', value: stats.tdee ? `${Math.round(stats.tdee)} kcal` : '-', detail: 'Z bazowa aktywnoscia' },
      { label: 'Srednia dieta', value: forecast.avgCalories ? `${Math.round(forecast.avgCalories)} kcal` : '-', detail: `${forecast.sampleDays}/14 dni z wpisami` },
      { label: 'Srednia aktywnosc', value: forecast.avgActivity ? `${Math.round(forecast.avgActivity)} kcal` : '0 kcal', detail: 'Z wpisow aktywnosci' },
      { label: 'Prognoza 30 dni', value: forecast.totalDeficit ? `${Math.abs(Math.round(forecast.totalDeficit))} kcal` : '-', detail: forecast.totalDeficit >= 0 ? 'Szacowany deficyt' : 'Szacowana nadwyzka' }
    ].map((card) => `
      <article class="weekly-review-card">
        <span>${card.label}</span>
        <strong>${card.value}</strong>
        <small>${card.detail}</small>
      </article>
    `).join('');

    if (!stats.tdee || !forecast.sampleDays) {
      note.textContent = 'To szacunek. Dodaj wzrost, wage i kilka dni wpisow, zeby prognoza miala sens.';
      return;
    }

    const direction = forecast.totalDeficit >= 0 ? 'redukcji' : 'przyrostu';
    note.textContent = `Przy obecnym tempie wychodzi ok. ${Math.abs(round1(forecast.weightChangeKg))} kg ${direction} w 30 dni. Traktuj to jako prognoze, nie obietnice.`;
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

  function addQuickEntry(event) {
    event.preventDefault();
    const name = $('quick-entry-name').value.trim();
    const calories = numberValue($('quick-entry-calories').value, 0);
    if (!name || calories <= 0) {
      toast('Podaj nazwe i kalorie szybkiego wpisu.');
      return;
    }

    state.entries.push({
      id: uid(),
      date: currentDate,
      meal: $('entry-meal').value || 'Snack',
      foodId: null,
      foodName: name,
      amount: 1,
      unit: 'porcja',
      grams: 1,
      calories,
      protein: 0,
      carbs: 0,
      fat: 0,
      macroIncomplete: true,
      source: 'quick',
      createdAt: new Date().toISOString()
    });

    $('quick-entry-name').value = '';
    $('quick-entry-calories').value = '';
    saveState();
    render();
    toast('Szybki wpis dodany.');
  }

  function entryFormSnapshot() {
    return {
      meal: $('entry-meal').value,
      food: $('entry-food').value,
      amount: $('entry-grams').value,
      unit: $('entry-unit').value,
      calories: $('entry-calories').value,
      protein: $('entry-protein').value,
      carbs: $('entry-carbs').value,
      fat: $('entry-fat').value,
      quickName: $('quick-entry-name').value,
      quickCalories: $('quick-entry-calories').value,
      aiText: $('ai-meal-text').value
    };
  }

  function restoreEntryFormSnapshot(snapshot) {
    if (!snapshot) return;
    $('entry-meal').value = snapshot.meal || 'Snack';
    $('entry-food').value = snapshot.food || '';
    $('entry-grams').value = snapshot.amount || '100';
    $('entry-unit').value = snapshot.unit || 'g';
    $('entry-calories').value = snapshot.calories || '';
    $('entry-protein').value = snapshot.protein || '';
    $('entry-carbs').value = snapshot.carbs || '';
    $('entry-fat').value = snapshot.fat || '';
    $('quick-entry-name').value = snapshot.quickName || '';
    $('quick-entry-calories').value = snapshot.quickCalories || '';
    $('ai-meal-text').value = snapshot.aiText || '';
    updateEntryPreview();
  }

  function resetEntryFormWithUndo() {
    pushUndo({
      type: 'restore-entry-form',
      values: entryFormSnapshot(),
      createdAt: new Date().toISOString()
    });
    $('entry-food').value = '';
    $('entry-grams').value = '100';
    $('entry-unit').value = 'g';
    $('entry-calories').value = '';
    $('entry-protein').value = '';
    $('entry-carbs').value = '';
    $('entry-fat').value = '';
    $('quick-entry-name').value = '';
    $('quick-entry-calories').value = '';
    $('ai-meal-text').value = '';
    aiDraft = null;
    updateEntryPreview();
    renderAIResult();
    toast('Formularz wyczyszczony.');
  }

  function pushUndo(action) {
    state.undoStack = trimUndoStack([...(state.undoStack || []), action]);
    localStorage.setItem(storageKey(currentProfileId), JSON.stringify(normalizeState(state)));
  }

  function undoLastAction() {
    const stack = Array.isArray(state.undoStack) ? [...state.undoStack] : [];
    const action = stack.pop();
    if (!action) {
      toast('Nie ma czego cofnac.');
      return;
    }
    state.undoStack = stack;

    if (action.type === 'restore-entries') {
      const entries = Array.isArray(action.entries) ? action.entries : [];
      entries.forEach((entry) => {
        if (!entry || !entry.id) return;
        state.deletedEntryIds = (state.deletedEntryIds || []).filter((id) => id !== entry.id);
        if (!state.entries.some((item) => item.id === entry.id)) state.entries.push(entry);
      });
      saveState();
      render();
      toast('Cofnieto usuniecie wpisu.');
      return;
    }

    if (action.type === 'restore-entry-form') {
      restoreEntryFormSnapshot(action.values);
      localStorage.setItem(storageKey(currentProfileId), JSON.stringify(normalizeState(state)));
      toast('Przywrocono formularz.');
      return;
    }

    saveState();
    render();
  }

  function duplicateEntryToDate(entry, date = currentDate, meal = entry.meal) {
    return {
      ...structuredCloneSafe(entry),
      id: uid(),
      date,
      meal,
      copiedFrom: entry.id,
      createdAt: new Date().toISOString()
    };
  }

  function isMacroIncomplete(entry) {
    return Boolean(entry && entry.macroIncomplete)
      || (numberValue(entry.calories, 0) > 0
        && numberValue(entry.protein, 0) === 0
        && numberValue(entry.carbs, 0) === 0
        && numberValue(entry.fat, 0) === 0);
  }

  function renderQuickTools() {
    renderRecentMeals();
    renderMealTemplates();
  }

  function renderRecentMeals() {
    const container = $('recent-meals-list');
    if (!container) return;
    const since = addDays(currentDate, -7);
    const recent = [];
    const seen = new Set();
    [...state.entries]
      .filter((entry) => entry.date >= since && entry.date <= currentDate)
      .sort((a, b) => String(b.createdAt || b.date || '').localeCompare(String(a.createdAt || a.date || '')))
      .forEach((entry) => {
        const key = `${normalize(entry.foodName)}:${Math.round(numberValue(entry.calories, 0))}`;
        if (seen.has(key)) return;
        seen.add(key);
        recent.push(entry);
      });

    container.innerHTML = recent.length
      ? recent.slice(0, 8).map((entry) => `
        <article class="quick-list-item">
          <div>
            <strong title="${escapeHTML(entry.foodName)}">${escapeHTML(entry.foodName)}</strong>
            <span>${shortDate(entry.date)} · ${mealLabel(entry.meal)} · ${Math.round(entry.calories)} kcal</span>
          </div>
          <div class="row-actions">
            <button class="icon-button" type="button" data-quick-repeat="${entry.id}" title="Dodaj ponownie" aria-label="Dodaj ponownie ${escapeHTML(entry.foodName)}">
              <i data-lucide="plus"></i>
            </button>
            <button class="icon-button" type="button" data-quick-template="${entry.id}" title="Zapisz jako szablon" aria-label="Zapisz jako szablon ${escapeHTML(entry.foodName)}">
              <i data-lucide="bookmark-plus"></i>
            </button>
          </div>
        </article>
      `).join('')
      : '<div class="empty-state">Brak ostatnich posilkow z 7 dni.</div>';
  }

  function renderMealTemplates() {
    const container = $('meal-template-list');
    if (!container) return;
    const templates = [...(state.mealTemplates || [])]
      .sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')));

    container.innerHTML = templates.length
      ? templates.slice(0, 8).map((template) => `
        <article class="quick-list-item">
          <div>
            <strong title="${escapeHTML(template.name)}">${escapeHTML(template.name)}</strong>
            <span>${template.entries.length} wpisy · ${Math.round(template.totalCalories || 0)} kcal</span>
          </div>
          <div class="row-actions">
            <button class="icon-button" type="button" data-template-add="${template.id}" title="Dodaj zestaw" aria-label="Dodaj zestaw ${escapeHTML(template.name)}">
              <i data-lucide="plus"></i>
            </button>
            <button class="icon-button" type="button" data-template-delete="${template.id}" title="Usun szablon" aria-label="Usun szablon ${escapeHTML(template.name)}">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </article>
      `).join('')
      : '<div class="empty-state">Zapisz posilek jako szablon, zeby dodawac go jednym kliknieciem.</div>';
  }

  function handleQuickMealAction(event) {
    const repeat = event.target.closest('[data-quick-repeat]');
    const template = event.target.closest('[data-quick-template]');
    if (repeat) {
      const entry = state.entries.find((item) => item.id === repeat.dataset.quickRepeat);
      if (!entry) return;
      state.entries.push(duplicateEntryToDate(entry, currentDate));
      saveState();
      render();
      toast('Dodano z ostatnich posilkow.');
      return;
    }
    if (template) {
      const entry = state.entries.find((item) => item.id === template.dataset.quickTemplate);
      if (!entry) return;
      saveSingleEntryTemplate(entry);
    }
  }

  function handleTemplateAction(event) {
    const add = event.target.closest('[data-template-add]');
    const remove = event.target.closest('[data-template-delete]');
    if (add) {
      const template = (state.mealTemplates || []).find((item) => item.id === add.dataset.templateAdd);
      if (!template) return;
      template.entries.forEach((entry) => {
        state.entries.push(duplicateEntryToDate(entry, currentDate, entry.meal || template.meal || 'Snack'));
      });
      saveState();
      render();
      toast('Szablon dodany do dziennika.');
      return;
    }
    if (remove) {
      state.mealTemplates = (state.mealTemplates || []).filter((item) => item.id !== remove.dataset.templateDelete);
      saveState();
      render();
      toast('Szablon usuniety.');
    }
  }

  function saveSingleEntryTemplate(entry) {
    const name = entry.foodName || 'Szablon posilku';
    saveTemplate(name, [entry], entry.meal || 'Snack');
  }

  function saveMealTemplate(meal) {
    const entries = entriesForDate(currentDate).filter((entry) => entry.meal === meal);
    if (!entries.length) {
      toast('Ten posilek nie ma wpisow do zapisania.');
      return;
    }
    saveTemplate(`${mealLabel(meal)} ${shortDate(currentDate)}`, entries, meal);
  }

  function saveTemplate(name, entries, meal) {
    const normalizedName = normalize(name);
    const now = new Date().toISOString();
    const templateEntries = entries.map((entry) => ({
      ...structuredCloneSafe(entry),
      templateSourceId: entry.id
    }));
    const totalCalories = sumEntries(templateEntries).calories;
    const existing = (state.mealTemplates || []).find((item) => normalize(item.name) === normalizedName);
    const template = {
      id: existing ? existing.id : uid(),
      name,
      meal,
      entries: templateEntries,
      totalCalories,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now
    };
    if (existing) Object.assign(existing, template);
    else state.mealTemplates.push(template);
    saveState();
    render();
    toast('Szablon zapisany.');
  }

  function renderPlanOptions() {
    const target = $('plan-options');
    if (!target) return;
    const foodOptions = state.foods.map((food) => `<option value="${escapeHTML(food.name)}">Produkt</option>`);
    const recipeOptions = state.recipes.map((recipe) => `<option value="${escapeHTML(recipe.name)}">Przepis</option>`);
    target.innerHTML = foodOptions.concat(recipeOptions).join('');
  }

  function resetPlannedMealForm() {
    $('planned-meal-id').value = '';
    $('planned-meal-date').value = currentDate;
    $('planned-meal-meal').value = 'Snack';
    $('planned-meal-type').value = 'note';
    $('planned-meal-title').value = '';
    $('planned-meal-calories').value = '';
    $('planned-meal-protein').value = '';
    $('planned-meal-note').value = '';
  }

  function hydratePlannedMealFromTitle() {
    const type = $('planned-meal-type').value;
    const title = $('planned-meal-title').value.trim();
    if (!title) return;
    const recipe = type === 'recipe' ? state.recipes.find((item) => normalize(item.name) === normalize(title)) : null;
    const food = type === 'food' ? findFoodByName(title) : null;
    const source = recipe || food;
    if (!source) return;
    $('planned-meal-calories').value = Math.round(numberValue(source.calories, 0));
    $('planned-meal-protein').value = round1(numberValue(source.protein, 0));
  }

  function planTomorrow() {
    switchView('plan');
    resetPlannedMealForm();
    $('planned-meal-date').value = addDays(currentDate, 1);
    $('planned-meal-title').focus();
  }

  function savePlannedMeal(event) {
    event.preventDefault();
    const title = $('planned-meal-title').value.trim();
    if (!title) {
      toast('Dodaj nazwe planowanego posilku.');
      return;
    }

    const id = $('planned-meal-id').value || uid();
    const type = $('planned-meal-type').value || 'note';
    const date = $('planned-meal-date').value || currentDate;
    const existingIndex = state.plannedMeals.findIndex((item) => item.id === id);
    const source = plannedMealSource(type, title);
    const now = new Date().toISOString();
    const plannedMeal = {
      id,
      date,
      meal: $('planned-meal-meal').value || 'Snack',
      type,
      title,
      calories: numberValue($('planned-meal-calories').value, source ? source.calories : 0),
      protein: numberValue($('planned-meal-protein').value, source ? source.protein : 0),
      note: $('planned-meal-note').value.trim(),
      sourceId: source ? source.id : null,
      createdAt: existingIndex >= 0 ? state.plannedMeals[existingIndex].createdAt : now,
      updatedAt: now
    };

    if (existingIndex >= 0) state.plannedMeals[existingIndex] = plannedMeal;
    else state.plannedMeals.push(plannedMeal);
    saveState();
    resetPlannedMealForm();
    render();
    toast('Plan zapisany.');
  }

  function plannedMealSource(type, title) {
    if (type === 'recipe') return state.recipes.find((item) => normalize(item.name) === normalize(title)) || null;
    if (type === 'food') return findFoodByName(title) || null;
    return null;
  }

  function renderPlannedMeals() {
    const container = $('planned-meals-list');
    if (!container) return;
    const from = addDays(currentDate, -1);
    const to = addDays(currentDate, 7);
    const plans = [...(state.plannedMeals || [])]
      .filter((item) => item.date >= from && item.date <= to)
      .sort((a, b) => a.date.localeCompare(b.date) || MEALS.indexOf(a.meal) - MEALS.indexOf(b.meal));

    $('planned-meals-count').textContent = String(plans.length);
    container.innerHTML = plans.length
      ? plans.map((plan) => `
        <article class="planned-meal-card ${plan.date < currentDate ? 'is-past' : ''}">
          <div class="planned-meal-icon"><i data-lucide="${planTypeIcon(plan.type)}"></i></div>
          <div>
            <strong title="${escapeHTML(plan.title)}">${escapeHTML(plan.title)}</strong>
            <span>${formatDateLabel(plan.date)} · ${mealLabel(plan.meal)} · ${Math.round(numberValue(plan.calories, 0)) || '-'} kcal</span>
            ${plan.note ? `<p>${escapeHTML(plan.note)}</p>` : ''}
          </div>
          <div class="row-actions">
            <button class="icon-button" type="button" data-plan-log="${plan.id}" title="Przenies do dziennika" aria-label="Przenies ${escapeHTML(plan.title)} do dziennika">
              <i data-lucide="check"></i>
            </button>
            <button class="icon-button" type="button" data-plan-edit="${plan.id}" title="Edytuj" aria-label="Edytuj ${escapeHTML(plan.title)}">
              <i data-lucide="pencil"></i>
            </button>
            <button class="icon-button" type="button" data-plan-delete="${plan.id}" title="Usun" aria-label="Usun ${escapeHTML(plan.title)}">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </article>
      `).join('')
      : '<div class="empty-state">Brak zaplanowanych posilkow. Dodaj pierwszy po lewej.</div>';
  }

  function planTypeIcon(type) {
    if (type === 'recipe') return 'chef-hat';
    if (type === 'food') return 'database';
    return 'sticky-note';
  }

  function handlePlannedMealAction(event) {
    const log = event.target.closest('[data-plan-log]');
    const edit = event.target.closest('[data-plan-edit]');
    const remove = event.target.closest('[data-plan-delete]');

    if (log) {
      const plan = state.plannedMeals.find((item) => item.id === log.dataset.planLog);
      if (!plan) return;
      addPlannedMealToDiary(plan);
      return;
    }

    if (edit) {
      const plan = state.plannedMeals.find((item) => item.id === edit.dataset.planEdit);
      if (!plan) return;
      $('planned-meal-id').value = plan.id;
      $('planned-meal-date').value = plan.date || currentDate;
      $('planned-meal-meal').value = plan.meal || 'Snack';
      $('planned-meal-type').value = plan.type || 'note';
      $('planned-meal-title').value = plan.title || '';
      $('planned-meal-calories').value = numberValue(plan.calories, 0) || '';
      $('planned-meal-protein').value = numberValue(plan.protein, 0) || '';
      $('planned-meal-note').value = plan.note || '';
      $('planned-meal-title').focus();
      return;
    }

    if (remove) {
      state.plannedMeals = state.plannedMeals.filter((item) => item.id !== remove.dataset.planDelete);
      saveState();
      render();
      toast('Plan usuniety.');
    }
  }

  function addPlannedMealToDiary(plan) {
    const source = plannedMealSource(plan.type, plan.title);
    const food = plan.type === 'recipe' && source ? addRecipeAsFood(source) : (plan.type === 'food' ? source : null);
    state.entries.push({
      id: uid(),
      date: plan.date || currentDate,
      meal: plan.meal || 'Snack',
      foodId: food ? food.id : null,
      foodName: plan.title,
      amount: 1,
      unit: plan.type === 'note' ? 'porcja' : foodServingUnit(food || {}),
      grams: 1,
      calories: numberValue(plan.calories, source ? source.calories : 0),
      protein: numberValue(plan.protein, source ? source.protein : 0),
      carbs: numberValue(source && source.carbs, 0),
      fat: numberValue(source && source.fat, 0),
      macroIncomplete: !source && numberValue(plan.calories, 0) > 0,
      source: 'plan',
      plannedMealId: plan.id,
      createdAt: new Date().toISOString()
    });
    state.plannedMeals = state.plannedMeals.filter((item) => item.id !== plan.id);
    currentDate = plan.date || currentDate;
    saveState();
    render();
    switchView('diary');
    toast('Plan przeniesiony do dziennika.');
  }

  function recipeToPlannedMeal(recipe, date = currentDate) {
    state.plannedMeals.push({
      id: uid(),
      date,
      meal: 'Dinner',
      type: 'recipe',
      title: recipe.name,
      calories: numberValue(recipe.calories, 0),
      protein: numberValue(recipe.protein, 0),
      note: recipe.description || '',
      sourceId: recipe.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    saveState();
    render();
    toast('Przepis dodany do planu.');
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
          <div class="mobile-action-menu">
            <button class="icon-button" type="button" data-food-menu aria-label="Więcej akcji dla ${escapeHTML(food.name)}" title="Więcej">
              <i data-lucide="ellipsis"></i>
            </button>
            <div class="mobile-action-menu-items">
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

  async function lookupBarcodeFromInput() {
    const code = normalizeBarcode($('barcode-input').value);
    if (!code) {
      toast('Podaj kod kreskowy.');
      return;
    }
    await lookupBarcode(code);
  }

  async function scanBarcodeFile(event) {
    const file = event.target.files && event.target.files[0];
    event.target.value = '';
    if (!file) return;
    if (!('BarcodeDetector' in window)) {
      toast('Ta przegladarka nie wspiera skanowania kodow ze zdjecia. Wpisz kod recznie.');
      return;
    }

    try {
      const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] });
      const bitmap = await createImageBitmap(file);
      const codes = await detector.detect(bitmap);
      if (bitmap.close) bitmap.close();
      const code = normalizeBarcode(codes && codes[0] && codes[0].rawValue);
      if (!code) {
        toast('Nie udalo sie odczytac kodu z tego zdjecia.');
        return;
      }
      $('barcode-input').value = code;
      await lookupBarcode(code);
    } catch (error) {
      console.error(error);
      toast(`Skanowanie kodu nie powiodlo sie: ${error.message}`);
    }
  }

  async function lookupBarcode(code) {
    const button = $('barcode-lookup');
    if (button) button.disabled = true;
    scannedProduct = null;
    renderBarcodeResult('loading');
    try {
      const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=code,product_name,brands,quantity,serving_size,nutriments,image_front_small_url`;
      const response = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Open Food Facts zwrocil ${response.status}.`);
      const data = await response.json();
      if (!data || data.status !== 1 || !data.product) {
        renderBarcodeResult('empty');
        toast('Nie znaleziono produktu dla tego kodu.');
        return;
      }
      scannedProduct = productFromOpenFoodFacts(data.product, code);
      renderBarcodeResult();
    } catch (error) {
      console.error(error);
      renderBarcodeResult('error', error.message);
      toast('Nie udalo sie pobrac produktu.');
    } finally {
      if (button) button.disabled = false;
    }
  }

  function productFromOpenFoodFacts(product, code) {
    const nutriments = product.nutriments || {};
    const name = String(product.product_name || product.brands || `Produkt ${code}`).trim();
    return {
      code,
      name,
      brand: String(product.brands || '').trim(),
      quantity: String(product.quantity || product.serving_size || '').trim(),
      image: product.image_front_small_url || '',
      servingGram: 100,
      servingUnit: 'g',
      calories: numberValue(nutriments['energy-kcal_100g'], numberValue(nutriments.energy_kcal_100g, 0)),
      protein: numberValue(nutriments.proteins_100g, 0),
      carbs: numberValue(nutriments.carbohydrates_100g, 0),
      fat: numberValue(nutriments.fat_100g, 0),
      fiber: numberValue(nutriments.fiber_100g, 0)
    };
  }

  function renderBarcodeResult(status = '', message = '') {
    const target = $('barcode-result');
    if (!target) return;
    if (status === 'loading') {
      target.innerHTML = '<div class="empty-state">Szukam produktu...</div>';
      return;
    }
    if (status === 'empty') {
      target.innerHTML = '<div class="empty-state">Nie znaleziono produktu. Mozesz dodac go recznie jako wlasny produkt.</div>';
      return;
    }
    if (status === 'error') {
      target.innerHTML = `<div class="empty-state">Blad pobierania: ${escapeHTML(message || 'sprobuj ponownie')}</div>`;
      return;
    }
    if (!scannedProduct) {
      target.innerHTML = '';
      return;
    }
    target.innerHTML = `
      <article class="barcode-card">
        ${scannedProduct.image ? `<img src="${escapeHTML(scannedProduct.image)}" alt="">` : '<div class="barcode-placeholder"><i data-lucide="package-search"></i></div>'}
        <div>
          <strong>${escapeHTML(scannedProduct.name)}</strong>
          <span>${escapeHTML([scannedProduct.brand, scannedProduct.quantity, scannedProduct.code].filter(Boolean).join(' · '))}</span>
          <div class="recipe-meta">
            <span>${Math.round(scannedProduct.calories)} kcal / 100 g</span>
            <span>${round1(scannedProduct.protein)} g bialka</span>
            <span>${round1(scannedProduct.carbs)} g wegli</span>
            <span>${round1(scannedProduct.fat)} g tluszczu</span>
          </div>
          <p class="storage-note">Dane z Open Food Facts moga byc niepelne. Sprawdz etykiete, jesli cos wyglada dziwnie.</p>
          <button class="primary-button compact" type="button" data-save-scanned-food>
            <i data-lucide="save"></i>
            Dodaj do bazy produktow
          </button>
        </div>
      </article>
    `;
    refreshIcons();
  }

  function handleBarcodeResultAction(event) {
    if (!event.target.closest('[data-save-scanned-food]') || !scannedProduct) return;
    const existing = findFoodByName(scannedProduct.name);
    const food = {
      id: existing ? existing.id : uid(),
      name: scannedProduct.name,
      servingGram: 100,
      servingUnit: 'g',
      calories: scannedProduct.calories,
      protein: scannedProduct.protein,
      carbs: scannedProduct.carbs,
      fat: scannedProduct.fat,
      fiber: scannedProduct.fiber,
      barcode: scannedProduct.code,
      custom: true,
      favorite: Boolean(existing && existing.favorite)
    };
    if (existing) Object.assign(existing, food);
    else state.foods.push(food);
    saveState();
    render();
    toast('Produkt z kodu dodany do bazy.');
  }

  function normalizeBarcode(value) {
    return String(value || '').replace(/[^0-9]/g, '').trim();
  }

  function renderRecipes() {
    const recipes = Array.isArray(state.recipes) ? state.recipes : [];
    $('recipe-list').innerHTML = recipes.length
      ? recipes.map(renderRecipeCard).join('')
      : '<div class="empty-state">Nie masz jeszcze przepisów. Dodaj pierwszy poniżej.</div>';
    refreshIcons();
  }

  function renderRecipeCard(recipe) {
    const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients.slice(0, 4) : [];
    return `
      <article class="recipe-card">
        <div class="recipe-icon"><i data-lucide="${recipeIcon(recipe)}"></i></div>
        <div class="recipe-content">
          <h3>${escapeHTML(recipe.name)}</h3>
          <p>${escapeHTML(recipe.description || ingredients.join(', ') || 'Własny przepis zapisany w profilu.')}</p>
          <div class="recipe-meta">
            <span>${Math.round(numberValue(recipe.calories, 0))} kcal</span>
            <span>${round1(recipe.protein)} g białka</span>
            ${numberValue(recipe.time, 0) ? `<span>${Math.round(numberValue(recipe.time, 0))} min</span>` : ''}
          </div>
          <div class="row-actions recipe-actions">
            <button class="icon-button" type="button" data-recipe-add="${recipe.id}" aria-label="Dodaj ${escapeHTML(recipe.name)} do dziennika" title="Dodaj do dziennika">
              <i data-lucide="plus"></i>
            </button>
            <button class="icon-button" type="button" data-recipe-edit="${recipe.id}" aria-label="Edytuj ${escapeHTML(recipe.name)}" title="Edytuj">
              <i data-lucide="pencil"></i>
            </button>
            ${recipe.custom ? `
              <button class="icon-button" type="button" data-recipe-delete="${recipe.id}" aria-label="Usuń ${escapeHTML(recipe.name)}" title="Usuń">
                <i data-lucide="trash-2"></i>
              </button>
            ` : ''}
          </div>
        </div>
      </article>
    `;
  }

  function recipeIcon(recipe) {
    const name = normalize(recipe && recipe.name);
    if (name.includes('losos') || name.includes('ryba')) return 'fish';
    if (name.includes('zupa')) return 'soup';
    if (name.includes('skyr') || name.includes('jogurt')) return 'milk';
    return 'salad';
  }

  function saveRecipe(event) {
    event.preventDefault();
    const id = $('recipe-id').value || uid();
    const recipe = {
      id,
      name: $('recipe-name').value.trim(),
      description: $('recipe-description').value.trim(),
      calories: numberValue($('recipe-calories').value, 0),
      protein: numberValue($('recipe-protein').value, 0),
      carbs: numberValue($('recipe-carbs').value, 0),
      fat: numberValue($('recipe-fat').value, 0),
      time: numberValue($('recipe-time').value, 0),
      ingredients: linesFromTextarea('recipe-ingredients'),
      steps: linesFromTextarea('recipe-steps'),
      custom: true,
      updatedAt: new Date().toISOString()
    };

    if (!recipe.name) {
      toast('Dodaj nazwę przepisu.');
      return;
    }

    const existingIndex = state.recipes.findIndex((item) => item.id === id);
    if (existingIndex >= 0) state.recipes[existingIndex] = recipe;
    else state.recipes.push(recipe);

    addRecipeAsFood(recipe);
    saveState();
    resetRecipeForm();
    render();
    toast('Przepis zapisany.');
  }

  function resetRecipeForm() {
    $('recipe-id').value = '';
    $('recipe-form').reset();
  }

  function handleRecipeAction(event) {
    const add = event.target.closest('[data-recipe-add]');
    const edit = event.target.closest('[data-recipe-edit]');
    const remove = event.target.closest('[data-recipe-delete]');

    if (add) {
      const recipe = state.recipes.find((item) => item.id === add.dataset.recipeAdd);
      if (!recipe) return;
      addRecipeToDiary(recipe);
      return;
    }

    if (edit) {
      const recipe = state.recipes.find((item) => item.id === edit.dataset.recipeEdit);
      if (!recipe) return;
      $('recipe-id').value = recipe.id;
      $('recipe-name').value = recipe.name || '';
      $('recipe-description').value = recipe.description || '';
      $('recipe-calories').value = numberValue(recipe.calories, 0);
      $('recipe-protein').value = numberValue(recipe.protein, 0);
      $('recipe-carbs').value = numberValue(recipe.carbs, 0);
      $('recipe-fat').value = numberValue(recipe.fat, 0);
      $('recipe-time').value = recipe.time || '';
      $('recipe-ingredients').value = Array.isArray(recipe.ingredients) ? recipe.ingredients.join('\n') : '';
      $('recipe-steps').value = Array.isArray(recipe.steps) ? recipe.steps.join('\n') : '';
      $('recipe-name').focus();
      return;
    }

    if (remove) {
      const recipe = state.recipes.find((item) => item.id === remove.dataset.recipeDelete);
      if (!recipe || !recipe.custom || !window.confirm(`Usunąć ${recipe.name}?`)) return;
      state.recipes = state.recipes.filter((item) => item.id !== recipe.id);
      saveState();
      render();
      toast('Przepis usunięty.');
    }
  }

  function renderRecipes() {
    const recipes = (Array.isArray(state.recipes) ? state.recipes : []).filter(recipeMatchesFilters);
    $('recipe-list').innerHTML = recipes.length
      ? recipes.map(renderRecipeCard).join('')
      : '<div class="empty-state">Nie znaleziono przepisow dla tych filtrow.</div>';
    refreshIcons();
  }

  function renderRecipeCard(recipe) {
    const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients.slice(0, 4) : [];
    return `
      <article class="recipe-card">
        <div class="recipe-icon"><i data-lucide="${recipeIcon(recipe)}"></i></div>
        <div class="recipe-content">
          <h3>${escapeHTML(recipe.name)}</h3>
          <p>${escapeHTML(recipe.description || ingredients.join(', ') || 'Wlasny przepis zapisany w profilu.')}</p>
          <div class="recipe-meta">
            <span>${Math.round(numberValue(recipe.calories, 0))} kcal</span>
            <span>${round1(recipe.protein)} g bialka</span>
            ${numberValue(recipe.time, 0) ? `<span>${Math.round(numberValue(recipe.time, 0))} min</span>` : ''}
          </div>
          <div class="row-actions recipe-actions">
            <button class="icon-button" type="button" data-recipe-add="${recipe.id}" aria-label="Dodaj ${escapeHTML(recipe.name)} do dziennika" title="Dodaj do dziennika">
              <i data-lucide="plus"></i>
            </button>
            <button class="icon-button" type="button" data-recipe-plan="${recipe.id}" aria-label="Dodaj ${escapeHTML(recipe.name)} do planu" title="Dodaj do planu">
              <i data-lucide="calendar-plus"></i>
            </button>
            <button class="icon-button" type="button" data-recipe-shopping="${recipe.id}" aria-label="Dodaj skladniki ${escapeHTML(recipe.name)} do listy zakupow" title="Dodaj do listy zakupow">
              <i data-lucide="shopping-basket"></i>
            </button>
            <button class="icon-button" type="button" data-recipe-edit="${recipe.id}" aria-label="Edytuj ${escapeHTML(recipe.name)}" title="Edytuj">
              <i data-lucide="pencil"></i>
            </button>
            ${recipe.custom ? `
              <button class="icon-button" type="button" data-recipe-delete="${recipe.id}" aria-label="Usun ${escapeHTML(recipe.name)}" title="Usun">
                <i data-lucide="trash-2"></i>
              </button>
            ` : ''}
          </div>
        </div>
      </article>
    `;
  }

  function recipeMatchesFilters(recipe) {
    const query = normalize($('recipe-search') ? $('recipe-search').value : '');
    const type = $('recipe-type-filter') ? $('recipe-type-filter').value : 'all';
    const maxCalories = numberValue($('recipe-max-calories') ? $('recipe-max-calories').value : '', null);
    const minProtein = numberValue($('recipe-min-protein') ? $('recipe-min-protein').value : '', null);
    const maxTime = numberValue($('recipe-max-time') ? $('recipe-max-time').value : '', null);
    const searchable = normalize([
      recipe.name,
      recipe.description,
      ...(Array.isArray(recipe.ingredients) ? recipe.ingredients : [])
    ].join(' '));

    if (query && !searchable.includes(query)) return false;
    if (type && type !== 'all' && recipeMealType(recipe) !== type) return false;
    if (maxCalories !== null && numberValue(recipe.calories, 0) > maxCalories) return false;
    if (minProtein !== null && numberValue(recipe.protein, 0) < minProtein) return false;
    if (maxTime !== null && numberValue(recipe.time, 0) > maxTime) return false;
    return true;
  }

  function recipeMealType(recipe) {
    const text = normalize(`${recipe.name || ''} ${recipe.description || ''}`);
    if (text.includes('skyr') || text.includes('jogurt') || text.includes('owsian')) return 'Breakfast';
    if (text.includes('zupa') || text.includes('salat')) return 'Lunch';
    if (text.includes('losos') || text.includes('kurczak') || text.includes('obiad')) return 'Dinner';
    return 'Snack';
  }

  function clearRecipeFilters() {
    $('recipe-search').value = '';
    $('recipe-type-filter').value = 'all';
    $('recipe-max-calories').value = '';
    $('recipe-min-protein').value = '';
    $('recipe-max-time').value = '';
    renderRecipes();
  }

  function handleRecipeAction(event) {
    const add = event.target.closest('[data-recipe-add]');
    const plan = event.target.closest('[data-recipe-plan]');
    const shopping = event.target.closest('[data-recipe-shopping]');
    const edit = event.target.closest('[data-recipe-edit]');
    const remove = event.target.closest('[data-recipe-delete]');

    if (add) {
      const recipe = state.recipes.find((item) => item.id === add.dataset.recipeAdd);
      if (!recipe) return;
      addRecipeToDiary(recipe);
      return;
    }

    if (plan) {
      const recipe = state.recipes.find((item) => item.id === plan.dataset.recipePlan);
      if (!recipe) return;
      recipeToPlannedMeal(recipe, currentDate);
      return;
    }

    if (shopping) {
      const recipe = state.recipes.find((item) => item.id === shopping.dataset.recipeShopping);
      if (!recipe) return;
      addRecipeToShoppingList(recipe);
      return;
    }

    if (edit) {
      const recipe = state.recipes.find((item) => item.id === edit.dataset.recipeEdit);
      if (!recipe) return;
      $('recipe-id').value = recipe.id;
      $('recipe-name').value = recipe.name || '';
      $('recipe-description').value = recipe.description || '';
      $('recipe-calories').value = numberValue(recipe.calories, 0);
      $('recipe-protein').value = numberValue(recipe.protein, 0);
      $('recipe-carbs').value = numberValue(recipe.carbs, 0);
      $('recipe-fat').value = numberValue(recipe.fat, 0);
      $('recipe-time').value = recipe.time || '';
      $('recipe-ingredients').value = Array.isArray(recipe.ingredients) ? recipe.ingredients.join('\n') : '';
      $('recipe-steps').value = Array.isArray(recipe.steps) ? recipe.steps.join('\n') : '';
      $('recipe-name').focus();
      return;
    }

    if (remove) {
      const recipe = state.recipes.find((item) => item.id === remove.dataset.recipeDelete);
      if (!recipe || !recipe.custom || !window.confirm(`Usunac ${recipe.name}?`)) return;
      state.recipes = state.recipes.filter((item) => item.id !== recipe.id);
      saveState();
      render();
      toast('Przepis usuniety.');
    }
  }

  function activeShoppingList() {
    if (!Array.isArray(state.shoppingLists)) state.shoppingLists = [];
    let list = state.shoppingLists.find((item) => item.status !== 'archived');
    if (!list) {
      list = {
        id: uid(),
        name: 'Lista zakupow',
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      state.shoppingLists.push(list);
    }
    if (!Array.isArray(list.items)) list.items = [];
    return list;
  }

  function addRecipeToShoppingList(recipe) {
    const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
    if (!ingredients.length) {
      toast('Ten przepis nie ma skladnikow.');
      return;
    }
    const list = activeShoppingList();
    ingredients.forEach((ingredient) => {
      const name = String(ingredient || '').trim();
      if (!name) return;
      const existing = list.items.find((item) => normalize(item.name) === normalize(name));
      if (existing) existing.count = numberValue(existing.count, 1) + 1;
      else list.items.push({ id: uid(), name, checked: false, count: 1, createdAt: new Date().toISOString() });
    });
    list.updatedAt = new Date().toISOString();
    saveState();
    renderShoppingList();
    refreshIcons();
    toast('Skladniki dodane do listy zakupow.');
  }

  function renderShoppingList() {
    const container = $('shopping-list-items');
    if (!container) return;
    const list = (state.shoppingLists || []).find((item) => item.status !== 'archived');
    const items = list && Array.isArray(list.items) ? list.items : [];
    container.innerHTML = items.length
      ? items.map((item) => `
        <label class="shopping-item ${item.checked ? 'is-checked' : ''}">
          <input type="checkbox" data-shopping-check="${item.id}" ${item.checked ? 'checked' : ''}>
          <span>${escapeHTML(item.name)}${numberValue(item.count, 1) > 1 ? ` ×${item.count}` : ''}</span>
          <button class="icon-button" type="button" data-shopping-delete="${item.id}" aria-label="Usun ${escapeHTML(item.name)}" title="Usun">
            <i data-lucide="x"></i>
          </button>
        </label>
      `).join('')
      : '<div class="empty-state">Dodaj skladniki z wybranego przepisu.</div>';
  }

  function handleShoppingListAction(event) {
    const check = event.target.closest('[data-shopping-check]');
    const remove = event.target.closest('[data-shopping-delete]');
    const list = (state.shoppingLists || []).find((item) => item.status !== 'archived');
    if (!list) return;

    if (check) {
      const item = list.items.find((entry) => entry.id === check.dataset.shoppingCheck);
      if (!item) return;
      item.checked = check.checked;
      list.updatedAt = new Date().toISOString();
      saveState();
      renderShoppingList();
      refreshIcons();
      return;
    }

    if (remove) {
      list.items = list.items.filter((item) => item.id !== remove.dataset.shoppingDelete);
      list.updatedAt = new Date().toISOString();
      saveState();
      renderShoppingList();
      refreshIcons();
    }
  }

  function clearShoppingList() {
    const list = (state.shoppingLists || []).find((item) => item.status !== 'archived');
    if (!list || !list.items.length) return;
    list.items = [];
    list.updatedAt = new Date().toISOString();
    saveState();
    renderShoppingList();
    refreshIcons();
    toast('Lista zakupow wyczyszczona.');
  }

  function handlePaidRecipeAction(event) {
    const button = event.target.closest('[data-paid-recipes]');
    if (!button) return;
    const variant = button.dataset.paidRecipes;
    const label = variant === 'personalized' ? 'spersonalizowane przepisy' : 'standardowe przepisy';
    toast(`Opcja „${label}” jest na razie zablokowana. Płatności dodamy w kolejnym kroku.`);
  }

  function addRecipeToDiary(recipe) {
    const food = addRecipeAsFood(recipe);
    state.entries.push({
      id: uid(),
      date: currentDate,
      meal: $('entry-meal').value || 'Dinner',
      foodId: food ? food.id : null,
      foodName: recipe.name,
      amount: 1,
      unit: 'porcja',
      grams: 1,
      calories: numberValue(recipe.calories, 0),
      protein: numberValue(recipe.protein, 0),
      carbs: numberValue(recipe.carbs, 0),
      fat: numberValue(recipe.fat, 0),
      createdAt: new Date().toISOString()
    });
    saveState();
    render();
    switchView('diary');
    toast('Przepis dodany do dziennika.');
  }

  function addRecipeAsFood(recipe) {
    if (!recipe || !recipe.name) return null;
    const existing = findFoodByName(recipe.name);
    const food = {
      id: existing ? existing.id : uid(),
      name: recipe.name,
      servingGram: 1,
      servingUnit: 'porcja',
      calories: numberValue(recipe.calories, 0),
      protein: numberValue(recipe.protein, 0),
      carbs: numberValue(recipe.carbs, 0),
      fat: numberValue(recipe.fat, 0),
      fiber: 0,
      custom: true,
      favorite: Boolean(existing && existing.favorite)
    };
    if (existing) Object.assign(existing, food);
    else state.foods.push(food);
    return existing || food;
  }

  function linesFromTextarea(id) {
    return ($(id).value || '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  function renderProfileVisuals() {
    const name = profileName();
    const initial = name.trim().charAt(0).toUpperCase() || 'A';
    const avatar = state.profile && state.profile.avatarDataUrl ? state.profile.avatarDataUrl : '';
    setAvatar('profile-avatar', 'profile-avatar-initials', avatar, initial);
    setAvatar('dashboard-avatar', 'dashboard-avatar-initials', avatar, initial);
    setAvatar('settings-avatar', 'settings-avatar-initials', avatar, initial);
    if ($('dashboard-profile-name')) $('dashboard-profile-name').textContent = name;
    if ($('settings-profile-name')) $('settings-profile-name').textContent = name;
  }

  function setAvatar(imageId, initialsId, dataUrl, initial) {
    const image = $(imageId);
    const initials = $(initialsId);
    if (!image || !initials) return;
    image.hidden = !dataUrl;
    initials.hidden = Boolean(dataUrl);
    if (dataUrl) image.src = dataUrl;
    else image.removeAttribute('src');
    initials.textContent = initial;
  }

  async function handleAvatarUpload(event) {
    const file = event.target.files && event.target.files[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('Wybierz plik graficzny.');
      return;
    }

    try {
      const avatarDataUrl = await compressAvatar(file);
      state.profile = {
        ...(state.profile || {}),
        avatarDataUrl,
        avatarUpdatedAt: new Date().toISOString()
      };
      saveState();
      render();
      toast('Zdjęcie profilowe zapisane.');
    } catch (error) {
      toast(`Nie udało się dodać zdjęcia: ${error.message}`);
    }
  }

  function removeAvatar() {
    state.profile = {
      ...(state.profile || {}),
      avatarDataUrl: '',
      avatarUpdatedAt: new Date().toISOString()
    };
    saveState();
    render();
    toast('Zdjęcie profilowe usunięte.');
  }

  async function compressAvatar(file) {
    const image = await loadImageFromFile(file);
    const size = 320;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Brak obsługi canvas.');

    const sourceSize = Math.min(image.naturalWidth || image.width, image.naturalHeight || image.height);
    const sourceX = ((image.naturalWidth || image.width) - sourceSize) / 2;
    const sourceY = ((image.naturalHeight || image.height) - sourceSize) / 2;
    ctx.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);
    const type = canvas.toDataURL('image/webp', 0.78).startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg';
    return canvas.toDataURL(type, 0.78);
  }

  function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Nie udało się odczytać pliku.'));
      reader.onload = () => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Nie udało się wczytać obrazu.'));
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function focusMealForm() {
    switchView('diary');
    const input = $('entry-food');
    if (input) {
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.setTimeout(() => input.focus(), 250);
    }
  }

  function planSnack() {
    $('entry-meal').value = 'Snack';
    $('entry-food').value = '';
    $('entry-grams').value = '1';
    $('entry-unit').value = 'porcja';
    focusMealForm();
  }

  function handleDashboardSearch(event) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const query = event.currentTarget.value.trim();
    if (!query) return;
    $('food-search').value = query;
    switchView('foods');
    renderFoods();
  }

  function renderWaterDrops(waterMl, targetMl) {
    const container = $('water-drops');
    if (!container) return;
    const drops = 8;
    const filled = targetMl > 0 ? Math.min(drops, Math.round((waterMl / targetMl) * drops)) : 0;
    container.innerHTML = Array.from({ length: drops }, (_, index) => `
      <span class="${index < filled ? 'is-filled' : ''}"><i data-lucide="droplet"></i></span>
    `).join('');
  }

  function renderDashboardInsights() {
    const streak = habitStreak(currentDate);
    const weekDates = lastNDates(7, currentDate);
    const lastWeight = latestWeightBefore(currentDate);
    const previousWeight = previousWeightBefore(lastWeight && lastWeight.date);
    const coach = getDailyCoach(currentDate, false);

    $('habit-streak-value').textContent = `${streak} ${streak === 1 ? 'dzień' : 'dni'}`;
    $('habit-streak-note').textContent = streak > 0
      ? 'Trzymaj rytm. Jeden wpis dziennie robi dużą różnicę.'
      : 'Dodaj pierwszy wpis, żeby zacząć serię.';
    $('habit-week').innerHTML = weekDates.map((date) => {
      const active = totalsForDate(date).calories > 0;
      return `<span class="${active ? 'is-active' : ''}" title="${escapeHTML(formatDateLabel(date))}">${shortWeekday(date)}</span>`;
    }).join('');

    if (lastWeight) {
      const delta = previousWeight ? lastWeight.weight - previousWeight.weight : null;
      $('dashboard-weight-value').textContent = `${round1(lastWeight.weight)} kg`;
      $('dashboard-weight-note').textContent = delta === null
        ? `Ostatni pomiar: ${shortDate(lastWeight.date)}.`
        : `${delta > 0 ? '+' : ''}${round1(delta)} kg od poprzedniego pomiaru.`;
    } else {
      $('dashboard-weight-value').textContent = '-';
      $('dashboard-weight-note').textContent = 'Brak pomiaru w wybranym zakresie.';
    }

    $('dashboard-recommendation').textContent = (coach.suggestions && coach.suggestions[0])
      ? coach.suggestions[0]
      : 'Zaplanuj prostą przekąskę białkową na później.';
  }

  function renderDashboardMeals() {
    const container = $('dashboard-meal-list');
    if (!container) return;
    const entries = entriesForDate(currentDate)
      .sort((a, b) => {
        const mealCompare = MEALS.indexOf(a.meal) - MEALS.indexOf(b.meal);
        if (mealCompare !== 0) return mealCompare;
        return String(a.createdAt || '').localeCompare(String(b.createdAt || ''));
      });

    if (!entries.length) {
      container.innerHTML = `
        <div class="dashboard-empty-meals">
          <i data-lucide="notebook-tabs"></i>
          <div>
            <strong>Brak wpisów na dziś</strong>
            <span>Otwórz dziennik i dodaj pierwszy posiłek.</span>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = entries.slice(0, 6).map((entry) => {
      const meta = mealMeta(entry.meal);
      return `
        <article class="dashboard-meal-card">
          <span class="dashboard-meal-icon"><i data-lucide="${meta.icon}"></i></span>
          <div>
            <strong title="${escapeHTML(entry.foodName)}">${escapeHTML(entry.foodName)}</strong>
            <span>${mealLabel(entry.meal)} · ${formatEntryAmount(entry)}</span>
          </div>
          <div class="dashboard-meal-macro">
            <strong>${Math.round(entry.calories)}</strong>
            <span>${round1(entry.protein)}b / ${round1(entry.carbs)}w / ${round1(entry.fat)}t</span>
          </div>
        </article>
      `;
    }).join('');
  }

  function renderTrendSummary() {
    if (!$('trend-avg-calories')) return;
    const range = Number($('trend-range').value || 7);
    const dates = lastNDates(range, currentDate);
    const calories = dates.map((date) => totalsForDate(date).calories);
    const loggedDays = calories.filter((value) => value > 0).length;
    const avgCalories = loggedDays ? calories.reduce((sum, value) => sum + value, 0) / loggedDays : 0;
    const waters = dates.map((date) => numberValue((state.water.find((item) => item.date === date) || {}).ml, 0));
    const waterDays = waters.filter((value) => value > 0).length;
    const avgWater = waterDays ? waters.reduce((sum, value) => sum + value, 0) / waterDays : 0;
    const weights = [...state.weights]
      .filter((item) => item.date >= dates[0] && item.date <= currentDate)
      .sort((a, b) => a.date.localeCompare(b.date));
    const weightDelta = weights.length >= 2 ? weights[weights.length - 1].weight - weights[0].weight : null;

    $('trend-avg-calories').textContent = Math.round(avgCalories);
    $('trend-logged-days').textContent = `${loggedDays}/${range}`;
    $('trend-weight-delta').textContent = weightDelta === null ? '-' : `${weightDelta > 0 ? '+' : ''}${round1(weightDelta)} kg`;
    $('trend-avg-water').textContent = formatLiters(avgWater);
  }

  function habitStreak(endDate) {
    let streak = 0;
    let cursor = endDate;
    while (streak < 365) {
      if (totalsForDate(cursor).calories <= 0) break;
      streak += 1;
      cursor = addDays(cursor, -1);
    }
    return streak;
  }

  function latestWeightBefore(date) {
    return [...state.weights]
      .filter((item) => item.date <= date)
      .sort((a, b) => b.date.localeCompare(a.date))[0] || null;
  }

  function previousWeightBefore(date) {
    if (!date) return null;
    return [...state.weights]
      .filter((item) => item.date < date)
      .sort((a, b) => b.date.localeCompare(a.date))[0] || null;
  }

  function shortWeekday(isoDate) {
    return parseLocalDate(isoDate).toLocaleDateString('pl-PL', { weekday: 'short' }).slice(0, 2);
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
      heightCm: numberValue($('profile-height').value, 0),
      age: numberValue($('profile-age').value, 35),
      sex: $('profile-sex').value === 'male' ? 'male' : 'female',
      activityLevel: $('profile-activity-level').value || 'light',
      bodyGoal: $('profile-goal').value || '',
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

  function renderSettings() {
    $('profile-height').value = state.settings.heightCm || '';
    $('profile-age').value = state.settings.age || '';
    $('profile-sex').value = state.settings.sex === 'male' ? 'male' : 'female';
    $('profile-activity-level').value = state.settings.activityLevel || 'light';
    $('profile-goal').value = state.settings.bodyGoal || '';
    $('target-calories').value = state.settings.calories;
    $('target-protein').value = state.settings.protein;
    $('target-carbs').value = state.settings.carbs;
    $('target-fat').value = state.settings.fat;
    $('target-water').value = state.settings.water;

    const goals = { ...defaultState.habitGoals, ...(state.habitGoals || {}) };
    $('habit-logging-days').value = goals.loggingDays;
    $('habit-water-days').value = goals.waterDays;
    $('habit-weigh-days').value = goals.weighDays;
    $('habit-protein-days').value = goals.proteinDays;
    $('habit-reminder-morning').checked = Boolean(goals.reminderMorning);
    $('habit-reminder-evening').checked = Boolean(goals.reminderEvening);
  }

  function saveHabitGoals(event) {
    event.preventDefault();
    state.habitGoals = {
      loggingDays: clampInt($('habit-logging-days').value, 1, 7, 5),
      waterDays: clampInt($('habit-water-days').value, 1, 7, 5),
      weighDays: clampInt($('habit-weigh-days').value, 1, 7, 3),
      proteinDays: clampInt($('habit-protein-days').value, 1, 7, 5),
      reminderMorning: $('habit-reminder-morning').checked,
      reminderEvening: $('habit-reminder-evening').checked
    };
    saveState();
    scheduleLocalReminders();
    render();
    toast('Cele tygodniowe zapisane.');
  }

  function clampInt(value, min, max, fallback) {
    const parsed = Math.round(numberValue(value, fallback));
    return Math.max(min, Math.min(max, parsed));
  }

  function habitGoalStats() {
    const dates = lastNDates(7, currentDate);
    const goals = { ...defaultState.habitGoals, ...(state.habitGoals || {}) };
    const loggedDays = dates.filter((date) => totalsForDate(date).calories > 0).length;
    const waterDays = dates.filter((date) => {
      const water = state.water.find((item) => item.date === date);
      return numberValue(water && water.ml, 0) >= state.settings.water * 0.7;
    }).length;
    const weighDays = dates.filter((date) => state.weights.some((item) => item.date === date)).length;
    const proteinDays = dates.filter((date) => totalsForDate(date).protein >= state.settings.protein * 0.8).length;
    return [
      { key: 'logging', label: 'Dni z wpisami', value: loggedDays, target: goals.loggingDays, icon: 'notebook-tabs' },
      { key: 'water', label: 'Woda', value: waterDays, target: goals.waterDays, icon: 'droplet' },
      { key: 'weigh', label: 'Wazenie', value: weighDays, target: goals.weighDays, icon: 'scale' },
      { key: 'protein', label: 'Bialko', value: proteinDays, target: goals.proteinDays, icon: 'egg' }
    ];
  }

  function renderHabitGoalProgress() {
    const container = $('habit-goal-progress');
    if (!container) return;
    container.innerHTML = habitGoalStats().map((goal) => {
      const percent = goal.target > 0 ? Math.min(100, Math.round((goal.value / goal.target) * 100)) : 0;
      return `
        <div class="habit-goal-row">
          <span><i data-lucide="${goal.icon}"></i>${goal.label}</span>
          <strong>${goal.value}/${goal.target}</strong>
          <div class="mini-meter"><span style="width:${percent}%"></span></div>
        </div>
      `;
    }).join('');
  }

  function renderWeeklyReview() {
    const review = buildWeeklyReview(7);
    const grid = $('weekly-review-grid');
    const note = $('weekly-review-note');
    if (!grid || !note) return;
    $('weekly-review-range').textContent = '7 dni';
    grid.innerHTML = review.cards.map((card) => `
      <article class="weekly-review-card">
        <span>${card.label}</span>
        <strong>${card.value}</strong>
        <small>${card.detail}</small>
      </article>
    `).join('');
    note.textContent = review.note;
    if (!state.weeklyReviews || typeof state.weeklyReviews !== 'object' || Array.isArray(state.weeklyReviews)) {
      state.weeklyReviews = {};
    }
    if (!state.weeklyReviews[review.key]) state.weeklyReviews[review.key] = review;
  }

  function buildWeeklyReview(days) {
    const dates = lastNDates(days, currentDate);
    const calories = dates.map((date) => totalsForDate(date).calories);
    const logged = calories.filter((value) => value > 0);
    const avgCalories = logged.length ? logged.reduce((sum, value) => sum + value, 0) / logged.length : 0;
    const waters = dates.map((date) => numberValue((state.water.find((item) => item.date === date) || {}).ml, 0)).filter((value) => value > 0);
    const avgWater = waters.length ? waters.reduce((sum, value) => sum + value, 0) / waters.length : 0;
    const weights = [...state.weights]
      .filter((item) => item.date >= dates[0] && item.date <= currentDate)
      .sort((a, b) => a.date.localeCompare(b.date));
    const weightDelta = weights.length >= 2 ? weights[weights.length - 1].weight - weights[0].weight : null;
    const best = dates
      .map((date) => ({ date, totals: totalsForDate(date) }))
      .filter((item) => item.totals.calories > 0)
      .sort((a, b) => Math.abs(state.settings.calories - a.totals.calories) - Math.abs(state.settings.calories - b.totals.calories))[0];
    const biggestGap = Math.max(0, ...dates.map((date) => Math.max(0, state.settings.calories - totalsForDate(date).calories)));
    const proteinDays = dates.filter((date) => totalsForDate(date).protein >= state.settings.protein * 0.8).length;

    const note = logged.length
      ? `Dzialalo: ${logged.length} dni z wpisami i ${proteinDays} dni blisko celu bialka. Do poprawy: najwieksza luka kalorii to okolo ${Math.round(biggestGap)} kcal, wiec zaplanuj awaryjna przekaske.`
      : 'Ten tydzien nie ma jeszcze wpisow. Zacznij od prostego planu na pierwszy posilek i jednej szklanki wody.';

    return {
      key: `${dates[0]}:${currentDate}`,
      createdAt: new Date().toISOString(),
      cards: [
        { label: 'Srednie kcal', value: Math.round(avgCalories), detail: `${logged.length}/${days} dni z wpisami` },
        { label: 'Srednia woda', value: formatLiters(avgWater), detail: waters.length ? `${waters.length} dni z pomiarem` : 'Brak pomiarow' },
        { label: 'Trend wagi', value: weightDelta === null ? '-' : `${weightDelta > 0 ? '+' : ''}${round1(weightDelta)} kg`, detail: weights.length ? `${weights.length} pomiarow` : 'Brak wag' },
        { label: 'Najlepszy dzien', value: best ? shortDate(best.date) : '-', detail: best ? `${Math.round(best.totals.calories)} kcal` : 'Brak danych' },
        { label: 'Najwieksza luka', value: `${Math.round(biggestGap)} kcal`, detail: 'Do celu kcal' },
        { label: 'Bialko', value: `${proteinDays}/${days}`, detail: 'Dni blisko celu' }
      ],
      note
    };
  }

  function renderSyncMeta() {
    const container = $('sync-meta');
    if (!container) return;
    const lastSync = localStorage.getItem(lastSyncKey(currentProfileId));
    const backup = state.backupMeta;
    container.innerHTML = `
      <div><span>Ostatnia synchronizacja</span><strong>${lastSync ? formatDateTime(lastSync) : 'Brak'}</strong></div>
      <div><span>Rewizja chmury</span><strong>${lastRemoteRevision || 0}</strong></div>
      <div><span>Ostatni backup JSON</span><strong>${backup && backup.createdAt ? formatDateTime(backup.createdAt) : 'Brak'}</strong></div>
    `;
  }

  function createLocalBackup(reason) {
    const createdAt = new Date().toISOString();
    const key = `${backupKey(currentProfileId)}:${Date.now()}`;
    const payload = {
      reason,
      createdAt,
      profileId: currentProfileId,
      data: structuredCloneSafe(state)
    };
    try {
      localStorage.setItem(key, JSON.stringify(payload));
      state.backupMeta = { key, reason, createdAt };
    } catch (error) {
      console.warn('Backup lokalny nie zostal zapisany', error);
      state.backupMeta = { reason, createdAt, error: error.message };
    }
  }

  function scheduleLocalReminders() {
    window.clearInterval(reminderTimer);
    const goals = state.habitGoals || {};
    if (!goals.reminderMorning && !goals.reminderEvening) return;
    reminderTimer = window.setInterval(checkLocalReminder, 60000);
    checkLocalReminder();
  }

  function checkLocalReminder() {
    const goals = state.habitGoals || {};
    const now = new Date();
    const hour = now.getHours();
    const day = todayISO();
    const key = `diet-studio:reminder:${day}:${hour}`;
    if (localStorage.getItem(key)) return;

    if (goals.reminderMorning && hour === 8) {
      localStorage.setItem(key, '1');
      toast('Przypomnienie: zaplanuj pierwszy posilek dnia.');
    }
    if (goals.reminderEvening && hour === 20) {
      localStorage.setItem(key, '1');
      toast('Przypomnienie: uzupelnij dziennik wieczorem.');
    }
  }

  function formatDateTime(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.valueOf())) return '-';
    return date.toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
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
    createLocalBackup('import');

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
    createLocalBackup('reset');
    const backupMeta = state.backupMeta;
    localStorage.removeItem(storageKey(currentProfileId));
    state = normalizeState({ ...structuredCloneSafe(defaultState), deletedEntryIds, backupMeta });
    currentDate = todayISO();
    clearImport();
    saveState();
    render();
    toast(`Profil ${profileName()} zresetowany.`);
  }

  function renderCharts() {
    renderWeekChart();
    renderDashboardMacroChart();
    renderCalorieChart();
    renderWeightChart();
    renderMacroChart();
    renderWaterChart();
  }

  function renderWeekChart() {
    const canvas = $('week-chart');
    if (!isVisible(canvas)) return;
    const dates = lastNDates(7, currentDate);
    const points = dates.map((date) => ({
      label: shortDate(date),
      value: totalsForDate(date).calories
    }));
    drawAreaLineChart(canvas, points, state.settings.calories, {
      label: 'Kalorie',
      unit: 'kcal',
      color: '#2f7d59',
      fillColor: 'rgba(62, 138, 80, 0.14)',
      targetColor: '#9dbb9b',
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
    drawAreaLineChart(canvas, points, state.settings.calories, {
      label: 'Kalorie',
      unit: 'kcal',
      color: '#2f7d59',
      fillColor: 'rgba(62, 138, 80, 0.14)',
      targetColor: '#9dbb9b',
      emptyLabel: 'Brak zapisanych kalorii'
    });
  }

  function renderDashboardMacroChart() {
    const canvas = $('dashboard-macro-chart');
    if (!isVisible(canvas)) return;
    const totals = totalsForDate(currentDate);
    const proteinCalories = totals.protein * 4;
    const carbCalories = totals.carbs * 4;
    const fatCalories = totals.fat * 9;
    drawDonutChart(canvas, [
      { label: 'Białko', value: proteinCalories, color: '#3e8a50' },
      { label: 'Węgle', value: carbCalories, color: '#d08a24' },
      { label: 'Tłuszcz', value: fatCalories, color: '#8f62d7' }
    ], 'Brak makro');
    $('dashboard-macro-label').textContent = formatDateLabel(currentDate);
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
      { label: 'Białko', value: proteinCalories, color: '#3e8a50' },
      { label: 'Węglowodany', value: carbCalories, color: '#d08a24' },
      { label: 'Tłuszcz', value: fatCalories, color: '#8f62d7' }
    ], 'Brak makro');
    $('macro-split-label').textContent = formatDateLabel(currentDate);
  }

  function renderWaterChart() {
    const canvas = $('water-chart');
    if (!isVisible(canvas)) return;
    const range = Number($('trend-range').value || 7);
    const dates = lastNDates(range, currentDate);
    const points = dates.map((date) => ({
      label: range > 14 ? shortDay(date) : shortDate(date),
      value: numberValue((state.water.find((item) => item.date === date) || {}).ml, 0) / 1000
    }));
    const values = points.map((point) => point.value).filter((value) => value > 0);
    $('water-trend-label').textContent = values.length
      ? `Śr. ${round1(values.reduce((sum, value) => sum + value, 0) / values.length)} L`
      : 'Brak danych';
    drawBarChart(canvas, points, state.settings.water / 1000, {
      label: 'Woda',
      unit: 'L',
      color: '#4f9de8',
      targetColor: '#9dc8ed',
      emptyLabel: 'Brak zapisanej wody'
    });
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

  function drawAreaLineChart(canvas, points, target, options) {
    const ctx = setupCanvas(canvas);
    if (!ctx) return;
    const { width, height } = canvas.__chartSize;
    clearChart(ctx, width, height);
    canvas.__chartHitboxes = [];
    const values = points.map((point) => numberValue(point.value, 0));
    const hasData = values.some((value) => value > 0);
    const maxValue = Math.max(target || 0, ...values, 1);
    const pad = { left: 48, right: 18, top: 36, bottom: 38 };
    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;

    drawChartLegend(ctx, width, [
      { label: options.label || 'Wartość', color: options.color || '#2f7d59' },
      ...(target ? [{ label: 'Cel', color: options.targetColor || '#9dbb9b', dashed: true }] : [])
    ]);
    drawGrid(ctx, pad, chartW, chartH, maxValue);

    if (target) {
      const y = pad.top + chartH - (target / maxValue) * chartH;
      ctx.strokeStyle = options.targetColor || '#9dbb9b';
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
        color: options.targetColor || '#9dbb9b'
      });
    }

    if (!hasData) {
      drawEmptyLabel(ctx, width, height, options.emptyLabel || 'Brak danych');
      return;
    }

    const xFor = (index) => pad.left + (index / Math.max(1, points.length - 1)) * chartW;
    const yFor = (value) => pad.top + chartH - (value / maxValue) * chartH;
    const coordinates = points.map((point, index) => ({
      x: xFor(index),
      y: yFor(numberValue(point.value, 0)),
      value: numberValue(point.value, 0),
      label: point.label
    }));

    const gradient = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    gradient.addColorStop(0, options.fillColor || 'rgba(62, 138, 80, 0.16)');
    gradient.addColorStop(1, 'rgba(62, 138, 80, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    coordinates.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.lineTo(coordinates[coordinates.length - 1].x, pad.top + chartH);
    ctx.lineTo(coordinates[0].x, pad.top + chartH);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = options.color || '#2f7d59';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    coordinates.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();

    coordinates.forEach((point, index) => {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = options.color || '#2f7d59';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      canvas.__chartHitboxes.push({
        type: 'circle',
        x: point.x,
        y: point.y,
        radius: 13,
        label: point.label,
        value: `${Math.round(point.value)} ${options.unit || ''}`.trim(),
        color: options.color || '#2f7d59'
      });

      if (points.length <= 14 || index % Math.ceil(points.length / 8) === 0) {
        ctx.fillStyle = '#65706d';
        ctx.font = '11px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(point.label, point.x, height - 12);
      }
    });
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
      recipes: Array.isArray(rawState && rawState.recipes) && rawState.recipes.length ? rawState.recipes : structuredCloneSafe(seedRecipes),
      profile: {
        ...defaultState.profile,
        ...((rawState && rawState.profile && typeof rawState.profile === 'object' && !Array.isArray(rawState.profile)) ? rawState.profile : {})
      },
      entries: Array.isArray(rawState && rawState.entries) ? rawState.entries : [],
      weights: Array.isArray(rawState && rawState.weights) ? rawState.weights : [],
      water: Array.isArray(rawState && rawState.water) ? rawState.water : [],
      activities: Array.isArray(rawState && rawState.activities) ? rawState.activities : [],
      dailyCoach: rawState && rawState.dailyCoach && typeof rawState.dailyCoach === 'object' && !Array.isArray(rawState.dailyCoach)
        ? rawState.dailyCoach
        : {},
      deletedEntryIds: Array.isArray(rawState && rawState.deletedEntryIds) ? uniqueStrings(rawState.deletedEntryIds) : [],
      mealTemplates: Array.isArray(rawState && rawState.mealTemplates) ? rawState.mealTemplates : [],
      plannedMeals: Array.isArray(rawState && rawState.plannedMeals) ? rawState.plannedMeals : [],
      shoppingLists: Array.isArray(rawState && rawState.shoppingLists) ? rawState.shoppingLists : [],
      weeklyReviews: rawState && rawState.weeklyReviews && typeof rawState.weeklyReviews === 'object' && !Array.isArray(rawState.weeklyReviews)
        ? rawState.weeklyReviews
        : {},
      habitGoals: { ...defaultState.habitGoals, ...((rawState && rawState.habitGoals) || {}) },
      undoStack: trimUndoStack(Array.isArray(rawState && rawState.undoStack) ? rawState.undoStack : []),
      backupMeta: rawState && rawState.backupMeta && typeof rawState.backupMeta === 'object' && !Array.isArray(rawState.backupMeta)
        ? rawState.backupMeta
        : null
    };
  }

  function trimUndoStack(items) {
    return (Array.isArray(items) ? items : [])
      .filter((item) => item && item.type && item.createdAt)
      .slice(-8);
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

  function recipeSeed(name, description, calories, protein, carbs, fat, time, ingredients = []) {
    return {
      id: `seed-recipe-${normalize(name).replace(/[^a-z0-9]+/g, '-')}`,
      name,
      description,
      calories,
      protein,
      carbs,
      fat,
      time,
      ingredients,
      steps: [],
      custom: false
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

  function formatLiters(ml) {
    return `${round1(numberValue(ml, 0) / 1000)} L`;
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
    navigator.serviceWorker.register('sw.js').then((registration) => {
      registration.update().catch(() => {});
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    }).catch(() => {});
  }
})();
