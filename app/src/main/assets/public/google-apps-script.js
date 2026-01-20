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