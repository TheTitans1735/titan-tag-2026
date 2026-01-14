package com.archaeology.field.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.ForeignKey
import androidx.room.Index

/**
 * Photo entity representing the Photos table
 */
@Entity(
    tableName = "photos",
    foreignKeys = [
        ForeignKey(
            entity = Finding::class,
            parentColumns = ["findingID"],
            childColumns = ["findingID"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index(value = ["photoID"], unique = true),
        Index(value = ["findingID"])
    ]
)
data class Photo(
    @PrimaryKey
    val photoID: String,
    val findingID: String,
    val imageFile: String, // Path to the image file
    val dateCreated: Long = System.currentTimeMillis()
)