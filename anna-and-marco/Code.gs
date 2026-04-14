// Anna & Marco — RSVP to Google Sheets
// Deploy as Web App: Execute as Me, Anyone can access

const SHEET_ID   = '1UdaACtGxNvgPut1UpF8qioRvoIKK6XOMjE-tkw6fBOQ';
const SHEET_NAME = 'RSVPs';

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const data  = e.parameter;
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

    // MailApp.sendEmail('anna@example.com', 'New RSVP from ' + data.name, JSON.stringify(data, null, 2));

    return json({ status: 'ok' });

  } catch (err) {
    return json({ status: 'error', message: err.message });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const action = e.parameter.action;

    // Dashboard data endpoint
    if (action === 'data') {
      const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
      const rows  = sheet.getDataRange().getValues();

      if (rows.length <= 1) {
        return json({ total: 0, going: 0, notGoing: 0, plusOnes: 0, headcount: 0, meals: {}, meals2: {}, recent: [] });
      }

      let going = 0, notGoing = 0, plusOnes = 0;
      const meals = {}, meals2 = {};
      const recent = [];

      for (let i = 1; i < rows.length; i++) {
        const [ts, name, email, phone, attend, guests, meal, meal2, message] = rows[i];
        if (!name) continue;

        if (attend === 'yes') {
          going++;
          if (String(guests) === '2') plusOnes++;
          if (meal)  meals[meal]   = (meals[meal]  || 0) + 1;
          if (meal2) meals2[meal2] = (meals2[meal2] || 0) + 1;
        } else {
          notGoing++;
        }

        recent.push({
          name,
          email,
          phone,
          attend,
          guests: String(guests),
          meal,
          ts: ts ? new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
          row: i + 1   // 1-indexed sheet row (row 1 = header, data starts at 2)
        });
      }

      recent.reverse(); // newest first

      return json({
        total:     going + notGoing,
        going,
        notGoing,
        plusOnes,
        headcount: going + plusOnes,
        meals,
        meals2,
        recent:    recent.slice(0, 20)
      });
    }

    // Delete a row
    if (action === 'delete') {
      const rowIndex = parseInt(e.parameter.row);
      if (rowIndex > 1) {
        const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
        sheet.deleteRow(rowIndex);
      }
      return json({ status: 'ok' });
    }

    // RSVP submission via GET (form handler)
    const data = e.parameter;
    if (data.name) {
      const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);

      if (sheet.getLastRow() === 0) {
        sheet.appendRow(['Timestamp','Name','Email','Phone','Attending','Guests','Meal','Plus-One Meal','Message']);
        sheet.getRange(1,1,1,9).setFontWeight('bold');
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

      return json({ status: 'ok' });
    }

    // Health check
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    return ContentService
      .createTextOutput('Sheet has ' + sheet.getLastRow() + ' rows (including header).')
      .setMimeType(ContentService.MimeType.TEXT);

  } catch (err) {
    return json({ status: 'error', message: err.message });
  } finally {
    lock.releaseLock();
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
