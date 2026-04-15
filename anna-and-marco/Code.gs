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
          meal2,
          message,
          ts:    ts ? new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
          tsRaw: ts ? new Date(ts).toLocaleString('en-US') : '',
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

function sendReminderEmail(toEmail, toName, coupleName, weddingDate, weddingUrl) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('RESEND_API_KEY');

  const payload = {
    from: 'Eventful <hello@eventful.page>',
    to: [toEmail],
    reply_to: 'hello@eventful.page',
    subject: `A reminder — ${coupleName}'s Wedding`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#2a2a2a;">
        <p style="font-size:1.1rem;">Dear ${toName},</p>
        <p>This is a friendly reminder that you're invited to celebrate the wedding of <strong>${coupleName}</strong> on <strong>${weddingDate}</strong>.</p>
        <p>
          <a href="${weddingUrl}" style="display:inline-block;padding:12px 32px;background:#C5A059;color:#fff;text-decoration:none;border-radius:999px;font-family:Arial,sans-serif;font-size:0.9rem;font-weight:600;">
            View Wedding Page
          </a>
        </p>
        <p style="color:#888;font-size:0.85rem;">If you haven't RSVP'd yet, please do so at your earliest convenience.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:32px 0;" />
        <p style="color:#aaa;font-size:0.78rem;">Sent by Eventful · hello@eventful.page</p>
      </div>
    `
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: `Bearer ${apiKey}` },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch('https://api.resend.com/emails', options);
  Logger.log(response.getContentText());
}

function sendWeddingReminders() {
  const WEDDING_DATE = new Date('2026-09-20'); // ← update per couple
  const COUPLE_NAME  = 'Anna & Marco';
  const WEDDING_URL  = 'https://eventful.page/anna-and-marco';
  const DAYS_BEFORE  = 1; // send 1 days before

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const triggerDate = new Date(WEDDING_DATE);
  triggerDate.setDate(triggerDate.getDate() - DAYS_BEFORE);
  triggerDate.setHours(0, 0, 0, 0);

  if (today.getTime() !== triggerDate.getTime()) return; // not today

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const rows  = sheet.getDataRange().getValues();

  rows.slice(1).forEach(row => {
    const name      = row[1];
    const email     = row[2];
    const attending = String(row[4]).toLowerCase();
    if (attending !== 'yes' || !email) return;

    sendReminderEmail(email, name.split(' ')[0], COUPLE_NAME, 'September 20, 2026', WEDDING_URL);
  });
}

function testReminder() {
  sendReminderEmail(
    'ezgubatanga@gmail.com',        // your own email
    'Ezra',
    'Anna & Marco',
    'September 20, 2026',
    'https://eventful.page/anna-and-marco'
  );
}

