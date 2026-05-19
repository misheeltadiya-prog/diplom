import type { FeatureKey } from "@/lib/features";
import { tierSatisfiesFeature } from "@/lib/features";
import { getCanonicalPlanForUser } from "@/services/subscriptionService";

/**
 * Хэрэглэгчийн subscription tier-ээр feature-д нэвтрэх эсэх.
 * Компонент биш — API / service давхаргаас дуудна.
 */
export async function canAccess(userId: number, featureName: FeatureKey): Promise<boolean> {
  const tier = await getCanonicalPlanForUser(userId);
  return tierSatisfiesFeature(tier, featureName);
}
