# Why you're not getting WhatsApp notifications

## 1. Fix your Account SID (most common)

In **server/.env** you currently have:

```env
TWILIO_ACCOUNT_SID=your_twilio_account_sid   ← This is a placeholder!
```

It must be your **real** Twilio Account SID:

1. Go to **https://console.twilio.com**
2. On the dashboard you’ll see **Account SID** — it **starts with `AC`** (e.g. `AC1234abcd...`)
3. Copy that value and in **server/.env** set:
   ```env
   TWILIO_ACCOUNT_SID=AC1234abcd...your_real_value
   ```
4. Restart the server (`npm run dev`).

If your value starts with `US` or `SK`, that’s not the Account SID — use the one that starts with **AC**.

---

## 2. Join the WhatsApp sandbox (for testing)

Before any message can be delivered to your number:

1. In Twilio Console go to **Messaging → Try it out → Send a WhatsApp message**
2. You’ll see a code like **join happy-sunset**
3. From **your** WhatsApp, send that exact code to **+1 415 523 8886**
4. Wait for the confirmation reply

Until you do this, Twilio will not deliver messages to your number.

---

## 3. Use “Send test notification” in the app

1. Open **Settings** in the app
2. Enter **your phone number with country code** (e.g. `+919876543210`)
3. Save (if using the backend)
4. Click **“Send test notification to my number”**
5. Check your WhatsApp

If the backend is not configured or you’re not logged in, the button will show an error and tell you what to fix.

---

## 4. Check the server terminal

When you start the server you should see either:

- `WhatsApp notifications are enabled.` → Twilio is configured
- `WhatsApp: NOT CONFIGURED — Set TWILIO_ACCOUNT_SID...` → Replace the placeholder in `.env` as in step 1

---

## 5. Check status via browser

Open: **http://localhost:3001/api/test/whatsapp-status**

- `{"configured":true,...}` → Backend is ready; focus on sandbox and phone number
- `{"configured":false,"message":"..."}` → Do what the message says (usually set Account SID)

---

## Summary

1. Set **TWILIO_ACCOUNT_SID** in **server/.env** to your real Account SID (starts with **AC**).
2. Join the Twilio WhatsApp sandbox from your phone.
3. Restart the server.
4. In the app, add your phone in Settings and click **“Send test notification to my number”**.
