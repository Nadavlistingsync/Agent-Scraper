# Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Run the Scraper
```bash
# Basic run - exports to CSV, JSON, and HTML
npx tsx src/simpleIndex.ts --limit 20

# Or build and run
npm run build
node dist/simpleIndex.js --limit 20
```

### Step 3: View Your Data

The scraper will automatically create an `output/` folder with your data:

#### Option 1: HTML Report (Easiest!)
```bash
# The path will be shown in the console output
# Open the HTML file in your browser
open output/leads-report-*.html
```

#### Option 2: CSV File (Excel/Google Sheets)
```bash
# Open with Excel, Google Sheets, or any spreadsheet app
open output/leads-*.csv
```

#### Option 3: JSON File (Developers)
```bash
# View the structured data
cat output/leads-*.json
```

## 📊 Export Options

### Export to Specific Formats
```bash
# CSV only
npx tsx src/simpleIndex.ts --limit 20 --csv

# HTML report only
npx tsx src/simpleIndex.ts --limit 20 --html

# JSON only
npx tsx src/simpleIndex.ts --limit 20 --json

# All formats at once
npx tsx src/simpleIndex.ts --limit 20 --all-formats
```

### Filter by State
```bash
# Focus on specific states
npx tsx src/simpleIndex.ts --limit 50 --state CA,TX,FL

# Single state
npx tsx src/simpleIndex.ts --limit 30 --state NY
```

### Export to Google Sheets (Optional)
```bash
# First, set up .env file (see env.example)
npx tsx src/simpleIndex.ts --limit 20 --sheets
```

## 🎯 What You'll Get

### Construction Leads
- CEO, COO, Presidents
- VP Operations, Directors
- Project Managers, Head Estimators
- With phone numbers and emails

### Real Estate Leads
- Real Estate Agents & Realtors
- Brokers & Managing Brokers
- Team Leaders & Sales Managers
- With phone numbers and emails

## 📁 Output Structure

```
output/
├── leads-2024-09-30.csv          # Spreadsheet format
├── leads-2024-09-30.json         # Structured data
└── leads-report-2024-09-30.html  # Interactive report
```

## 💡 Pro Tips

1. **Start Small**: Use `--limit 10` to test first
2. **Use HTML Report**: It's the easiest way to view and filter leads
3. **Filter by State**: Target specific regions with `--state`
4. **Export to CSV**: Open in Excel for further analysis
5. **No Config Needed**: Default exports work without any setup!

## 🔧 Troubleshooting

### No output folder?
The folder is created automatically when you run the scraper.

### Want Google Sheets?
1. Copy `env.example` to `.env`
2. Add your Google Sheets credentials
3. Run with `--sheets` flag

### Need help?
Check the main [README.md](README.md) for detailed documentation.

## 🎉 Example Output

After running:
```bash
npx tsx src/simpleIndex.ts --limit 20
```

You'll see:
```
🚀 Starting lead generation for construction and real estate...
Found 15 total results (10 construction, 5 real estate)
...
=== SCRAPING COMPLETE ===
Total leads found: 20
  - Construction leads: 12
  - Real estate leads: 8

📤 EXPORTING DATA...
📊 CSV: /path/to/output/leads-2024-09-30.csv
📋 JSON: /path/to/output/leads-2024-09-30.json
🌐 HTML: /path/to/output/leads-report-2024-09-30.html
   Open in browser: file:///path/to/output/leads-report-2024-09-30.html
```

Then simply open the HTML file in your browser to see a beautiful, interactive report! 🎨

