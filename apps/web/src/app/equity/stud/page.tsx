import VariantEquityPage from "../variant-page";

export const metadata = {
  title: "Stud Equity Calculator — GTO Wizard",
  description: "Calculate Seven Card Stud equity ranges using Monte Carlo simulation.",
};

export default function Page() {
  return <VariantEquityPage variantKey="stud" />;
}
