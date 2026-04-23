// ── Addon price lookup (must match onboarding form) ────────────────────────
const FUNCTIONAL_PRICES = {
  'Background Music / Spotify Playlist': 400,
  'Meal Selection': 600,
  'Featured Video': 400,
  'Gift Registry Integration': 600,
  'Calendar Integration': 400,
};

const PREMIUM_PRICES = {
  'Digital Invite + QR Code': 1200,
  'Email Reminder': 1200,
  'Guest Photo Submissions': 1200,
  'Custom Domain (1 year)': 1800,
};

// ── Sheets menu ────────────────────────────────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Eventful')
    .addItem('Send Confirmation Email', 'sendConfirmationToSelectedRow')
    .addToUi();
}

// ── doPost (unchanged) ─────────────────────────────────────────────────────
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    // Set headers if the sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Submitted At',
        'Groom Name',
        'Bride Name',
        'Wedding Date',
        'Ceremony Time',
        'Ceremony Location',
        'Reception Location',
        'Email',
        'Contact Number',
        'Page URL',
        'Functional Add-Ons',
        'Premium Add-Ons',
        'Delivery',
        'Special Requests',
        'Estimated Price (₱)',
        'Payment Status',
        'Receipt URL',
        'Color Palette',
        'Confirmation Sent',
      ]);

      var headerRange = sheet.getRange(1, 1, 1, 19);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#2A2520');
      headerRange.setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([
      new Date(data.submittedAt),
      data.groomName || '',
      data.brideName || '',
      data.weddingDate || '',
      data.ceremonyTime || '',
      data.location || '',
      data.venueName || '',
      data.email || '',
      data.contactNumber || '',
      data.pageSlug ? 'eventful.page/' + data.pageSlug : '',
      (data.functionalAddOns || []).join(', '),
      (data.premiumAddOns || []).join(', '),
      data.delivery || 'Standard (5 days)',
      data.specialRequests || '',
      data.estimatedPrice || 0,
      data.paymentStatus || '',
      data.receiptUrl || '',
      data.colorPalette || '',
      '', // Confirmation Sent — filled by menu action
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── Trigger from Sheets menu ───────────────────────────────────────────────
function sendConfirmationToSelectedRow() {
  const ui    = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const row   = sheet.getActiveCell().getRow();

  if (row <= 1) { ui.alert('Select a data row (not the header).'); return; }

  // Column positions (1-indexed) matching the header order above
  const COL = {
    groomName:    2,
    brideName:    3,
    weddingDate:  4,
    email:        8,
    pageUrl:      10,
    fnAddons:     11,
    prAddons:     12,
    delivery:     13,
    price:        15,
    colorPalette: 18,
    confirmSent:  19,
  };

  const lastCol   = 19;
  const values    = sheet.getRange(row, 1, 1, lastCol).getValues()[0];

  const groomName   = values[COL.groomName   - 1];
  const brideName   = values[COL.brideName   - 1];
  const email       = values[COL.email       - 1];
  const weddingDate = values[COL.weddingDate - 1];
  const pageUrl     = values[COL.pageUrl     - 1];
  const fnAddons    = values[COL.fnAddons    - 1];
  const prAddons    = values[COL.prAddons    - 1];
  const delivery     = values[COL.delivery     - 1];
  const price        = values[COL.price        - 1];
  const colorPalette = values[COL.colorPalette - 1];
  const alreadySent  = values[COL.confirmSent  - 1];

  if (!email) { ui.alert('No email address in this row.'); return; }

  if (alreadySent) {
    const again = ui.alert(
      'Already sent',
      'Confirmation was sent on ' + alreadySent + '.\nSend again?',
      ui.ButtonSet.YES_NO
    );
    if (again !== ui.Button.YES) return;
  }

  sendOrderConfirmation({
    groomName, brideName, email, weddingDate,
    pageUrl, fnAddons, prAddons, delivery, price, colorPalette,
  });

  sheet.getRange(row, COL.confirmSent).setValue(
    new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
  );

  ui.alert('✓ Confirmation email sent to ' + email);
}

// ── Build and send the confirmation email via Resend ──────────────────────
function sendOrderConfirmation(d) {
  const apiKey     = PropertiesService.getScriptProperties().getProperty('RESEND_API_KEY');
  const coupleName = d.groomName + ' & ' + d.brideName;
  const isRush     = String(d.delivery).toLowerCase().includes('rush');
  const hasMusic   = String(d.fnAddons || '').includes('Background Music');

  // Receipt line items
  let total = 4000;
  let rows  =
    '<tr>' +
      '<td style="padding:11px 16px;border-bottom:1px solid #F0EBE3;font-size:14px;font-family:Arial,sans-serif;color:#444;">Base Package <span style="font-size:12px;color:#AAA;">(all core sections)</span></td>' +
      '<td style="padding:11px 16px;border-bottom:1px solid #F0EBE3;font-size:14px;font-family:Arial,sans-serif;color:#444;text-align:right;white-space:nowrap;">₱4,000</td>' +
    '</tr>';

  String(d.fnAddons || '').split(',').map(s => s.trim()).filter(Boolean).forEach(function(label) {
    const price = FUNCTIONAL_PRICES[label];
    if (!price) return;
    total += price;
    rows +=
      '<tr>' +
        '<td style="padding:11px 16px;border-bottom:1px solid #F0EBE3;font-size:14px;font-family:Arial,sans-serif;color:#444;">' + label + '</td>' +
        '<td style="padding:11px 16px;border-bottom:1px solid #F0EBE3;font-size:14px;font-family:Arial,sans-serif;color:#444;text-align:right;white-space:nowrap;">+₱' + price.toLocaleString() + '</td>' +
      '</tr>';
  });

  String(d.prAddons || '').split(',').map(s => s.trim()).filter(Boolean).forEach(function(label) {
    const price = PREMIUM_PRICES[label];
    if (!price) return;
    total += price;
    rows +=
      '<tr>' +
        '<td style="padding:11px 16px;border-bottom:1px solid #F0EBE3;font-size:14px;font-family:Arial,sans-serif;color:#444;">' + label + '</td>' +
        '<td style="padding:11px 16px;border-bottom:1px solid #F0EBE3;font-size:14px;font-family:Arial,sans-serif;color:#444;text-align:right;white-space:nowrap;">+₱' + price.toLocaleString() + '</td>' +
      '</tr>';
  });

  if (isRush) {
    total += 1800;
    rows +=
      '<tr>' +
        '<td style="padding:11px 16px;border-bottom:1px solid #F0EBE3;font-size:14px;font-family:Arial,sans-serif;color:#444;">Rush Delivery <span style="font-size:12px;color:#AAA;">(2-day turnaround)</span></td>' +
        '<td style="padding:11px 16px;border-bottom:1px solid #F0EBE3;font-size:14px;font-family:Arial,sans-serif;color:#444;text-align:right;white-space:nowrap;">+₱1,800</td>' +
      '</tr>';
  }

  const deliveryLabel = isRush ? '2-day Rush' : '5-day Standard';
  const weddingDate   = d.weddingDate || 'TBD';
  const pageUrl       = d.pageUrl || '';

  const html =
'<!DOCTYPE html>' +
'<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>' +
'<body style="margin:0;padding:0;background:#F5F2EE;font-family:Georgia,serif;">' +
'<div style="max-width:600px;margin:0 auto;background:#FFFFFF;">' +

  // Header
  '<div style="background:#1E1E1E;padding:40px 40px 32px;text-align:center;">' +
    '<div style="font-size:11px;letter-spacing:4px;color:#C9A96E;text-transform:uppercase;margin-bottom:10px;font-family:Arial,sans-serif;">Eventful</div>' +
    '<div style="font-size:22px;color:#FFFFFF;font-weight:400;letter-spacing:1px;">Your wedding page is confirmed.</div>' +
  '</div>' +

  // Body
  '<div style="padding:40px;">' +
    '<p style="font-size:20px;color:#1E1E1E;margin:0 0 16px;">Hi ' + d.groomName + ' &amp; ' + d.brideName + ',</p>' +
    '<p style="font-size:15px;line-height:1.75;color:#555;font-family:Arial,sans-serif;margin:0 0 28px;">Your payment has been verified — we\'re officially getting started on your page. Here\'s your order receipt for reference.</p>' +

    // Receipt
    '<div style="border:1px solid #E8E2D9;border-radius:8px;overflow:hidden;margin-bottom:28px;">' +
      '<div style="background:#F5F0E8;padding:12px 16px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#8B7355;font-family:Arial,sans-serif;font-weight:600;">Order Receipt</div>' +
      '<table style="width:100%;border-collapse:collapse;">' +
        rows +
        '<tr>' +
          '<td style="padding:14px 16px;font-size:15px;font-family:Arial,sans-serif;font-weight:700;color:#1E1E1E;background:#FAF9F7;">Total Paid</td>' +
          '<td style="padding:14px 16px;font-size:15px;font-family:Arial,sans-serif;font-weight:700;color:#C9A96E;background:#FAF9F7;text-align:right;white-space:nowrap;">₱' + total.toLocaleString() + '</td>' +
        '</tr>' +
      '</table>' +
    '</div>' +

    // Info grid
    '<table style="width:100%;border-collapse:collapse;margin-bottom:28px;">' +
      '<tr>' +
        '<td style="width:50%;padding:0 8px 12px 0;vertical-align:top;">' +
          '<div style="background:#FAF9F7;border-radius:8px;padding:14px 16px;">' +
            '<div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#A0906F;font-family:Arial,sans-serif;margin-bottom:4px;">Wedding Date</div>' +
            '<div style="font-size:14px;color:#1E1E1E;font-family:Arial,sans-serif;">' + weddingDate + '</div>' +
          '</div>' +
        '</td>' +
        '<td style="width:50%;padding:0 0 12px 8px;vertical-align:top;">' +
          '<div style="background:#FAF9F7;border-radius:8px;padding:14px 16px;">' +
            '<div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#A0906F;font-family:Arial,sans-serif;margin-bottom:4px;">Delivery</div>' +
            '<div style="font-size:14px;color:#1E1E1E;font-family:Arial,sans-serif;">' + deliveryLabel + '</div>' +
          '</div>' +
        '</td>' +
      '</tr>' +
      '<tr>' +
        '<td style="width:50%;padding:0 8px 0 0;vertical-align:top;">' +
          '<div style="background:#FAF9F7;border-radius:8px;padding:14px 16px;">' +
            '<div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#A0906F;font-family:Arial,sans-serif;margin-bottom:4px;">Page URL</div>' +
            '<div style="font-size:14px;color:#1E1E1E;font-family:Arial,sans-serif;">' + pageUrl + '</div>' +
          '</div>' +
        '</td>' +
        '<td style="width:50%;padding:0 0 0 8px;vertical-align:top;">' +
          '<div style="background:#FAF9F7;border-radius:8px;padding:14px 16px;">' +
            '<div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#A0906F;font-family:Arial,sans-serif;margin-bottom:4px;">Color Palette</div>' +
            '<div style="font-size:14px;color:#1E1E1E;font-family:Arial,sans-serif;">' + (d.colorPalette || 'Not specified') + '</div>' +
          '</div>' +
        '</td>' +
      '</tr>' +
    '</table>' +

    // Reply prompt
    '<div style="border-left:3px solid #C9A96E;background:#FBF8F3;border-radius:0 8px 8px 0;padding:20px 24px;margin-bottom:28px;">' +
      '<div style="font-size:16px;color:#1E1E1E;margin-bottom:10px;font-weight:600;">Help us build your page</div>' +
      '<p style="font-size:14px;color:#555;font-family:Arial,sans-serif;margin:0 0 12px;line-height:1.6;"><strong>Reply to this email</strong> with whatever you have — no need to send it all at once:</p>' +
      '<ul style="margin:0;padding-left:18px;">' +
        '<li style="font-size:14px;color:#555;font-family:Arial,sans-serif;line-height:1.9;"><strong>Your story</strong> — how you met, the proposal, what makes your relationship yours</li>' +
        '<li style="font-size:14px;color:#555;font-family:Arial,sans-serif;line-height:1.9;"><strong>Wedding day timeline</strong> — ceremony start, reception, key moments</li>' +
        '<li style="font-size:14px;color:#555;font-family:Arial,sans-serif;line-height:1.9;"><strong>Photos</strong> — engagement shots, candids, anything you want on the page</li>' +
        '<li style="font-size:14px;color:#555;font-family:Arial,sans-serif;line-height:1.9;"><strong>Venue details</strong> — full address, directions, parking notes</li>' +
        (hasMusic ? '<li style="font-size:14px;color:#555;font-family:Arial,sans-serif;line-height:1.9;"><strong>Background music</strong> — song title/Spotify link, or let us know the vibe</li>' : '') +
        '<li style="font-size:14px;color:#555;font-family:Arial,sans-serif;line-height:1.9;"><strong>Anything else</strong> — dress code, message to your guests, any special notes</li>' +
      '</ul>' +
    '</div>' +

    '<p style="font-size:15px;line-height:1.75;color:#555;font-family:Arial,sans-serif;margin:0 0 8px;">You\'ll hear from us within 24 hours if we have questions. Once everything\'s in, your page goes live and we\'ll send you the link.</p>' +
    '<p style="font-size:15px;color:#1E1E1E;font-family:Arial,sans-serif;margin:0;">Excited to build this with you.<br><strong>— Ezra, Eventful</strong></p>' +
  '</div>' +

  // Footer
  '<div style="background:#1E1E1E;padding:28px 40px;text-align:center;">' +
    '<p style="color:rgba(255,255,255,0.35);font-size:12px;font-family:Arial,sans-serif;margin:0;line-height:1.7;">' +
      '<a href="https://eventful.page" style="color:#C9A96E;text-decoration:none;">eventful.page</a><br><br>' +
      'You\'re receiving this because you placed an order at eventful.page.<br>' +
      'Questions? Reply to this email or reach us at <a href="mailto:hello@eventful.page" style="color:#C9A96E;text-decoration:none;">hello@eventful.page</a>.' +
    '</p>' +
  '</div>' +

'</div></body></html>';

  const response = UrlFetchApp.fetch('https://api.resend.com/emails', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + apiKey },
    payload: JSON.stringify({
      from:     'Eventful <hello@eventful.page>',
      to:       [d.email],
      reply_to: 'hello@eventful.page',
      subject:  'Your Eventful wedding page — ' + coupleName,
      html:     html,
    }),
    muteHttpExceptions: true,
  });

  const status = response.getResponseCode();
  if (status !== 200 && status !== 201) {
    const err = JSON.parse(response.getContentText());
    throw new Error(err.message || 'Resend returned ' + status);
  }
}
