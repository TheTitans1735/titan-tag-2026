package com.example.titantagpoc;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

import java.util.Locale;

public class MainActivity extends BridgeActivity {
    
    private TextToSpeech tts;
    private static final String TAG = "MainActivity";
    private static final int REQUEST_TTS_CODE = 1001;
    
    @Override
    public void onStart() {
        super.onStart();
        
        // Check and request TTS permissions
        checkAndRequestPermissions();
        
        // Initialize TTS
        tts = new TextToSpeech(this, new TextToSpeech.OnInitListener() {
            @Override
            public void onInit(int status) {
                if (status == TextToSpeech.SUCCESS) {
                    Log.d(TAG, "TTS initialized successfully");
                    
                    // Add JavaScript interface
                    WebView webView = getBridge().getWebView();
                    if (webView != null) {
                        webView.addJavascriptInterface(new AndroidTTSInterface(), "AndroidTTS");
                        Log.d(TAG, "AndroidTTS interface added");
                        
                        // Add JavaScript to make interface globally available
                        webView.post(new Runnable() {
                            @Override
                            public void run() {
                                String js = "if (typeof window.AndroidTTS === 'undefined') { console.log('AndroidTTS not defined'); } else { console.log('AndroidTTS interface confirmed available'); window.AndroidTTS.global = true; }";
                                webView.evaluateJavascript(js, null);
                                Log.d(TAG, "Executed global TTS check JS");
                            }
                        });
                    }
                    
                    // Check if TTS data is installed
                    Locale hebrew = new Locale("he", "IL");
                    int result = tts.isLanguageAvailable(hebrew);

//                    int result = tts.isLanguageAvailable(java.util.Locale.US);
                    Log.d(TAG, "TTS language availability result: " + result);
                    
                    if (result == TextToSpeech.LANG_MISSING_DATA || 
                        result == TextToSpeech.LANG_NOT_SUPPORTED) {
                        Log.w(TAG, "TTS data missing, prompting user");
                        showTTSPrompt();
                        showTTSInstallDialog();
                    } else {
                        Log.d(TAG, "TTS language available");
                        // Don't run test automatically - wait for user interaction
                        Log.d(TAG, "TTS ready for user interaction");
                    }
                } else {
                    Log.e(TAG, "TTS initialization failed with status: " + status);
                    showTTSPrompt();
                }
            }
        });
    }
    
    @Override
    public void onDestroy() {
        if (tts != null) {
            tts.stop();
            tts.shutdown();
        }
        super.onDestroy();
    }
    
    private void checkAndRequestPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            // Check for required permissions
            String[] permissions = {
                Manifest.permission.RECORD_AUDIO,
                Manifest.permission.MODIFY_AUDIO_SETTINGS,
                Manifest.permission.SYSTEM_ALERT_WINDOW
            };
            
            boolean needsPermission = false;
            for (String permission : permissions) {
                if (ContextCompat.checkSelfPermission(this, permission) 
                    != PackageManager.PERMISSION_GRANTED) {
                    needsPermission = true;
                    break;
                }
            }
            
