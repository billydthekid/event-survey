import { Badge } from "@/components/ui/badge";
import { PHASE_META, type Phase } from "@/lib/utils/event-phase";

export function PhaseBadge({ phase }: { phase: Phase }) {
  return <Badge className={PHASE_META[phase].cls}>{PHASE_META[phase].th}</Badge>;
}
