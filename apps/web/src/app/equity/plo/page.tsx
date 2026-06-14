import VariantEquityPage from "../variant-page";

export const metadata = {
  title: "PLO Equity Calculator — GTO Wizard",
  description: "Calculate Pot-Limit Omaha (4-card) equity ranges using Monte Carlo simulation.",
};

export default function Page() {
  return <VariantEquityPage variantKey="plo4" />;
}
