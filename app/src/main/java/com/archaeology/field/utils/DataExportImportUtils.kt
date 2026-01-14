package com.archaeology.field.utils

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.core.content.FileProvider
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.archaeology.field.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

/**
 * Export/Import utility for data sharing
 */
class DataExportImportUtils(private val context: Context) {
    
    private val gson = Gson()
    
    /**
     * Export all data to compressed file
     */
    suspend fun exportAllData(
        users: List<User>,
        sites: List<Site>,
        findings: List<Finding>,
        photos: List<Photo>
    ): Uri? = withContext(Dispatchers.IO) {
        try {
            val timestamp = System.currentTimeMillis()
            val exportDir = File(context.cacheDir, "exports")
            exportDir.mkdirs()
            
            // Create JSON files for each table
            val usersJson = gson.toJson(users)
            val sitesJson = gson.toJson(sites)
            val findingsJson = gson.toJson(findings)
            val photosJson = gson.toJson(photos)
            
            // Write JSON files
            val usersFile = File(exportDir, "users_$timestamp.json")
            val sitesFile = File(exportDir, "sites_$timestamp.json")
            val findingsFile = File(exportDir, "findings_$timestamp.json")
            val photosFile = File(exportDir, "photos_$timestamp.json")
            
            usersFile.writeText(usersJson)
            sitesFile.writeText(sitesJson)
            findingsFile.writeText(findingsJson)
            photosFile.writeText(photosJson)
            
            // Create ZIP file
            val zipFile = File(exportDir, "archaeology_data_$timestamp.zip")
            createZipFile(
                zipFile,
                listOf(usersFile, sitesFile, findingsFile, photosFile)
            )
            
            // Clean up JSON files
            usersFile.delete()
            sitesFile.delete()
            findingsFile.delete()
            photosFile.delete()
            
            // Return URI for sharing
            FileProvider.getUriForFile(
                context,
                "${context.packageName}.fileprovider",
                zipFile
            )
        } catch (e: Exception) {
            null
        }
    }
    
    /**
     * Create ZIP file from multiple files
     */
    private fun createZipFile(zipFile: File, files: List<File>) {
        ZipOutputStream(FileOutputStream(zipFile)).use { zipOut ->
            files.forEach { file ->
                if (file.exists()) {
                    zipOut.putNextEntry(ZipEntry(file.name))
                    file.inputStream().use { input ->
                        input.copyTo(zipOut)
                    }
                    zipOut.closeEntry()
                }
            }
        }
    }
    
    /**
     * Import data from file
     */
    suspend fun importDataFromFile(uri: Uri): ImportResult = withContext(Dispatchers.IO) {
        try {
            val content = context.contentResolver.openInputStream(uri)?.use { input ->
                input.bufferedReader().use { reader ->
                    reader.readText()
                }
            } ?: return@withContext ImportResult(success = false, error = "Could not read file")
            
            // Try to parse as JSON
            val dataType = detectDataType(content)
            when (dataType) {
                DataType.USERS -> {
                    val users = parseUsers(content)
                    ImportResult(success = true, users = users)
                }
                DataType.SITES -> {
                    val sites = parseSites(content)
                    ImportResult(success = true, sites = sites)
                }
                DataType.FINDINGS -> {
                    val findings = parseFindings(content)
                    ImportResult(success = true, findings = findings)
                }
                DataType.PHOTOS -> {
                    val photos = parsePhotos(content)
                    ImportResult(success = true, photos = photos)
                }
                DataType.UNKNOWN -> {
                    ImportResult(success = false, error = "Unknown data format")
                }
            }
        } catch (e: Exception) {
            ImportResult(success = false, error = "Import failed: ${e.message}")
        }
    }
    
    /**
     * Detect data type from JSON content
     */
    private fun detectDataType(content: String): DataType {
        return try {
            val jsonObject = gson.fromJson(content, Map::class.java) as Map<String, Any>
            when {
                jsonObject.containsKey("email") -> DataType.USERS
                jsonObject.containsKey("siteName") && jsonObject.containsKey("locationGps") -> DataType.SITES
                jsonObject.containsKey("findingID") && jsonObject.containsKey("siteName") -> DataType.FINDINGS
                jsonObject.containsKey("photoID") && jsonObject.containsKey("findingID") -> DataType.PHOTOS
                else -> DataType.UNKNOWN
            }
        } catch (e: Exception) {
            // Try to detect array format
            if (content.trim().startsWith("[") && content.contains("\"email\"")) DataType.USERS
            else if (content.trim().startsWith("[") && content.contains("\"siteName\"")) {
                if (content.contains("\"findingID\"")) DataType.FINDINGS
                else if (content.contains("\"photoID\"")) DataType.PHOTOS
                else DataType.SITES
            } else DataType.UNKNOWN
        }
    }
    
    private fun parseUsers(content: String): List<User> {
        val type = object : TypeToken<List<User>>() {}.type
        return gson.fromJson(content, type)
    }
    
    private fun parseSites(content: String): List<Site> {
        val type = object : TypeToken<List<Site>>() {}.type
        return gson.fromJson(content, type)
    }
    
    private fun parseFindings(content: String): List<Finding> {
        val type = object : TypeToken<List<Finding>>() {}.type
        return gson.fromJson(content, type)
    }
    
    private fun parsePhotos(content: String): List<Photo> {
        val type = object : TypeToken<List<Photo>>() {}.type
        return gson.fromJson(content, type)
    }
    
    /**
     * Share export file
     */
    fun shareExportFile(uri: Uri) {
        val shareIntent = Intent().apply {
            action = Intent.ACTION_SEND
            type = "application/zip"
            putExtra(Intent.EXTRA_STREAM, uri)
            putExtra(Intent.EXTRA_SUBJECT, "Archaeology Field Data Export")
            putExtra(Intent.EXTRA_TEXT, "Archaeology field documentation data export")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        context.startActivity(Intent.createChooser(shareIntent, "Share Export File"))
    }
    
    enum class DataType {
        USERS, SITES, FINDINGS, PHOTOS, UNKNOWN
    }
    
    data class ImportResult(
        val success: Boolean,
        val error: String? = null,
        val users: List<User>? = null,
        val sites: List<Site>? = null,
        val findings: List<Finding>? = null,
        val photos: List<Photo>? = null
    )
}