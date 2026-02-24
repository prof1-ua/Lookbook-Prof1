# Lookbook Generator

AI-powered lookbook photo generator. Upload individual clothing items, specify model measurements and a location — get a professional-looking photoshoot.

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **FAL.ai** — AI pipeline (background removal, FLUX model generation, IDM-VTON try-on, background replacement, upscaling)
- **Tailwind CSS** + custom components
- **Supabase** — storage & database (optional for MVP)

## AI Pipeline

```
Clothing photos → Remove BG → Generate Model (FLUX) → Virtual Try-On (IDM-VTON) → Background Replace → Upscale → Done
```

**Clothing order applied:** bottom → top → shoes → hat

**Cost per photo:** ~$0.10

## Setup

### 1. Install Node.js

Download from https://nodejs.org (LTS version)

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env.local
```

Fill in:
- `FAL_KEY` — from https://fal.ai/dashboard/keys
- `NEXT_PUBLIC_SUPABASE_URL` + keys — from https://app.supabase.com (optional)

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000

## Supabase Setup (optional)

Create a bucket named `lookbook` in Supabase Storage with public access.

## Deployment

Deploy to Vercel:
```bash
npm install -g vercel
vercel
```

Add environment variables in Vercel dashboard.

## Project Structure

```
app/
  page.tsx                    # Landing page
  generate/page.tsx           # Main generator wizard
  api/
    generate-lookbook/        # Full pipeline orchestrator
    remove-background/        # FAL birefnet
    generate-model/           # FLUX.1 model generation
    try-on/                   # IDM-VTON virtual try-on
    set-background/           # BRIA background replace
    upscale/                  # Clarity upscaler
    fal/proxy/                # FAL client-side upload proxy
components/
  ClothingUploader.tsx        # 4-slot drag & drop uploader
  ModelConfigurator.tsx       # Model parameters (gender, height, etc.)
  BackgroundSelector.tsx      # Location & lighting picker
  GenerationProgress.tsx      # Step-by-step progress indicator
  LookbookResult.tsx          # Result view + download/share
lib/
  fal.ts                      # FAL.ai API wrappers
  supabase.ts                 # Supabase client & helpers
  utils.ts                    # cn(), file upload helpers
types/
  lookbook.ts                 # All TypeScript types
```
