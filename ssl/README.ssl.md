# 🔒 GameForge SSL/TLS Deployment Guide

## Overview

This guide covers the complete setup of SSL/TLS certificates using Let's Encrypt for GameForge production deployment with automatic renewal and monitoring.

## 🚀 Quick Setup

### 1. Configure Domain

Ensure your domain points to your server:
```bash
# Check domain resolution
dig +short yourdomain.com
dig +short www.yourdomain.com  
dig +short api.yourdomain.com
```

### 2. Setup SSL/TLS

```bash
# Make setup script executable
chmod +x ssl/scripts/setup-ssl.sh

# Run SSL setup (replace with your domain and email)
./ssl/scripts/setup-ssl.sh yourdomain.com admin@yourdomain.com false
```

### 3. Deploy with SSL

```bash
# Deploy with SSL support
docker-compose -f docker-compose.production-secure.yml -f docker-compose.ssl.yml up -d

# Verify SSL is working
curl -I https://yourdomain.com
```

## 📋 Detailed Setup Steps

### Step 1: Prerequisites

1. **Domain Configuration**
   - Domain must point to your server IP
   - Subdomains (www, api) should also resolve
   - Port 80 and 443 must be open

2. **Environment Setup**
   ```bash
   # Copy SSL environment template
   cp ssl/.env.ssl.template .env.ssl

   # Edit with your domain and email
   nano .env.ssl

   # Merge with main environment file
   cat .env.ssl >> .env.production
   ```

### Step 2: Initial Certificate Generation

```bash
# Option A: Use automated setup script
./ssl/scripts/setup-ssl.sh yourdomain.com admin@yourdomain.com

# Option B: Manual setup
mkdir -p /etc/letsencrypt /var/www/certbot

# Start nginx with HTTP-only config for ACME challenge
docker-compose -f docker-compose.production-secure.yml up -d nginx

# Request certificate
docker run --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/www/certbot:/var/www/certbot \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@yourdomain.com \
  --agree-tos \
  --no-eff-email \
  -d yourdomain.com \
  -d www.yourdomain.com \
  -d api.yourdomain.com
```

### Step 3: Configure SSL Nginx

```bash
# Copy SSL nginx configuration
cp nginx/nginx.ssl.conf nginx/nginx.conf

# Update domain placeholders
sed -i 's/${DOMAIN}/yourdomain.com/g' nginx/nginx.conf

# Test configuration
docker-compose -f docker-compose.production-secure.yml exec nginx nginx -t

# Reload nginx with SSL config
docker-compose -f docker-compose.production-secure.yml restart nginx
```

### Step 4: Setup Automatic Renewal

```bash
# Deploy SSL renewal service
docker-compose -f docker-compose.ssl.yml up -d

# Test renewal (dry run)
docker-compose -f docker-compose.ssl.yml exec certbot certbot renew --dry-run

# Check renewal service logs
docker-compose -f docker-compose.ssl.yml logs cert-renewal
```

## 🔧 Configuration Options

### Multi-Domain Setup

```bash
# For multiple domains, update the certificate command:
certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@yourdomain.com \
  --agree-tos \
  --expand \
  -d yourdomain.com \
  -d www.yourdomain.com \
  -d api.yourdomain.com \
  -d admin.yourdomain.com \
  -d cdn.yourdomain.com
```

### Wildcard Certificates

```bash
# For wildcard certificates (requires DNS challenge)
certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials ~/.secrets/certbot/cloudflare.ini \
  --email admin@yourdomain.com \
  --agree-tos \
  -d yourdomain.com \
  -d "*.yourdomain.com"
```

### Custom SSL Configuration

Edit `nginx/nginx.ssl.conf` to customize:

```nginx
# Custom SSL protocols
ssl_protocols TLSv1.3;

# Custom cipher suites  
ssl_ciphers TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256;

# Custom HSTS header
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

## 📊 Monitoring & Alerts

### Certificate Expiry Monitoring

```bash
# Check certificate status manually
./ssl/scripts/health-check-certs.sh

# View certificate details
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/fullchain.pem -text -noout

