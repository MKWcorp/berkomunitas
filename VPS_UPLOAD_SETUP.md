# VPS Upload Setup Guide

## 🎯 Architecture
```
User Upload → Vercel App → VPS API → Store File → Return URL
```

## 🖥️ VPS Setup (Ubuntu/CentOS)

### 1. Install Nginx
```bash
# Ubuntu
sudo apt update
sudo apt install nginx

# CentOS
sudo yum install nginx
```

### 2. Create Upload Directory
```bash
sudo mkdir -p /var/www/uploads
sudo chown www-data:www-data /var/www/uploads
sudo chmod 755 /var/www/uploads
```

### 3. Nginx Configuration
```nginx
# /etc/nginx/sites-available/uploads
server {
    listen 80;
    server_name cdn.berkomunitas.com; # Your subdomain
    
    # Static file serving
    location /uploads/ {
        alias /var/www/uploads/;
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }
    
    # Upload API
    location /api/upload {
        proxy_pass http://localhost:3001;
        client_max_body_size 10M;
    }
}
```

### 4. SSL Certificate (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d cdn.berkomunitas.com
```

## 🚀 Upload API Server (Node.js)

### 1. Create Upload Server
```javascript
// vps-upload-server.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const cors = require('cors');

const app = express();

// CORS for Vercel domain
app.use(cors({
    origin: ['https://berkomunitas.com', 'https://www.berkomunitas.com'],
    credentials: true
}));

// Multer configuration
const storage = multer.diskStorage({
    destination: '/var/www/uploads/',
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only images allowed!'));
        }
    }
});

// Upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const fileUrl = `https://cdn.berkomunitas.com/uploads/${req.file.filename}`;
        
        res.json({
            success: true,
            url: fileUrl,
            filename: req.file.filename
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(3001, () => {
    console.log('🚀 Upload server running on port 3001');
});
```

### 2. Process Manager (PM2)
```bash
npm install -g pm2
pm2 start vps-upload-server.js --name "upload-api"
pm2 startup
pm2 save
```

## 🔧 Vercel Integration

### 1. Environment Variables
```env
# .env.local
VPS_UPLOAD_URL=https://cdn.berkomunitas.com/api/upload
VPS_UPLOAD_TOKEN=your-secure-token-here
```

### 2. Upload Function
```javascript
// utils/uploadToVPS.js
export async function uploadToVPS(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(process.env.VPS_UPLOAD_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.VPS_UPLOAD_TOKEN}`
        },
        body: formData
    });
    
    if (!response.ok) {
        throw new Error('Upload failed');
    }
    
    return await response.json();
}
```

## 🔒 Security Measures

### 1. Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const uploadLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 uploads per IP per 15 minutes
    message: 'Too many uploads, try again later'
});

app.use('/api/upload', uploadLimit);
```

### 2. File Validation
```javascript
// Image processing and validation
const sharp = require('sharp');

app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        const filePath = req.file.path;
        
        // Process image with Sharp
        await sharp(filePath)
            .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toFile(filePath + '_processed');
            
        // Replace original with processed
        fs.renameSync(filePath + '_processed', filePath);
        
        // Return URL
        const fileUrl = `https://cdn.berkomunitas.com/uploads/${req.file.filename}`;
        res.json({ success: true, url: fileUrl });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

## 📊 Monitoring & Maintenance

### 1. Log Rotation
```bash
# /etc/logrotate.d/upload-api
/var/log/upload-api/*.log {
    daily
    missingok
    rotate 7
    compress
    notifempty
    copytruncate
}
```

### 2. Disk Space Monitoring
```bash
# Add to crontab
0 6 * * * df -h /var/www/uploads | mail -s "Upload Storage Report" admin@berkomunitas.com
```

## 🚀 Deployment Steps

1. **Setup VPS Server** (Nginx + Node.js)
2. **Configure Domain** (`cdn.berkomunitas.com`)
3. **Deploy Upload API** 
4. **Update Vercel Code** (use VPS upload)
5. **Test Upload Flow**
6. **Monitor & Maintain**

## 💰 Cost Comparison

### VPS Solution:
- **Setup Time:** 2-3 hours
- **Monthly Cost:** $0 (using existing VPS)
- **Storage:** Unlimited (VPS capacity)
- **Bandwidth:** VPS bandwidth limit

### Cloudinary:
- **Setup Time:** 30 minutes
- **Monthly Cost:** $0 (free tier) / $89+ (paid)
- **Storage:** 25GB free / Unlimited paid
- **Bandwidth:** 25GB free / Unlimited paid

## ⚡ Quick Start Script

```bash
#!/bin/bash
# Quick VPS upload setup
curl -sSL https://raw.githubusercontent.com/your-repo/vps-setup.sh | bash
```
