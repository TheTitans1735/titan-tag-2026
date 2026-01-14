package com.archaeology.field.data.dao

import androidx.room.*
import com.archaeology.field.data.model.User
import kotlinx.coroutines.flow.Flow

/**
 * Data Access Object for User operations
 */
@Dao
interface UserDao {
    
    @Query("SELECT * FROM users")
    fun getAllUsers(): Flow<List<User>>
    
    @Query("SELECT * FROM users WHERE email = :email")
    suspend fun getUserByEmail(email: String): User?
    
    @Query("SELECT * FROM users WHERE email = :email")
    fun observeUser(email: String): Flow<User?>
    
    @Query("SELECT * FROM users WHERE role = 'ADMIN'")
    fun getAdminUsers(): Flow<List<User>>
    
    @Query("SELECT * FROM users WHERE assignedSite = :siteName")
    fun getUsersBySite(siteName: String): Flow<List<User>>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: User)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUsers(users: List<User>)
    
    @Update
    suspend fun updateUser(user: User)
    
    @Delete
    suspend fun deleteUser(user: User)
    
    @Query("DELETE FROM users WHERE email = :email")
    suspend fun deleteUserByEmail(email: String)
    
    @Query("DELETE FROM users")
    suspend fun deleteAllUsers()
}