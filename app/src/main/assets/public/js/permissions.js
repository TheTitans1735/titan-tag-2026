import { t } from './i18n.js';

function getPlugins() {
  const cap = window.Capacitor;
  if (!cap || !cap.Plugins) return null;
  return cap.Plugins;
}

async function safeCall(fn, fallbackValue) {
  try {
    return await fn();
  } catch {
    return fallbackValue;
  }
}

async function requestWebCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return t('perm_not_supported_webview');
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  stream.getTracks().forEach(t => t.stop());
  return t('perm_approved');
}

async function requestWebMicrophone() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return t('perm_not_supported_webview');
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  stream.getTracks().forEach(t => t.stop());
  return t('perm_approved');
}

async function requestWebLocation() {
  if (!navigator.geolocation) return t('perm_not_supported_webview');
  await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve(),
      err => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
  return t('perm_approved');
}

export async function requestAllPermissions() {
  const plugins = getPlugins();
  const results = [];

  if (plugins?.Camera?.requestPermissions) {
    const cam = await safeCall(() => plugins.Camera.requestPermissions(), null);
    results.push(`${t('perm_camera')}: ${cam ? JSON.stringify(cam) : t('perm_check_ok')}`);
  } else {
    const cam = await safeCall(() => requestWebCamera(), t('perm_denied'));
    results.push(`${t('perm_camera')}: ${cam}`);
  }

  if (plugins?.Geolocation?.requestPermissions) {
    const geo = await safeCall(() => plugins.Geolocation.requestPermissions(), null);
    results.push(`${t('perm_location')}: ${geo ? JSON.stringify(geo) : t('perm_check_ok')}`);
  } else {
    const geo = await safeCall(() => requestWebLocation(), t('perm_denied'));
    results.push(`${t('perm_location')}: ${geo}`);
  }

  const mic = await safeCall(() => requestWebMicrophone(), t('perm_denied'));
  results.push(`${t('perm_microphone')}: ${mic}`);

  if (plugins?.Filesystem?.requestPermissions) {
    const fs = await safeCall(() => plugins.Filesystem.requestPermissions(), null);
    results.push(`${t('perm_files')}: ${fs ? JSON.stringify(fs) : t('perm_check_ok')}`);
  } else {
    results.push(`${t('perm_files')}: ${t('perm_will_prompt_plugin')}`);
  }

  results.push(t('perm_tts'));
  results.push(t('perm_bt'));
  results.push(t('perm_share'));

  return results;
}
