import { PrismaClient } from "@prisma/client";

/**
 * Get all WhatsApp notification recipients for a main user:
 * - The main user's own phone (if set)
 * - The linked partner's phone (if set)
 *
 * Returns a de-duplicated array of raw phone strings.
 */
export async function getUserAndPartnerPhones(
  prisma: PrismaClient,
  mainUserId: string
): Promise<string[]> {
  const [user, partner] = await Promise.all([
    prisma.user.findUnique({
      where: { id: mainUserId },
      select: { phone: true },
    }),
    prisma.user.findFirst({
      where: { partnerId: mainUserId },
      select: { phone: true },
    }),
  ]);

  const phones = new Set<string>();

  if (user?.phone) {
    phones.add(user.phone);
  }
  if (partner?.phone) {
    phones.add(partner.phone);
  }

  return Array.from(phones);
}

