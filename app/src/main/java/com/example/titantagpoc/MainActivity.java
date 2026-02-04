package com.example.titantagpoc;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.util.Log;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;

import java.io.ByteArrayOutputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.json.JSONObject;

public class MainActivity extends BridgeActivity {
    
    private TextToSpeech tts;
    private SpeechRecognizer speechRecognizer;
    private Intent speechIntent;
    private String speechCallbackName;
    private boolean speechListening = false;
    private boolean speechPendingStart = false;
    private static final String TAG = "MainActivity";
    private static final int REQUEST_TTS_CODE = 1001;
    private static final int REQUEST_BT_PERMISSIONS = 1002;
    private static final int REQUEST_SPEECH_PERMISSION = 1003;

    private String pendingPrintFindId;

    private static final UUID SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");
    private static final String PRINTER_PREFIX = "SK58";

    // Target output for labels/QR
    // Assumption: most 58mm printers are 203dpi ~= 8 dots/mm.
    private static final int DOTS_PER_MM = 8;

    // Label size (mm)
    // User requirement: 3cm (feed/length) x 4.5cm (width)
    private static final int LABEL_HEIGHT_MM = 30;
    private static final int LABEL_WIDTH_MM = 45;

    // Gap between prints (mm)
    private static final int GAP_MM = 15; // 1.5cm

    // QR/Barcode size (mm)
    // Note: QR is always square.
    private static final int QR_SIZE_MM = 20;

