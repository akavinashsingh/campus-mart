# Password Reset Feature Implementation

## Overview
A complete password reset feature has been implemented for the Campus Mart application. Users can now reset their forgotten passwords by requesting a reset link via email.

## Changes Made

### 1. **Updated User Model** (`models/User.js`)
Added two new fields to store password reset tokens:
- `passwordResetToken`: String - stores the reset token
- `passwordResetTokenExpires`: Date - stores when the token expires (1 hour)

### 2. **Added Controller Functions** (`controllers/users.js`)
Four new controller methods:

- **`renderForgotPasswordForm()`** - Displays the forgot password form
- **`forgotPassword()`** - Handles password reset request
  - Validates email
  - Generates secure reset token using crypto
  - Sets token expiration to 1 hour
  - Sends password reset email with link
  - Returns security-conscious message (doesn't reveal if email exists)

- **`renderResetPasswordForm()`** - Displays the password reset form
  - Validates the reset token
  - Checks if token hasn't expired
  - Renders reset form with the token

- **`resetPassword()`** - Handles the actual password reset
  - Validates token validity and expiration
  - Validates new password and confirmation match
  - Sets new password using passport-local-mongoose's `setPassword()`
  - Clears reset token fields
  - Redirects to login with success message

- **`sendPasswordResetEmail()`** - Sends password reset email
  - Uses existing nodemailer configuration from SMTP settings
  - Logs reset link to console as fallback
  - Includes 1-hour expiration notice in email

### 3. **Updated Routes** (`routes/users.js`)
Added three new route handlers:
```
GET  /forgot-password        - Shows forgot password form
POST /forgot-password        - Processes password reset request
GET  /reset-password         - Shows reset password form
POST /reset-password/:token  - Processes password reset
```

### 4. **Created Views**

**`views/users/forgot-password.ejs`**
- Email input form
- Instructions for user
- Link back to login
- Styled with Bootstrap

**`views/users/reset-password.ejs`**
- New password input field
- Confirm password input field
- Uses token from query parameter
- Form submits to `/reset-password/:token` endpoint
- Styled with Bootstrap

### 5. **Updated Login Page** (`views/users/login.ejs`)
Added "Forgot password?" link below password field that directs to `/forgot-password`

## How It Works

1. **User Forgot Password:**
   - User clicks "Forgot password?" on login page or visits `/forgot-password`
   - Enters their email address
   - System checks if email exists (doesn't reveal if not found for security)
   - Generates a unique reset token
   - Sends email with reset link: `{baseUrl}/reset-password?token={token}`

2. **Email Reset Link:**
   - Email contains clickable reset link
   - Link is valid for 1 hour
   - If SMTP not configured, link is logged to console as fallback

3. **Reset Password:**
   - User clicks link from email → `/reset-password?token={token}`
   - System validates token and expiration
   - User enters new password and confirmation
   - System updates password using passport-local-mongoose
   - Clears reset token
   - Redirects to login page

## Email Configuration
The feature uses existing SMTP configuration from `.env`:
```
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
SMTP_SECURE
SMTP_FROM
```

If SMTP is not configured, the reset link is logged to console for testing/development.

## Security Features
✓ Reset tokens expire after 1 hour
✓ Tokens are cryptographically random (32 bytes)
✓ Email-based authentication (user must have access to email)
✓ Security-conscious response (doesn't reveal if email exists)
✓ Password validation with confirmation
✓ One-time use tokens (cleared after reset)

## Testing
You can test the feature by:
1. Going to login page and clicking "Forgot password?"
2. Entering a registered email
3. Checking console for fallback reset link if SMTP not configured
4. Visiting reset link and entering new password
5. Logging in with new password
