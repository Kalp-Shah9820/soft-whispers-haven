# Quick Fix: WhatsApp Notifications Not Working

## Step 1: Check Your .env File

Make sure `server/.env` exists and has these variables:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

**Where to find these:**
1. Go to https://console.twilio.com
2. Dashboard shows your Account SID
3. Auth Token is on the dashboard (click to reveal)
4. WhatsApp FROM number: Go to Messaging → Try it out → Send a WhatsApp message

## Step 2: Restart Your Server

After updating `.env`, restart the server:
```bash
cd server
# Stop the server (Ctrl+C)
npm run dev
```

## Step 3: Join Twilio WhatsApp Sandbox

**IMPORTANT**: For testing, you MUST join Twilio's sandbox first!

1. Go to Twilio Console → Messaging → Try it out
2. You'll see a code like "join happy-sunset"
3. Send this code to `+1 415 523 8886` from your WhatsApp
4. You'll get a confirmation message

## Step 4: Test the Notification

Use the test endpoint:

```bash
# Replace YOUR_TOKEN with your actual JWT token
# Replace +14155551234 with your phone number (with country code)

curl -X POST http://localhost:3001/api/test/whatsapp \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+14155551234", "message": "Test message"}'
```

Or check your phone number:
```bash
curl http://localhost:3001/api/test/phone \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Step 5: Check Server Logs

Look for these messages in your terminal:

**Good signs:**
```
📤 Attempting to send WhatsApp to whatsapp:+14155551234
✅ WhatsApp sent successfully!
```

**Bad signs:**
```
⚠️  Twilio credentials not configured
❌ Failed to send WhatsApp: [error message]
```

## Common Errors

### Error: "Twilio credentials not configured"
→ Check your `.env` file exists and has all three TWILIO_* variables

### Error: "Unsubscribed recipient" (Code 21608)
→ You need to join the Twilio WhatsApp sandbox (Step 3)

### Error: "Invalid 'To' phone number" (Code 21211)
→ Make sure phone number includes country code: `+14155551234` not `4155551234`

### Error: "Invalid 'From' phone number" (Code 21212)
→ Check `TWILIO_WHATSAPP_FROM` matches exactly: `whatsapp:+14155238886`

## Verify Your Phone Number Format

In your user settings, phone should be:
- ✅ `+14155551234` (with + and country code)
- ✅ `14155551234` (will be auto-formatted)
- ❌ `415-555-1234` (has dashes)
- ❌ `(415) 555-1234` (has formatting)

## Still Not Working?

1. **Check Twilio Console Logs**:
   - Go to Twilio Console → Monitor → Logs
   - Look for recent API calls and errors

2. **Verify Twilio Account**:
   - Make sure your account has credits
   - Check account status is active

3. **Test with curl** (see Step 4 above)

4. **Check server terminal** for detailed error messages

5. **Read full troubleshooting guide**: See `WHATSAPP-TROUBLESHOOTING.md`

## Quick Checklist

- [ ] `.env` file exists in `server/` directory
- [ ] All three TWILIO_* variables are set
- [ ] Server was restarted after updating `.env`
- [ ] Joined Twilio WhatsApp sandbox
- [ ] Phone number in settings includes country code (+1 for US)
- [ ] Checked server logs for errors
- [ ] Tested with `/api/test/whatsapp` endpoint
