import { isFreePeriodOpen } from "@/lib/free-period";
import LaunchOffer from "./LaunchOffer";

/**
 * While the launch offer is open the Subscription section explains it, and the payment
 * screen (page.tsx) is not rendered. After the end date the page returns on its own.
 */
export default function SubscriptionLayout({ children }: { children: React.ReactNode }) {
  return isFreePeriodOpen() ? <LaunchOffer /> : children;
}
