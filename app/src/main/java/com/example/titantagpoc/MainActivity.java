package com.example.titantagpoc;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

import java.io.OutputStream;
import java.util.Locale;
import java.util.Set;

public class MainActivity extends BridgeActivity {
    
    private TextToSpeech tts;
    private static final String TAG = "MainActivity";
    private static final int REQUEST_TTS_CODE = 1001;
    private static final int REQUEST_BT_PERMISSIONS = 1002;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        initTextToSpeech();
        initWebViewInterface();
    }
    
    private void initWebViewInterface() {
        bridge.getWebView().addJavascriptInterface(this, "Android");
    }

    private void initTextToSpeech() {
        tts = new TextToSpeech(this, new TextToSpeech.OnInitListener() {
            @Override
            public void onInit(int status) {
                if (status == TextToSpeech.SUCCESS) {
                    int result = tts.setLanguage(Locale.forLanguageTag("he-IL"));
                    if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                        Log.e(TAG, "Hebrew language not supported");
                    }
                    tts.setSpeechRate(1.0f);
                    tts.setPitch(1.0f);
                    Log.d(TAG, "TTS initialized successfully");
                } else {
                    Log.e(TAG, "TTS initialization failed");
                }
            }
        });

        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override
            public void onStart(String utteranceId) {
                Log.d(TAG, "TTS started: " + utteranceId);
            }

            @Override
            public void onDone(String utteranceId) {
                Log.d(TAG, "TTS finished: " + utteranceId);
            }

            @Override
            public void onError(String utteranceId) {
                Log.e(TAG, "TTS error: " + utteranceId);
            }

            @Override
            public void onError(String utteranceId, int errorCode) {
                Log.e(TAG, "TTS error code: " + errorCode + " for " + utteranceId);
            }
        });
    }

    @JavascriptInterface
    public void speak(String text) {
        if (tts != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "tts_utterance");
            } else {
                tts.speak(text, TextToSpeech.QUEUE_FLUSH, null);
            }
        }
    }

    @JavascriptInterface
    public void speakWithCallback(String text, String callbackName) {
        if (tts == null) return;
        
        String utteranceId = "tts_" + System.currentTimeMillis();
        
        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override
            public void onStart(String id) {}
            
            @Override
            public void onDone(String id) {
                if (id.equals(utteranceId)) {
                    runOnUiThread(() -> {
                        bridge.getWebView().evaluateJavascript(
                            "if (typeof " + callbackName + " === 'function') { " + callbackName + "(); }",
                            null
                        );
                    });
                }
            }
            
            @Override
            public void onError(String id) {
                Log.e(TAG, "TTS error: " + id);
            }
            
            @Override
            public void onError(String id, int errorCode) {
                Log.e(TAG, "TTS error code: " + errorCode + " for " + id);
            }
        });
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, utteranceId);
        } else {
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, null);
        }
    }

    @JavascriptInterface
    public boolean isTtsAvailable() {
        return tts != null && tts.setLanguage(Locale.forLanguageTag("he-IL")) != TextToSpeech.LANG_MISSING_DATA 
               && tts.setLanguage(Locale.forLanguageTag("he-IL")) != TextToSpeech.LANG_NOT_SUPPORTED;
    }

    @Override
    public void onDestroy() {
        if (tts != null) {
            tts.stop();
            tts.shutdown();
        }
        super.onDestroy();
    }
}