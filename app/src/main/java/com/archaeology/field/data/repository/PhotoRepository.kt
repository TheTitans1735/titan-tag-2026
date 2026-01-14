package com.archaeology.field.data.repository

import com.archaeology.field.data.dao.PhotoDao
import com.archaeology.field.data.model.Photo
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Repository for photo operations
 */
@Singleton
class PhotoRepository @Inject constructor(
    private val photoDao: PhotoDao
) {
    
    fun getAllPhotos(): Flow<List<Photo>> = photoDao.getAllPhotos()
    
    suspend fun getPhotoById(photoID: String): Photo? = photoDao.getPhotoById(photoID)
    
    fun getPhotosByFinding(findingID: String): Flow<List<Photo>> = photoDao.getPhotosByFinding(findingID)
    
    suspend fun getPhotosCountByFinding(findingID: String): Int = photoDao.getPhotosCountByFinding(findingID)
    
    suspend fun insertPhoto(photo: Photo) = photoDao.insertPhoto(photo)
    
    suspend fun insertPhotos(photos: List<Photo>) = photoDao.insertPhotos(photos)
    
    suspend fun updatePhoto(photo: Photo) = photoDao.updatePhoto(photo)
    
    suspend fun deletePhoto(photo: Photo) = photoDao.deletePhoto(photo)
    
    suspend fun deletePhotoById(photoID: String) = photoDao.deletePhotoById(photoID)
    
    suspend fun deletePhotosByFinding(findingID: String) = photoDao.deletePhotosByFinding(findingID)
    
    suspend fun deleteAllPhotos() = photoDao.deleteAllPhotos()
    
    fun getPhotosOrderByDate(): Flow<List<Photo>> = photoDao.getPhotosOrderByDate()
    
    /**
     * Create new photo with auto-generated ID
     */
    suspend fun createNewPhoto(findingID: String, imageFile: String): Photo {
        val photoID = generatePhotoID()
        return Photo(
            photoID = photoID,
            findingID = findingID,
            imageFile = imageFile,
            dateCreated = System.currentTimeMillis()
        )
    }
    
    /**
     * Generate unique photo ID
     */
    private fun generatePhotoID(): String {
        val timestamp = System.currentTimeMillis()
        val random = (1000..9999).random()
        return "PHO${timestamp}$random"
    }
}