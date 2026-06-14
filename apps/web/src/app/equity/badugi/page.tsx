import VariantEquityPage from "../variant-page";

export const metadata = {
  title: "Badugi Equity Calculator — GTO Wizard",
  description: "Calculate Badugi (4-card rainbow) equity ranges using Monte Carlo simulation.",
};

export default function Page() {
  return <VariantEquityPage variantKey="badugi" />;
}
