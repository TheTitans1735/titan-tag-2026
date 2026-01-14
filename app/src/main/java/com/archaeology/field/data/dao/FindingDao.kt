package com.archaeology.field.data.dao

import androidx.room.*
import com.archaeology.field.data.model.Finding
import kotlinx.coroutines.flow.Flow

/**
 * Data Access Object for Finding operations
 */
@Dao
interface FindingDao {
    
    @Query("SELECT * FROM findings")
    fun getAllFindings(): Flow<List<Finding>>
    
    @Query("SELECT * FROM findings WHERE findingID = :findingID")
    suspend fun getFindingById(findingID: String): Finding?
    
    @Query("SELECT * FROM findings WHERE findingID = :findingID")
    fun observeFinding(findingID: String): Flow<Finding?>
    
    @Query("SELECT * FROM findings WHERE siteName = :siteName")
    fun getFindingsBySite(siteName: String): Flow<List<Finding>>
    
    @Query("SELECT * FROM findings WHERE siteName = :siteName AND area = :area")
    fun getFindingsBySiteAndArea(siteName: String, area: String): Flow<List<Finding>>
    
    @Query("SELECT * FROM findings WHERE siteName = :siteName AND area = :area AND layer = :layer")
    fun getFindingsBySiteAreaLayer(siteName: String, area: String, layer: String): Flow<List<Finding>>
    
    @Query("SELECT COUNT(*) FROM findings WHERE siteName = :siteName")
    suspend fun getFindingsCountBySite(siteName: String): Int
    
    @Query("SELECT COUNT(*) FROM findings")
    suspend fun getTotalFindingsCount(): Int
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertFinding(finding: Finding)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertFindings(findings: List<Finding>)
    
    @Update
    suspend fun updateFinding(finding: Finding)
    
    @Delete
    suspend fun deleteFinding(finding: Finding)
    
    @Query("DELETE FROM findings WHERE findingID = :findingID")
    suspend fun deleteFindingById(findingID: String)
    
    @Query("DELETE FROM findings")
    suspend fun deleteAllFindings()
    
    @Query("SELECT * FROM findings ORDER BY dateCreated DESC")
    fun getFindingsOrderByDate(): Flow<List<Finding>>
    
    @Query("SELECT * FROM findings WHERE dateCreated >= :startDate AND dateCreated <= :endDate")
    fun getFindingsByDateRange(startDate: Long, endDate: Long): Flow<List<Finding>>
}