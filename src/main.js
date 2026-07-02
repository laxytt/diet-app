import { createClient } from '@supabase/supabase-js';
import readXlsxFile from 'read-excel-file/browser';
import { BrowserMultiFormatReader } from '@zxing/library';
import { createIcons, icons } from 'lucide';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Purchases } from '@revenuecat/purchases-capacitor';
import {
  AdMob,
  AdmobConsentStatus,
  BannerAdPosition,
  BannerAdSize,
  MaxAdContentRating
} from '@capacitor-community/admob';

const isNative = Capacitor.isNativePlatform();
let purchasesConfigured = false;
let cachedOfferings = null;
let admobConfigured = false;
let admobBannerId = '';
let admobTesting = true;
let admobStatus = {
  configured: false,
  visible: false,
  bannerId: '',
  testing: true,
  lastAction: 'boot',
  lastResult: '',
  lastError: '',
  updatedAt: ''
};

function setAdmobStatus(patch) {
  admobStatus = {
    ...admobStatus,
    ...patch,
    updatedAt: new Date().toISOString()
  };
  return { ...admobStatus };
}

window.supabase = { createClient };
window.DietExcel = {
  async readRows(file) {
    const sheets = await readXlsxFile(file);
    const sheet = sheets.find((item) => item && item.data && item.data.length > 1) || sheets[0];
    if (!sheet) return { sheetName: 'Arkusz', rows: [] };
    return {
      sheetName: sheet.sheet || 'Arkusz',
      rows: sheet.data || []
    };
  }
};
window.ZXing = { BrowserMultiFormatReader };
window.lucide = {
  createIcons(options = {}) {
    createIcons({ icons, ...options });
  }
};

window.DietNative = {
  isNative,
  platform: Capacitor.getPlatform(),
  redirectUrl: 'nouria://auth-callback',
  async openBrowser(url) {
    if (!isNative) {
      window.location.href = url;
      return;
    }
    await Browser.open({ url, presentationStyle: 'fullscreen' });
  },
  async closeBrowser() {
    if (isNative) await Browser.close().catch(() => {});
  },
  async pickImage(options = {}) {
    if (!isNative) return null;
    const source = options.source === 'camera'
      ? CameraSource.Camera
      : options.source === 'photos'
        ? CameraSource.Photos
        : CameraSource.Prompt;
    const photo = await Camera.getPhoto({
      quality: options.quality || 82,
      allowEditing: Boolean(options.allowEditing),
      resultType: CameraResultType.DataUrl,
      source,
      promptLabelHeader: options.promptLabelHeader || 'Zdjęcie',
      promptLabelPhoto: options.promptLabelPhoto || 'Zrób zdjęcie',
      promptLabelPicture: options.promptLabelPicture || 'Wybierz z galerii'
    });
    return photo && photo.dataUrl ? photo.dataUrl : null;
  }
};

window.DietBillingNative = {
  isNative,
  platform: Capacitor.getPlatform(),
  async configure(options = {}) {
    if (!isNative) return { ok: false, reason: 'web' };
    const apiKey = String(options.apiKey || '').trim();
    const appUserID = String(options.appUserID || '').trim();
    if (!apiKey || !appUserID) return { ok: false, reason: 'missing-config' };
    await Purchases.configure({ apiKey, appUserID });
    purchasesConfigured = true;
    cachedOfferings = await Purchases.getOfferings().catch(() => null);
    return {
      ok: true,
      customerInfo: await safeCustomerInfo(),
      offerings: simplifyOfferings(cachedOfferings)
    };
  },
  async getOfferings() {
    if (!purchasesConfigured) return { ok: false, reason: 'not-configured' };
    cachedOfferings = await Purchases.getOfferings();
    return { ok: true, offerings: simplifyOfferings(cachedOfferings) };
  },
  async purchaseProduct(productId) {
    if (!purchasesConfigured) return { ok: false, reason: 'not-configured' };
    const item = await findRevenueCatPackage(productId);
    if (!item) return { ok: false, reason: 'product-not-found' };
    const result = await Purchases.purchasePackage({ aPackage: item });
    return { ok: true, productId, customerInfo: result.customerInfo };
  },
  async restorePurchases() {
    if (!purchasesConfigured) return { ok: false, reason: 'not-configured' };
    const result = await Purchases.restorePurchases();
    return { ok: true, customerInfo: result.customerInfo };
  },
  async customerInfo() {
    if (!purchasesConfigured) return { ok: false, reason: 'not-configured' };
    return { ok: true, customerInfo: await safeCustomerInfo() };
  }
};

