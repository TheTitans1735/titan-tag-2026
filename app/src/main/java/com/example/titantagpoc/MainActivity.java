package com.example.titantagpoc;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
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

import java.io.OutputStream;
import java.util.Locale;
import java.util.Set;

public class MainActivity extends BridgeActivity {
    
    private TextToSpeech tts;
    private static final String TAG = "MainActivity";
    private static final int REQUEST_TTS_CODE = 1001;
    private static final int REQUEST_BT_PERMISSIONS = 1002;

}