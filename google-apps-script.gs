// ─────────────────────────────────────────────────────────────
//  Eventful – Google Apps Script
//  Receives POST submissions from form.html and logs them to a
//  Google Sheet.
//
//  SETUP:
//  1. Open script.google.com → New Project → paste this code.
//  2. Set SHEET_NAME to match the tab name in your spreadsheet.
//  3. Click Deploy → New Deployment → Web App.
//     - Execute as: Me
//     - Who has access: Anyone
//  4. Copy the Web App URL and paste it into form.html as APPS_SCRIPT_URL.
// ─────────────────────────────────────────────────────────────

const SHEET_NAME = 'Submissions'; // ← Change if your tab has a different name

// ── Entry point for POST requests ──────────────────────────────
function doPost(e) {
  try {
    // Parse the incoming JSON body
    const data = JSON.parse(e.postData.contents);

    // Write a row to the sheet
    logToSheet(data);

    // Send a success response
    return buildResponse({ status: 'success', message: 'Submission received.' });

  } catch (error) {
    // Log the error to the Apps Script execution log for debugging
    console.error('doPost error:', error.toString());
    return buildResponse({ status: 'error', message: error.toString() }, true);
  }
}

// ── Also handle GET (useful for testing the web app URL in a browser) ──
function doGet(e) {
  return buildResponse({ status: 'ok', message: 'Eventful webhook is live.' });
}

// ── Write one row to the Google Sheet ─────────────────────────
function logToSheet(data) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let   sheet = ss.getSheetByName(SHEET_NAME);

  // Auto-create the sheet + header row if it doesn't exist yet
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    appendHeaderRow(sheet);
  }

  // If the sheet is brand new (only 1 row or 0 rows), add headers
  if (sheet.getLastRow() === 0) {
    appendHeaderRow(sheet);
  }

  // Build the row array – order must match the header row
  const row = [
    new Date(),                                          // Timestamp
    sanitize(data.coupleNames),                          // Couple Names
    sanitize(data.weddingDate),                          // Wedding Date
    sanitize(data.email),                                // Email
    sanitize(data.location),                             // Location
    arrayToString(data.coreSections),                    // Core Sections
    arrayToString(data.functionalAddOns),                // Functional Add-Ons
    arrayToString(data.premiumAddOns),                   // Premium Add-Ons
    Number(data.estimatedPrice) || 0,                    // Estimated Price (₱)
    sanitize(data.submittedAt),                          // Client Timestamp
  ];

  sheet.appendRow(row);
}

// ── Write the header row ───────────────────────────────────────
function appendHeaderRow(sheet) {
  const headers = [
    'Timestamp',
    'Couple Names',
    'Wedding Date',
    'Email',
    'Location',
    'Core Sections',
    'Functional Add-Ons',
    'Premium Add-Ons',
    'Estimated Price (₱)',
    'Client Submitted At',
  ];

  sheet.appendRow(headers);

  // Style the header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#2A2520');
  headerRange.setFontColor('#C5A059');
  headerRange.setFontSize(11);

  // Auto-resize columns for readability
  sheet.setFrozenRows(1);
  headers.forEach((_, i) => sheet.autoResizeColumn(i + 1));
}

// ── Helpers ────────────────────────────────────────────────────

// Safely convert a value to a trimmed string
function sanitize(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

// Convert an array to a comma-separated string
function arrayToString(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return 'None';
  return arr.join(', ');
}

// Return a JSON ContentService response
function buildResponse(payload, isError = false) {
  const output = ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}
