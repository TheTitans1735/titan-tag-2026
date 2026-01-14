package com.archaeology.field.data.repository

import com.archaeology.field.data.dao.SiteDao
import com.archaeology.field.data.model.Site
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Repository for site operations
 */
@Singleton
class SiteRepository @Inject constructor(
    private val siteDao: SiteDao
) {
    
    fun getAllSites(): Flow<List<Site>> = siteDao.getAllSites()
    
    suspend fun getSiteByName(siteName: String): Site? = siteDao.getSiteByName(siteName)
    
    fun observeSite(siteName: String): Flow<Site?> = siteDao.observeSite(siteName)
    
    suspend fun insertSite(site: Site) = siteDao.insertSite(site)
    
    suspend fun insertSites(sites: List<Site>) = siteDao.insertSites(sites)
    
    suspend fun updateSite(site: Site) = siteDao.updateSite(site)
    
    suspend fun deleteSite(site: Site) = siteDao.deleteSite(site)
    
    suspend fun deleteSiteByName(siteName: String) = siteDao.deleteSiteByName(siteName)
    
    suspend fun deleteAllSites() = siteDao.deleteAllSites()
    
    fun getSiteNames(): Flow<List<String>> = siteDao.getSiteNames()
    
    /**
     * Get areas for a specific site
     */
    suspend fun getAreasForSite(siteName: String): List<String> {
        val site = siteDao.getSiteByName(siteName)
        return site?.let { parseJsonList(it.areas) } ?: emptyList()
    }
    
    /**
     * Get layers for a specific site
     */
    suspend fun getLayersForSite(siteName: String): List<String> {
        val site = siteDao.getSiteByName(siteName)
        return site?.let { parseJsonList(it.layers) } ?: emptyList()
    }
    
    /**
     * Helper function to parse JSON string list
     */
    private fun parseJsonList(json: String): List<String> {
        return try {
            com.google.gson.Gson().fromJson(json, Array<String>::class.java).toList()
        } catch (e: Exception) {
            emptyList()
        }
    }
}