# Check expiry date
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/fullchain.pem -enddate -noout
```

### Automated Monitoring

The SSL infrastructure includes:

- **Daily certificate checks** via cron
- **Prometheus metrics** for certificate expiry
- **Slack notifications** for renewal events
- **Email alerts** for critical issues

### Grafana Dashboard

Import the SSL monitoring dashboard:
- Certificate expiry countdown
- SSL handshake performance
- Certificate renewal status
- SSL security score

## 🔒 Security Best Practices

### 1. Security Headers

All security headers are automatically configured:
- `Strict-Transport-Security` (HSTS)
- `X-Frame-Options`
- `X-Content-Type-Options`
- `X-XSS-Protection`
- `Content-Security-Policy`

### 2. Perfect Forward Secrecy

- Strong DH parameters (2048-bit)
- ECDHE cipher suites
- Session ticket rotation

### 3. OCSP Stapling

Automatic OCSP stapling for improved performance:
```nginx
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate /etc/letsencrypt/live/yourdomain.com/chain.pem;
```

## 🔄 Renewal Process

### Automatic Renewal

Certificates are automatically renewed:
- **Check frequency**: Twice daily (12:00 and 00:00)
- **Renewal threshold**: 30 days before expiry
- **Zero downtime**: Nginx graceful reload
- **Backup**: Old certificates backed up before renewal

### Manual Renewal

```bash
# Force renewal (for testing)
docker-compose -f docker-compose.ssl.yml exec certbot certbot renew --force-renewal

# Renew specific domain
docker-compose -f docker-compose.ssl.yml exec certbot certbot renew --cert-name yourdomain.com

# Dry run (test renewal without making changes)
docker-compose -f docker-compose.ssl.yml exec certbot certbot renew --dry-run
```

## 🔧 Troubleshooting

### Common Issues

1. **Domain not resolving**
   ```bash
   # Check DNS resolution
   nslookup yourdomain.com
   dig yourdomain.com
   ```

2. **Port 80/443 not accessible**
   ```bash
   # Check if ports are open
   netstat -tlnp | grep :80
   netstat -tlnp | grep :443

   # Test external connectivity
   curl -I http://yourdomain.com
   ```

3. **Certificate request failed**
   ```bash
   # Check certbot logs
   docker-compose -f docker-compose.ssl.yml logs certbot

   # Verify webroot is accessible
   echo "test" > /var/www/certbot/test.txt
   curl http://yourdomain.com/.well-known/acme-challenge/test.txt
   ```

4. **Nginx configuration errors**
   ```bash
   # Test nginx config
   docker-compose exec nginx nginx -t

   # Check nginx logs
   docker-compose logs nginx
   ```

### Certificate Validation

```bash
# Test SSL connection
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Check certificate chain
openssl s_client -connect yourdomain.com:443 -showcerts

# Verify certificate matches private key
openssl x509 -noout -modulus -in /etc/letsencrypt/live/yourdomain.com/fullchain.pem | openssl md5
openssl rsa -noout -modulus -in /etc/letsencrypt/live/yourdomain.com/privkey.pem | openssl md5
```

### Performance Testing

```bash
# SSL Labs test (online)
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com

# Local SSL test
curl -I https://yourdomain.com
curl -w "@curl-format.txt" -o /dev/null -s "https://yourdomain.com"
```

## 📚 Additional Resources

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [SSL Labs Server Test](https://www.ssllabs.com/ssltest/)
- [Certificate Transparency Logs](https://crt.sh/)

## 🎯 Production Checklist

- [ ] Domain DNS configured correctly
- [ ] Firewall allows ports 80 and 443
- [ ] Initial certificate generated successfully
- [ ] SSL nginx configuration applied
- [ ] HTTPS redirects working
- [ ] Security headers present
- [ ] SSL Labs score A+ achieved
- [ ] Automatic renewal configured
- [ ] Monitoring and alerts setup
- [ ] Certificate backup configured
- [ ] Team trained on SSL procedures

## 🚀 Next Steps

After SSL/TLS setup is complete:

1. **Update application URLs** to use HTTPS
2. **Configure CDN** with SSL if using one
3. **Update OAuth providers** with HTTPS redirect URLs
4. **Test all application features** with HTTPS
5. **Monitor SSL performance** and security
6. **Plan certificate renewal procedures**
7. **Document emergency procedures**

Your GameForge application is now secured with enterprise-grade SSL/TLS! 🔒✨
