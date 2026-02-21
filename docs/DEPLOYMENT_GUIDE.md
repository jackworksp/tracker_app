# Vela Deployment Guide

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup (Neon PostgreSQL)](#database-setup-neon-postgresql)
5. [AWS SSM Parameter Store Setup](#aws-ssm-parameter-store-setup)
6. [Docker Deployment](#docker-deployment)
7. [CI/CD Pipeline (GitHub Actions)](#cicd-pipeline-github-actions)
8. [Production Considerations](#production-considerations)
9. [Monitoring and Logging](#monitoring-and-logging)
10. [Troubleshooting](#troubleshooting)

---

## Overview

### Deployment Architecture

Vela is deployed as a **Docker container** with the following characteristics:

- **Hosting Model**: Subpath hosting at `/vela/`
- **Web Application**: React frontend served at `/vela/`
- **API Endpoints**: Backend API served at `/vela/api/*`
- **Mobile App**: Android APK downloadable at `/vela/app-release.apk`
- **Health Check**: Available at `/vela/health`

### Multi-Stage Docker Build

The deployment uses a **two-stage Docker build**:

1. **Stage 1 (Frontend Builder)**:
   - Builds the React application using Vite
   - Outputs static files to `dist/`
   - Includes mobile APK build in CI/CD pipeline

2. **Stage 2 (Production Runtime)**:
   - Node.js 20 runtime for Express backend
   - Copies backend source code
   - Copies built frontend from Stage 1
   - Installs production-only dependencies
   - Serves frontend and API from single container

### Port Configuration

- **Container Internal Port**: 3000
- **External Port Mapping**: 80:3000 (HTTP traffic on port 80 forwarded to container port 3000)
- **Base Path**: All routes are prefixed with `/vela`

---

## Prerequisites

### Required Accounts and Services

1. **Neon Account** (Free Tier)
   - Sign up at: https://neon.tech
   - Provides serverless PostgreSQL database
   - Free tier: 512 MB storage, 0.5 GB data transfer

2. **Docker Hub Account**
   - Sign up at: https://hub.docker.com
   - Used for storing Docker images

3. **AWS Account** (Optional but recommended)
   - For AWS Systems Manager (SSM) Parameter Store
   - Secure storage for database credentials

4. **GitHub Account**
   - For repository hosting and CI/CD

5. **EC2 Instance or Similar Server**
   - Ubuntu/Debian recommended
   - Docker installed
   - SSH access configured
   - Minimum 1 GB RAM, 10 GB storage

### Required Software

- **Node.js**: 20.x or higher
- **Docker**: 20.x or higher
- **Docker Compose**: 2.x or higher (optional)
- **Git**: Latest version

---

## Environment Configuration

### Backend Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
PORT=3000
NODE_ENV=production

# AWS Configuration (Optional - for SSM Parameter Store)
DB_SSM_PARAM_NAME=/vela/production/database-url
AWS_REGION=us-east-1
```

### Environment Variable Descriptions

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes* | PostgreSQL connection string from Neon | `postgresql://user:pass@ep-xxx.neon.tech/neondb` |
| `JWT_SECRET` | Yes | Secret key for signing JWT tokens | `generate-with-openssl-rand-hex-32` |
| `PORT` | No | Server port (default: 3000) | `3000` |
| `NODE_ENV` | Yes | Environment mode | `production` |
| `DB_SSM_PARAM_NAME` | No* | AWS SSM parameter name for database URL | `/vela/production/database-url` |
| `AWS_REGION` | No | AWS region for SSM | `us-east-1` |

*Either `DATABASE_URL` or `DB_SSM_PARAM_NAME` must be provided.

### Configuration Priority

The backend loads configuration in the following priority order:

1. **Environment Variable**: `DATABASE_URL` from `.env` or system environment
2. **AWS SSM Parameter Store**: If `DB_SSM_PARAM_NAME` is set and `DATABASE_URL` is not found
3. **Fallback**: Warning logged if neither is available

See `backend/aws-config.js` for implementation details.

### Frontend Environment Variables

For mobile builds, create `.env.mobile` in `frontend-web/`:

```bash
VITE_API_URL=http://your-domain.com/vela/api
```

This is automatically used during the mobile build process to configure the API endpoint.

---

## Database Setup (Neon PostgreSQL)

### Step 1: Create Neon Project

1. Visit https://console.neon.tech
2. Sign up or log in (free account)
3. Click **"Create Project"**
4. Choose project name: `vela-production`
5. Select region closest to your server
6. Click **"Create Project"**

### Step 2: Get Connection String

1. In the Neon dashboard, navigate to your project
2. Click **"Connection Details"**
3. Copy the connection string (format: `postgresql://user:password@ep-xxx.neon.tech/dbname`)
4. Ensure `?sslmode=require` is appended (Neon requires SSL)

Example connection string:
```
postgresql://vela_user:AbC123XyZ@ep-cool-darkness-12345678.us-east-1.aws.neon.tech/vela_db?sslmode=require
```

### Step 3: Database Initialization

The database schema is **automatically created** when the backend starts. The initialization process:

1. Backend starts and calls `loadConfig()` to get `DATABASE_URL`
2. `database.js` creates a connection pool
3. `initDB()` function runs on startup
4. Creates all required tables with foreign key relationships
5. Inserts default user settings if not exists

**Tables Created**:
- `user_settings` - User configuration and preferences
- `subjects` - Study subjects/courses
- `topics` - Individual topics within subjects
- `study_sessions` - Study session logs
- `tasks` - Task management with priorities and deadlines
- `goals` - Long-term goal tracking
- `notes` - Rich text notes with tags
- `note_folders` - Hierarchical note organization
- `note_links` - Graph-based note connections
- `attachments` - File and link attachments
- `attachment_folders` - Attachment organization

### Step 4: Verify Database Connection

Once deployed, check the health endpoint:

```bash
curl http://your-domain.com/vela/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Vela API is running",
  "database": "Neon PostgreSQL",
  "apk_download": "/vela/app-release.apk"
}
```

### Neon Free Tier Limits

- **Storage**: 512 MB
- **Data Transfer**: 0.5 GB/month
- **Connections**: Reasonable limit for personal use
- **Autosuspend**: Database suspends after 5 minutes of inactivity (automatically resumes on connection)

---

## AWS SSM Parameter Store Setup

Using AWS Systems Manager (SSM) Parameter Store is **recommended** for production to avoid storing sensitive credentials in environment variables.

### Step 1: Create IAM Policy

1. Go to AWS IAM Console
2. Create a new policy with the following JSON:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters"
      ],
      "Resource": "arn:aws:ssm:us-east-1:YOUR_ACCOUNT_ID:parameter/vela/production/*"
    }
  ]
}
```

3. Name it: `VelaSSMReadPolicy`

### Step 2: Attach Policy to EC2 Instance Role

1. Navigate to EC2 instance
2. Actions → Security → Modify IAM Role
3. Create or select a role with `VelaSSMReadPolicy` attached
4. Save changes

### Step 3: Store Database URL in SSM

Using AWS CLI:

```bash
aws ssm put-parameter \
  --name "/vela/production/database-url" \
  --value "postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require" \
  --type "SecureString" \
  --region us-east-1
```

Or via AWS Console:
1. Go to AWS Systems Manager → Parameter Store
2. Click **"Create parameter"**
3. Name: `/vela/production/database-url`
4. Type: **SecureString**
5. Value: Your Neon PostgreSQL connection string
6. Click **"Create parameter"**

### Step 4: Configure Backend to Use SSM

In your deployment environment variables:

```bash
DB_SSM_PARAM_NAME=/vela/production/database-url
AWS_REGION=us-east-1
# DO NOT set DATABASE_URL - it will be fetched from SSM
```

### Verification

Check backend logs on startup:
- ✅ `Configuration successfully loaded from AWS SSM` - SSM is working
- ✅ `Configuration loaded from environment variables` - Using .env file
- ⚠️ `No DATABASE_URL or DB_SSM_PARAM_NAME found` - Configuration missing

---

## Docker Deployment

### Manual Deployment (Without CI/CD)

#### Step 1: Clone Repository

```bash
git clone https://github.com/your-username/vela.git
cd vela
```

#### Step 2: Build Mobile APK (Optional)

If you want to include the mobile app download feature:

```bash
cd frontend-web
npm install
npm run build:mobile
npx cap sync android
cd android
./gradlew assembleRelease
mkdir -p ../../mobile
cp app/build/outputs/apk/release/app-release-unsigned.apk ../../mobile/app-release.apk
cd ../..
```

**Note**: If skipping mobile build, create an empty `mobile/` directory:
```bash
mkdir mobile
```

#### Step 3: Build Docker Image

```bash
docker build -t vela:latest .
```

This will:
1. Build the React frontend (production mode, base path: `/vela/`)
2. Install backend dependencies (production only)
3. Copy backend source code
4. Copy built frontend static files
5. Copy mobile APK (if available)

#### Step 4: Run Docker Container

```bash
docker run -d \
  --name vela \
  -p 80:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL='postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require' \
  -e JWT_SECRET='your-super-secret-jwt-key' \
  --restart unless-stopped \
  vela:latest
```

**With AWS SSM**:
```bash
docker run -d \
  --name vela \
  -p 80:3000 \
  -e NODE_ENV=production \
  -e DB_SSM_PARAM_NAME=/vela/production/database-url \
  -e AWS_REGION=us-east-1 \
  -e JWT_SECRET='your-super-secret-jwt-key' \
  --restart unless-stopped \
  vela:latest
```

#### Step 5: Verify Deployment

```bash
# Check container is running
docker ps | grep vela

# View logs
docker logs vela --tail 50

# Test health endpoint
curl http://localhost/vela/health
```

### Docker Compose Deployment

Create `docker-compose.yml` in the project root:

```yaml
version: '3.8'

services:
  vela:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: vela
    ports:
      - "80:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - DB_SSM_PARAM_NAME=${DB_SSM_PARAM_NAME}
      - AWS_REGION=${AWS_REGION:-us-east-1}
    restart: unless-stopped
    volumes:
      - ./backend/uploads:/app/backend/uploads
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

Create `.env` file in project root:

```bash
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require
JWT_SECRET=your-super-secret-jwt-key
# Optional: Use SSM instead
# DB_SSM_PARAM_NAME=/vela/production/database-url
# AWS_REGION=us-east-1
```

Deploy with Docker Compose:

```bash
docker-compose up -d
docker-compose logs -f vela
```

### Updating Deployment

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## CI/CD Pipeline (GitHub Actions)

The project includes a **fully automated CI/CD pipeline** using GitHub Actions that builds and deploys to EC2 on every push to the `main` branch.

### Pipeline Overview

Location: `.github/workflows/deploy.yml`

**Workflow Steps**:
1. Checkout code
2. Setup Node.js 20 and Java 17 (for Android build)
3. Build production APK with correct API URL
4. Sign APK with debug keystore (use release keystore for production)
5. Build Docker image
6. Push to Docker Hub
7. SSH into EC2 server
8. Pull latest image and restart container

### Required GitHub Secrets

Navigate to: **Repository Settings → Secrets and variables → Actions**

Add the following secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `DOCKER_USERNAME` | Docker Hub username | `yourusername` |
| `DOCKER_PASSWORD` | Docker Hub password or access token | `dckr_pat_xxxxx` |
| `EC2_HOST` | EC2 server IP or domain | `54.123.45.67` or `vela.example.com` |
| `EC2_USERNAME` | SSH username for EC2 | `ubuntu` or `ec2-user` |
| `EC2_SSH_KEY` | Private SSH key for EC2 access | Contents of `~/.ssh/id_rsa` |
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://...` |
| `DB_SSM_PARAM_NAME` | (Optional) AWS SSM parameter name | `/vela/production/database-url` |
| `AWS_REGION` | (Optional) AWS region | `us-east-1` |

### Generating SSH Key for GitHub Actions

On your local machine:

```bash
# Generate new SSH key (no passphrase)
ssh-keygen -t rsa -b 4096 -C "github-actions@vela" -f ~/.ssh/vela_deploy_key -N ""

# Copy public key to EC2 server
ssh-copy-id -i ~/.ssh/vela_deploy_key.pub ubuntu@your-ec2-host

# Copy private key contents to GitHub secret EC2_SSH_KEY
cat ~/.ssh/vela_deploy_key
```

### Pipeline Trigger

The pipeline automatically triggers on:
- Push to `main` branch
- Manual workflow dispatch (optional)

To trigger manually:
```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

### Monitoring Pipeline Execution

1. Go to GitHub repository
2. Click **"Actions"** tab
3. Select latest workflow run
4. View logs for each step
5. Check for errors in "Deploy to EC2" step

### APK Signing for Production

The current pipeline uses a **debug keystore** for APK signing. For production releases:

1. Generate a release keystore:
```bash
keytool -genkey -v -keystore release.keystore \
  -alias vela-release -keyalg RSA -keysize 2048 -validity 10000
```

2. Store keystore file and credentials in GitHub Secrets:
   - `RELEASE_KEYSTORE` - Base64 encoded keystore file
   - `RELEASE_KEYSTORE_PASSWORD` - Keystore password
   - `RELEASE_KEY_ALIAS` - Key alias
   - `RELEASE_KEY_PASSWORD` - Key password

3. Update `.github/workflows/deploy.yml` to use release keystore instead of debug

### Deployment Verification

After successful deployment, the pipeline:
1. Waits 5 seconds for container startup
2. Checks running containers: `docker ps | grep study-tracker`
3. Shows last 20 log lines: `docker logs study-tracker --tail 20`

Check these logs in the GitHub Actions output to verify successful deployment.

---

## Production Considerations

### Security Settings

#### 1. CORS Configuration

**Current Setting** (in `backend/server.js`):
```javascript
app.use(cors({
    origin: true, // Allow all origins for development
    credentials: true
}));
```

**Recommended for Production**:
```javascript
app.use(cors({
    origin: [
        'http://your-domain.com',
        'https://your-domain.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
```

#### 2. Rate Limiting

The application includes rate limiting for security:

**Auth Endpoints** (`/api/auth/login`, `/api/auth/signup`):
- **Limit**: 5 requests per 15 minutes
- **Purpose**: Prevent brute force attacks

**API Endpoints** (all `/api/*` routes):
- **Limit**: 3000 requests per 15 minutes per IP
- **Purpose**: Prevent abuse and DDoS

To adjust limits, modify `backend/server.js`:
```javascript
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // Adjust as needed
    message: { error: 'Too many authentication attempts, please try again later' }
});
```

#### 3. JWT Secret

**Critical**: Use a strong, randomly generated secret:

```bash
# Generate secure JWT secret
openssl rand -hex 32
```

Store in environment variables, never commit to repository.

#### 4. SQL Injection Protection

The application uses **parameterized queries** throughout:
```javascript
// ✅ Safe - parameterized
await pool.query('SELECT * FROM tasks WHERE user_id = $1', [userId]);

// ❌ Unsafe - never do this
await pool.query(`SELECT * FROM tasks WHERE user_id = ${userId}`);
```

All database queries in the codebase use parameterized queries (`$1`, `$2`, etc.).

#### 5. Environment Variable Security

- **Never commit** `.env` files to repository
- `.gitignore` includes `.env` entries
- Use AWS SSM Parameter Store for sensitive credentials in production
- Rotate credentials periodically

### SSL/TLS Configuration

#### Option 1: Nginx Reverse Proxy with Let's Encrypt

Install Nginx and Certbot on EC2:

```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx
```

Create Nginx configuration (`/etc/nginx/sites-available/vela`):

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /vela {
        proxy_pass http://localhost:3000/vela;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site and get SSL certificate:

```bash
sudo ln -s /etc/nginx/sites-available/vela /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d your-domain.com
```

Certbot will automatically configure SSL and set up auto-renewal.

#### Option 2: AWS Application Load Balancer

1. Create Application Load Balancer in AWS Console
2. Add SSL certificate from AWS Certificate Manager
3. Configure target group pointing to EC2 instance port 80
4. Update security groups to allow ALB traffic

#### Option 3: Cloudflare

1. Add domain to Cloudflare
2. Enable "Always Use HTTPS"
3. Set SSL/TLS mode to "Full" or "Full (strict)"
4. Cloudflare provides free SSL certificate

### Performance Optimization

#### 1. Compression

Add gzip compression to backend (`backend/server.js`):

```bash
npm install compression
```

```javascript
const compression = require('compression');
app.use(compression());
```

#### 2. Static File Caching

Configure Nginx to cache static assets:

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

#### 3. Database Connection Pooling

The application uses `pg` connection pooling (default: 10 connections). For high traffic:

```javascript
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 20, // Increase pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
});
```

#### 4. CDN for Static Assets

Consider serving static assets from a CDN:
- Upload `frontend-web/dist/assets` to AWS S3 + CloudFront
- Update Vite build to use CDN URLs for assets

### Container Resource Limits

Limit Docker container resources to prevent memory issues:

```bash
docker run -d \
  --name vela \
  --memory="1g" \
  --cpus="1.0" \
  -p 80:3000 \
  # ... other options
  vela:latest
```

Or in `docker-compose.yml`:

```yaml
services:
  vela:
    # ... other config
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

---

## Monitoring and Logging

### Application Logging

The backend includes request logging:

```javascript
app.use((req, res, next) => {
    console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.url} from ${req.ip}`);
    next();
});
```

**View logs**:
```bash
docker logs vela -f --tail 100
```

### Structured Logging (Recommended)

Install Winston for production logging:

```bash
npm install winston
```

Example configuration:

```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
        new winston.transports.Console({ format: winston.format.simple() })
    ]
});
```

### Health Check Monitoring

Set up automated health checks:

```bash
# Cron job (every 5 minutes)
*/5 * * * * curl -f http://localhost/vela/health || systemctl restart docker-vela
```

Or use external monitoring:
- **UptimeRobot** (free tier: 50 monitors)
- **Pingdom**
- **AWS CloudWatch** (if using AWS)

### Database Monitoring

Monitor Neon database:
1. Go to Neon Console → Your Project
2. View **Metrics** tab for:
   - Active connections
   - Query performance
   - Storage usage
   - Data transfer

Set up alerts for:
- Storage approaching 512 MB limit
- Unusual connection patterns
- High query latency

### Container Monitoring

Monitor Docker container metrics:

```bash
docker stats vela
```

For production, use monitoring tools:
- **Prometheus + Grafana**
- **cAdvisor**
- **AWS CloudWatch Container Insights**

### Error Tracking

Consider integrating error tracking:
- **Sentry** (error monitoring)
- **LogRocket** (session replay)
- **Rollbar** (real-time error tracking)

### Log Rotation

Configure Docker log rotation:

```yaml
# docker-compose.yml
services:
  vela:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

Or in docker run:
```bash
docker run -d \
  --log-driver json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  # ... other options
```

---

## Troubleshooting

### Common Deployment Issues

#### 1. Container Fails to Start

**Symptoms**: Container exits immediately after starting

**Diagnosis**:
```bash
docker logs vela
```

**Common Causes**:
- Missing environment variables
- Invalid DATABASE_URL
- Port 3000 already in use inside container
- Missing `mobile/` directory during build

**Solutions**:
```bash
# Check environment variables
docker inspect vela | grep -A 20 Env

# Verify DATABASE_URL is set
docker exec vela env | grep DATABASE_URL

# Rebuild with correct configuration
docker stop vela && docker rm vela
docker build -t vela:latest .
docker run -d --name vela -p 80:3000 -e DATABASE_URL='...' vela:latest
```

#### 2. Database Connection Errors

**Symptoms**:
- `❌ Database connection error: connection to server failed`
- API returns 500 errors

**Diagnosis**:
```bash
docker logs vela | grep -i database
```

**Common Causes**:
- Incorrect DATABASE_URL format
- Missing `?sslmode=require` suffix for Neon
- Neon database suspended (auto-resumes on connection)
- Network connectivity issues

**Solutions**:
```bash
# Test connection from container
docker exec -it vela node -e "
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
pool.query('SELECT NOW()', (err, res) => {
  console.log(err ? err : res.rows[0]);
  process.exit(0);
});
"

# Verify DATABASE_URL format
# Correct: postgresql://user:pass@host.neon.tech/db?sslmode=require
# Wrong: postgres://... (should be postgresql://)
```

#### 3. Frontend Returns 404

**Symptoms**: Accessing `/vela/` returns 404 or blank page

**Common Causes**:
- Frontend not built correctly
- Wrong base path in Vite config
- Static files not copied to container

**Solutions**:
```bash
# Verify frontend files exist in container
docker exec vela ls -la /app/frontend-web/dist

# Check Vite build base path
# Should be: base: '/vela/' in vite.config.js

# Rebuild frontend
cd frontend-web
npm run build
cd ..
docker build -t vela:latest .
```

#### 4. API Calls Return 404

**Symptoms**: Frontend loads but API calls fail with 404

**Diagnosis**:
- Check browser network tab
- Look for `/vela/api/...` in requests

**Common Causes**:
- API routes not mounted under `/vela` prefix
- Proxy misconfiguration in development
- CORS blocking requests

**Solutions**:
```bash
# Test API endpoint directly
curl http://localhost/vela/api/health
curl http://localhost/vela/health

# Check backend logs
docker logs vela -f

# Verify route mounting in server.js
# Should have: app.use('/vela', appRouter)
```

#### 5. CI/CD Pipeline Fails

**Symptoms**: GitHub Actions workflow fails

**Common Failures**:

**Build APK Step**:
```bash
# Check Java and Android SDK are installed
# Verify VITE_API_URL is set correctly
# Ensure gradlew has execute permissions
```

**Docker Push Step**:
```bash
# Verify DOCKER_USERNAME and DOCKER_PASSWORD secrets
# Check Docker Hub credentials are valid
```

**Deploy to EC2 Step**:
```bash
# Verify EC2_SSH_KEY is correct private key
# Check EC2 security group allows SSH (port 22)
# Ensure EC2_HOST is reachable
```

**Solutions**:
- Review GitHub Actions logs for specific error
- Test Docker build locally: `docker build -t test .`
- Test SSH access: `ssh -i ~/.ssh/key ubuntu@ec2-host`
- Verify all secrets are set in GitHub repository settings

#### 6. Mobile APK Missing

**Symptoms**: `/vela/app-release.apk` returns 404

**Causes**:
- APK not built during CI/CD
- `mobile/` directory empty
- APK not copied to container

**Solutions**:
```bash
# Verify APK exists in container
docker exec vela ls -la /app/mobile

# If missing, create dummy mobile directory for web-only deployment
mkdir mobile
touch mobile/.gitkeep
docker build -t vela:latest .
```

#### 7. High Memory Usage

**Symptoms**: Container uses excessive memory, OOM kills

**Diagnosis**:
```bash
docker stats vela
```

**Solutions**:
```bash
# Add memory limits
docker update --memory="1g" --memory-swap="1g" vela

# Or recreate with limits
docker stop vela && docker rm vela
docker run -d --name vela --memory="1g" -p 80:3000 vela:latest

# Check for memory leaks in application logs
docker logs vela | grep -i memory
```

#### 8. SSL Certificate Issues

**Symptoms**: Browser shows "Not Secure" warning

**Solutions**:
- Verify Nginx SSL configuration
- Check Let's Encrypt certificate renewal: `sudo certbot renew --dry-run`
- Ensure Certbot auto-renewal is enabled: `sudo systemctl status certbot.timer`
- For Cloudflare, verify SSL mode is "Full" or "Full (strict)"

### Debugging Commands

```bash
# View container logs (real-time)
docker logs vela -f

# View last 100 log lines
docker logs vela --tail 100

# Inspect container configuration
docker inspect vela

# Access container shell
docker exec -it vela /bin/bash

# Check running processes in container
docker top vela

# View container resource usage
docker stats vela

# Restart container
docker restart vela

# Stop and remove container
docker stop vela && docker rm vela

# Remove all stopped containers
docker container prune

# Remove unused images
docker image prune -a

# View Docker disk usage
docker system df
```

### Emergency Rollback

If deployment fails, quickly rollback to previous version:

```bash
# On EC2 server
docker stop vela
docker rm vela

# Pull previous image tag (if tagged)
docker pull yourusername/study-tracker:previous

# Or use local previous image
docker images | grep study-tracker

# Run previous version
docker run -d --name vela -p 80:3000 \
  -e DATABASE_URL='...' \
  yourusername/study-tracker:previous
```

### Getting Help

If issues persist:

1. **Check logs**: Always start with `docker logs vela -f`
2. **Test health endpoint**: `curl http://localhost/vela/health`
3. **Verify environment**: `docker exec vela env`
4. **Check database**: Test connection from container
5. **Review GitHub Actions logs**: Check CI/CD pipeline output
6. **Consult documentation**: Review `CLAUDE.md` and `backend/README.md`

---

## Production Checklist

Before deploying to production, verify:

### Pre-Deployment

- [ ] Neon database created and connection string obtained
- [ ] All environment variables set correctly
- [ ] JWT_SECRET is strong and randomly generated
- [ ] CORS origin restricted to production domain
- [ ] Rate limiting configured appropriately
- [ ] SSL/TLS certificate obtained and configured
- [ ] Docker Hub credentials configured in GitHub Secrets
- [ ] EC2 SSH key added to GitHub Secrets
- [ ] All required GitHub Secrets added
- [ ] Mobile APK built with correct production API URL

### Deployment

- [ ] Docker image builds successfully
- [ ] Container starts without errors
- [ ] Health endpoint responds correctly
- [ ] Database connection established
- [ ] Frontend loads at `/vela/`
- [ ] API endpoints accessible at `/vela/api/*`
- [ ] Mobile APK downloadable at `/vela/app-release.apk`
- [ ] Authentication (login/signup) works
- [ ] All features tested (tasks, sessions, notes, goals)

### Post-Deployment

- [ ] Monitoring set up (health checks, logs)
- [ ] SSL certificate auto-renewal configured
- [ ] Backup strategy implemented for database
- [ ] Error tracking integrated (optional)
- [ ] Documentation updated with deployment details
- [ ] Team notified of deployment
- [ ] Rollback plan tested

---

## Additional Resources

### Documentation
- **CLAUDE.md**: Main development guide
- **FEATURES.md**: User feature documentation
- **backend/README.md**: Backend API documentation
- **frontend-web/src/design-system/README.md**: Design system guide

### External Services
- **Neon Documentation**: https://neon.tech/docs
- **Docker Documentation**: https://docs.docker.com
- **GitHub Actions**: https://docs.github.com/en/actions
- **AWS SSM**: https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html
- **Let's Encrypt**: https://letsencrypt.org/getting-started/

### Support
- **GitHub Issues**: Report bugs and request features
- **Neon Community**: https://neon.tech/community
- **Docker Community**: https://forums.docker.com

---

**Last Updated**: 2026-02-21
**Version**: 1.0
**Maintained By**: Vela Development Team
