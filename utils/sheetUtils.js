const { google } = require('googleapis');
const credentials = require('../credentials.json');
const sheets = google.sheets('v4');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: SCOPES,
});

async function getRows(range) {
  try {
    const clientAuth = await auth.getClient();
    const sheetsApi = google.sheets({ version: 'v4', auth: clientAuth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    const res = await sheetsApi.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    return res.data.values || [];
  } catch (error) {
    console.error('Error reading Google Sheets:', error);
    return [];
  }
}

module.exports = { getRows };
