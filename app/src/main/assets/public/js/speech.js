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
  onError
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

  rec.onstart = () => {
    onStatus?.('listening');
  };

  rec.onresult = ev => {
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
    onStatus?.('error');
    onError?.(new Error(ev?.error || 'speech error'));
  };

  rec.onend = () => {
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
