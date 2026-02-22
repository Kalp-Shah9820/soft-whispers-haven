import { PrismaClient } from "@prisma/client";
import { sendWhatsAppNotification } from "./whatsapp";
import { getPartnerInfo } from "../utils/notifications";

/**
 * Fire-and-forget partner notification.
 * Looks up the partner phone via mainUserId and sends a WhatsApp message.
 * Never throws — all errors are logged silently so the caller is unaffected.
 */
export async function notifyPartner(
    prisma: PrismaClient,
    mainUserId: string,
    message: string
): Promise<void> {
    try {
        const partnerInfo = await getPartnerInfo(prisma, mainUserId);
        if (!partnerInfo) return;

        const result = await sendWhatsAppNotification(partnerInfo.phone, message);
        if (!result.success) {
            // Non-critical — log but never bubble up
            console.error("[notifyPartner] Failed to send:", result.error, `(${partnerInfo.phone})`);
        }
    } catch (err: any) {
        console.error("[notifyPartner] Unexpected error:", err?.message ?? err);
    }
}
