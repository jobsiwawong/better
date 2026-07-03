import { getExpensesData } from "@/lib/queries/expenses";
import { ExpensesShell } from "@/components/expenses/expenses-shell";

export default async function ExpensesPage() {
  const { trips, unassigned, categories, owners } = await getExpensesData();
  return (
    <div className="flex h-full flex-col">
      <ExpensesShell
        trips={trips}
        unassigned={unassigned}
        categories={categories}
        owners={owners}
      />
    </div>
  );
}
