package com.archaeology.field.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.ForeignKey
import androidx.room.Index

/**
 * Finding entity representing the Findings table
 */
@Entity(
    tableName = "findings",
    foreignKeys = [
        ForeignKey(
            entity = Site::class,
            parentColumns = ["siteName"],
            childColumns = ["siteName"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index(value = ["findingID"], unique = true),
        Index(value = ["siteName"])
    ]
)
data class Finding(
    @PrimaryKey
    val findingID: String,
    val siteName: String,
    val area: String,
    val layer: String,
    val description: String = "",
    val voiceTranscription: String = "",
    val gpsCoordinates: String = "", // Format: "latitude,longitude"
    val dateCreated: Long = System.currentTimeMillis()
)