// ============================================================
//  AMET Anow Packaging Feedback — Google Apps Script
//  Paste this into: script.google.com → New Project
// ============================================================

// ── STEP 1: Set your Google Sheet ID here ──────────────────
// Open your Google Sheet, copy the ID from the URL:
// https://docs.google.com/spreadsheets/d/  <<<THIS PART>>>  /edit
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';
const SHEET_NAME = 'Responses'; // Tab name in the sheet
// ────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);

    // Create sheet + headers if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow([
        'Timestamp',
        'SPOO#',
        'What Went Wrong',
        'Bag Size',
        'Country',
        'Comments',
        'Photo URL'
      ]);
      // Style headers
      const headerRange = sheet.getRange(1, 1, 1, 7);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#1a3a4a');
      headerRange.setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }

    // Parse form data
    const params = e.parameter;
    const timestamp  = params.timestamp  || new Date().toISOString();
    const spoo       = params.spoo       || '';
    const issue      = params.issue      || '';
    const bagSize    = params.bagSize    || '';
    const country    = params.country    || '';
    const comments   = params.comments   || '';

    // Handle photo upload (stored in Drive)
    let photoUrl = '';
    if (e.parameters && e.parameters.photo) {
      try {
        const photoBlob = e.parameters.photo[0];
        if (photoBlob && photoBlob.getBytes) {
          const folder = getOrCreateFolder('AMET_Packaging_Photos');
          const filename = 'SPOO_' + spoo + '_' + Date.now() + '.jpg';
          const file = folder.createFile(photoBlob.setName(filename));
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          photoUrl = file.getUrl();
        }
      } catch(photoErr) {
        photoUrl = 'Upload error: ' + photoErr.message;
      }
    }

    // Append row
    sheet.appendRow([
      new Date(timestamp),
      spoo,
      issue,
      bagSize,
      country,
      comments,
      photoUrl
    ]);

    // Auto-resize columns
    sheet.autoResizeColumns(1, 7);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', message: 'Recorded!' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle CORS preflight
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'AMET Packaging Feedback API is running.' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Helper: get or create Drive folder for photos
function getOrCreateFolder(name) {
  const folders = DriveApp.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(name);
}
