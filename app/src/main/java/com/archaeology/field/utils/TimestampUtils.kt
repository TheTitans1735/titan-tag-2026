package com.archaeology.field.utils

import java.text.SimpleDateFormat
import java.util.*

/**
 * Timestamp utility class for consistent date/time handling
 */
object TimestampUtils {
    
    private const val DATE_FORMAT = "yyyy-MM-dd HH:mm:ss"
    private const val DATE_FORMAT_SHORT = "yyyy-MM-dd"
    private const val TIME_FORMAT = "HH:mm:ss"
    private const val HEBREW_DATE_FORMAT = "dd/MM/yyyy HH:mm"
    
    /**
     * Get current timestamp in milliseconds
     */
    fun getCurrentTimestamp(): Long = System.currentTimeMillis()
    
    /**
     * Format timestamp to readable string
     */
    fun formatTimestamp(timestamp: Long, format: String = DATE_FORMAT): String {
        return try {
            val sdf = SimpleDateFormat(format, Locale.getDefault())
            sdf.format(Date(timestamp))
        } catch (e: Exception) {
            "Invalid timestamp"
        }
    }
    
    /**
     * Format timestamp to Hebrew readable string
     */
    fun formatTimestampHebrew(timestamp: Long): String {
        return try {
            val sdf = SimpleDateFormat(HEBREW_DATE_FORMAT, Locale("he", "IL"))
            sdf.format(Date(timestamp))
        } catch (e: Exception) {
            "תאריך לא חוקי"
        }
    }
    
    /**
     * Format timestamp to date only
     */
    fun formatDate(timestamp: Long): String {
        return formatTimestamp(timestamp, DATE_FORMAT_SHORT)
    }
    
    /**
     * Format timestamp to time only
     */
    fun formatTime(timestamp: Long): String {
        return formatTimestamp(timestamp, TIME_FORMAT)
    }
    
    /**
     * Parse timestamp from string
     */
    fun parseTimestamp(dateString: String, format: String = DATE_FORMAT): Long? {
        return try {
            val sdf = SimpleDateFormat(format, Locale.getDefault())
            sdf.parse(dateString)?.time
        } catch (e: Exception) {
            null
        }
    }
    
    /**
     * Get relative time description (e.g., "2 hours ago")
     */
    fun getRelativeTime(timestamp: Long): String {
        val now = getCurrentTimestamp()
        val diff = now - timestamp
        
        return when {
            diff < 60_000 -> "לפני פחות מדקה"
            diff < 3_600_000 -> "לפני ${diff / 60_000} דקות"
            diff < 86_400_000 -> "לפני ${diff / 3_600_000} שעות"
            diff < 604_800_000 -> "לפני ${diff / 86_400_000} ימים"
            else -> formatDate(timestamp)
        }
    }
    
    /**
     * Check if timestamp is today
     */
    fun isToday(timestamp: Long): Boolean {
        val today = Calendar.getInstance()
        val date = Calendar.getInstance()
        date.timeInMillis = timestamp
        
        return today.get(Calendar.YEAR) == date.get(Calendar.YEAR) &&
               today.get(Calendar.DAY_OF_YEAR) == date.get(Calendar.DAY_OF_YEAR)
    }
    
    /**
     * Check if timestamp is within last 24 hours
     */
    fun isLast24Hours(timestamp: Long): Boolean {
        val now = getCurrentTimestamp()
        val diff = now - timestamp
        return diff < 86_400_000 // 24 hours in milliseconds
    }
    
    /**
     * Get start of day timestamp
     */
    fun getStartOfDay(timestamp: Long): Long {
        val calendar = Calendar.getInstance()
        calendar.timeInMillis = timestamp
        calendar.set(Calendar.HOUR_OF_DAY, 0)
        calendar.set(Calendar.MINUTE, 0)
        calendar.set(Calendar.SECOND, 0)
        calendar.set(Calendar.MILLISECOND, 0)
        return calendar.timeInMillis
    }
    
    /**
     * Get end of day timestamp
     */
    fun getEndOfDay(timestamp: Long): Long {
        val calendar = Calendar.getInstance()
        calendar.timeInMillis = timestamp
        calendar.set(Calendar.HOUR_OF_DAY, 23)
        calendar.set(Calendar.MINUTE, 59)
        calendar.set(Calendar.SECOND, 59)
        calendar.set(Calendar.MILLISECOND, 999)
        return calendar.timeInMillis
    }
    
    /**
     * Generate unique ID with timestamp
     */
    fun generateTimestampedId(prefix: String = "ID"): String {
        val timestamp = getCurrentTimestamp()
        val random = (1000..9999).random()
        return "${prefix}_${timestamp}_$random"
    }
}