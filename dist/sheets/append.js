import { google } from 'googleapis';
import { config } from '../config.js';
import { logError, logProgress } from '../logger.js';
export class GoogleSheetsAppender {
    sheets;
    spreadsheetId;
    constructor() {
        this.spreadsheetId = config.googleSheets.sheetId;
        this.initializeAuth();
    }
    initializeAuth() {
        try {
            const auth = new google.auth.GoogleAuth({
                credentials: {
                    client_email: config.googleSheets.serviceAccountEmail,
                    private_key: config.googleSheets.serviceAccountKey.replace(/\\n/g, '\n'),
                },
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
            this.sheets = google.sheets({ version: 'v4', auth });
            logProgress('Google Sheets API initialized');
        }
        catch (error) {
            logError(error, { context: 'GoogleSheetsAppender.initializeAuth' });
            throw error;
        }
    }
    async createSheetIfNotExists() {
        try {
            // Check if sheet exists
            const response = await this.sheets.spreadsheets.get({
                spreadsheetId: this.spreadsheetId,
            });
            const sheetExists = response.data.sheets?.some((sheet) => sheet.properties.title === 'Construction DM');
            if (!sheetExists) {
                // Create the sheet
                await this.sheets.spreadsheets.batchUpdate({
                    spreadsheetId: this.spreadsheetId,
                    resource: {
                        requests: [
                            {
                                addSheet: {
                                    properties: {
                                        title: 'Construction DM',
                                    },
                                },
                            },
                        ],
                    },
                });
                // Add headers
                await this.appendHeaders();
                logProgress('Created "Construction DM" sheet with headers');
            }
        }
        catch (error) {
            logError(error, { context: 'GoogleSheetsAppender.createSheetIfNotExists' });
            throw error;
        }
    }
    async appendHeaders() {
        const headers = [
            'Name',
            'Title',
            'Company',
            'Phone',
            'Email',
            'City',
            'State',
            'Company Size',
            'Website',
            'SourceURL',
            'Verified',
            'Notes'
        ];
        await this.sheets.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            range: 'Construction DM!A1:L1',
            valueInputOption: 'RAW',
            resource: {
                values: [headers],
            },
        });
    }
    async appendLeads(leads) {
        if (leads.length === 0)
            return;
        try {
            // Convert leads to rows
            const rows = leads.map(lead => [
                lead.Name,
                lead.Title,
                lead.Company,
                lead.Phone,
                lead.Email,
                lead.City,
                lead.State,
                lead.CompanySize,
                lead.Website,
                lead.SourceURL,
                lead.Verified,
                lead.Notes
            ]);
            // Append to sheet
            await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: 'Construction DM!A:L',
                valueInputOption: 'RAW',
                insertDataOption: 'INSERT_ROWS',
                resource: {
                    values: rows,
                },
            });
            logProgress(`Appended ${leads.length} leads to Google Sheet`);
        }
        catch (error) {
            logError(error, {
                leadCount: leads.length,
                context: 'GoogleSheetsAppender.appendLeads'
            });
            throw error;
        }
    }
    async getExistingLeads() {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: 'Construction DM!A2:L', // Skip header row
            });
            const rows = response.data.values || [];
            const leads = [];
            for (const row of rows) {
                if (row.length >= 12) {
                    leads.push({
                        Name: row[0] || '',
                        Title: row[1] || '',
                        Company: row[2] || '',
                        Phone: row[3] || '',
                        Email: row[4] || '',
                        City: row[5] || '',
                        State: row[6] || '',
                        CompanySize: row[7] || '',
                        Website: row[8] || '',
                        SourceURL: row[9] || '',
                        Verified: row[10] || 'N',
                        Notes: row[11] || ''
                    });
                }
            }
            logProgress(`Retrieved ${leads.length} existing leads from Google Sheet`);
            return leads;
        }
        catch (error) {
            logError(error, { context: 'GoogleSheetsAppender.getExistingLeads' });
            return [];
        }
    }
    async getSheetUrl() {
        return `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}`;
    }
    async getRowCount() {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: 'Construction DM!A:A',
            });
            const rows = response.data.values || [];
            return rows.length - 1; // Subtract header row
        }
        catch (error) {
            logError(error, { context: 'GoogleSheetsAppender.getRowCount' });
            return 0;
        }
    }
}
//# sourceMappingURL=append.js.map