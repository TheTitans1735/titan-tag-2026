package com.archaeology.field.utils

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationManager
import android.os.Looper
import androidx.core.content.ContextCompat
import com.google.android.gms.location.*
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/**
 * GPS utility class for location services
 */
class GPSUtils(private val context: Context) {
    
    private val fusedLocationClient = LocationServices.getFusedLocationProviderClient(context)
    private val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
    
    /**
     * Check if location permissions are granted
     */
    fun hasLocationPermissions(): Boolean {
        return ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED &&
               ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
    }
    
    /**
     * Check if GPS is enabled
     */
    fun isGPSEnabled(): Boolean {
        return locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) ||
               locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
    }
    
    /**
     * Get current location (suspend function for coroutine usage)
     */
    suspend fun getCurrentLocation(): Location? {
        return try {
            if (!hasLocationPermissions()) {
                throw SecurityException("Location permissions not granted")
            }
            
            if (!isGPSEnabled()) {
                throw Exception("GPS is not enabled")
            }
            
            suspendCancellableCoroutine<Location?> { continuation ->
                val locationRequest = LocationRequest.create().apply {
                    priority = LocationRequest.PRIORITY_HIGH_ACCURACY
                    interval = 10000
                    fastestInterval = 5000
                }
                
                val locationCallback = object : LocationCallback() {
                    override fun onLocationResult(locationResult: LocationResult) {
                        locationResult.lastLocation?.let { location ->
                            fusedLocationClient.removeLocationUpdates(this)
                            continuation.resume(location)
                        } ?: continuation.resume(null)
                    }
                }
                
                fusedLocationClient.requestLocationUpdates(
                    locationRequest,
                    locationCallback,
                    Looper.getMainLooper()
                ).addOnFailureListener { exception ->
                    continuation.resumeWithException(exception)
                }
                
                continuation.invokeOnCancellation {
                    fusedLocationClient.removeLocationUpdates(locationCallback)
                }
            }
        } catch (e: Exception) {
            null
        }
    }
    
    /**
     * Get last known location
     */
    suspend fun getLastKnownLocation(): Location? {
        return try {
            if (!hasLocationPermissions()) {
                return null
            }
            
            suspendCancellableCoroutine<Location?> { continuation ->
                fusedLocationClient.lastLocation
                    .addOnSuccessListener { location ->
                        continuation.resume(location)
                    }
                    .addOnFailureListener { exception ->
                        continuation.resumeWithException(exception)
                    }
            }
        } catch (e: Exception) {
            null
        }
    }
    
    /**
     * Format location to string
     */
    fun formatLocationToString(location: Location?): String {
        return location?.let { "${it.latitude},${it.longitude}" } ?: ""
    }
    
    /**
     * Parse location from string
     */
    fun parseLocationFromString(locationString: String): Location? {
        return try {
            val parts = locationString.split(",")
            if (parts.size == 2) {
                val location = Location("GPS")
                location.latitude = parts[0].toDouble()
                location.longitude = parts[1].toDouble()
                location
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }
    
    /**
     * Calculate distance between two locations in meters
     */
    fun calculateDistanceBetween(
        lat1: Double, lon1: Double,
        lat2: Double, lon2: Double
    ): Float {
        val results = FloatArray(1)
        Location.distanceBetween(lat1, lon1, lat2, lon2, results)
        return results[0]
    }
    
    /**
     * Get location accuracy description
     */
    fun getAccuracyDescription(location: Location): String {
        return when {
            location.accuracy < 5 -> "מדויק מאוד"
            location.accuracy < 10 -> "מדויק"
            location.accuracy < 20 -> "סביר"
            location.accuracy < 50 -> "משוער"
            else -> "לא מדויק"
        }
    }
}