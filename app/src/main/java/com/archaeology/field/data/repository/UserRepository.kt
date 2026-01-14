package com.archaeology.field.data.repository

import com.archaeology.field.data.dao.UserDao
import com.archaeology.field.data.model.User
import com.archaeology.field.data.model.UserRole
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Repository for user operations
 */
@Singleton
class UserRepository @Inject constructor(
    private val userDao: UserDao
) {
    
    fun getAllUsers(): Flow<List<User>> = userDao.getAllUsers()
    
    suspend fun getUserByEmail(email: String): User? = userDao.getUserByEmail(email)
    
    fun observeUser(email: String): Flow<User?> = userDao.observeUser(email)
    
    fun getAdminUsers(): Flow<List<User>> = userDao.getAdminUsers()
    
    fun getUsersBySite(siteName: String): Flow<List<User>> = userDao.getUsersBySite(siteName)
    
    suspend fun insertUser(user: User) = userDao.insertUser(user)
    
    suspend fun insertUsers(users: List<User>) = userDao.insertUsers(users)
    
    suspend fun updateUser(user: User) = userDao.updateUser(user)
    
    suspend fun deleteUser(user: User) = userDao.deleteUser(user)
    
    suspend fun deleteUserByEmail(email: String) = userDao.deleteUserByEmail(email)
    
    suspend fun deleteAllUsers() = userDao.deleteAllUsers()
    
    /**
     * Authenticate user by email
     */
    suspend fun authenticateUser(email: String): User? {
        return userDao.getUserByEmail(email)
    }
    
    /**
     * Check if user has admin privileges
     */
    suspend fun isAdmin(email: String): Boolean {
        val user = userDao.getUserByEmail(email)
        return user?.role == UserRole.ADMIN
    }
    
    /**
     * Check if user can access specific site
     */
    suspend fun canAccessSite(email: String, siteName: String): Boolean {
        val user = userDao.getUserByEmail(email) ?: return false
        return when (user.role) {
            UserRole.ADMIN -> true
            UserRole.WORKER -> user.assignedSite == siteName
        }
    }
}