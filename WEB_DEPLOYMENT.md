# 🚀 Web Dashboard Deployment Guide

## Quick Deploy to Vercel

### Method 1: One-Click Deploy (Easiest!)

1. **Push to GitHub** (already done ✅)

2. **Go to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with GitHub

3. **Import Project**
   - Click "Add New Project"
   - Select your `Agent-Scraper` repository
   - Vercel will auto-detect Next.js

4. **Configure Build Settings**
   - Root Directory: `web`
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)
   - Install Command: `npm install` (auto-detected)

5. **Deploy!**
   - Click "Deploy"
   - Wait ~2 minutes
   - Your site will be live at `your-project.vercel.app`

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to web directory
cd web

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? lead-dashboard
# - Directory? ./
# - Override settings? No

# Production deploy
vercel --prod
```

## 📊 How It Works

### Data Flow

1. **Scraper generates data** → Saves to `output/leads-YYYY-MM-DD.json`
2. **Web app reads data** → From `/output` directory
3. **API endpoint serves data** → `/api/leads`
4. **Dashboard displays data** → Beautiful UI with filters

### Connecting Real Data

#### Option 1: Upload JSON Files (Manual)
```bash
# After running the scraper
cd "Agent Scrapper"
npx tsx src/simpleIndex.ts --limit 50

# The JSON file is in output/
# Upload it to your Vercel deployment or use environment variables
```

#### Option 2: API Integration (Automatic)
```bash
# Add to web/.env.local
NEXT_PUBLIC_API_URL=https://your-api.com/leads

# Modify web/app/api/leads/route.ts to fetch from your API
```

#### Option 3: Database Integration (Advanced)
- Connect to MongoDB, PostgreSQL, or Supabase
- Store leads in database
- Query from API route

## 🎨 Features

### Dashboard Includes:
- ✅ **Statistics Cards** - Total leads, construction, real estate counts
- ✅ **Tabbed Interface** - Filter by All, Construction, Real Estate
- ✅ **Search Functionality** - Search by name, company, email, phone
- ✅ **Responsive Design** - Works on mobile, tablet, desktop
- ✅ **Beautiful UI** - Gradient backgrounds, smooth animations
- ✅ **Live Data** - Auto-refreshes with latest scraped data
- ✅ **Contact Links** - Click to email or visit website

## 🔄 Update Your Data

### Manual Update
1. Run scraper locally:
   ```bash
   npx tsx src/simpleIndex.ts --limit 100 --json
   ```

2. Upload JSON to Vercel:
   - Use Vercel's file upload
   - Or commit to git and redeploy

### Automatic Update (Coming Soon)
- Set up GitHub Actions
- Run scraper on schedule
- Auto-deploy to Vercel

## 🌐 Custom Domain

1. In Vercel Dashboard:
   - Go to Project Settings
   - Click "Domains"
   - Add your custom domain
   - Follow DNS instructions

## 📱 Mobile Responsive

The dashboard is fully responsive:
- **Desktop**: Full table view with all columns
- **Tablet**: Optimized layout
- **Mobile**: Card-based layout (automatically adapts)

## 🔐 Environment Variables (Optional)

Create `web/.env.local`:
```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://your-api.com

# Analytics (optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Feature Flags
NEXT_PUBLIC_ENABLE_EXPORT=true
```

## 🚀 Performance

- **Static Generation** where possible
- **API Routes** for dynamic data
- **Optimized Bundle** - Only ship what's needed
- **Fast Load Times** - < 1s first paint

## 🛠️ Development

```bash
# Install dependencies
cd web
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## 📦 Project Structure

```
web/
├── app/
│   ├── api/
│   │   └── leads/
│   │       └── route.ts          # API endpoint
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Dashboard page
│   └── globals.css               # Global styles
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## 🎉 Next Steps

1. **Deploy to Vercel** ✅
2. **Add custom domain** (optional)
3. **Set up automatic scraping** with GitHub Actions
4. **Add authentication** (if needed)
5. **Integrate with CRM** (if needed)

## 🐛 Troubleshooting

### Build Fails
- Check Node.js version (18+ required)
- Clear `.next` folder and rebuild
- Check for TypeScript errors

### No Data Showing
- Verify JSON files in `/output`
- Check API route at `/api/leads`
- Check browser console for errors

### Slow Performance
- Enable ISR (Incremental Static Regeneration)
- Add caching to API routes
- Optimize images

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Your dashboard is ready to deploy! 🎨**

Just push to GitHub and import to Vercel!

