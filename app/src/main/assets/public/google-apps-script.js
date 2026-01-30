// Google Apps Script למערכת ארכיאולוגיה
// יש להדביק קוד זה ב-Apps Script של ה-Google Sheets

// פונקציה ראשית שמטפלת בבקשות
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const sheetName = e.parameter.sheet || 'משתמשים';
  const action = e.parameter.action || 'read';
  
  try {
    switch(action) {
      case 'read':
        return readData(sheetName);
      case 'write':
        return writeData(sheetName, e.parameter);
      case 'update':
        return updateData(sheetName, e.parameter);
      case 'find':
        return findData(sheetName, e.parameter);
      default:
        return createResponse('error', 'פעולה לא חוקית');
    }
  } catch(error) {
    return createResponse('error', error.message);
  }
}

function readData(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    return createResponse('error', 'גיליון לא נמצא');
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
  
  return createResponse('success', rows);
}

function writeData(sheetName, params) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    return createResponse('error', 'גיליון לא נמצא');
  }
  
  // קבלת כותרות
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // יצירת שורה חדשה
  const newRow = [];
  headers.forEach(header => {
    if (header.includes('מזהה') && !params[header]) {
      // מספור אוטומטי למזהים
      const lastRow = sheet.getLastRow();
      newRow.push(lastRow);
    } else if (header.includes('תאריך')) {
      newRow.push(new Date());
    } else {
      newRow.push(params[header] || '');
    }
  });
  
  sheet.appendRow(newRow);
  return createResponse('success', 'נתונים נשמרו בהצלחה');
}

function updateData(sheetName, params) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    return createResponse('error', 'גיליון לא נמצא');
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idColumn = headers.findIndex(h => h.includes('מזהה'));
  
  if (idColumn === -1) {
    return createResponse('error', 'עמודת מזהה לא נמצאה');
  }
  
  const rowIndex = data.findIndex(row => row[idColumn] == params.id);
  if (rowIndex === -1) {
    return createResponse('error', 'רשומה לא נמצאה');
  }
  
  // עדכון השורה
  headers.forEach((header, index) => {
    if (params[header] !== undefined) {
      sheet.getRange(rowIndex + 1, index + 1).setValue(params[header]);
    }
  });
  
  return createResponse('success', 'נתונים עודכנו בהצלחה');
}

function findData(sheetName, params) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    return createResponse('error', 'גיליון לא נמצא');
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  // חיפוש לפי פרמטרים
  let results = rows;
  Object.keys(params).forEach(key => {
    const columnIndex = headers.findIndex(h => h === key);
    if (columnIndex !== -1) {
      results = results.filter(row => row[columnIndex] == params[key]);
    }
  });
  
  // המרה לאובייקטים
  const objects = results.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
  
  return createResponse('success', objects);
}

function createResponse(status, data) {
  return ContentService.createTextOutput(JSON.stringify({
    status: status,
    data: data
  })).setMimeType(ContentService.MimeType.JSON);
}

// פונקציות עזר ספציפיות למערכת הארכיאולוגית

function addUser(name, email, role, site) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('משתמשים');
  const id = sheet.getLastRow();
  const date = new Date();
  
  sheet.appendRow([id, name, email, role, site, date]);
  return {id: id, message: 'משתמש נוסף בהצלחה'};
}

function addFind(site, plot, layer, description, gps, userId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ממצאים');
  const id = sheet.getLastRow();
  const date = new Date();
  
  sheet.appendRow([id, site, plot, layer, description, '', gps, date, userId]);
  return {id: id, message: 'ממצא נוסף בהצלחה'};
}

function addImage(findId, imageUrl, description) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('תמונות');
  const id = sheet.getLastRow();
  const date = new Date();
  
  sheet.appendRow([id, findId, imageUrl, description, date]);
  return {id: id, message: 'תמונה נוספה בהצלחה'};
}

function getUserSites(userId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('משתמשים');
  const data = sheet.getDataRange().getValues();
  const userRow = data.find(row => row[0] == userId);
  
  if (!userRow) {
    return null;
  }
  
  return userRow[4]; // עמודת אתר משויך
}

function getFindsBySite(site) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ממצאים');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const siteColumn = headers.findIndex(h => h === 'שם_אתר');
  
  if (siteColumn === -1) {
    return [];
  }
  
  const finds = data.slice(1).filter(row => row[siteColumn] === site);
  
  return finds.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}

// ------------------------------
// Titan Tag: יצירה וזריעת נתונים ראשוניים
// ------------------------------

function ensureSheet(sheetName, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  const hasHeaderRow = lastRow >= 1 && lastCol >= 1;

  if (!hasHeaderRow) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
  }

  return sheet;
}

function isOnlyHeader(sheet) {
  return sheet.getLastRow() <= 1;
}

// להרצה ידנית פעם אחת מתוך עורך Apps Script
function setupTitanTag() {
  const usersHeaders = ['מזהה_משתמש', 'שם_מלא', 'אימייל', 'תפקיד', 'אתר_משויך', 'תאריך_הצטרפות'];
  const sitesHeaders = ['מזהה_אתר', 'שם_אתר', 'מיקום', 'רשימת_חלקות', 'רשימת_שכבות', 'תאריך_הקמה'];
  const findsHeaders = ['מזהה_ממצא', 'שם_אתר', 'חלקה', 'שכבה', 'תיאור_טקסטואלי', 'תמלול_קולי', 'GPS', 'תאריך_גילוי', 'מזהה_מתגלה'];
  const imagesHeaders = ['מזהה_תמונה', 'מזהה_ממצא', 'קישור_תמונה', 'תיאור_תמונה', 'תאריך_העלאה'];

  const usersSheet = ensureSheet('משתמשים', usersHeaders);
  const sitesSheet = ensureSheet('אתרים', sitesHeaders);
  const findsSheet = ensureSheet('ממצאים', findsHeaders);
  const imagesSheet = ensureSheet('תמונות', imagesHeaders);

  if (isOnlyHeader(sitesSheet)) {
    seedSites_(sitesSheet);
  }
  if (isOnlyHeader(usersSheet)) {
    seedUsers_(usersSheet);
  }
  if (isOnlyHeader(findsSheet)) {
    seedFinds_(findsSheet);
  }
  if (isOnlyHeader(imagesSheet)) {
    seedImages_(imagesSheet);
  }

  return 'Titan Tag setup complete';
}