window.DietAdsNative = {
  isNative,
  platform: Capacitor.getPlatform(),
  status() {
    return { ok: true, status: { ...admobStatus } };
  },
  async configure(options = {}) {
    if (!isNative) {
      setAdmobStatus({ configured: false, visible: false, lastAction: 'configure', lastResult: 'web' });
      return { ok: false, reason: 'web', status: { ...admobStatus } };
    }
    const platform = Capacitor.getPlatform();
    admobBannerId = String(platform === 'ios' ? options.iosBannerId || '' : options.androidBannerId || '').trim();
    admobTesting = options.testing !== false;
    setAdmobStatus({
      configured: false,
      visible: false,
      bannerId: admobBannerId,
      testing: admobTesting,
      lastAction: 'configure',
      lastResult: admobBannerId ? 'starting' : 'missing-ad-unit',
      lastError: ''
    });
    if (!admobBannerId) return { ok: false, reason: 'missing-ad-unit', status: { ...admobStatus } };
    try {
      const consentInfo = await AdMob.requestConsentInfo({
        tagForUnderAgeOfConsent: false
      }).catch((error) => {
        setAdmobStatus({ lastAction: 'consent', lastResult: 'error', lastError: error instanceof Error ? error.message : String(error) });
        return null;
      });
      if (consentInfo && consentInfo.isConsentFormAvailable && consentInfo.status === AdmobConsentStatus.REQUIRED) {
        await AdMob.showConsentForm().catch((error) => {
          setAdmobStatus({ lastAction: 'consent-form', lastResult: 'error', lastError: error instanceof Error ? error.message : String(error) });
        });
      }
      await AdMob.initialize({
        initializeForTesting: admobTesting,
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: false,
        maxAdContentRating: MaxAdContentRating.General
      });
      admobConfigured = true;
      setAdmobStatus({ configured: true, lastAction: 'configure', lastResult: 'ok', lastError: '' });
      return { ok: true, status: { ...admobStatus } };
    } catch (error) {
      admobConfigured = false;
      setAdmobStatus({
        configured: false,
        visible: false,
        lastAction: 'configure',
        lastResult: 'error',
        lastError: error instanceof Error ? error.message : String(error)
      });
      return { ok: false, reason: 'configure-error', error: admobStatus.lastError, status: { ...admobStatus } };
    }
  },
  async showBanner(options = {}) {
    if (!isNative || !admobConfigured || !admobBannerId) {
      setAdmobStatus({ visible: false, lastAction: 'showBanner', lastResult: 'not-configured' });
      return { ok: false, reason: 'not-configured', status: { ...admobStatus } };
    }
    try {
      await AdMob.showBanner({
        adId: admobBannerId,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: Number(options.margin || 0),
        isTesting: admobTesting,
        npa: true
      });
      setAdmobStatus({ visible: true, lastAction: 'showBanner', lastResult: 'ok', lastError: '' });
      return { ok: true, status: { ...admobStatus } };
    } catch (error) {
      setAdmobStatus({
        visible: false,
        lastAction: 'showBanner',
        lastResult: 'error',
        lastError: error instanceof Error ? error.message : String(error)
      });
      return { ok: false, reason: 'show-error', error: admobStatus.lastError, status: { ...admobStatus } };
    }
  },
  async hideBanner() {
    if (!isNative || !admobConfigured) {
      setAdmobStatus({ visible: false, lastAction: 'hideBanner', lastResult: 'not-configured' });
      return { ok: false, reason: 'not-configured', status: { ...admobStatus } };
    }
    await AdMob.hideBanner().catch((error) => {
      setAdmobStatus({ lastAction: 'hideBanner', lastResult: 'error', lastError: error instanceof Error ? error.message : String(error) });
    });
    setAdmobStatus({ visible: false, lastAction: 'hideBanner', lastResult: 'ok' });
    return { ok: true, status: { ...admobStatus } };
  }
};

bootstrap().catch((error) => {
  console.error('Nie udało się uruchomić aplikacji.', error);
});

async function bootstrap() {
  if (isNative) {
    const launchUrl = await App.getLaunchUrl().catch(() => null);
    if (launchUrl && launchUrl.url) window.DIET_NATIVE_INITIAL_URL = launchUrl.url;
    App.addListener('appUrlOpen', async ({ url }) => {
      await window.DietNative.closeBrowser();
      window.dispatchEvent(new CustomEvent('diet-native-url', { detail: { url } }));
    });
  }

  await import('../config.js');
  await import('../app.js');
}

async function safeCustomerInfo() {
  const result = await Purchases.getCustomerInfo().catch(() => null);
  return result && result.customerInfo ? result.customerInfo : result;
}

async function findRevenueCatPackage(productId) {
  const wanted = String(productId || '').trim();
  if (!wanted) return null;
  if (!cachedOfferings) cachedOfferings = await Purchases.getOfferings().catch(() => null);
  const packages = offeringPackages(cachedOfferings);
  return packages.find((item) => matchesRevenueCatId(item, wanted)) || null;
}

function offeringPackages(offerings) {
  const all = [];
  const current = offerings && offerings.current ? offerings.current : null;
  if (current && Array.isArray(current.availablePackages)) all.push(...current.availablePackages);
  const byId = offerings && offerings.all && typeof offerings.all === 'object' ? offerings.all : {};
  Object.values(byId).forEach((offering) => {
    if (offering && Array.isArray(offering.availablePackages)) all.push(...offering.availablePackages);
  });
  const seen = new Set();
  return all.filter((item) => {
    const id = revenueCatProductId(item) || JSON.stringify(item && item.identifier);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function revenueCatProductId(item) {
  return String(
    item?.product?.identifier ||
    item?.product?.productIdentifier ||
    item?.storeProduct?.identifier ||
    item?.storeProduct?.productIdentifier ||
    ''
  ).trim();
}

function revenueCatPackageId(item) {
  return String(item?.identifier || item?.packageIdentifier || '').trim();
}

function matchesRevenueCatId(item, wanted) {
  const ids = [revenueCatProductId(item), revenueCatPackageId(item)].filter(Boolean);
  return ids.some((id) => id === wanted || id.startsWith(`${wanted}:`));
}

function simplifyOfferings(offerings) {
  return offeringPackages(offerings).map((item) => ({
    identifier: item.identifier || '',
    productId: revenueCatProductId(item),
    title: item.product?.title || item.storeProduct?.title || '',
    priceString: item.product?.priceString || item.storeProduct?.priceString || ''
  }));
}
