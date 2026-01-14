package com.archaeology.field.ui.voice

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.archaeology.field.databinding.ActivityVoiceRecognitionBinding
import java.util.*

/**
 * Voice recognition activity for speech-to-text transcription
 */
class VoiceRecognitionActivity : AppCompatActivity(), RecognitionListener {
    
    private lateinit var binding: ActivityVoiceRecognitionBinding
    private var speechRecognizer: SpeechRecognizer? = null
    private var isListening = false
    
    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (isGranted) {
            initializeSpeechRecognizer()
        } else {
            Toast.makeText(this, "Microphone permission required", Toast.LENGTH_SHORT).show()
            finish()
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityVoiceRecognitionBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setupUI()
        checkMicrophonePermission()
    }
    
    private fun setupUI() {
        binding.buttonStartStop.setOnClickListener {
            if (isListening) {
                stopListening()
            } else {
                startListening()
            }
        }
        
        binding.buttonClose.setOnClickListener {
            finish()
        }
        
        binding.buttonClear.setOnClickListener {
            binding.textTranscription.text = ""
        }
        
        binding.buttonUseText.setOnClickListener {
            val transcription = binding.textTranscription.text.toString()
            if (transcription.isNotEmpty()) {
                val result = Intent().apply {
                    putExtra("TRANSCRIPTION_TEXT", transcription)
                }
                setResult(RESULT_OK, result)
                finish()
            } else {
                Toast.makeText(this, "No transcription to use", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun checkMicrophonePermission() {
        when {
            ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.RECORD_AUDIO
            ) == PackageManager.PERMISSION_GRANTED -> {
                initializeSpeechRecognizer()
            }
            else -> {
                requestPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
            }
        }
    }
    
    private fun initializeSpeechRecognizer() {
        if (SpeechRecognizer.isRecognitionAvailable(this)) {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this)
            speechRecognizer?.setRecognitionListener(this)
        } else {
            Toast.makeText(this, "Speech recognition not available", Toast.LENGTH_SHORT).show()
            finish()
        }
    }
    
    private fun startListening() {
        if (speechRecognizer == null) {
            initializeSpeechRecognizer()
        }
        
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault())
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
        }
        
        speechRecognizer?.startListening(intent)
        isListening = true
        updateUI()
    }
    
    private fun stopListening() {
        speechRecognizer?.stopListening()
        isListening = false
        updateUI()
    }
    
    private fun updateUI() {
        if (isListening) {
            binding.buttonStartStop.text = "עצור הקלטה"
            binding.buttonStartStop.setBackgroundColor(resources.getColor(R.color.button_danger))
            binding.statusText.text = "מקליט..."
            binding.statusText.setTextColor(resources.getColor(R.color.warning))
        } else {
            binding.buttonStartStop.text = "התחל הקלטה"
            binding.buttonStartStop.setBackgroundColor(resources.getColor(R.color.button_success))
            binding.statusText.text = "מוכן להקלטה"
            binding.statusText.setTextColor(resources.getColor(R.color.text_secondary))
        }
    }
    
    // RecognitionListener implementation
    override fun onReadyForSpeech(params: Bundle?) {
        binding.statusText.text = "מוכן לדיבור..."
    }
    
    override fun onBeginningOfSpeech() {
        binding.statusText.text = "מזהה דיבור..."
    }
    
    override fun onRmsChanged(rmsdB: Float) {
        // Update visual feedback based on volume
    }
    
    override fun onBufferReceived(buffer: ByteArray?) {
        // Handle audio buffer if needed
    }
    
    override fun onEndOfSpeech() {
        binding.statusText.text = "מעבד דיבור..."
        isListening = false
        updateUI()
    }
    
    override fun onError(error: Int) {
        val errorMessage = when (error) {
            SpeechRecognizer.ERROR_AUDIO -> "שגיאת אודיו"
            SpeechRecognizer.ERROR_CLIENT -> "שגיאת לקוח"
            SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "חסרות הרשאות"
            SpeechRecognizer.ERROR_NETWORK -> "שגיאת רשת"
            SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "תם הזמן המוקצב לרשת"
            SpeechRecognizer.ERROR_NO_MATCH -> "לא זוהה דיבור"
            SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "מזהה הדיבור עסוק"
            SpeechRecognizer.ERROR_SERVER -> "שגיאת שרת"
            SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "תם הזמן המוקצב לדיבור"
            else -> "שגיאה לא ידועה"
        }
        
        binding.statusText.text = errorMessage
        binding.statusText.setTextColor(resources.getColor(R.color.error))
        isListening = false
        updateUI()
    }
    
    override fun onResults(results: Bundle?) {
        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        if (!matches.isNullOrEmpty()) {
            val transcription = matches[0]
            binding.textTranscription.text = transcription
            binding.statusText.text = "הקלטה הושלמה"
            binding.statusText.setTextColor(resources.getColor(R.color.success))
        }
    }
    
    override fun onPartialResults(partialResults: Bundle?) {
        val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        if (!matches.isNullOrEmpty()) {
            val partialTranscription = matches[0]
            binding.textTranscription.text = partialTranscription
            binding.statusText.text = "מקליט..."
        }
    }
    
    override fun onEvent(eventType: Int, params: Bundle?) {
        // Handle events if needed
    }
    
    override fun onDestroy() {
        super.onDestroy()
        speechRecognizer?.destroy()
    }
    
    companion object {
        const val EXTRA_TRANSCRIPTION_TEXT = "transcription_text"
    }
}