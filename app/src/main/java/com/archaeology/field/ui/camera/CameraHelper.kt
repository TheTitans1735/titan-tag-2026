package com.archaeology.field.ui.camera

import android.app.Activity
import android.content.Intent
import androidx.fragment.app.Fragment
import java.io.File

/**
 * Camera helper class for easy integration
 */
object CameraHelper {
    
    private const val REQUEST_CODE_CAMERA = 2001
    
    /**
     * Launch camera from activity
     */
    fun launchCamera(activity: Activity) {
        val intent = Intent(activity, CameraActivity::class.java)
        activity.startActivityForResult(intent, REQUEST_CODE_CAMERA)
    }
    
    /**
     * Launch camera from fragment
     */
    fun launchCamera(fragment: Fragment) {
        val intent = Intent(fragment.requireContext(), CameraActivity::class.java)
        fragment.startActivityForResult(intent, REQUEST_CODE_CAMERA)
    }
    
    /**
     * Handle camera result from activity
     */
    fun handleActivityResult(
        requestCode: Int,
        resultCode: Int,
        data: Intent?,
        onPhotoResult: (photoUri: String) -> Unit
    ): Boolean {
        if (resultCode == Activity.RESULT_OK && data != null) {
            when (requestCode) {
                REQUEST_CODE_CAMERA -> {
                    val photoUri = data.getStringExtra("PHOTO_URI") ?: ""
                    if (photoUri.isNotEmpty()) {
                        onPhotoResult(photoUri)
                        return true
                    }
                }
            }
        }
        return false
    }
    
    /**
     * Get file from URI
     */
    fun getFileFromUri(uri: String): File? {
        return try {
            // Implementation to convert URI to File
            // This would depend on how you want to handle file storage
            File(uri)
        } catch (e: Exception) {
            null
        }
    }
    
    /**
     * Generate unique photo filename
     */
    fun generatePhotoFilename(): String {
        val timestamp = System.currentTimeMillis()
        val random = (1000..9999).random()
        return "archaeology_photo_${timestamp}_$random.jpg"
    }
}