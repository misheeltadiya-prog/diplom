import { isPaidTier } from "@/lib/subscription-tier";
import { getEffectiveSubscription, type PlanKey } from "@/lib/user-subscription";

/** Төлбөртэй (STANDARD / PREMIUM) идэвхтэй эрх эсэх — API / UI шалгалтад ашиглана. */
export async function userHasActivePaidPlan(userId: number): Promise<boolean> {
  const s = await getEffectiveSubscription(userId);
  return isPaidTier(s.planKey);
}

export async function getUserPlanKey(userId: number): Promise<PlanKey> {
  const s = await getEffectiveSubscription(userId);
  return s.planKey;
}
