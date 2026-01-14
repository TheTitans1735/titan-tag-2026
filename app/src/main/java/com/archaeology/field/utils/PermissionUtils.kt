package com.archaeology.field.utils

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.pm.PackageManager
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment

/**
 * Permission utility class for handling app permissions
 */
class PermissionUtils(private val context: Context) {
    
    /**
     * Check if specific permission is granted
     */
    fun hasPermission(permission: String): Boolean {
        return ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED
    }
    
    /**
     * Check if all permissions are granted
     */
    fun hasPermissions(permissions: Array<String>): Boolean {
        return permissions.all { hasPermission(it) }
    }
    
    /**
     * Get missing permissions
     */
    fun getMissingPermissions(permissions: Array<String>): Array<String> {
        return permissions.filter { !hasPermission(it) }.toTypedArray()
    }
    
    /**
     * Check if should show permission rationale
     */
    fun shouldShowRationale(activity: Activity, permission: String): Boolean {
        return ActivityCompat.shouldShowRequestPermissionRationale(activity, permission)
    }
    
    /**
     * Check if camera permission is granted
     */
    fun hasCameraPermission(): Boolean {
        return hasPermission(Manifest.permission.CAMERA)
    }
    
    /**
     * Check if location permissions are granted
     */
    fun hasLocationPermissions(): Boolean {
        return hasPermissions(arrayOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ))
    }
    
    /**
     * Check if microphone permission is granted
     */
    fun hasMicrophonePermission(): Boolean {
        return hasPermission(Manifest.permission.RECORD_AUDIO)
    }
    
    /**
     * Check if storage permission is granted (for older Android versions)
     */
    fun hasStoragePermission(): Boolean {
        return hasPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE)
    }
    
    /**
     * Get all required permissions for the app
     */
    fun getRequiredPermissions(): Array<String> {
        return arrayOf(
            Manifest.permission.CAMERA,
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION,
            Manifest.permission.RECORD_AUDIO
        )
    }
    
    companion object {
        /**
         * Permission request codes
         */
        const val REQUEST_CODE_CAMERA = 1001
        const val REQUEST_CODE_LOCATION = 1002
        const val REQUEST_CODE_MICROPHONE = 1003
        const val REQUEST_CODE_STORAGE = 1004
        const val REQUEST_CODE_ALL_PERMISSIONS = 1005
        
        /**
         * Request permissions from activity
         */
        fun requestPermissions(activity: Activity, permissions: Array<String>, requestCode: Int) {
            ActivityCompat.requestPermissions(activity, permissions, requestCode)
        }
        
        /**
         * Request permissions from fragment
         */
        fun requestPermissions(fragment: Fragment, permissions: Array<String>, requestCode: Int) {
            fragment.requestPermissions(permissions, requestCode)
        }
        
        /**
         * Check if permission result is granted
         */
        fun isPermissionGranted(grantResults: IntArray): Boolean {
            return grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED
        }
        
        /**
         * Check if all permissions are granted
         */
        fun areAllPermissionsGranted(grantResults: IntArray): Boolean {
            return grantResults.all { it == PackageManager.PERMISSION_GRANTED }
        }
    }
}