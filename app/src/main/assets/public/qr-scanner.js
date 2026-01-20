// הוספת פונקציונליות סריקת QR/ברקוד לאפליקציה

// הוסף את הסקריפט הזה לקובץ ה-HTML הראשי
// יש להוסיף את הספרייה: https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js

let html5QrcodeScanner = null;

function startQRScanner() {
    const scannerDiv = document.createElement('div');
    scannerDiv.id = 'qr-reader';
    scannerDiv.style.position = 'fixed';
    scannerDiv.style.top = '0';
    scannerDiv.style.left = '0';
    scannerDiv.style.width = '100%';
    scannerDiv.style.height = '100%';
    scannerDiv.style.backgroundColor = 'white';
    scannerDiv.style.zIndex = '1000';
    document.body.appendChild(scannerDiv);
    
    html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader", 
        { 
            fps: 10, 
            qrbox: {width: 250, height: 250},
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
        }
    );
    
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
    
    // הוספת כפתור סגירה
    const closeButton = document.createElement('button');
    closeButton.textContent = 'סגור סורק';
    closeButton.style.position = 'fixed';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.zIndex = '1001';
    closeButton.style.padding = '10px';
    closeButton.style.backgroundColor = '#ff69b4';
    closeButton.style.color = 'white';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '5px';
    closeButton.onclick = stopQRScanner;
    document.body.appendChild(closeButton);
}

function onScanSuccess(decodedText, decodedResult) {
    stopQRScanner();
    
    // בדיקה אם המזהה שנסרק הוא מזהה ממצא
    if (decodedText.startsWith('FIND-')) {
        const findId = decodedText.replace('FIND-', '');
        showFindDetails(findId);
    } else {
        // חיפוש ממצא לפי מזהה
        searchFindById(decodedText);
    }
}

function onScanFailure(error) {
    // מתעלם משגיאות סריקה רגילות
}

function stopQRScanner() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear();
        html5QrcodeScanner = null;
    }
    
    // הסרת אלמנטים
    const scannerDiv = document.getElementById('qr-reader');
    if (scannerDiv) {
        scannerDiv.remove();
    }
    
    const closeButton = document.querySelector('button[onclick="stopQRScanner()"]');
    if (closeButton) {
        closeButton.remove();
    }
}

function generateQRCode(findId) {
    // יצירת קוד QR עם מזהה ממצא
    const qrData = `FIND-${findId}`;
    
    // כאן ניתן להשתמש בספריית יצירת QR כמו qrcode.js
    // לדוגמה: new QRCode(document.getElementById("qrcode"), qrData);
    
    return qrData;
}

function showFindDetails(findId) {
    // חיפוש פרטי הממצא מ-Google Sheets
    fetchGoogleData('ממצאים', 'find', {מזהה_ממצא: findId})
        .then(response => {
            if (response.status === 'success' && response.data.length > 0) {
                const find = response.data[0];
                displayFindDetails(find);
            } else {
                alert('ממצא לא נמצא');
            }
        })
        .catch(error => {
            console.error('שגיאה בחיפוש ממצא:', error);
            alert('אירעה שגיאה בחיפוש הממצא');
        });
}

function displayFindDetails(find) {
    // יצירת חלון מודאלי עם פרטי הממצא
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modal.style.zIndex = '1000';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    
    const content = document.createElement('div');
    content.style.backgroundColor = 'white';
    content.style.padding = '2rem';
    content.style.borderRadius = '15px';
    content.style.maxWidth = '500px';
    content.style.maxHeight = '80vh';
    content.style.overflow = 'auto';
    content.innerHTML = `
        <h2>פרטי ממצא</h2>
        <p><strong>מזהה:</strong> ${find.מזהה_ממצא}</p>
        <p><strong>אתר:</strong> ${find.שם_אתר}</p>
        <p><strong>חלקה:</strong> ${find.חלקה}</p>
        <p><strong>שכבה:</strong> ${find.שכבה}</p>
        <p><strong>תיאור:</strong> ${find.תיאור_טקסטואלי}</p>
        <p><strong>GPS:</strong> ${find.GPS}</p>
        <p><strong>תאריך:</strong> ${new Date(find.תאריך_גילוי).toLocaleDateString('he-IL')}</p>
        <button onclick="this.parentElement.parentElement.remove()" style="background: #ff69b4; color: white; border: none; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer;">סגור</button>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
}

function searchFindById(findId) {
    // פונקציית עזר לחיפוש ממצא לפי מזהה
    showFindDetails(findId);
}

// פונקציה להתחברות ל-Google Apps Script
async function fetchGoogleData(sheet, action, params = {}) {
    const scriptUrl = 'YOUR_GOOGLE_APPS_SCRIPT_URL'; // יש להחליף ב-URL של ה-Apps Script
    
    const url = new URL(scriptUrl);
    url.searchParams.append('sheet', sheet);
    url.searchParams.append('action', action);
    
    Object.keys(params).forEach(key => {
        url.searchParams.append(key, params[key]);
    });
    
    const response = await fetch(url);
    return await response.json();
}