function seedSites_(sheet) {
  // אתרים אמיתיים בישראל + רשימות חלקות/שכבות (בדרך המקובלת: Areas/Strata)
  const rows = [
    [1, 'תל מגידו', '32.5856,35.1825', 'Area A, Area B, Area C, Area K', 'Stratum I, II, III, IVA, IVB, V, VI', new Date()],
    [2, 'תל חצור', '33.0178,35.5694', 'Area A, Area B, Area M', 'Stratum XV, XIV, XIII, XII, XI', new Date()],
    [3, 'מצדה', '31.3156,35.3536', 'North Palace, West Palace, Casemate Wall', 'Herodian, Byzantine', new Date()],
    [4, 'קיסריה', '32.5000,34.8928', 'Harbor, Theater, Cardo', 'Roman, Byzantine, Crusader, Ottoman', new Date()],
    [5, 'עיר דוד', '31.7767,35.2350', 'Area G, Area E, Givati Parking', 'Iron Age II, Persian, Hellenistic, Second Temple', new Date()],
    [6, 'תל לכיש', '31.5591,34.8316', 'Area S, Area P, Area R', 'Level I, II, III, IV, V', new Date()],
    [7, 'תל באר שבע', '31.2516,34.7913', 'Area A, Area B, Gate Complex', 'Iron Age II, Persian', new Date()],
    [8, 'קומראן', '31.7413,35.4602', 'Main Building, Caves', 'Second Temple', new Date()]
  ];

  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
}

function seedUsers_(sheet) {
  const users = [
    { name: 'דרור', email: 'dror@titantag.local', role: 'מנהל', site: 'תל מגידו' },
    { name: 'מתן', email: 'matan@titantag.local', role: 'מנהל', site: 'עיר דוד' },
    { name: 'מאיה', email: 'maya@titantag.local', role: 'עובד', site: 'תל חצור' },
    { name: 'תום', email: 'tom@titantag.local', role: 'עובד', site: 'מצדה' },
    { name: 'דבי', email: 'debi@titantag.local', role: 'עובד', site: 'קיסריה' },
    { name: 'סהר', email: 'sahar@titantag.local', role: 'עובד', site: 'תל לכיש' },
    { name: 'עדי', email: 'adi@titantag.local', role: 'עובד', site: 'תל באר שבע' },
    { name: 'גילי', email: 'gili@titantag.local', role: 'עובד', site: 'קומראן' },
    { name: 'יהב', email: 'yahav@titantag.local', role: 'עובד', site: 'תל מגידו' },
    { name: 'נוגה', email: 'noga@titantag.local', role: 'עובד', site: 'תל חצור' },
    { name: 'אלה', email: 'ela@titantag.local', role: 'עובד', site: 'קיסריה' },
    { name: 'נדב', email: 'nadav@titantag.local', role: 'עובד', site: 'עיר דוד' }
  ];

  const rows = users.map((u, idx) => [idx + 1, u.name, u.email, u.role, u.site, new Date()]);
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
}

function seedFinds_(sheet) {
  const rows = [
    [1, 'תל מגידו', 'Area A', 'Stratum IVA', 'חרס מצויר קטן', '', '32.5859,35.1821', new Date(), 1],
    [2, 'תל חצור', 'Area M', 'Stratum XIII', 'ראש חץ ברונזה', '', '33.0182,35.5690', new Date(), 3],
    [3, 'מצדה', 'North Palace', 'Herodian', 'שבר נר חרס', '', '31.3158,35.3534', new Date(), 4],
    [4, 'קיסריה', 'Theater', 'Roman', 'מטבע ברונזה', '', '32.4996,34.8925', new Date(), 5],
    [5, 'עיר דוד', 'Area G', 'Iron Age II', 'שבר חותם (בולה)', '', '31.7765,35.2352', new Date(), 2]
  ];

  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
}

function seedImages_(sheet) {
  const now = new Date();
  const rows = [
    [1, 1, 'https://example.com/find-1-a.jpg', 'תמונה כללית', now],
    [2, 1, 'https://example.com/find-1-b.jpg', 'תקריב', now],
    [3, 2, 'https://example.com/find-2-a.jpg', 'תמונה כללית', now],
    [4, 2, 'https://example.com/find-2-b.jpg', 'תקריב', now],
    [5, 3, 'https://example.com/find-3-a.jpg', 'תמונה כללית', now],
    [6, 3, 'https://example.com/find-3-b.jpg', 'תקריב', now],
    [7, 4, 'https://example.com/find-4-a.jpg', 'תמונה כללית', now],
    [8, 4, 'https://example.com/find-4-b.jpg', 'תקריב', now],
    [9, 5, 'https://example.com/find-5-a.jpg', 'תמונה כללית', now],
    [10, 5, 'https://example.com/find-5-b.jpg', 'תקריב', now]
  ];

  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
}
