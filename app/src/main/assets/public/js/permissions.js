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
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return 'לא נתמך (WebView)';
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  stream.getTracks().forEach(t => t.stop());
  return 'אושר';
}

async function requestWebMicrophone() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return 'לא נתמך (WebView)';
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  stream.getTracks().forEach(t => t.stop());
  return 'אושר';
}

async function requestWebLocation() {
  if (!navigator.geolocation) return 'לא נתמך (WebView)';
  await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve(),
      err => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
  return 'אושר';
}

export async function requestAllPermissions() {
  const plugins = getPlugins();
  const results = [];

  if (plugins?.Camera?.requestPermissions) {
    const cam = await safeCall(() => plugins.Camera.requestPermissions(), null);
    results.push(`מצלמה: ${cam ? JSON.stringify(cam) : 'אושר/נבדק'}`);
  } else {
    const cam = await safeCall(() => requestWebCamera(), 'נדחה');
    results.push(`מצלמה: ${cam}`);
  }

  if (plugins?.Geolocation?.requestPermissions) {
    const geo = await safeCall(() => plugins.Geolocation.requestPermissions(), null);
    results.push(`מיקום: ${geo ? JSON.stringify(geo) : 'אושר/נבדק'}`);
  } else {
    const geo = await safeCall(() => requestWebLocation(), 'נדחה');
    results.push(`מיקום: ${geo}`);
  }

  const mic = await safeCall(() => requestWebMicrophone(), 'נדחה');
  results.push(`מיקרופון (הקלטה/תמלול): ${mic}`);

  if (plugins?.Filesystem?.requestPermissions) {
    const fs = await safeCall(() => plugins.Filesystem.requestPermissions(), null);
    results.push(`קבצים (שמירה): ${fs ? JSON.stringify(fs) : 'אושר/נבדק'}`);
  } else {
    results.push('קבצים (שמירה): יתבקש בעת שימוש בפיצ׳ר (plugin)');
  }

  results.push('טקסט לדיבור (TTS): ללא הרשאה ייעודית (תלוי במנוע המכשיר)');
  results.push('Bluetooth/הדפסה: יתבקש בעת שילוב plugin למדפסת BT');
  results.push('שיתוף: ללא הרשאה ייעודית (Share)');

  return results;
}
