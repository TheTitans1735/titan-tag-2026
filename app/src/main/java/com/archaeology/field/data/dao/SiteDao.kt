package com.archaeology.field.data.dao

import androidx.room.*
import com.archaeology.field.data.model.Site
import kotlinx.coroutines.flow.Flow

/**
 * Data Access Object for Site operations
 */
@Dao
interface SiteDao {
    
    @Query("SELECT * FROM sites")
    fun getAllSites(): Flow<List<Site>>
    
    @Query("SELECT * FROM sites WHERE siteName = :siteName")
    suspend fun getSiteByName(siteName: String): Site?
    
    @Query("SELECT * FROM sites WHERE siteName = :siteName")
    fun observeSite(siteName: String): Flow<Site?>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSite(site: Site)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSites(sites: List<Site>)
    
    @Update
    suspend fun updateSite(site: Site)
    
    @Delete
    suspend fun deleteSite(site: Site)
    
    @Query("DELETE FROM sites WHERE siteName = :siteName")
    suspend fun deleteSiteByName(siteName: String)
    
    @Query("DELETE FROM sites")
    suspend fun deleteAllSites()
    
    @Query("SELECT siteName FROM sites")
    fun getSiteNames(): Flow<List<String>>
}