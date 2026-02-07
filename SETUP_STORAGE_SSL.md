# 🔒 Setup SSL for storage.berkomunitas.com

## ⚠️ Problem

Production console errors:
```
Mixed Content: The page at 'https://berkomunitas.com' was loaded over HTTPS, 
but requested an insecure element 'http://storage.berkomunitas.com/...'

ERR_CERT_COMMON_NAME_INVALID: storage.berkomunitas.com
```

**Root Cause:** `storage.berkomunitas.com` tidak punya SSL certificate, masih pakai HTTP.

---

## ✅ Solution: Add Let's Encrypt SSL

### 1️⃣ **Install Certbot (Jika Belum Ada)**

```bash
ssh root@213.190.4.159

# Install Certbot
apt update
apt install certbot python3-certbot-nginx -y
```

---

### 2️⃣ **Generate SSL Certificate untuk storage.berkomunitas.com**

```bash
# Stop nginx temporarily
systemctl stop nginx

# Generate certificate
certbot certonly --standalone -d storage.berkomunitas.com --email wiro@drwcorp.com --agree-tos --no-eff-email

# Start nginx
systemctl start nginx
```

**Output expected:**
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/storage.berkomunitas.com/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/storage.berkomunitas.com/privkey.pem
```

---

### 3️⃣ **Update Nginx Config dengan SSL**

```bash
# Edit Nginx config
nano /etc/nginx/sites-available/storage.berkomunitas.com

# Or if using different path
nano /etc/nginx/conf.d/storage.berkomunitas.com.conf
```

**Replace dengan config ini:**

```nginx
# HTTP - Redirect to HTTPS
server {
    listen 80;
    server_name storage.berkomunitas.com;
    
    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS - MinIO Reverse Proxy
server {
    listen 443 ssl http2;
    server_name storage.berkomunitas.com;
    
    # SSL Certificate
    ssl_certificate /etc/letsencrypt/live/storage.berkomunitas.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/storage.berkomunitas.com/privkey.pem;
    
    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # CORS Headers
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, HEAD, OPTIONS, PUT, POST' always;
    add_header 'Access-Control-Allow-Headers' 'Range, Content-Type, Authorization, X-Amz-Date, X-Amz-Content-Sha256' always;
    add_header 'Access-Control-Expose-Headers' 'Content-Length, Content-Range, ETag' always;
    
    # Handle OPTIONS preflight
    if ($request_method = 'OPTIONS') {
        return 204;
    }
    
    # Proxy to MinIO
    location / {
        proxy_pass http://localhost:9100;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # MinIO specific
        proxy_buffering off;
        proxy_request_buffering off;
        client_max_body_size 100M;
    }
}
```

---

### 4️⃣ **Test & Reload Nginx**

```bash
# Test config
nginx -t

# Expected output:
# nginx: configuration file /etc/nginx/nginx.conf test is successful

# Reload nginx
systemctl reload nginx

# Check status
systemctl status nginx
```

---

### 5️⃣ **Update Environment Variables**

Update `MINIO_PUBLIC_URL` dari HTTP → HTTPS:

#### **Vercel:**
```bash
# Go to Vercel Dashboard → Settings → Environment Variables
# Update:
MINIO_PUBLIC_URL=https://storage.berkomunitas.com/berkomunitas
```

#### **Local .env:**
```bash
# Update .env file
MINIO_PUBLIC_URL=https://storage.berkomunitas.com/berkomunitas
```

---

### 6️⃣ **Update Database URLs (Existing Photos)**

Ada 24 photos dengan `http://` yang perlu di-update ke `https://`:

```bash
# Login to PostgreSQL
psql -h 213.190.4.159 -U berkomunitas -d berkomunitas_db

# Update all MinIO URLs to HTTPS
UPDATE members
SET foto_profil_url = REPLACE(foto_profil_url, 
    'http://storage.berkomunitas.com', 
    'https://storage.berkomunitas.com')
WHERE foto_profil_url LIKE 'http://storage.berkomunitas.com%';

# Check result
SELECT COUNT(*) FROM members 
WHERE foto_profil_url LIKE 'https://storage.berkomunitas.com%';
-- Should return: 24

\q
```

---

### 7️⃣ **Test SSL Certificate**

```bash
# Test from server
curl -I https://storage.berkomunitas.com/berkomunitas/profile-pictures/1770451372_hcpx4mardfsjeshbpdop.jpg

# Expected output:
# HTTP/2 200
# content-type: image/jpeg
# ...
```

**Or test in browser:**
```
https://storage.berkomunitas.com/berkomunitas/profile-pictures/1770451372_hcpx4mardfsjeshbpdop.jpg
```

Should load without certificate errors! ✅

---

### 8️⃣ **Redeploy Next.js Application**

Setelah environment variables updated di Vercel:

```bash
# Trigger redeploy
# Via Vercel Dashboard → Deployments → Redeploy
# Or via Git push (will auto-deploy)
```

---

## 🔄 **Auto-Renewal SSL Certificate**

Let's Encrypt certificates expire every 90 days. Setup auto-renewal:

```bash
# Test renewal
certbot renew --dry-run

# Certbot auto-adds cron job for renewal
# Check:
systemctl status certbot.timer

# Or check crontab
crontab -l
```

---

## ✅ **Verification Checklist**

After setup complete:

- [ ] SSL certificate installed: `https://storage.berkomunitas.com` works
- [ ] No browser certificate errors
- [ ] Photos load without "Mixed Content" warnings
- [ ] Database URLs updated to HTTPS (24 photos)
- [ ] Vercel environment variables updated
- [ ] Next.js redeployed
- [ ] Test upload new photo (should use HTTPS URL)
- [ ] Check console: No security errors

---

## 🚨 **Troubleshooting**

### Certificate generation fails:
```bash
# Check DNS
dig storage.berkomunitas.com

# Check port 80 open
netstat -tulpn | grep :80

# Ensure nginx stopped during cert generation
systemctl stop nginx
certbot certonly --standalone -d storage.berkomunitas.com
systemctl start nginx
```

### Nginx won't start:
```bash
# Check detailed error
journalctl -xeu nginx

# Common issues:
# - Certificate paths wrong
# - Port 443 already in use
# - Syntax error in config
```

### Photos still HTTP:
```bash
# Check database
psql -h 213.190.4.159 -U berkomunitas -d berkomunitas_db -c "SELECT COUNT(*) FROM members WHERE foto_profil_url LIKE 'http://storage%';"

# Should return: 0 (all HTTPS)
```

---

## 📊 **Summary**

**Before:**
```
❌ http://storage.berkomunitas.com (no SSL)
❌ Mixed Content warnings
❌ ERR_CERT_COMMON_NAME_INVALID
```

**After:**
```
✅ https://storage.berkomunitas.com (with SSL)
✅ No warnings
✅ Secure image loading
```

---

**Created:** 2026-02-07  
**Status:** Ready for Server Configuration
