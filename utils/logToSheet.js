const { google } = require('googleapis');
const credentials = require('../credentials.json');
const sheets = google.sheets('v4');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: SCOPES,
});

async function logPayment({ invoiceId, seller, client, amount, item, status, timestamp }) {
  try {
    const clientAuth = await auth.getClient();
    const sheetsApi = google.sheets({ version: 'v4', auth: clientAuth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    const values = [[invoiceId, seller, client, amount, item, status, timestamp]];

    await sheetsApi.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:G',
      valueInputOption: 'USER_ENTERED',
      resource: { values },
    });
  } catch (error) {
    console.error('Error logging payment to Google Sheets:', error);
  }
}

module.exports = logPayment;