            if (needsPermission) {
                ActivityCompat.requestPermissions(
                    this, 
                    permissions, 
                    REQUEST_TTS_CODE
                );
            }
        }
    }
    
    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        
        if (requestCode == REQUEST_TTS_CODE) {
            for (int i = 0; i < grantResults.length; i++) {
                if (grantResults[i] != PackageManager.PERMISSION_GRANTED) {
                    Log.w(TAG, "Permission denied: " + permissions[i]);
                    Toast.makeText(this, "Permission required for TTS: " + permissions[i], 
                        Toast.LENGTH_LONG).show();
                }
            }
        }
    }
    
    private void showTTSPrompt() {
        Toast.makeText(this, 
            "Text-to-Speech may not be available. Please install TTS data from Google Play.", 
            Toast.LENGTH_LONG).show();
    }
    
    private void showTTSInstallDialog() {
        try {
            // Try to launch Google TTS installation
            Intent installIntent = new Intent();
            installIntent.setAction(TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA);
            installIntent.setPackage("com.google.android.tts");
            startActivity(installIntent);
            Log.d(TAG, "Launched Google TTS installation");
        } catch (Exception e) {
            Log.e(TAG, "Failed to launch TTS installation: " + e.getMessage());
            Toast.makeText(this, 
                "Please install Google Text-to-Speech from Google Play Store", 
                Toast.LENGTH_LONG).show();
        }
    }
    
    private void testTTSWithSpeak() {
        if (tts != null) {
            Log.d(TAG, "Testing TTS with test phrase");
            
            // Create utterance parameters for modern API
            java.util.HashMap<String, String> params = new java.util.HashMap<>();
            params.put(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, "titanTagTest");
            
            int result = tts.speak("TTS test successful", TextToSpeech.QUEUE_ADD, params);
            
            if (result == TextToSpeech.ERROR) {
                Log.e(TAG, "TTS test failed with ERROR");
                showTTSPrompt();
            } else {
                Log.d(TAG, "TTS test initiated successfully");
            }
        }
    }
    
    // JavaScript Interface for TTS
    public class AndroidTTSInterface {
        private Context context;
        
        public AndroidTTSInterface() {
            this.context = getApplicationContext();
        }
        
        @JavascriptInterface
        public void speak(final String text) {
            Log.d(TAG, "JavaScript TTS request: " + text);
            Log.d(TAG, "Text length: " + (text != null ? text.length() : 0));
            Log.d(TAG, "Text bytes: " + (text != null ? text.getBytes().length : 0));
            
            // Log character encoding details
            if (text != null) {
                try {
                    byte[] utf8Bytes = text.getBytes("UTF-8");
                    Log.d(TAG, "UTF-8 bytes length: " + utf8Bytes.length);
                    Log.d(TAG, "Text characters: " + text.length());
                    
                    // Check if text contains Hebrew characters
                    boolean hasHebrew = text.matches(".*[\\u0590-\\u05FF].*");
                    Log.d(TAG, "Contains Hebrew: " + hasHebrew);
                } catch (Exception e) {
                    Log.e(TAG, "Encoding check error: " + e.getMessage());
                }
            }
            
            if (tts != null && text != null && !text.isEmpty()) {
                // Use simpler approach without anonymous classes
                try {
                    // Set language to English
                    int result = tts.setLanguage(java.util.Locale.US);
                    Log.d(TAG, "TTS language set result: " + result);
                    
                    // Check TTS status
                    String ttsEngine = tts.getDefaultEngine();
                    Log.d(TAG, "TTS engine: " + ttsEngine);
                    
                    // Speak text
                    if (result == TextToSpeech.LANG_MISSING_DATA || 
                        result == TextToSpeech.LANG_NOT_SUPPORTED) {
                        Log.e(TAG, "TTS language not supported");
                        Toast.makeText(context, "TTS language not supported", Toast.LENGTH_SHORT).show();
                    } else {
                        Log.d(TAG, "Speaking via TTS: " + text);
                        
                        // Create utterance parameters for modern API
                        java.util.HashMap<String, String> params = new java.util.HashMap<>();
                        params.put(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, "titanTagTTS");
                        
                        int speakResult = tts.speak(text, TextToSpeech.QUEUE_FLUSH, params);
                        
                        Log.d(TAG, "TTS speak result: " + speakResult);
                        
                        if (speakResult == TextToSpeech.ERROR) {
                            Log.e(TAG, "TTS speak method returned ERROR");
                            Toast.makeText(context, "TTS speak failed: " + text, Toast.LENGTH_LONG).show();
                        } else {
                            Log.d(TAG, "TTS speak successful for: " + text);
                            Toast.makeText(context, "TTS speaking: " + text, Toast.LENGTH_SHORT).show();
                        }
                    }
                } catch (Exception e) {
                    Log.e(TAG, "TTS exception: " + e.getMessage());
                    e.printStackTrace();
                    Toast.makeText(context, "TTS exception: " + e.getMessage(), Toast.LENGTH_LONG).show();
                }
            } else {
                Log.w(TAG, "TTS not available or text is empty/null");
                Toast.makeText(context, "TTS not initialized", Toast.LENGTH_SHORT).show();
            }
        }
        
        @JavascriptInterface
        public boolean isAvailable() {
            boolean available = tts != null;
            Log.d(TAG, "TTS availability check: " + available);
            return available;
        }
        
        @JavascriptInterface
        public String getTTSEngine() {
            String engine = tts != null ? tts.getDefaultEngine() : "Not initialized";
            Log.d(TAG, "TTS engine requested: " + engine);
            return engine;
        }
        
        @JavascriptInterface
        public void testTTS() {
            Log.d(TAG, "TTS test requested from JavaScript");
            if (tts != null) {
                // Create utterance parameters for modern API
                java.util.HashMap<String, String> params = new java.util.HashMap<>();
                params.put(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, "titanTagTest");
                
                int result = tts.speak("TTS test successful", TextToSpeech.QUEUE_FLUSH, null, null);
                
                if (result == TextToSpeech.ERROR) {
                    Log.e(TAG, "TTS test failed with ERROR");
                    showTTSPrompt();
                } else {
                    Log.d(TAG, "TTS test initiated successfully");
                }
            }
        }
        
        @JavascriptInterface
        public void directSpeak(String text) {
            Log.d(TAG, "Direct TTS request: " + text);
            if (tts != null && text != null && !text.isEmpty()) {
                try {
                    // Set language to Hebrew first
                    int result = tts.setLanguage(new java.util.Locale("he", "IL"));
                    Log.d(TAG, "TTS Hebrew language result: " + result);
                    
                    // If Hebrew not available, fallback to English
                    if (result == TextToSpeech.LANG_MISSING_DATA || 
                        result == TextToSpeech.LANG_NOT_SUPPORTED) {
                        Log.w(TAG, "Hebrew TTS not available, using English");
                        result = tts.setLanguage(java.util.Locale.US);
                        Log.d(TAG, "TTS English fallback result: " + result);
                    }
                    
//                    if (result != TextToSpeech.LANG_MISSING_DATA &&
//                        result != TextToSpeech.LANG_NOT_SUPPORTED) {
//                        // Test TTS with simple English phrase
//                        Log.d(TAG, "Testing TTS with English: Hello");
//                        int testResult = tts.speak("Hello", TextToSpeech.QUEUE_FLUSH, null);
//                        Log.d(TAG, "TTS test result: " + testResult);
//
//                        if (testResult == TextToSpeech.ERROR) {
//                            Log.e(TAG, "TTS test failed");
//                        } else {
//                            Log.d(TAG, "TTS test successful - TTS is working");
//                        }
//                    }
//
//                        java.util.HashMap<String, String> params = new java.util.HashMap<>();
//                        params.put(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, "directSpeak");

                        int speakResult = tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "utteranceId");
                        Log.d(TAG, "Direct TTS result: " + speakResult);
//                    }
                } catch (Exception e) {
                    Log.e(TAG, "Direct TTS error: " + e.getMessage());
                }
//            }
            }
        }
        
        @JavascriptInterface
        public void printToBluetooth(String printerName, String findId) {
            Log.d(TAG, "Bluetooth print request - Printer: " + printerName + ", Find ID: " + findId);
            
            try {
                // Create a simple QR code and text for printing
                String printContent = createBluetoothPrintContent(findId);
                
                // Try to send to Bluetooth printer
                boolean success = sendToBluetoothPrinter(printerName, printContent);
                
                if (success) {
                    Log.d(TAG, "Successfully sent print job to " + printerName);
                    showToast("נשלח להדפסה: " + printerName + " - " + findId);
                } else {
                    Log.e(TAG, "Failed to send print job to " + printerName);
                    showToast("שגיאה בהדפסה: " + printerName);
                }
                
            } catch (Exception e) {
                Log.e(TAG, "Error in Bluetooth printing: " + e.getMessage(), e);
                showToast("שגיאה בהדפסה: " + e.getMessage());
            }
        }
        
        private String createBluetoothPrintContent(String findId) {
            StringBuilder content = new StringBuilder();
            content.append("================================\n");
            content.append("קוד QR לממצא\n");
            content.append("================================\n");
            content.append("מזהה: ").append(findId).append("\n");
            content.append("תאריך: ").append(new java.text.SimpleDateFormat("dd/MM/yyyy", java.util.Locale.getDefault()).format(new java.util.Date())).append("\n");
            content.append("================================\n");
            content.append("\n\n");
            
            // Note: For actual QR code printing, you would need to:
            // 1. Generate QR code image
            // 2. Convert to printer-compatible format
            // 3. Send as binary data
            
            // For now, we send a text representation
            content.append("[QR CODE: ").append(findId).append("]\n");
            content.append("סרוק את הקוד לגישה לממצא\n");
            content.append("\n================================\n");
            
            return content.toString();
        }
        
        private boolean sendToBluetoothPrinter(String printerName, String content) {
            try {
                // This is a basic implementation
                // In a real implementation, you would:
                // 1. Discover Bluetooth devices
                // 2. Connect to the specific printer
                // 3. Send data in the printer's expected format
                
                // For demonstration, we'll show the print intent
                Log.d(TAG, "Preparing to send to printer: " + printerName);
                Log.d(TAG, "Content length: " + content.length() + " characters");
                
                // Try to use Android's print framework
                android.print.PrintManager printManager = (android.print.PrintManager) getSystemService(Context.PRINT_SERVICE);
                if (printManager != null) {
                    String jobName = "QR Code - " + printerName;
                    printManager.print(jobName, null, null);
                    return true;
                }
                
                // Fallback - show print dialog
                Intent printIntent = new Intent(Intent.ACTION_SEND);
                printIntent.setType("text/plain");
                printIntent.putExtra(Intent.EXTRA_TEXT, content);
                printIntent.putExtra(Intent.EXTRA_SUBJECT, "QR Code - " + findId);
                startActivity(Intent.createChooser(printIntent, "שלח למדפסת: " + printerName));
                
                return true;
                
            } catch (Exception e) {
                Log.e(TAG, "Error sending to Bluetooth printer: " + e.getMessage(), e);
                return false;
            }
        }
        
        private void showToast(String message) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Toast.makeText(MainActivity.this, message, Toast.LENGTH_LONG).show();
                }
            });
        }
    }
}