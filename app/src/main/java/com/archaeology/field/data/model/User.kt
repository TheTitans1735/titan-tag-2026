package com.archaeology.field.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * User roles enumeration
 */
enum class UserRole {
    ADMIN,
    WORKER
}

/**
 * User entity representing the Users table
 */
@Entity(tableName = "users")
data class User(
    @PrimaryKey
    val email: String,
    val name: String,
    val role: UserRole,
    val assignedSite: String? = null
)