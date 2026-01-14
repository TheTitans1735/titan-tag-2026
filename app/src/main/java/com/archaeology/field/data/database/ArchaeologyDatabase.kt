package com.archaeology.field.data.database

import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import android.content.Context
import com.archaeology.field.data.dao.*
import com.archaeology.field.data.model.*
import com.archaeology.field.data.database.converters.*

/**
 * Main Room database for the archaeology field documentation app
 */
@Database(
    entities = [
        User::class,
        Site::class,
        Finding::class,
        Photo::class
    ],
    version = 1,
    exportSchema = false
)
@TypeConverters(
    UserRoleConverter::class,
    StringListConverter::class
)
abstract class ArchaeologyDatabase : RoomDatabase() {
    
    abstract fun userDao(): UserDao
    abstract fun siteDao(): SiteDao
    abstract fun findingDao(): FindingDao
    abstract fun photoDao(): PhotoDao
    
    companion object {
        @Volatile
        private var INSTANCE: ArchaeologyDatabase? = null
        
        fun getDatabase(context: Context): ArchaeologyDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    ArchaeologyDatabase::class.java,
                    "archaeology_database"
                )
                .fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}