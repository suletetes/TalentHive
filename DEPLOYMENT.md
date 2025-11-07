# TalentHive Platform - Deployment Guide

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- MongoDB 7.0+ (or MongoDB Atlas account)
- Redis 7.2+ (or Redis Cloud account)
- Domain name with SSL certificate
- Stripe account (for payments)
- SendGrid account (for emails)
- Cloudinary account (for file uploads)

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/talenthive-platform.git
cd talenthive-platform
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.production.example .env.production
```

Edit `.env.production` and set all required values:

- Database credentials
- JWT secrets (use strong random strings)
- API keys for third-party services
- Application URLs

### 3. SSL Certificate Setup

Place your SSL certificate files in the `nginx/ssl` directory:

```bash
mkdir -p nginx/ssl
# Copy your certificate files
cp /path/to/your/certificate.crt nginx/ssl/talenthive.crt
cp /path/to/your/private-key.key nginx/ssl/talenthive.key
```

## Deployment Methods

### Method 1: Docker Compose (Recommended)

#### Initial Deployment

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

#### Update Deployment

```bash
# Use the deployment script
./scripts/deploy.sh
```

### Method 2: Manual Deployment

#### Backend Deployment

```bash
cd server
npm ci --only=production
npm run build
npm start
```

#### Frontend Deployment

```bash
cd client
npm ci
npm run build
# Serve the dist folder with nginx or any static file server
```

## Database Management

### Initial Database Setup

The database will be automatically initialized on first run. To seed with sample data:

```bash
docker exec -it talenthive-backend-prod npm run seed
```

### Database Backup

Create a backup of the database:

```bash
./scripts/backup-database.sh
```

Backups are stored in `/var/backups/talenthive/` and retained for 30 days.

### Database Restore

Restore from a backup:

```bash
./scripts/restore-database.sh /var/backups/talenthive/talenthive_backup_YYYYMMDD_HHMMSS.tar.gz
```

## Monitoring and Maintenance

### Health Checks

The application provides several health check endpoints:

- **Backend Health**: `http://your-domain:5000/api/health`
- **Frontend Health**: `http://your-domain/health`
- **Readiness Check**: `http://your-domain:5000/api/ready`
- **Liveness Check**: `http://your-domain:5000/api/live`

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f mongodb
docker-compose -f docker-compose.prod.yml logs -f redis
```

### Service Management

```bash
# Stop all services
docker-compose -f docker-compose.prod.yml down

# Restart a specific service
docker-compose -f docker-compose.prod.yml restart backend

# Scale a service (if needed)
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

## CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment.

### Setup GitHub Secrets

Configure the following secrets in your GitHub repository:

- `PRODUCTION_HOST`: Your production server IP or hostname
- `PRODUCTION_USER`: SSH username for deployment
- `PRODUCTION_SSH_KEY`: SSH private key for authentication
- `VITE_API_URL`: Production API URL
- `VITE_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key

### Workflow

1. Push code to `main` branch
2. GitHub Actions runs tests
3. Builds Docker images
4. Pushes images to GitHub Container Registry
5. Deploys to production server
6. Runs health checks

## Security Considerations

### SSL/TLS

- Always use HTTPS in production
- Keep SSL certificates up to date
- Use strong cipher suites

### Environment Variables

- Never commit `.env.production` to version control
- Use strong, random values for secrets
- Rotate secrets regularly

### Database Security

- Use strong passwords
- Enable authentication
- Restrict network access
- Regular backups

### Application Security

- Keep dependencies updated
- Run security audits regularly: `npm audit`
- Monitor for vulnerabilities
- Implement rate limiting

## Performance Optimization

### Caching

- Redis is used for session storage and caching
- Static assets are cached by nginx
- Configure CDN for better performance

### Database Optimization

- Indexes are created automatically
- Monitor slow queries
- Regular maintenance and optimization

### Scaling

To scale the application:

1. Use a load balancer (nginx, HAProxy, or cloud load balancer)
2. Scale backend containers: `docker-compose up -d --scale backend=3`
3. Use managed database services (MongoDB Atlas, Redis Cloud)
4. Implement CDN for static assets

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Check service status
docker-compose -f docker-compose.prod.yml ps

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

### Database Connection Issues

- Verify MongoDB is running: `docker-compose ps mongodb`
- Check connection string in `.env.production`
- Verify network connectivity

### Redis Connection Issues

- Verify Redis is running: `docker-compose ps redis`
- Check Redis password in `.env.production`
- Test connection: `docker exec -it talenthive-redis-prod redis-cli ping`

### Application Errors

- Check application logs
- Verify all environment variables are set
- Check third-party service status (Stripe, SendGrid, Cloudinary)

## Rollback Procedure

If deployment fails:

```bash
# Stop current deployment
docker-compose -f docker-compose.prod.yml down

# Restore database from backup
./scripts/restore-database.sh /path/to/backup.tar.gz

# Checkout previous version
git checkout <previous-commit-hash>

# Deploy previous version
./scripts/deploy.sh
```

## Support and Maintenance

### Regular Maintenance Tasks

- **Daily**: Monitor logs and health checks
- **Weekly**: Review security alerts, update dependencies
- **Monthly**: Database backup verification, performance review
- **Quarterly**: Security audit, disaster recovery test

### Monitoring Checklist

- [ ] Application health checks passing
- [ ] Database backups running successfully
- [ ] Disk space sufficient
- [ ] Memory usage normal
- [ ] CPU usage normal
- [ ] No security alerts
- [ ] SSL certificate valid

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Redis Documentation](https://redis.io/documentation)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
