export function speakHebrew(text) {
  return new Promise((resolve) => {
    console.log('Speaking Hebrew:', text);

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };

    // Safety timeout: some TTS engines never fire callbacks
    // Keep this short so we don't delay listening too long if callbacks don't fire.
    // The prompt is short, so 3000ms is enough as a safety net.
    const timeoutMs = 3000;
    const timer = setTimeout(() => {
      console.log('TTS timeout reached, continuing');
      finish();
    }, timeoutMs);
    
    // Prioritize Android native TTS
    if (window.Android && typeof window.Android.speakWithCallback === 'function') {
      console.log('Using Android TTS');
      const callbackName = 'window.__ttsCallback_' + Date.now();
      window[callbackName] = () => {
        console.log('Android TTS finished');
        clearTimeout(timer);
        finish();
        delete window[callbackName];
      };
      window.Android.speakWithCallback(text, callbackName);
      return;
    }
    
    // Web TTS fallback
    if (window.speechSynthesis) {
      console.log('Using Web TTS');
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'he-IL';
      utterance.rate = 0.9;  // Slightly slower for Hebrew
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onend = () => {
        console.log('Web TTS finished');
        clearTimeout(timer);
        finish();
      };
      
      utterance.onerror = (event) => {
        console.error('Web TTS error:', event);
        clearTimeout(timer);
        finish();  // Resolve anyway to continue flow
      };
      
      speechSynthesis.speak(utterance);
      return;
    }
    
    console.log('No TTS available, skipping audio');
    clearTimeout(timer);
    finish(); // Silent fallback
  });
}
