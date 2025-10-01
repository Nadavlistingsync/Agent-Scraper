# Lead Generator - Construction & Real Estate

A Node.js/TypeScript automation tool for generating leads from construction companies and real estate agencies in the USA.

## Features

- **Target Audience**: 
  - Construction decision makers (CEO, COO, VP Operations, Project Managers)
  - Real estate agents and brokers (Realtors, Managing Brokers, Team Leaders)
- **Data Sources**: Google search, company websites, trade associations, real estate directories
- **Output**: Google Sheets with structured lead data
- **Quality Gates**: Phone validation, title filtering, deduplication
- **Enrichment**: Optional Apollo/Hunter API integration for contact verification
- **Dual Mode**: Automatically categorizes leads as construction or real estate

## Prerequisites

- Node.js 18+
- PNPM
- Google Sheets API credentials
- (Optional) Apollo API key for enrichment
- (Optional) Hunter API key for email verification

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd construction-lead-generator
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp env.example .env
```

Edit `.env` with your credentials:
```env
GOOGLE_SHEET_ID=your_google_sheet_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Optional enrichment APIs
APOLLO_API_KEY=your_apollo_api_key_here
HUNTER_API_KEY=your_hunter_api_key_here
```

## Google Sheets Setup

1. Create a new Google Sheet
2. Copy the Sheet ID from the URL
3. Create a service account in Google Cloud Console
4. Download the service account JSON key
5. Share the Google Sheet with the service account email
6. Add the credentials to your `.env` file

## Usage

### Basic Usage
```bash
# Run with default settings (exports to CSV, JSON, and HTML)
pnpm start

# Or use the simple implementation
npx tsx src/simpleIndex.ts
```

### With Options
```bash
# Limit to 250 leads, focus on specific states
pnpm start -- --limit 250 --state CA,TX,FL

# Export only to CSV
pnpm start -- --csv

# Export to Google Sheets
pnpm start -- --sheets

# Export to all formats
pnpm start -- --all-formats
```

### Available Options
- `--limit <number>`: Maximum number of leads to collect (default: 50)
- `--state <states>`: Comma-separated list of states to focus on
- `--csv`: Export to CSV file (Excel compatible)
- `--json`: Export to JSON file
- `--html`: Export to HTML report (interactive browser view)
- `--sheets`: Export to Google Sheets (requires setup)
- `--all-formats`: Export to all formats at once

### Export Formats

#### 1. **CSV Export** (Default)
- Opens in Excel, Google Sheets, or any spreadsheet software
- Located in `output/leads-YYYY-MM-DD.csv`
- Separate files for construction and real estate if using `--csv`

#### 2. **JSON Export** (Default)
- Structured data with metadata
- Located in `output/leads-YYYY-MM-DD.json`
- Perfect for developers and data processing

#### 3. **HTML Report** (Default)
- Beautiful interactive report in your browser
- Located in `output/leads-report-YYYY-MM-DD.html`
- Tabs for All Leads, Construction, and Real Estate
- Searchable and filterable

#### 4. **Google Sheets** (Requires Setup)
- Real-time collaboration
- Automatic syncing
- See [Google Sheets Setup](#google-sheets-setup) below

## Output Schema

The tool writes to a Google Sheet with these columns:

| Column | Description |
|--------|-------------|
| Name | Full name of the decision maker or agent |
| Title | Job title (filtered for decision makers only) |
| Company | Company name |
| Phone | Phone number (required, E.164 format) |
| Email | Email address (optional) |
| City | City location |
| State | State location |
| Company Size | Estimated company size |
| Website | Company website |
| SourceURL | URL where the lead was found |
| Verified | Y/N if contact info was verified |
| Notes | Additional notes |
| LeadType | 'construction' or 'real-estate' |

## Target Roles

### Construction Decision Makers
- Owner
- President
- CEO / Chief Executive
- COO / Chief Operating Officer
- Managing Partner
- VP Operations / Vice President of Operations
- Director of Operations
- Head Estimator
- Project Manager
- Operations Manager

### Real Estate Professionals
- Real Estate Agent / Realtor
- Real Estate Broker
- Managing Broker
- Principal Broker
- Associate Broker
- Owner/Broker
- Team Leader
- Sales Manager
- Listing Agent
- Buyer's Agent

## Quality Gates

- **Phone Required**: All leads must have a phone number
- **Title Filtering**: Only decision-maker and professional titles are included
- **Deduplication**: Prevents duplicate leads based on phone/email/name+company
- **US Only**: Focuses on US-based companies and agents
- **Company Size**: 
  - Construction: 50-500 employees or $5M-$200M revenue
  - Real Estate: Top-producing agents and established brokerages
- **Lead Categorization**: Automatically categorizes as construction or real estate

## Rate Limiting

The tool implements polite scraping with:
- 2-6 second delays between requests
- 1-3 concurrent page requests
- User agent rotation
- Respect for robots.txt

## Logging

- Console output for progress updates
- Error logs in `logs/error.log`
- Combined logs in `logs/combined.log`

## Troubleshooting

### Common Issues

1. **Google Sheets API Error**: Check your service account credentials and sheet permissions
2. **No Leads Found**: Try different states or increase the limit
3. **Rate Limiting**: The tool automatically handles rate limiting, but you can increase delays in config

### Debug Mode
```bash
# Enable verbose logging
LOG_LEVEL=debug pnpm start
```

## Development

### Project Structure
```
src/
├── search/          # Google search functionality
├── scrape/          # Web scraping modules
├── enrich/          # Contact enrichment
├── util/            # Utility functions
├── sheets/          # Google Sheets integration
├── types.ts         # TypeScript type definitions
├── config.ts        # Configuration and constants
├── logger.ts        # Logging setup
└── index.ts         # Main orchestrator
```

### Building
```bash
pnpm build
```

### Development Mode
```bash
pnpm dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the logs in the `logs/` directory
3. Create an issue with detailed error information
