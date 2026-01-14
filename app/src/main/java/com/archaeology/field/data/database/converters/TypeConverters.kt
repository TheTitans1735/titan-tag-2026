package com.archaeology.field.data.database.converters

import androidx.room.TypeConverter
import com.archaeology.field.data.model.UserRole
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

/**
 * Type converter for UserRole enum
 */
class UserRoleConverter {
    
    @TypeConverter
    fun fromUserRole(role: UserRole): String {
        return role.name
    }
    
    @TypeConverter
    fun toUserRole(role: String): UserRole {
        return UserRole.valueOf(role)
    }
}

/**
 * Type converter for String lists (used for areas and layers)
 */
class StringListConverter {
    
    private val gson = Gson()
    
    @TypeConverter
    fun fromStringList(list: List<String>): String {
        return gson.toJson(list)
    }
    
    @TypeConverter
    fun toStringList(json: String): List<String> {
        val type = object : TypeToken<List<String>>() {}.type
        return gson.fromJson(json, type) ?: emptyList()
    }
}