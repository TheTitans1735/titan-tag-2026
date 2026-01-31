function getSpeechRecognition() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

async function requestMicPermission() {
  if (!navigator.mediaDevices?.getUserMedia) return;
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  stream.getTracks().forEach(t => t.stop());
}

export async function startHebrewTranscription({
  onText,
  onStatus,
  onEnd,
  onError,
  silenceTimeoutMs = 5000
}) {
  const SR = getSpeechRecognition();
  if (!SR) {
    throw new Error('SpeechRecognition לא נתמך במכשיר/ב-WebView');
  }

  await requestMicPermission();

  const rec = new SR();
  rec.lang = 'he-IL';
  rec.continuous = false;
  rec.interimResults = true;
  rec.maxAlternatives = 1;

  let finalText = '';
  let interim = '';
  let lastHeardAt = Date.now();
  let watchdog = null;

  rec.onstart = () => {
    lastHeardAt = Date.now();
    if (watchdog) {
      clearInterval(watchdog);
      watchdog = null;
    }

    watchdog = setInterval(() => {
      if (Date.now() - lastHeardAt >= silenceTimeoutMs) {
        try {
          rec.stop();
        } catch {
          // ignore
        }
      }
    }, 250);
    onStatus?.('listening');
  };

  rec.onresult = ev => {
    lastHeardAt = Date.now();
    interim = '';

    for (let i = ev.resultIndex; i < ev.results.length; i += 1) {
      const res = ev.results[i];
      const txt = (res[0]?.transcript || '').trim();
      if (!txt) continue;
      if (res.isFinal) {
        finalText = `${finalText} ${txt}`.trim();
      } else {
        interim = txt;
      }
    }

    onText?.({ finalText, interimText: interim });
  };

  rec.onerror = ev => {
    if (watchdog) {
      clearInterval(watchdog);
      watchdog = null;
    }
    onStatus?.('error');
    onError?.(new Error(ev?.error || 'speech error'));
  };

  rec.onend = () => {
    if (watchdog) {
      clearInterval(watchdog);
      watchdog = null;
    }
    onStatus?.('idle');
    onEnd?.();
  };

  rec.start();

  return {
    stop() {
      try {
        rec.stop();
      } catch {
        // ignore
      }
    }
  };
}
