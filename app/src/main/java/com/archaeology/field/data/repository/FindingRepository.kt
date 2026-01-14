package com.archaeology.field.data.repository

import com.archaeology.field.data.dao.FindingDao
import com.archaeology.field.data.model.Finding
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Repository for finding operations
 */
@Singleton
class FindingRepository @Inject constructor(
    private val findingDao: FindingDao
) {
    
    fun getAllFindings(): Flow<List<Finding>> = findingDao.getAllFindings()
    
    suspend fun getFindingById(findingID: String): Finding? = findingDao.getFindingById(findingID)
    
    fun observeFinding(findingID: String): Flow<Finding?> = findingDao.observeFinding(findingID)
    
    fun getFindingsBySite(siteName: String): Flow<List<Finding>> = findingDao.getFindingsBySite(siteName)
    
    fun getFindingsBySiteAndArea(siteName: String, area: String): Flow<List<Finding>> = 
        findingDao.getFindingsBySiteAndArea(siteName, area)
    
    fun getFindingsBySiteAreaLayer(siteName: String, area: String, layer: String): Flow<List<Finding>> = 
        findingDao.getFindingsBySiteAreaLayer(siteName, area, layer)
    
    suspend fun getFindingsCountBySite(siteName: String): Int = findingDao.getFindingsCountBySite(siteName)
    
    suspend fun getTotalFindingsCount(): Int = findingDao.getTotalFindingsCount()
    
    suspend fun insertFinding(finding: Finding) = findingDao.insertFinding(finding)
    
    suspend fun insertFindings(findings: List<Finding>) = findingDao.insertFindings(findings)
    
    suspend fun updateFinding(finding: Finding) = findingDao.updateFinding(finding)
    
    suspend fun deleteFinding(finding: Finding) = findingDao.deleteFinding(finding)
    
    suspend fun deleteFindingById(findingID: String) = findingDao.deleteFindingById(findingID)
    
    suspend fun deleteAllFindings() = findingDao.deleteAllFindings()
    
    fun getFindingsOrderByDate(): Flow<List<Finding>> = findingDao.getFindingsOrderByDate()
    
    fun getFindingsByDateRange(startDate: Long, endDate: Long): Flow<List<Finding>> = 
        findingDao.getFindingsByDateRange(startDate, endDate)
    
    /**
     * Check if finding ID exists
     */
    suspend fun findingExists(findingID: String): Boolean {
        return findingDao.getFindingById(findingID) != null
    }
    
    /**
     * Create new finding with auto-generated ID if needed
     */
    suspend fun createNewFinding(siteName: String, area: String, layer: String): Finding {
        val findingID = generateFindingID()
        return Finding(
            findingID = findingID,
            siteName = siteName,
            area = area,
            layer = layer,
            dateCreated = System.currentTimeMillis()
        )
    }
    
    /**
     * Generate unique finding ID
     */
    private fun generateFindingID(): String {
        val timestamp = System.currentTimeMillis()
        val random = (1000..9999).random()
        return "FND${timestamp}$random"
    }
}