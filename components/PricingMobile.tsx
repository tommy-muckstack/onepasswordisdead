import { MeasuredPage } from "@/components/m/MeasuredPage";
import pm from "@/components/m/pricing390.json";

// Phone layout (<=900px) measured from 1password.com/pricing at 390px; the desktop markup is hidden at that width.
export function PricingMobile() { return <MeasuredPage data={pm as never} className="op-pm" />; }
