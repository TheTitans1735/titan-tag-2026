package com.archaeology.field.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Site entity representing the Sites table
 */
@Entity(tableName = "sites")
data class Site(
    @PrimaryKey
    val siteName: String,
    val locationGps: String, // Format: "latitude,longitude"
    val areas: String, // JSON array of area names
    val layers: String  // JSON array of layer names
)