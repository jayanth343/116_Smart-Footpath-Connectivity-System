# Google Cloud Deployment Guide

## Prerequisites
1. Install [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
2. Authenticate: `gcloud auth login`
3. Set your project: `gcloud config set project YOUR_PROJECT_ID`

## Deployment Options

### Option 1: Cloud Run (Recommended)

#### Using Cloud Build (Automated)
```powershell
gcloud builds submit --config cloudbuild.yaml
```

#### Manual Deployment
```powershell
# Build and push to Container Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/pathfinders-backend

# Deploy to Cloud Run
gcloud run deploy pathfinders-backend `
  --image gcr.io/YOUR_PROJECT_ID/pathfinders-backend `
  --region asia-southeast1 `
  --platform managed `
  --allow-unauthenticated `
  --memory 2Gi `
  --cpu 2 `
  --timeout 300
```

### Option 2: Using Docker locally then push

```powershell
# Build the image
docker build -t gcr.io/YOUR_PROJECT_ID/pathfinders-backend .

# Test locally
docker run -p 8080:8080 --env-file .env gcr.io/YOUR_PROJECT_ID/pathfinders-backend

# Push to Google Container Registry
docker push gcr.io/YOUR_PROJECT_ID/pathfinders-backend

# Deploy to Cloud Run
gcloud run deploy pathfinders-backend `
  --image gcr.io/YOUR_PROJECT_ID/pathfinders-backend `
  --region asia-southeast1 `
  --platform managed `
  --allow-unauthenticated `
  --memory 2Gi `
  --cpu 2 `
  --timeout 300
```

## Environment Variables

Make sure to set your environment variables in Cloud Run:

```powershell
gcloud run services update pathfinders-backend `
  --region asia-southeast1 `
  --update-env-vars GEMINI_API_KEY=your_key,SUPABASE_URL=your_url,SUPABASE_KEY=your_key
```

Or use secrets:
```powershell
gcloud run services update pathfinders-backend `
  --region asia-southeast1 `
  --update-secrets GEMINI_API_KEY=gemini-api-key:latest,SUPABASE_URL=supabase-url:latest,SUPABASE_KEY=supabase-key:latest
```

## Notes
- The service will run on port 8080 (Cloud Run default)
- Adjust memory/CPU in cloudbuild.yaml or deployment commands as needed
- The timeout is set to 300 seconds for long-running predictions
- Make sure best.pt file is included in your deployment
