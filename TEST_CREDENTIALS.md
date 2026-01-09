# Test Credentials for Campus Mart

## Option 1: Use Real College Email Domains
If you have actual college email addresses, use those:
- Replace `college.edu` with your actual college domain
- Example: `john@mit.edu`, `sarah@stanford.edu`

## Option 2: Use Temporary Email Service
Use services like **Mailtrap** or **Ethereal Email** for testing:
1. Sign up at [https://mailtrap.io/](https://mailtrap.io/) (free tier available)
2. Get your test email credentials
3. Update your `.env` with Mailtrap SMTP settings
4. Use test emails like: `test1@mailtrap.io`, `test2@mailtrap.io`

## Option 3: Skip Email Verification (Development Only)
Edit the **login** middleware to auto-verify test users:

```javascript
// In controllers/users.js - modify the login function:
module.exports.login = async (req, res) => {
    // For testing: auto-verify test accounts
    if (['seller_john', 'buyer_sarah'].includes(req.user.username)) {
        req.user.isVerified = true;
        await req.user.save();
    }
    
    if (!req.user.isVerified) {
        req.logout(() => {});
        req.flash("error", "Please verify your email before logging in.");
        return res.redirect("/login");
    }
    req.flash("success", `Welcome back, ${req.user.username}!`);
    const redirectUrl = res.locals.redirectUrl || "/products";
    res.redirect(redirectUrl);
};
```

---

## Recommended Test Users (Using Option 3 - Skip Verification for Testing)

### Test User 1 (Seller)
- **Username**: `seller_john`
- **Email**: `john@testcollege.local`
- **Password**: `TestPass123!`
- **Phone**: `9876543210`
- **College**: `MIT`

### Test User 2 (Buyer)
- **Username**: `buyer_sarah`
- **Email**: `sarah@testcollege.local`
- **Password**: `TestPass456!`
- **Phone**: `9876543211`
- **College**: `Stanford`

---

## Quick Setup for Local Testing

1. Use Option 3 (auto-verify test accounts) for fastest development
2. Sign up both users with any email address (verification will be skipped)
3. Start testing product creation and reviews immediately

---

## Admin Login (Local Testing)

A default admin user is auto-created on server start if missing.

- Username: `admin`
- Email: `admin@campus.local`
- Password: `admin123`

You can override these with environment variables:

- `DEFAULT_ADMIN_USERNAME`
- `DEFAULT_ADMIN_PASSWORD`
- `DEFAULT_ADMIN_EMAIL`

Admin routes for quick access:

- Login: `/admin/login`
- Dashboard: `/admin`

