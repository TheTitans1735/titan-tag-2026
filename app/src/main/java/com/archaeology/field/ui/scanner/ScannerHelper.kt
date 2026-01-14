package com.archaeology.field.ui.scanner

import android.app.Activity
import android.content.Intent
import androidx.fragment.app.Fragment
import com.archaeology.field.ui.scanner.ScannerActivity.ScanMode

/**
 * Scanner helper class for easy integration
 */
object ScannerHelper {
    
    private const val REQUEST_CODE_QR = 1001
    private const val REQUEST_CODE_BARCODE = 1002
    
    /**
     * Launch QR code scanner
     */
    fun launchQRScanner(activity: Activity) {
        val intent = Intent(activity, ScannerActivity::class.java).apply {
            putExtra("SCAN_MODE", ScanMode.QR)
        }
        activity.startActivityForResult(intent, REQUEST_CODE_QR)
    }
    
    /**
     * Launch QR code scanner from fragment
     */
    fun launchQRScanner(fragment: Fragment) {
        val intent = Intent(fragment.requireContext(), ScannerActivity::class.java).apply {
            putExtra("SCAN_MODE", ScanMode.QR)
        }
        fragment.startActivityForResult(intent, REQUEST_CODE_QR)
    }
    
    /**
     * Launch barcode scanner
     */
    fun launchBarcodeScanner(activity: Activity) {
        val intent = Intent(activity, ScannerActivity::class.java).apply {
            putExtra("SCAN_MODE", ScanMode.BARCODE)
        }
        activity.startActivityForResult(intent, REQUEST_CODE_BARCODE)
    }
    
    /**
     * Launch barcode scanner from fragment
     */
    fun launchBarcodeScanner(fragment: Fragment) {
        val intent = Intent(fragment.requireContext(), ScannerActivity::class.java).apply {
            putExtra("SCAN_MODE", ScanMode.BARCODE)
        }
        fragment.startActivityForResult(intent, REQUEST_CODE_BARCODE)
    }
    
    /**
     * Handle scan result from activity
     */
    fun handleActivityResult(
        requestCode: Int,
        resultCode: Int,
        data: Intent?,
        onScanResult: (scannedText: String, scanMode: ScanMode) -> Unit
    ): Boolean {
        if (resultCode == Activity.RESULT_OK && data != null) {
            when (requestCode) {
                REQUEST_CODE_QR, REQUEST_CODE_BARCODE -> {
                    val scannedText = data.getStringExtra("SCANNED_TEXT") ?: ""
                    val scanModeName = data.getStringExtra("SCAN_MODE") ?: ScanMode.QR.name
                    val scanMode = try {
                        ScanMode.valueOf(scanModeName)
                    } catch (e: IllegalArgumentException) {
                        ScanMode.QR
                    }
                    onScanResult(scannedText, scanMode)
                    return true
                }
            }
        }
        return false
    }
}