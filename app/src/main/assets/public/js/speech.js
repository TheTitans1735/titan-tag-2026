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
  silenceTimeoutMs = 3000
}) {
  console.log('Starting Hebrew speech recognition...');
  const SR = getSpeechRecognition();
  console.log('SpeechRecognition available:', !!SR);
  
  if (!SR) {
    throw new Error('זיהוי דיבור לא נתמך במכשיר זה או ב-WebView');
  }

  const rec = new SR();
  
  // Configure for Hebrew speech recognition
  rec.lang = 'he-IL';
  rec.continuous = false;  // Auto-stop after user finishes speaking
  rec.interimResults = true;  // Provide real-time feedback
  rec.maxAlternatives = 1;
  
  // Additional configuration for better recognition
  try {
    rec.serviceURI = 'w3c-speech-api'; // Try to force web standard
  } catch (e) {
    console.log('Could not set service URI');
  }

  let finalText = '';
  let interim = '';
  let lastHeardAt = Date.now();
  let watchdog = null;

  rec.onstart = () => {
    console.log('Speech recognition started');
    lastHeardAt = Date.now();
    if (watchdog) {
      clearInterval(watchdog);
      watchdog = null;
    }

    watchdog = setInterval(() => {
      if (Date.now() - lastHeardAt >= silenceTimeoutMs) {
        console.log('Silence timeout reached, stopping recognition');
        try {
          rec.stop();
        } catch (e) {
          console.log('Could not stop recognition:', e);
        }
      }
    }, 250);
    onStatus?.('listening');
  };

  rec.onresult = ev => {
    lastHeardAt = Date.now();
    interim = '';

    console.log('Speech recognition results:', ev.results);

    for (let i = ev.resultIndex; i < ev.results.length; i += 1) {
      const res = ev.results[i];
      const txt = (res[0]?.transcript || '').trim();
      console.log('Result text:', txt, 'isFinal:', res.isFinal);
      
      if (!txt) continue;
      if (res.isFinal) {
        finalText = `${finalText} ${txt}`.trim();
        console.log('Final text accumulated:', finalText);
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
