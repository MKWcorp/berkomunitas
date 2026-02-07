# MinIO Public Access dengan Nginx Reverse Proxy

**Problem:** MinIO port 9000 (S3 API) butuh authentication, tidak bisa langsung public access.  
**Solution:** Nginx reverse proxy untuk serve files secara public di port 9100.

---

## 🎯 Konfigurasi Nginx untuk MinIO

### 1. File Konfigurasi Nginx

Buat file: `/etc/nginx/sites-available/minio-public`

```nginx
# MinIO Public File Access via storage.berkomunitas.com
# Domain untuk HTTP public access ke bucket berkomunitas

upstream minio_s3 {
    server drw-minio:9000;  # Internal Docker hostname
    # Atau gunakan: server 127.0.0.1:9000; jika MinIO di host yang sama
}

server {
    listen 80;
    listen [::]:80;
    
    server_name storage.berkomunitas.com;
    
    # Ignore to avoid remote URLs issues
    ignore_invalid_headers off;
    
    # Allow any size file to be uploaded
    client_max_body_size 0;
    
    # Proxy buffering optimization for MinIO
    proxy_buffering off;
    proxy_request_buffering off;
    
    # Location untuk akses bucket berkomunitas secara public
    location /berkomunitas/ {
        # Proxy to MinIO
        proxy_pass http://minio_s3;
        
        # Rewrite path - hapus /berkomunitas/ prefix
        rewrite ^/berkomunitas/(.*)$ /berkomunitas/$1 break;
        
        # Headers untuk MinIO S3 API
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-NginX-Proxy true;
        
        # MinIO internal path handling
        proxy_set_header Connection "";
        chunked_transfer_encoding off;
        
        # Tambahkan headers untuk public access
        add_header X-Served-By "Nginx-MinIO-Proxy" always;
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, HEAD, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Range, Content-Type" always;
        
        # Handle OPTIONS method untuk CORS
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "*";
            add_header Access-Control-Allow-Methods "GET, HEAD, OPTIONS";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type 'text/plain charset=UTF-8';
            add_header Content-Length 0;
            return 204;
        }
    }
    
    # Root location redirect ke main site
    location = / {
        return 301 https://berkomunitas.com;
    }
    
    # Health check endpoint
    location /health {
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
}
```

---

## 📋 Langkah-Langkah Setup

### 1. Install Nginx (jika belum)
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

### 2. Buat Konfigurasi
```bash
# Buat file konfigurasi
sudo nano /etc/nginx/sites-available/minio-public

# Copy paste config di atas, save (Ctrl+X, Y, Enter)
```

### 3. Enable Konfigurasi
```bash
# Symlink ke sites-enabled
sudo ln -s /etc/nginx/sites-available/minio-public /etc/nginx/sites-enabled/

# Test konfigurasi
sudo nginx -t

# Jika OK, restart Nginx
sudo systemctl restart nginx
```

### 4. DNS Configuration
```bash
# Setup DNS A record (minta tim server atau DNS admin)
# Domain: storage.berkomunitas.com
# Type: A
# Value: 213.190.4.159
# TTL: 3600

# Verify DNS (tunggu propagasi ~5-10 menit)
nslookup storage.berkomunitas.com
dig storage.berkomunitas.com
```

### 5. Firewall Rules
```bash
# Port 80 (HTTP) - sudah biasanya open
sudo ufw allow 80/tcp

# Port 443 (HTTPS) - untuk SSL nanti
sudo ufw allow 443/tcp

# Firewalld (CentOS)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 6. Verify
```bash
# Test dari server langsung
curl http://localhost/health
# Expected: OK

# Test dengan domain (setelah DNS propagasi)
curl http://storage.berkomunitas.com/health
# Expected: OK

# Test file access (ganti dengan file yang ada)
curl -I http://storage.berkomunitas.com/berkomunitas/test-file.txt
```

---

## 🔒 Opsi: Setup dengan SSL (HTTPS)

Jika mau pakai HTTPS di port 443:

```nginx
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    
    server_name minio.drwcorp.com;  # Ganti dengan domain
    
    # SSL Certificate
    ssl_certificate /etc/ssl/certs/your-cert.crt;
    ssl_certificate_key /etc/ssl/private/your-key.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # ... rest of config sama seperti di atas ...
    
    location /berkomunitas/ {
        proxy_pass http://minio_s3;
        # ... same as above ...
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name minio.drwcorp.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 🧪 Test Migrasi Setelah Nginx Setup

Setelah Nginx jalan, test akses file:

```bash
# Test file yang baru di-upload
curl http://213.190.4.159:9100/berkomunitas/profile-pictures/migrated_138_1770442317996.jpg

# Jika sukses, akan download file (bukan XML error)
```

Lalu update `.env` **TIDAK PERLU DIUBAH** - sudah benar:
```env
MINIO_PUBLIC_URL=http://213.190.4.159:9100/berkomunitas
```

---

## 🚨 Troubleshooting

### Error: "502 Bad Gateway"
```bash
# Cek MinIO running di port 9000
sudo netstat -tulpn | grep 9000

# Cek Nginx error log
sudo tail -f /var/log/nginx/error.log
```

### Error: "Connection refused"
```bash
# Pastikan MinIO listen di 127.0.0.1:9000
# Edit MinIO config atau start command:
MINIO_ADDRESS=":9000" minio server /data
```

### Nginx tidak bisa start
```bash
# Test config
sudo nginx -t

# Lihat error detail
sudo journalctl -u nginx -n 50
```

---

## 📊 Arsitektur Akhir

```
Browser/App
    ↓
Port 9100 (Nginx - Public HTTP)
    ↓
Port 9000 (MinIO S3 API - Internal)
    ↓
Disk Storage (/data atau /mnt/minio)
```

**Public URLs:**
- `http://213.190.4.159:9100/berkomunitas/profile-pictures/file.jpg` ✅ PUBLIC
- `http://213.190.4.159:9001` → MinIO Web Console (admin only)

---

## ✅ Checklist

- [ ] Nginx installed
- [ ] Config file created di `/etc/nginx/sites-available/minio-public`
- [ ] Symlink created di `/etc/nginx/sites-enabled/`
- [ ] Nginx config tested: `sudo nginx -t`
- [ ] Nginx restarted: `sudo systemctl restart nginx`
- [ ] Firewall port 9100 opened
- [ ] Health check works: `curl http://213.190.4.159:9100/health`
- [ ] File access works: `curl http://213.190.4.159:9100/berkomunitas/test-file.txt`
- [ ] Re-run migration: `node scripts/migrate-images-to-minio.js`
- [ ] Verify images: `curl -I http://213.190.4.159:9100/berkomunitas/profile-pictures/migrated_138_*.jpg`

---

**💡 Setelah Nginx setup, jalankan:**
```bash
# 1. Rollback ke Cloudinary
python scripts/rollback-to-cloudinary.py

# 2. Migrasi ulang
node scripts/migrate-images-to-minio.js

# 3. Test URL
curl http://213.190.4.159:9100/berkomunitas/profile-pictures/migrated_138_*.jpg
```
