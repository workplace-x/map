# Azure AD Redirect URI Fix

## Issue
Getting `hash_empty_error: Hash value cannot be processed because it is empty` on the live Azure Toolbox site.

## Root Cause
The Azure AD app registration doesn't have the correct redirect URI configured for the production site, causing the authentication hash to be cleared.

## Solution

### 1. Update Azure AD App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Find your app: **Tangram Toolbox Frontend** (Client ID: `72129170-78ba-47b7-8989-fe826a45a7d4`)
4. Go to **Authentication** section
5. Under **Redirect URIs**, add the production callback URL:
   ```
   https://your-production-domain.com/auth/callback
   ```
   Replace `your-production-domain.com` with your actual production domain.

### 2. Verify Current Redirect URIs
Make sure you have these redirect URIs configured:
- `http://localhost:3001` (for development)
- `http://localhost:3002` (for development)
- `https://your-production-domain.com/auth/callback` (for production)

### 3. Additional Azure AD Settings
In the **Authentication** section, ensure:
- **Access tokens** is checked
- **ID tokens** is checked
- **Allow public client flows** is set to **No**
- **Supported account types** is set to **Accounts in this organizational directory only**

## Code Changes Made

### 1. Updated MSAL Configuration
- Added environment-specific redirect URI handling
- Improved cache configuration for production
- Added proper timeout settings
- Enabled cookie storage for better compatibility

### 2. Updated Authentication Flow
- Production uses redirect login (more reliable)
- Development uses popup login (better DX)
- Improved error handling and hash processing

### 3. Enhanced Auth Callback
- Better redirect response handling
- Proper navigation using React Router
- Complete profile loading flow
- Improved error states

## Testing

### Development
```bash
cd apps/toolbox
npm run dev
```
Visit `http://localhost:3002/sign-in` and test authentication.

### Production
Deploy the updated code and test authentication on your production domain.

## Troubleshooting

If you still get hash errors:

1. **Clear browser cache and cookies**
2. **Check browser console** for detailed error messages
3. **Verify redirect URI** matches exactly in Azure AD
4. **Check network tab** to see if redirects are working properly

## Important Notes

- The redirect URI in Azure AD must match **exactly** (including protocol, domain, port, and path)
- Make sure your production domain is using HTTPS
- The `/auth/callback` route is now the designated callback handler for production 