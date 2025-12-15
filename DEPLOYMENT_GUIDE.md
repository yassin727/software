# 🚀 HMTS Deployment Guide

Choose the best hosting option for your needs:

## 🎯 Quick Recommendations

### For Beginners: **Railway** (Easiest)
- ✅ One-click MySQL database
- ✅ Automatic deployments from GitHub
- ✅ Generous free tier ($5/month credit)
- ✅ No configuration needed

### For Free Hosting: **Heroku** (Most Popular)
- ✅ Well-documented
- ✅ Large community
- ✅ Many addons available
- ⚠️ Sleeps after 30 minutes of inactivity

### For Performance: **Render** (Best Free Performance)
- ✅ No sleep mode
- ✅ Automatic SSL
- ✅ Good performance
- ⚠️ Uses PostgreSQL (requires schema conversion)

### For Scale: **Vercel + PlanetScale** (Most Modern)
- ✅ Serverless (infinite scale)
- ✅ Global CDN
- ✅ Git-based deployments
- ⚠️ More complex setup

## 🚀 Fastest Setup: Railway

1. **Create account**: [railway.app](https://railway.app)
2. **Install CLI**: `npm install -g @railway/cli`
3. **Login**: `railway login`
4. **Initialize**: `railway init`
5. **Add database**: `railway add mysql`
6. **Set JWT secret**: `railway variables set JWT_SECRET="your-secret-here"`
7. **Deploy**: `railway up`
8. **Setup database**: `railway run npm run setup`
9. **Create admin**: `railway run node create-admin.js`
10. **Seed menus**: `railway run node seed-menu.js`

Your app will be live at the generated Railway URL!

## 📋 Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database connection string ready
- [ ] JWT_SECRET set to secure value
- [ ] NODE_ENV=production
- [ ] All dependencies in package.json
- [ ] Database schema ready to deploy

## 🔧 Environment Variables Needed

```bash
NODE_ENV=production
JWT_SECRET=your-super-secure-jwt-secret-key-here
# Database URL (provided by hosting platform)
```

## 📱 After Deployment

1. **Test the endpoints**:
   - `GET /health` - Should return API status
   - `GET /` - Should serve home.html
   - `POST /api/auth/register` - Test user registration

2. **Create admin user**:
   ```bash
   # Run on your hosting platform
   node create-admin.js
   ```

3. **Seed menu data**:
   ```bash
   # Run on your hosting platform  
   node seed-menu.js
   ```

4. **Test the full flow**:
   - Register as homeowner/maid
   - Login with different roles
   - Admin approval workflow
   - Job creation and management

## 🆘 Troubleshooting

### Database Connection Issues
- Check environment variables
- Verify database URL format
- Check SSL requirements

### App Won't Start
- Check logs on hosting platform
- Verify all dependencies installed
- Check PORT environment variable

### 404 Errors
- Verify static file serving
- Check route configurations
- Ensure build completed successfully

## 📞 Support

Each hosting platform has excellent documentation:
- **Railway**: [docs.railway.app](https://docs.railway.app)
- **Heroku**: [devcenter.heroku.com](https://devcenter.heroku.com)
- **Render**: [render.com/docs](https://render.com/docs)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)

Choose your preferred platform and follow the detailed setup guide!