package com.archaeology.field

import android.content.Intent
import android.os.Bundle
import android.view.MenuItem
import android.widget.Toast
import androidx.appcompat.app.ActionBarDrawerToggle
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.GravityCompat
import androidx.databinding.DataBindingUtil
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import com.archaeology.field.databinding.ActivityMainBinding
import com.archaeology.field.ui.camera.CameraHelper
import com.archaeology.field.ui.scanner.ScannerHelper
import com.archaeology.field.ui.scanner.ScannerActivity
import com.archaeology.field.ui.voice.VoiceHelper
import com.archaeology.field.utils.GPSUtils
import com.archaeology.field.utils.PermissionUtils
import com.google.android.material.navigation.NavigationView
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity(), NavigationView.OnNavigationItemSelectedListener {
    
    private lateinit var binding: ActivityMainBinding
    private lateinit var actionBarDrawerToggle: ActionBarDrawerToggle
    private lateinit var gpsUtils: GPSUtils
    private lateinit var permissionUtils: PermissionUtils
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = DataBindingUtil.setContentView(this, R.layout.activity_main)
        
        initializeUtils()
        setupUI()
        setupNavigation()
        setupClickListeners()
        loadDashboardData()
    }
    
    private fun initializeUtils() {
        gpsUtils = GPSUtils(this)
        permissionUtils = PermissionUtils(this)
    }
    
    private fun setupUI() {
        setSupportActionBar(binding.toolbar)
        
        // Setup drawer toggle
        actionBarDrawerToggle = ActionBarDrawerToggle(
            this,
            binding.drawerLayout,
            binding.toolbar,
            R.string.nav_open_drawer,
            R.string.nav_close_drawer
        )
        binding.drawerLayout.addDrawerListener(actionBarDrawerToggle)
        actionBarDrawerToggle.syncState()
        
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
    }
    
    private fun setupNavigation() {
        binding.navigationView.setNavigationItemSelectedListener(this)
        binding.bottomNavigation.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_dashboard -> {
                    // Show dashboard fragment
                    true
                }
                R.id.nav_findings -> {
                    // Show findings fragment
                    true
                }
                R.id.nav_sites -> {
                    // Show sites fragment
                    true
                }
                R.id.nav_users -> {
                    // Show users fragment (admin only)
                    true
                }
                R.id.nav_settings -> {
                    // Show settings
                    true
                }
                else -> false
            }
        }
    }
    
    private fun setupClickListeners() {
        // Menu button
        binding.menuButton.setOnClickListener {
            binding.drawerLayout.openDrawer(GravityCompat.START)
        }
        
        // Scan QR button
        binding.buttonScanQr.setOnClickListener {
            ScannerHelper.launchQRScanner(this)
        }
        
        // Scan Barcode button
        binding.buttonScanBarcode.setOnClickListener {
            ScannerHelper.launchBarcodeScanner(this)
        }
    }
    
    private fun loadDashboardData() {
        lifecycleScope.launch {
            try {
                // Load dashboard data in background
                updateDashboardSummary()
            } catch (e: Exception) {
                Toast.makeText(this@MainActivity, "Failed to load data", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun updateDashboardSummary() {
        // This would typically load from repository
        // For now, using placeholder values
        binding.textTotalFindings.text = "0"
        binding.textTotalSites.text = "0"
        binding.textTodayFindings.text = "0"
    }
    
    override fun onNavigationItemSelected(item: MenuItem): Boolean {
        when (item.itemId) {
            R.id.nav_dashboard -> {
                // Dashboard
                binding.bottomNavigation.selectedItemId = R.id.nav_dashboard
            }
            R.id.nav_findings -> {
                // Findings
                binding.bottomNavigation.selectedItemId = R.id.nav_findings
            }
            R.id.nav_sites -> {
                // Sites
                binding.bottomNavigation.selectedItemId = R.id.nav_sites
            }
            R.id.nav_users -> {
                // Users (admin only)
                binding.bottomNavigation.selectedItemId = R.id.nav_users
            }
            R.id.nav_export -> {
                // Export data
                exportData()
            }
            R.id.nav_import -> {
                // Import data
                importData()
            }
            R.id.nav_settings -> {
                // Settings
                binding.bottomNavigation.selectedItemId = R.id.nav_settings
            }
        }
        
        binding.drawerLayout.closeDrawer(GravityCompat.START)
        return true
    }
    
    private fun exportData() {
        // Implement export functionality
        Toast.makeText(this, "Export feature coming soon", Toast.LENGTH_SHORT).show()
    }
    
    private fun importData() {
        // Implement import functionality
        Toast.makeText(this, "Import feature coming soon", Toast.LENGTH_SHORT).show()
    }
    
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        
        // Handle scanner results
        ScannerHelper.handleActivityResult(requestCode, resultCode, data) { scannedText, scanMode ->
            handleScanResult(scannedText, scanMode)
        }
        
        // Handle camera results
        CameraHelper.handleActivityResult(requestCode, resultCode, data) { photoUri ->
            handleCameraResult(photoUri)
        }
        
        // Handle voice recognition results
        VoiceHelper.handleActivityResult(requestCode, resultCode, data) { transcriptionText ->
            handleVoiceResult(transcriptionText)
        }
    }
    
    private fun handleScanResult(scannedText: String, scanMode: ScannerActivity.ScanMode) {
        Toast.makeText(this, "Scanned: $scannedText (${scanMode.name})", Toast.LENGTH_LONG).show()
        
        // Navigate to finding edit/create screen
        // This would typically check if finding exists and open appropriate screen
        val intent = Intent(this, FindingActivity::class.java).apply {
            putExtra("FINDING_ID", scannedText)
            putExtra("SCAN_MODE", scanMode.name)
        }
        startActivity(intent)
    }
    
    private fun handleCameraResult(photoUri: String) {
        Toast.makeText(this, "Photo saved: $photoUri", Toast.LENGTH_LONG).show()
        // Handle photo result - would typically attach to current finding
    }
    
    private fun handleVoiceResult(transcriptionText: String) {
        Toast.makeText(this, "Voice transcription: $transcriptionText", Toast.LENGTH_LONG).show()
        // Handle voice result - would typically set in voice transcription field
    }
    
    override fun onBackPressed() {
        if (binding.drawerLayout.isDrawerOpen(GravityCompat.START)) {
            binding.drawerLayout.closeDrawer(GravityCompat.START)
        } else {
            super.onBackPressed()
        }
    }
    
    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return if (actionBarDrawerToggle.onOptionsItemSelected(item)) {
            true
        } else {
            super.onOptionsItemSelected(item)
        }
    }
}