import twilio from "twilio";
import { normalizePhoneForWhatsApp } from "../utils/phone";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_WHATSAPP_FROM;

  // Strip inline comments (e.g. "whatsapp:+14155238886  # comment")
const fromNumberClean = fromNumber ? fromNumber.split(/#/)[0].trim() : "";

// Treat placeholder values as missing; real Twilio Account SID starts with "AC"
const hasValidConfig =
  accountSid &&
  authToken &&
  fromNumberClean &&
  !accountSid.includes("your_") &&
  accountSid.startsWith("AC") &&
  fromNumberClean.startsWith("whatsapp:+");

if (!hasValidConfig) {
  console.warn("⚠️  Twilio credentials not configured. WhatsApp notifications will be disabled.");
  if (!accountSid || accountSid.includes("your_") || !accountSid.startsWith("AC")) {
    console.warn("   → Set TWILIO_ACCOUNT_SID in server/.env (from https://console.twilio.com, starts with AC)");
  }
  if (!authToken || authToken.includes("your_")) {
    console.warn("   → Set TWILIO_AUTH_TOKEN in server/.env");
  }
  if (!fromNumberClean || !fromNumberClean.startsWith("whatsapp:+")) {
    console.warn("   → Set TWILIO_WHATSAPP_FROM=whatsapp:+14155238886 (no spaces or comments)");
  }
}

const client = hasValidConfig ? twilio(accountSid, authToken) : null;
const effectiveFromNumber = hasValidConfig ? fromNumberClean : "";

/** Call this at startup to log WhatsApp status */
export function getWhatsAppStatus(): { configured: boolean; message: string } {
  if (hasValidConfig) {
    return { configured: true, message: "WhatsApp notifications are enabled." };
  }
  if (!accountSid || accountSid.includes("your_") || !accountSid.startsWith("AC")) {
    return {
      configured: false,
      message: "Set TWILIO_ACCOUNT_SID in server/.env — get it from https://console.twilio.com (starts with AC).",
    };
  }
  if (!authToken || authToken.includes("your_")) {
    return { configured: false, message: "Set TWILIO_AUTH_TOKEN in server/.env" };
  }
  if (!fromNumberClean || !fromNumberClean.startsWith("whatsapp:+")) {
    return { configured: false, message: "Set TWILIO_WHATSAPP_FROM=whatsapp:+14155238886 in server/.env" };
  }
  return { configured: false, message: "WhatsApp configuration incomplete." };
}

/** Re-export for reuse by other modules */
export { normalizePhoneForWhatsApp } from "../utils/phone";

export async function sendWhatsAppNotification(
  to: string,
  message: string
): Promise<{ success: boolean; error?: string; details?: any }> {
  // Check configuration
  if (!client || !effectiveFromNumber) {
    const mockMessage = `📱 [WhatsApp Mock - Not Configured] To: ${to}, Message: ${message}`;
    console.log(mockMessage);
    return { 
      success: false, 
      error: "Twilio credentials not configured",
      details: { to, message }
    };
  }

  try {
    // Normalize phone to Twilio E.164 WhatsApp format
    const formattedTo = normalizePhoneForWhatsApp(to);
    
    console.log(`📤 Attempting to send WhatsApp to ${formattedTo}`);
    console.log(`   From: ${effectiveFromNumber}`);
    console.log(`   Message: ${message.substring(0, 50)}...`);

    const result = await client.messages.create({
      from: effectiveFromNumber,
      to: formattedTo,
      body: message,
    });

    console.log(`✅ WhatsApp sent successfully!`);
    console.log(`   Message SID: ${result.sid}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   To: ${formattedTo}`);
    
    return { 
      success: true, 
      details: {
        sid: result.sid,
        status: result.status,
        to: formattedTo
      }
    };
  } catch (error: any) {
    console.error("❌ Failed to send WhatsApp notification");
    console.error(`   Error Code: ${error.code}`);
    console.error(`   Error Message: ${error.message}`);
    console.error(`   To: ${to}`);
    console.error(`   Formatted To: ${normalizePhoneForWhatsApp(to)}`);
    
    // Provide helpful error messages
    let errorMessage = error.message;
    if (error.code === 21211) {
      errorMessage = "Invalid 'To' phone number. Make sure it's in E.164 format (e.g., +14155551234)";
    } else if (error.code === 21212) {
      errorMessage = "Invalid 'From' phone number. Check TWILIO_WHATSAPP_FROM in .env";
    } else if (error.code === 21608) {
      errorMessage = "Unsubscribed recipient. The recipient needs to join Twilio's WhatsApp sandbox first.";
    } else if (error.code === 21614) {
      errorMessage = "WhatsApp number not registered. Check Twilio console for WhatsApp setup.";
    }
    
    return { 
      success: false, 
      error: errorMessage,
      details: {
        code: error.code,
        message: error.message,
        to: to,
        formattedTo: normalizePhoneForWhatsApp(to),
        from: effectiveFromNumber
      }
    };
  }
}
