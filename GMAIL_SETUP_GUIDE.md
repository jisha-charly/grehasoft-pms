# Gmail SMTP Configuration Fix

## Issue
Getting `SMTPAuthenticationError: (535, b'5.7.8 Username and Password not accepted')`

## Root Cause
Google rejected the password because you likely have **2-Factor Authentication (2FA)** enabled on your Gmail account. When 2FA is enabled, you cannot use your regular Gmail password for SMTP. You must use an **App Password**.

## Solution: Create a Gmail App Password

### Step 1: Enable 2-Step Verification (if not already done)
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Look for "2-Step Verification"
3. If it's not enabled, click "Enable 2-Step Verification" and follow the steps

### Step 2: Create an App Password
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Scroll down to "App passwords" (this appears ONLY if 2FA is enabled)
3. Select:
   - **App:** Mail
   - **Device:** Windows Computer (or your device)
4. Click "Generate"
5. Google will show you a 16-character password
6. **Copy this password** (it looks like: `xxxx xxxx xxxx xxxx`)

### Step 3: Update Your .env File
Replace the `EMAIL_HOST_PASSWORD` in `backend/.env`:

```env
EMAIL_HOST_USER=jisha.charly@gmail.com
EMAIL_HOST_PASSWORD=xxxx xxxx xxxx xxxx
```

**Important:** Use the 16-character password Google generated, **NOT** your regular Gmail password.

### Step 4: Restart Django Server
```bash
cd backend
python manage.py runserver
```

### Step 5: Test Email Sending
Create a reminder with today's due date and check the console for email confirmation.

---

## Alternative: Allow Less Secure Apps (Not Recommended)

If you don't want to use App Passwords, you can enable "Allow less secure apps":

1. Go to [google account access](https://myaccount.google.com/lesssecureapps)
2. Click "Turn on" for "Less secure app access"
3. Then use your regular Gmail password in `.env`

**Note:** This is less secure and Google may disable this option in the future.

---

## Troubleshooting

### Still getting authentication error?
- Verify the 16-character password is copied correctly (spaces included)
- Restart the Django server
- Check `logs/debug.log` for detailed error messages

### Email still not sending after fixing credentials?
- Make sure admin users have valid email addresses
- Check that at least one user has the `SUPER_ADMIN` role or `is_superuser=True`
- Look for error messages in console or `logs/debug.log`
