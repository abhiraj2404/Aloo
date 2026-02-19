import { TableCard } from "./table-card";
import { type TableData } from "@/lib/dummy-data";

interface TableCategorySectionProps {
  categoryName: string;
  tables: TableData[];
}

export function TableCategorySection({ categoryName, tables }: TableCategorySectionProps) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3">{categoryName}</h3>
      <div className="flex flex-wrap gap-2">
        {tables.map((table) => (
          <TableCard key={table.id} table={table} categoryName={categoryName} />
        ))}
      </div>
    </div>
  );
}
