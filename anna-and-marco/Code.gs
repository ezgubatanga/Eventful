// Anna & Marco — RSVP to Google Sheets
// Deploy as Web App: Execute as Me, Anyone can access

const SHEET_ID   = '1UdaACtGxNvgPut1UpF8qioRvoIKK6XOMjE-tkw6fBOQ';
const SHEET_NAME = 'RSVPs';

function doPost(e) {
  const lock = LockService.scriptLock();
  lock.tryLock(10000);

  try {
    const data   = e.parameter;
    const sheet  = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);

    // Add header row if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp', 'Name', 'Email', 'Phone',
        'Attending', 'Guests', 'Meal', 'Plus-One Meal', 'Message'
      ]);
      sheet.getRange(1, 1, 1, 9).setFontWeight('bold');
    }

    sheet.appendRow([
      new Date(),
      data.name    || '',
      data.email   || '',
      data.phone   || '',
      data.attend  || '',
      data.guests  || '',
      data.meal    || '',
      data.meal2   || '',
      data.message || ''
    ]);

    // Optional: email notification
    // MailApp.sendEmail('anna@example.com', 'New RSVP from ' + data.name, JSON.stringify(data, null, 2));

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  const lock = LockService.scriptLock();
  lock.tryLock(10000);

  try {
    const data  = e.parameter;

    // If no name param, return row count (health check)
    if (!data.name) {
      const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
      return ContentService
        .createTextOutput('Sheet has ' + sheet.getLastRow() + ' rows (including header).')
        .setMimeType(ContentService.MimeType.TEXT);
    }

    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp', 'Name', 'Email', 'Phone',
        'Attending', 'Guests', 'Meal', 'Plus-One Meal', 'Message'
      ]);
      sheet.getRange(1, 1, 1, 9).setFontWeight('bold');
    }

    sheet.appendRow([
      new Date(),
      data.name    || '',
      data.email   || '',
      data.phone   || '',
      data.attend  || '',
      data.guests  || '',
      data.meal    || '',
      data.meal2   || '',
      data.message || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}
