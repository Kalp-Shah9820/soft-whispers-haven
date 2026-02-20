import { PrismaClient } from "@prisma/client";

/**
 * Get only the MAIN_USER's phone(s) for reminders (water, daily motivation,
 * skincare, period care, self-care time). Scheduler must use this so the
 * partner never receives daily reminders.
 */
export async function getMainUserPhones(
  prisma: PrismaClient,
  mainUserId: string
): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: mainUserId },
    select: { phone: true },
  });
  if (!user?.phone) return [];
  return [user.phone];
}

/**
 * Get only the PARTNER's phone(s) for event-based relationship updates
 * (dream/thought/letter share, mood log, self-care task complete, current need change).
 */
export async function getPartnerPhones(
  prisma: PrismaClient,
  mainUserId: string
): Promise<string[]> {
  const partner = await prisma.user.findFirst({
    where: { partnerId: mainUserId },
    select: { phone: true },
  });
  if (!partner?.phone) return [];
  return [partner.phone];
}

/**
 * Get all WhatsApp notification recipients for a main user:
 * - The main user's own phone (if set)
 * - The linked partner's phone (if set)
 *
 * Returns a de-duplicated array of raw phone strings.
 * Use for test/utility flows; scheduler uses getMainUserPhones, event notifications use getPartnerPhones.
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

