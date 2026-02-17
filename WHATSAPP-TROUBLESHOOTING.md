# WhatsApp Notification Troubleshooting Guide

## Common Issues and Solutions

### 1. "Twilio credentials not configured" Warning

**Problem**: You see this warning in the terminal:
```
⚠️  Twilio credentials not configured. WhatsApp notifications will be disabled.
```

**Solution**:
1. Make sure you have a `.env` file in the `server/` directory
2. Add these variables:
   ```env
   TWILIO_ACCOUNT_SID=your_account_sid_here
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
   ```
3. Restart the server after adding credentials

### 2. Error Code 21211: Invalid 'To' Phone Number

**Problem**: Phone number format is incorrect.

**Solution**:
- Twilio requires phone numbers in E.164 format: `+[country code][number]`
- Examples:
  - US: `+14155551234`
  - UK: `+447911123456`
  - India: `+919876543210`
- The system will automatically format numbers, but make sure you enter them correctly in settings

### 3. Error Code 21608: Unsubscribed Recipient

**Problem**: The recipient hasn't joined Twilio's WhatsApp sandbox.

**Solution**:
1. Go to your Twilio Console → Messaging → Try it out → Send a WhatsApp message
2. You'll see a sandbox join code (e.g., "join happy-sunset")
3. Send this code to your WhatsApp number from your phone
4. Once joined, you can receive messages

**For Production**: You need to get your WhatsApp number approved by Twilio (can take 24-48 hours)

### 4. Error Code 21614: WhatsApp Number Not Registered

**Problem**: Your Twilio WhatsApp number isn't set up correctly.

**Solution**:
1. Check Twilio Console → Messaging → Senders
2. Make sure your WhatsApp number is registered
3. Verify `TWILIO_WHATSAPP_FROM` matches exactly (including `whatsapp:` prefix)

### 5. Not Receiving Notifications

**Checklist**:
- [ ] Twilio credentials are set in `.env`
- [ ] Server was restarted after adding credentials
- [ ] Phone number is saved in user settings
- [ ] Phone number is in correct format (with country code)
- [ ] You've joined Twilio WhatsApp sandbox (for testing)
- [ ] Check server logs for error messages

### 6. Testing Your Setup

Use the test endpoint to verify everything works:

```bash
# Get your phone number from the API
curl http://localhost:3001/api/test/phone \
  -H "Authorization: Bearer YOUR_TOKEN"

# Send a test notification
curl -X POST http://localhost:3001/api/test/whatsapp \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+14155551234", "message": "Test message"}'
```

### 7. Phone Number Format Examples

**Correct formats**:
- `+14155551234` ✅
- `+447911123456` ✅
- `14155551234` ✅ (will be auto-formatted)
- `whatsapp:+14155551234` ✅

**Incorrect formats**:
- `4155551234` ❌ (missing country code)
- `(415) 555-1234` ❌ (has formatting characters)
- `+1 415-555-1234` ❌ (has spaces/dashes)

### 8. Scheduled Jobs Not Running

**Problem**: Notifications aren't being sent at scheduled times.

**Check**:
1. Make sure the server is running continuously (not just for testing)
2. Check server logs for cron job execution:
   ```
   🌅 Running daily motivation job...
   💧 Running water reminder check...
   ```
3. Verify your phone number is saved in the database
4. Check that settings are enabled (e.g., `showWater: true`)

### 9. Debug Mode

Enable detailed logging by checking the server console. You should see:
- `📤 Attempting to send WhatsApp to whatsapp:+...`
- `✅ WhatsApp sent successfully!` or error details

### 10. Twilio Sandbox Setup (For Testing)

1. **Get your sandbox number**:
   - Go to Twilio Console → Messaging → Try it out
   - Note the sandbox number (usually `+14155238886`)

2. **Join the sandbox**:
   - Send the join code to the sandbox number from your WhatsApp
   - Example: Send "join happy-sunset" to `+1 415 523 8886`

3. **Test**:
   - Use the test endpoint or trigger a notification
   - You should receive it on WhatsApp

### 11. Production Setup

For production (real WhatsApp numbers):

1. **Apply for WhatsApp Business API**:
   - Go to Twilio Console → Messaging → Senders
   - Click "Add a new sender"
   - Follow the approval process (can take 24-48 hours)

2. **Update `.env`**:
   ```env
   TWILIO_WHATSAPP_FROM=whatsapp:+YOUR_APPROVED_NUMBER
   ```

3. **Restart server**

## Quick Test Script

Create a file `test-whatsapp.js` in the server directory:

```javascript
require('dotenv').config();
const { sendWhatsAppNotification } = require('./dist/services/whatsapp');

async function test() {
  const result = await sendWhatsAppNotification(
    process.argv[2] || '+14155551234',
    '🧪 Test notification from Emotional Companion!'
  );
  console.log(JSON.stringify(result, null, 2));
}

test();
```

Run it:
```bash
cd server
npm run build
node test-whatsapp.js +14155551234
```

## Still Having Issues?

1. Check server logs for detailed error messages
2. Verify Twilio account has credits/balance
3. Check Twilio Console → Monitor → Logs for API errors
4. Ensure phone numbers are verified in Twilio (for production)
5. Test with the `/api/test/whatsapp` endpoint first
