package com.archaeology.field.ui.voice

import android.app.Activity
import android.content.Intent
import android.speech.RecognizerIntent
import androidx.fragment.app.Fragment

/**
 * Voice recognition helper class for easy integration
 */
object VoiceHelper {
    
    private const val REQUEST_CODE_VOICE = 3001
    
    /**
     * Launch voice recognition from activity
     */
    fun launchVoiceRecognition(activity: Activity) {
        val intent = Intent(activity, VoiceRecognitionActivity::class.java)
        activity.startActivityForResult(intent, REQUEST_CODE_VOICE)
    }
    
    /**
     * Launch voice recognition from fragment
     */
    fun launchVoiceRecognition(fragment: Fragment) {
        val intent = Intent(fragment.requireContext(), VoiceRecognitionActivity::class.java)
        fragment.startActivityForResult(intent, REQUEST_CODE_VOICE)
    }
    
    /**
     * Handle voice recognition result from activity
     */
    fun handleActivityResult(
        requestCode: Int,
        resultCode: Int,
        data: Intent?,
        onVoiceResult: (transcriptionText: String) -> Unit
    ): Boolean {
        if (resultCode == Activity.RESULT_OK && data != null) {
            when (requestCode) {
                REQUEST_CODE_VOICE -> {
                    val transcriptionText = data.getStringExtra("TRANSCRIPTION_TEXT") ?: ""
                    if (transcriptionText.isNotEmpty()) {
                        onVoiceResult(transcriptionText)
                        return true
                    }
                }
            }
        }
        return false
    }
    
    /**
     * Check if voice recognition is available
     */
    fun isVoiceRecognitionAvailable(activity: Activity): Boolean {
        return try {
            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
            activity.packageManager.queryIntentActivities(intent, 0).isNotEmpty()
        } catch (e: Exception) {
            false
        }
    }
}