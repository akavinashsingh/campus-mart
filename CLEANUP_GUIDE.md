# Test Data Cleanup Guide

## After Testing is Complete

Once your friends have finished testing CampusMart, use this guide to clean up all test data from the database.

---

## 🗑️ What Gets Deleted

The cleanup script will remove:
- ✅ **User accounts** (test user profiles)
- ✅ **All products** created by those users
- ✅ **All reviews** written by those users
- ✅ **All contact logs** (buyer-seller interactions)
- ✅ **Profile images** metadata (from database)

**Note:** Uploaded images on Cloudinary are NOT automatically deleted. You may need to clean those up separately from your Cloudinary dashboard if needed.

---

## 📋 Step-by-Step Cleanup Process

### Step 1: Get Test User Email Addresses

Ask your friends for the email addresses they used to sign up. For example:
- Friend 1: `john.test@college.edu`
- Friend 2: `sarah.test@college.edu`

### Step 2: Open Terminal/Command Prompt

Navigate to your project directory:

```bash
cd c:\Users\akavi\OneDrive\Desktop\campus-mart
```

### Step 3: Run the Cleanup Script

**For 2 test users:**
```bash
node cleanupTestData.js john.test@college.edu sarah.test@college.edu
```

**For 1 test user:**
```bash
node cleanupTestData.js john.test@college.edu
```

**For 3+ test users:**
```bash
node cleanupTestData.js email1@college.edu email2@college.edu email3@college.edu
```

### Step 4: Verify Output

You should see output like:

```
✅ Connected to MongoDB

🗑️  Starting cleanup for the following emails:
   1. john.test@college.edu
   2. sarah.test@college.edu

📧 Processing: john.test@college.edu
──────────────────────────────────────────────────
   ✓ Found user: John Seller (john.test)
   ✓ Deleted 2 products
   ✓ Deleted 1 reviews by user
   ✓ Deleted 3 contact logs
   ✓ Deleted user account: john.test@college.edu

📧 Processing: sarah.test@college.edu
──────────────────────────────────────────────────
   ✓ Found user: Sarah Buyer (sarah.test)
   ✓ Deleted 1 products
   ✓ Deleted 2 reviews by user
   ✓ Deleted 2 contact logs
   ✓ Deleted user account: sarah.test@college.edu

==================================================
🎉 CLEANUP COMPLETE!
==================================================
✅ Users deleted:        2
✅ Products deleted:     3
✅ Reviews deleted:      3
✅ Contact logs deleted: 5
==================================================

💡 All test data has been removed from the database.
```

---

## ⚠️ Important Notes

### Before Running Cleanup:
1. ✅ **Ensure testing is complete** - This cannot be undone!
2. ✅ **Double-check email addresses** - Make sure they're correct
3. ✅ **Backup if needed** - Consider database backup for safety
4. ✅ **Verify you're in the right environment** - Don't run on production by accident!

### After Cleanup:
- 🔄 Test users can sign up again with the same emails
- 🔄 All their previous data will be gone
- 🔄 Database will be clean for next testing round

---

## 🚨 Troubleshooting

### Error: "No email addresses provided"
**Solution:** You forgot to add email addresses. Use:
```bash
node cleanupTestData.js user@email.com
```

### Error: "No user found with email: xxx"
**Possible causes:**
- Email address is misspelled
- User never completed signup
- User already deleted

**Solution:** Double-check the email address or skip that user.

### Error: "Cannot connect to MongoDB"
**Possible causes:**
- `.env` file missing or incorrect
- Database connection string wrong
- Internet connection issues

**Solution:** 
1. Check your `.env` file has `ATLASDB_URL`
2. Verify MongoDB connection is working
3. Try running `node app.js` first to test connection

### Script Hangs/Freezes
**Solution:**
1. Press `Ctrl + C` to cancel
2. Check your internet connection
3. Try again

---

## 🔐 Security Best Practices

1. **Never delete real user data** - Only use this for test accounts
2. **Verify emails carefully** - Double-check before running
3. **Keep admin accounts safe** - Don't delete admin users
4. **Document test emails** - Keep a list of test user emails

---

## 📝 Example Workflow

### After Testing Session:

1. **Collect emails from friends:**
   ```
   Friend 1: john.test@college.edu
   Friend 2: sarah.test@college.edu
   ```

2. **Run cleanup:**
   ```bash
   node cleanupTestData.js john.test@college.edu sarah.test@college.edu
   ```

3. **Verify success:**
   - Check the output shows both users deleted
   - Confirm product counts match expectations

4. **Test clean database:**
   - Try logging in with test emails (should fail)
   - Check products page (their listings should be gone)
   - Verify admin dashboard shows reduced counts

---

## 🔄 Alternative: Clean Up Individual Components

If you only want to delete specific things, you can modify the script or use MongoDB directly.

### Delete Only Products (Keep User Account):
```javascript
// In MongoDB shell or script:
db.products.deleteMany({ owner: ObjectId("USER_ID_HERE") })
```

### Delete Only Reviews:
```javascript
db.reviews.deleteMany({ reviewer: ObjectId("USER_ID_HERE") })
```

**Note:** The provided script is recommended as it cleans everything in one go.

---

## 💡 Pro Tips

1. **Create a test user list** - Keep a document with test email addresses
2. **Use consistent naming** - Name test users like `test1@college.edu`, `test2@college.edu`
3. **Run cleanup immediately** - Don't leave test data in production
4. **Verify admin dashboard** - Check counts decreased after cleanup
5. **Test signup again** - Verify same email can be reused

---

## 📞 Need Help?

If you encounter issues during cleanup:

**Contact:** 23uj1a0504@mrem.ac.in

**Include:**
- Error message (full output)
- Email addresses you tried to delete
- Screenshot of terminal output

---

## ✅ Cleanup Checklist

After running the script, verify:

- [ ] Script completed without errors
- [ ] All test users deleted (check output count)
- [ ] Products no longer appear on website
- [ ] Test users cannot log in anymore
- [ ] Admin dashboard shows reduced counts
- [ ] You can sign up with same emails again (optional test)

---

**Remember:** This script is PERMANENT. Deleted data cannot be recovered. Always double-check email addresses before running!
