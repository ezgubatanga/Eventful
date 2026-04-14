const SHEET_ID   = '1UdaACtGxNvgPut1UpF8qioRvoIKK6XOMjE-tkw6fBOQ';
const SHEET_NAME = 'RSVPs';

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const data  = e.parameter;
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Timestamp', 'Name', 'Email', 'Phone', 'Attending', 'Guests', 'Meal', 'Plus-One Meal', 'Message']);
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

    return json({ status: 'ok' }, null);

  } catch (err) {
    return json({ status: 'error', message: err.message }, null);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  const params   = (e && e.parameter) ? e.parameter : {};
  const callback = params.callback || null;

  try {
    const action = params.action;

    if (action === 'data') {
      const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
      const rows  = sheet.getDataRange().getValues();

      if (rows.length <= 1) {
        return json({ total: 0, going: 0, notGoing: 0, plusOnes: 0, headcount: 0, meals: {}, meals2: {}, recent: [] }, callback);
      }

      let going = 0, notGoing = 0, plusOnes = 0;
      const meals  = {};
      const meals2 = {};
      const recent = [];

      for (let i = 1; i < rows.length; i++) {
        const [ts, name, email, phone, attend, guests, meal, meal2, message] = rows[i];
        if (!name) continue;

        if (attend === 'yes') {
          going++;
          if (String(guests) === '2') plusOnes++;
          if (meal)  meals[meal]   = (meals[meal]   || 0) + 1;
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
          ts:  ts ? new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
          row: i + 1
        });
      }

      recent.reverse();

      return json({
        total:     going + notGoing,
        going,
        notGoing,
        plusOnes,
        headcount: going + plusOnes,
        meals,
        meals2,
        recent:    recent
      }, callback);
    }

    if (action === 'delete') {
      const rowIndex = parseInt(params.row);
      if (rowIndex > 1) {
        const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
        sheet.deleteRow(rowIndex);
      }
      return json({ status: 'ok' }, callback);
    }

    const data = params;
    if (data.name) {
      const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);

      if (sheet.getLastRow() === 0) {
        sheet.appendRow(['Timestamp', 'Name', 'Email', 'Phone', 'Attending', 'Guests', 'Meal', 'Plus-One Meal', 'Message']);
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

      return json({ status: 'ok' }, callback);
    }

    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    return ContentService
      .createTextOutput('Sheet has ' + sheet.getLastRow() + ' rows (including header).')
      .setMimeType(ContentService.MimeType.TEXT);

  } catch (err) {
    return json({ status: 'error', message: err.message }, callback);
  } finally {
    lock.releaseLock();
  }
}

function json(obj, callback) {
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + JSON.stringify(obj) + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
