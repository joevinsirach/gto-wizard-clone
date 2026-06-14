import VariantEquityPage from "../variant-page";

export const metadata = {
  title: "Razz Equity Calculator — GTO Wizard",
  description: "Calculate Razz (A-5 Lowball) equity ranges using Monte Carlo simulation.",
};

export default function Page() {
  return <VariantEquityPage variantKey="razz" />;
}
