package com.archaeology.field.data.dao

import androidx.room.*
import com.archaeology.field.data.model.Photo
import kotlinx.coroutines.flow.Flow

/**
 * Data Access Object for Photo operations
 */
@Dao
interface PhotoDao {
    
    @Query("SELECT * FROM photos")
    fun getAllPhotos(): Flow<List<Photo>>
    
    @Query("SELECT * FROM photos WHERE photoID = :photoID")
    suspend fun getPhotoById(photoID: String): Photo?
    
    @Query("SELECT * FROM photos WHERE findingID = :findingID")
    fun getPhotosByFinding(findingID: String): Flow<List<Photo>>
    
    @Query("SELECT COUNT(*) FROM photos WHERE findingID = :findingID")
    suspend fun getPhotosCountByFinding(findingID: String): Int
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPhoto(photo: Photo)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPhotos(photos: List<Photo>)
    
    @Update
    suspend fun updatePhoto(photo: Photo)
    
    @Delete
    suspend fun deletePhoto(photo: Photo)
    
    @Query("DELETE FROM photos WHERE photoID = :photoID")
    suspend fun deletePhotoById(photoID: String)
    
    @Query("DELETE FROM photos WHERE findingID = :findingID")
    suspend fun deletePhotosByFinding(findingID: String)
    
    @Query("DELETE FROM photos")
    suspend fun deleteAllPhotos()
    
    @Query("SELECT * FROM photos ORDER BY dateCreated DESC")
    fun getPhotosOrderByDate(): Flow<List<Photo>>
}