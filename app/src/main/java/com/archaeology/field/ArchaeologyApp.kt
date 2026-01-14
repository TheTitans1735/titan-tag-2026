package com.archaeology.field

import android.app.Application
import com.archaeology.field.data.database.ArchaeologyDatabase

/**
 * Application class for the archaeology field documentation app
 */
class ArchaeologyApp : Application() {
    
    val database by lazy { ArchaeologyDatabase.getDatabase(this) }
    
    override fun onCreate() {
        super.onCreate()
    }
}