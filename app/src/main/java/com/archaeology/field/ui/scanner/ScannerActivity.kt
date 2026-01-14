package com.archaeology.field.ui.scanner

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.archaeology.field.databinding.ActivityScannerBinding
import com.journeyapps.barcodescanner.BarcodeCallback
import com.journeyapps.barcodescanner.BarcodeResult
import com.journeyapps.barcodescanner.DecoratedBarcodeView

/**
 * Scanner activity for QR codes and barcodes
 */
class ScannerActivity : AppCompatActivity(), BarcodeCallback {
    
    private lateinit var binding: ActivityScannerBinding
    private var scanMode = ScanMode.QR // Default to QR mode
    
    enum class ScanMode {
        QR, BARCODE
    }
    
    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (isGranted) {
            startScanning()
        } else {
            Toast.makeText(this, "Camera permission required", Toast.LENGTH_SHORT).show()
            finish()
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityScannerBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setupUI()
        checkCameraPermission()
    }
    
    private fun setupUI() {
        // Get scan mode from intent
        scanMode = intent?.getSerializableExtra("SCAN_MODE") as? ScanMode ?: ScanMode.QR
        
        // Set title based on scan mode
        val title = when (scanMode) {
            ScanMode.QR -> "סריקת QR קוד"
            ScanMode.BARCODE -> "סריקת ברקוד"
        }
        binding.toolbarTitle.text = title
        
        // Setup buttons
        binding.buttonClose.setOnClickListener {
            finish()
        }
        
        // Configure scanner based on mode
        configureScanner()
    }
    
    private fun configureScanner() {
        when (scanMode) {
            ScanMode.QR -> {
                binding.barcodeScanner.setTorchOff()
                // Configure for QR codes
                binding.barcodeScanner.barcodeView.decoderFactory = 
                    com.journeyapps.barcodescanner.DefaultDecoderFactory(
                        listOf(com.google.zxing.BarcodeFormat.QR_CODE)
                    )
            }
            ScanMode.BARCODE -> {
                binding.barcodeScanner.setTorchOff()
                // Configure for barcodes
                binding.barcodeScanner.barcodeView.decoderFactory = 
                    com.journeyapps.barcodescanner.DefaultDecoderFactory(
                        listOf(
                            com.google.zxing.BarcodeFormat.CODE_128,
                            com.google.zxing.BarcodeFormat.CODE_39,
                            com.google.zxing.BarcodeFormat.EAN_13,
                            com.google.zxing.BarcodeFormat.EAN_8,
                            com.google.zxing.BarcodeFormat.UPC_A,
                            com.google.zxing.BarcodeFormat.UPC_E
                        )
                    )
            }
        }
    }
    
    private fun checkCameraPermission() {
        when {
            ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.CAMERA
            ) == PackageManager.PERMISSION_GRANTED -> {
                startScanning()
            }
            else -> {
                requestPermissionLauncher.launch(Manifest.permission.CAMERA)
            }
        }
    }
    
    private fun startScanning() {
        binding.barcodeScanner.decodeFrom(this)
        binding.barcodeScanner.resume()
    }
    
    override fun barcodeResult(result: BarcodeResult?) {
        result?.let {
            handleScanResult(it.text)
        }
    }
    
    private fun handleScanResult(scannedText: String) {
        // Stop scanning
        binding.barcodeScanner.pause()
        
        // Return result to calling activity
        val result = android.content.Intent().apply {
            putExtra("SCANNED_TEXT", scannedText)
            putExtra("SCAN_MODE", scanMode.name)
        }
        setResult(RESULT_OK, result)
        finish()
    }
    
    override fun onResume() {
        super.onResume()
        binding.barcodeScanner.resume()
    }
    
    override fun onPause() {
        super.onPause()
        binding.barcodeScanner.pause()
    }
    
    override fun onDestroy() {
        super.onDestroy()
        binding.barcodeScanner.destroy()
    }
    
    override fun possibleResultPoints(resultPoints: MutableList<com.google.zxing.ResultPoint>?) {
        // Optional: Handle possible result points for visual feedback
    }
}