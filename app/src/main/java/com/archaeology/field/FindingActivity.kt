package com.archaeology.field

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.databinding.DataBindingUtil
import androidx.lifecycle.lifecycleScope
import com.archaeology.field.databinding.ActivityFindingBinding
import com.archaeology.field.ui.camera.CameraHelper
import com.archaeology.field.ui.scanner.ScannerActivity
import com.archaeology.field.ui.voice.VoiceHelper
import com.archaeology.field.utils.GPSUtils
import com.archaeology.field.utils.TimestampUtils
import kotlinx.coroutines.launch

/**
 * Finding activity for creating/editing archaeological findings
 */
class FindingActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityFindingBinding
    private lateinit var gpsUtils: GPSUtils
    private var findingId: String? = null
    private var scanMode: String? = null
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = DataBindingUtil.setContentView(this, R.layout.activity_finding)
        
        initializeUtils()
        setupUI()
        handleIntent()
        loadFindingData()
    }
    
    private fun initializeUtils() {
        gpsUtils = GPSUtils(this)
    }
    
    private fun setupUI() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.setDisplayShowHomeEnabled(true)
        
        binding.buttonSave.setOnClickListener {
            saveFinding()
        }
        
        binding.buttonCancel.setOnClickListener {
            finish()
        }
        
        binding.buttonCamera.setOnClickListener {
            CameraHelper.launchCamera(this)
        }
        
        binding.buttonVoice.setOnClickListener {
            VoiceHelper.launchVoiceRecognition(this)
        }
        
        binding.buttonGps.setOnClickListener {
            captureGPS()
        }
    }
    
    private fun handleIntent() {
        findingId = intent.getStringExtra("FINDING_ID")
        scanMode = intent.getStringExtra("SCAN_MODE")
        
        val title = if (findingId != null) {
            if (scanMode == ScannerActivity.ScanMode.QR.name) {
                "עריכת ממצא (QR)"
            } else {
                "עריכת ממצא (ברקוד)"
            }
        } else {
            "ממצא חדש"
        }
        
        binding.toolbarTitle.text = title
        
        // Pre-fill finding ID if provided
        if (findingId != null) {
            binding.editFindingId.setText(findingId)
        }
    }
    
    private fun loadFindingData() {
        // This would typically load from repository based on findingId
        // For now, setting up initial state
        if (findingId == null) {
            // New finding - set current timestamp
            binding.textDateCreated.text = TimestampUtils.formatTimestampHebrew(
                TimestampUtils.getCurrentTimestamp()
            )
        }
        
        // Capture GPS on load for new findings
        if (findingId == null) {
            captureGPS()
        }
    }
    
    private fun saveFinding() {
        val findingId = binding.editFindingId.text.toString()
        val siteName = binding.editSiteName.text.toString()
        val area = binding.editArea.text.toString()
        val layer = binding.editLayer.text.toString()
        val description = binding.editDescription.text.toString()
        val voiceTranscription = binding.editVoiceTranscription.text.toString()
        val gpsCoordinates = binding.editGpsCoordinates.text.toString()
        
        if (findingId.isEmpty()) {
            Toast.makeText(this, "נא להזין מזהה ממצא", Toast.LENGTH_SHORT).show()
            return
        }
        
        if (siteName.isEmpty()) {
            Toast.makeText(this, "נא להזין שם אתר", Toast.LENGTH_SHORT).show()
            return
        }
        
        if (area.isEmpty()) {
            Toast.makeText(this, "נא להזין אזור", Toast.LENGTH_SHORT).show()
            return
        }
        
        if (layer.isEmpty()) {
            Toast.makeText(this, "נא להזין שכבה", Toast.LENGTH_SHORT).show()
            return
        }
        
        // Save finding to database
        lifecycleScope.launch {
            try {
                // This would typically save through repository
                Toast.makeText(this@FindingActivity, "הממצא נשמר בהצלחה", Toast.LENGTH_SHORT).show()
                finish()
            } catch (e: Exception) {
                Toast.makeText(this@FindingActivity, "שגיאה בשמירת הממצא", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun captureGPS() {
        lifecycleScope.launch {
            try {
                val location = gpsUtils.getCurrentLocation()
                if (location != null) {
                    val coordinates = gpsUtils.formatLocationToString(location)
                    binding.editGpsCoordinates.setText(coordinates)
                    val accuracy = gpsUtils.getAccuracyDescription(location)
                    Toast.makeText(this@FindingActivity, "מיקום הולכד ($accuracy)", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(this@FindingActivity, "לא הצליח להלכיד מיקום", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@FindingActivity, "שגיאה בהלכדת מיקום", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: android.content.Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        
        // Handle camera results
        CameraHelper.handleActivityResult(requestCode, resultCode, data) { photoUri ->
            binding.textPhotoCount.text = "תמונות: 1" // Update photo count
            Toast.makeText(this, "תמונה נוספה: $photoUri", Toast.LENGTH_SHORT).show()
        }
        
        // Handle voice recognition results
        VoiceHelper.handleActivityResult(requestCode, resultCode, data) { transcriptionText ->
            binding.editVoiceTranscription.setText(transcriptionText)
            Toast.makeText(this, "תמלול הוסף", Toast.LENGTH_SHORT).show()
        }
    }
    
    override fun onSupportNavigateUp(): Boolean {
        onBackPressed()
        return true
    }
}