    // Safety margins: real printers often have non-printable areas and firmware feeds.
    // Keep a small buffer so the print won't spill into the next label.
    // 0 = smallest spacing/maximum fill.
    private static final int SAFE_MARGIN_DOTS = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        initTextToSpeech();
        initWebViewInterface();
    }
    
    private void initWebViewInterface() {
        bridge.getWebView().addJavascriptInterface(this, "Android");
    }

    private void toast(String msg) {
        runOnUiThread(() -> Toast.makeText(this, msg, Toast.LENGTH_LONG).show());
    }

    private boolean hasBtConnectPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true;
        return ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED;
    }

    private void requestBtConnectPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return;
        ActivityCompat.requestPermissions(this, new String[]{ Manifest.permission.BLUETOOTH_CONNECT }, REQUEST_BT_PERMISSIONS);
    }

    private BluetoothDevice findBondedPrinter() {
        if (!hasBtConnectPermission()) return null;
        BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
        if (adapter == null) return null;

        Set<BluetoothDevice> bonded;
        try {
            bonded = adapter.getBondedDevices();
        } catch (SecurityException se) {
            return null;
        }
        if (bonded == null) return null;
        for (BluetoothDevice d : bonded) {
            String name;
            try {
                name = d.getName();
            } catch (SecurityException se) {
                continue;
            }
            if (name != null && name.startsWith(PRINTER_PREFIX)) return d;
        }
        return null;
    }

    private Bitmap createQrBitmap(String text, int sizePx) throws Exception {
        Map<EncodeHintType, Object> hints = new HashMap<>();
        hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M);
        hints.put(EncodeHintType.MARGIN, 0);

        QRCodeWriter writer = new QRCodeWriter();
        BitMatrix matrix = writer.encode(text, BarcodeFormat.QR_CODE, sizePx, sizePx, hints);
        int w = matrix.getWidth();
        int h = matrix.getHeight();
        Bitmap bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        for (int y = 0; y < h; y++) {
            for (int x = 0; x < w; x++) {
                bmp.setPixel(x, y, matrix.get(x, y) ? Color.BLACK : Color.WHITE);
            }
        }
        return bmp;
    }

    private Bitmap createQrLabelBitmap(String text) throws Exception {
        int labelHeight = LABEL_HEIGHT_MM * DOTS_PER_MM;
        int labelWidth = LABEL_WIDTH_MM * DOTS_PER_MM;
        int margin = SAFE_MARGIN_DOTS;

        int maxQr = Math.min(labelWidth - (margin * 2), labelHeight - (margin * 2));
        int requestedQr = QR_SIZE_MM * DOTS_PER_MM;
        int qrSize = Math.max(40, Math.min(requestedQr, maxQr));

        Bitmap qr = createQrBitmap(text, qrSize);

        // Print bitmap size matches the physical label; QR is placed as high as possible (top).
        Bitmap label = Bitmap.createBitmap(labelWidth, labelHeight, Bitmap.Config.ARGB_8888);
        label.eraseColor(Color.WHITE);

        int x = Math.max(0, (labelWidth - qr.getWidth()) / 2);
        int y = margin;

        android.graphics.Canvas canvas = new android.graphics.Canvas(label);
        canvas.drawBitmap(qr, x, y, null);
        return label;
    }

    private void feedToNextLabelIfSupported(OutputStream os) {
        // Many label printers expose a "feed to gap/mark" command in ESC/POS.
        // If unsupported, printers typically ignore it.
        try {
            os.write(new byte[]{ 0x1D, 0x0C }); // GS FF
        } catch (Exception ignored) {
        }
    }

    private byte[] escPosRasterBytes(Bitmap bmp) {
        int width = bmp.getWidth();
        int height = bmp.getHeight();
        int bytesPerRow = (width + 7) / 8;
        byte[] image = new byte[bytesPerRow * height];

        for (int y = 0; y < height; y++) {
            int rowOffset = y * bytesPerRow;
            for (int x = 0; x < width; x++) {
                int pixel = bmp.getPixel(x, y);
                int r = Color.red(pixel);
                int g = Color.green(pixel);
                int b = Color.blue(pixel);
                int lum = (r * 30 + g * 59 + b * 11) / 100;
                boolean black = lum < 128;
                if (black) {
                    int idx = rowOffset + (x / 8);
                    image[idx] |= (byte)(0x80 >> (x % 8));
                }
            }
        }

        byte xL = (byte)(bytesPerRow & 0xFF);
        byte xH = (byte)((bytesPerRow >> 8) & 0xFF);
        byte yL = (byte)(height & 0xFF);
        byte yH = (byte)((height >> 8) & 0xFF);

        byte[] header = new byte[]{ 0x1D, 0x76, 0x30, 0x00, xL, xH, yL, yH };
        byte[] out = new byte[header.length + image.length];
        System.arraycopy(header, 0, out, 0, header.length);
        System.arraycopy(image, 0, out, header.length, image.length);
        return out;
    }

    @JavascriptInterface
    public String getQrPngDataUrl(String text) {
        try {
            String t = (text == null) ? "" : text.trim();
            if (t.isEmpty()) return "";
            Bitmap bmp = createQrBitmap(t, 256);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            bmp.compress(Bitmap.CompressFormat.PNG, 100, baos);
            String b64 = Base64.encodeToString(baos.toByteArray(), Base64.NO_WRAP);
            return "data:image/png;base64," + b64;
        } catch (Exception e) {
            Log.e(TAG, "Failed to generate QR data URL", e);
            return "";
        }
    }

    @JavascriptInterface
    public void printFindQrToSk58(String findId) {
        final String id = (findId == null) ? "" : findId.trim();
        if (id.isEmpty()) {
            toast("מזהה ממצא חסר");
            return;
        }

        if (!hasBtConnectPermission()) {
            pendingPrintFindId = id;
            toast("נדרשת הרשאת Bluetooth כדי להדפיס");
            requestBtConnectPermission();
            return;
        }

        new Thread(() -> doPrintFindQr(id)).start();
    }

    private void doPrintFindQr(String findId) {
        if (!hasBtConnectPermission()) {
            toast("אין הרשאת Bluetooth");
            return;
        }

        BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
        if (adapter == null) {
            toast("Bluetooth לא זמין במכשיר");
            return;
        }

        try {
            if (!adapter.isEnabled()) {
                try {
                    Intent enableBtIntent = new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE);
                    runOnUiThread(() -> {
                        try { startActivity(enableBtIntent); } catch (Exception ignored) {}
                    });
                } catch (Exception ignored) {
                }
                toast("נא להפעיל Bluetooth ולנסות שוב");
                return;
            }
        } catch (SecurityException se) {
            toast("אין הרשאת Bluetooth");
            return;
        }

        BluetoothDevice printer = findBondedPrinter();
        if (printer == null) {
            toast("לא נמצאה מדפסת מזווגת בשם שמתחיל ב-" + PRINTER_PREFIX);
            return;
        }

        BluetoothSocket socket = null;
        try {
            try {
                adapter.cancelDiscovery();
            } catch (SecurityException ignored) {
            }

            socket = printer.createRfcommSocketToServiceRecord(SPP_UUID);
            socket.connect();
            OutputStream os = socket.getOutputStream();

            Bitmap label = createQrLabelBitmap(findId);
            byte[] qrRaster = escPosRasterBytes(label);

            // ESC/POS init
            os.write(new byte[]{ 0x1B, 0x40 });

            // Avoid extra feed between lines (some firmwares add spacing after raster)
            os.write(new byte[]{ 0x1B, 0x33, 0x00 }); // ESC 3 n (n=0)

            // Print QR
            os.write(qrRaster);

            // Gap between QR to QR (feed 1cm)
            int gapDots = GAP_MM * DOTS_PER_MM;
            if (gapDots > 0 && gapDots <= 255) {
                os.write(new byte[]{ 0x1D, 0x4A, (byte)gapDots }); // GS J n
            }

            // Do not force an extra feed here; we align before each print.

            // Restore default line spacing
            os.write(new byte[]{ 0x1B, 0x32 });
            os.flush();

            String printerName = PRINTER_PREFIX;
            try {
                String n = printer.getName();
                if (n != null && !n.trim().isEmpty()) printerName = n;
            } catch (SecurityException ignored) {
            }
            toast("נשלח להדפסה: " + printerName);
        } catch (SecurityException se) {
            Log.e(TAG, "Missing Bluetooth permission", se);
            toast("אין הרשאת Bluetooth");
        } catch (Exception e) {
            Log.e(TAG, "Print failed", e);
            toast("הדפסה נכשלה: " + e.getMessage());
        } finally {
            if (socket != null) {
                try { socket.close(); } catch (Exception ignored) {}
            }
        }
    }

    private void ensureSpeechRecognizer() {
        if (speechRecognizer != null) return;

        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this);
        speechRecognizer.setRecognitionListener(new RecognitionListener() {
            @Override
            public void onReadyForSpeech(Bundle params) {
                Log.d(TAG, "Speech ready");
            }

            @Override
            public void onBeginningOfSpeech() {
                Log.d(TAG, "Speech beginning");
            }

            @Override
            public void onRmsChanged(float rmsdB) {}

            @Override
            public void onBufferReceived(byte[] buffer) {}

            @Override
            public void onEndOfSpeech() {
                Log.d(TAG, "Speech end");
            }

            @Override
            public void onError(int error) {
                Log.e(TAG, "Speech error: " + error);
                speechListening = false;
                sendSpeechCallback(null, true, "error:" + error);
            }

            @Override
            public void onResults(Bundle results) {
                speechListening = false;
                ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                String text = (matches != null && !matches.isEmpty()) ? matches.get(0) : "";
                sendSpeechCallback(text, true, null);
            }

            @Override
            public void onPartialResults(Bundle partialResults) {
                ArrayList<String> matches = partialResults.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                String text = (matches != null && !matches.isEmpty()) ? matches.get(0) : "";
                sendSpeechCallback(text, false, null);
            }

            @Override
            public void onEvent(int eventType, Bundle params) {}
        });

        speechIntent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        speechIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        // Force Hebrew recognition (as much as the recognizer service allows)
        speechIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "he-IL");
        speechIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "he-IL");
        speechIntent.putExtra(RecognizerIntent.EXTRA_ONLY_RETURN_LANGUAGE_PREFERENCE, true);
        speechIntent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        speechIntent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
        // Prefer online recognition for better Hebrew results
        speechIntent.putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, false);
        speechIntent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 5000);
        speechIntent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 5000);
    }

    private void sendSpeechCallback(String text, boolean isFinal, String error) {
        if (speechCallbackName == null || speechCallbackName.isEmpty()) return;
        final String cb = speechCallbackName;
        final String qText = (text == null) ? "null" : JSONObject.quote(text);
        final String qErr = (error == null) ? "null" : JSONObject.quote(error);

        runOnUiThread(() -> {
            bridge.getWebView().evaluateJavascript(
                "(function(){try{var cb=window['" + cb + "']; if(typeof cb==='function'){ cb(" + qText + "," + (isFinal ? "true" : "false") + "," + qErr + "); }}catch(e){}})();",
                null
            );
        });
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
            public void onError(String id, int errorCode) {
                Log.e(TAG, "TTS error code: " + errorCode + " for " + id);
                if (id.equals(utteranceId)) {
                    runOnUiThread(() -> {
                        bridge.getWebView().evaluateJavascript(
                            "if (typeof " + callbackName + " === 'function') { " + callbackName + "(); }",
                            null
                        );
                    });
                }
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

    @JavascriptInterface
    public void startSpeechRecognition(String callbackName) {
        speechCallbackName = callbackName;

        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            sendSpeechCallback(null, true, "not_available");
            return;
        }

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            speechPendingStart = true;
            ActivityCompat.requestPermissions(this, new String[]{ Manifest.permission.RECORD_AUDIO }, REQUEST_SPEECH_PERMISSION);
            return;
        }

        runOnUiThread(() -> {
            try {
                ensureSpeechRecognizer();

                // Some recognizers pay attention only when these are set right before startListening
                speechIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "he-IL");
                speechIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "he-IL");

                if (speechListening) {
                    try { speechRecognizer.cancel(); } catch (Exception ignored) {}
                }
                speechListening = true;
                speechRecognizer.startListening(speechIntent);
            } catch (Exception e) {
                Log.e(TAG, "Failed to start speech recognizer", e);
                speechListening = false;
                sendSpeechCallback(null, true, "start_failed");
            }
        });
    }

    @JavascriptInterface
    public void stopSpeechRecognition() {
        runOnUiThread(() -> {
            try {
                if (speechRecognizer != null) {
                    speechRecognizer.stopListening();
                    speechRecognizer.cancel();
                }
            } catch (Exception ignored) {
            } finally {
                speechListening = false;
            }
        });
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode == REQUEST_BT_PERMISSIONS) {
            boolean ok = grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            if (ok) {
                final String id = pendingPrintFindId;
                pendingPrintFindId = null;
                if (id != null && !id.trim().isEmpty()) {
                    new Thread(() -> doPrintFindQr(id.trim())).start();
                }
            } else {
                pendingPrintFindId = null;
                toast("הרשאת Bluetooth נדחתה");
            }
        }

        if (requestCode == REQUEST_SPEECH_PERMISSION) {
            boolean ok = grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            if (ok && speechPendingStart) {
                speechPendingStart = false;
                startSpeechRecognition(speechCallbackName);
            } else {
                speechPendingStart = false;
                sendSpeechCallback(null, true, "permission_denied");
            }
        }
    }

    @Override
    public void onDestroy() {
        if (tts != null) {
            tts.stop();
            tts.shutdown();
        }
        if (speechRecognizer != null) {
            try {
                speechRecognizer.destroy();
            } catch (Exception ignored) {
            }
            speechRecognizer = null;
        }
        super.onDestroy();
    }
}
