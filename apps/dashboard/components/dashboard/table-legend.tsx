import { legendItems } from "@/lib/dummy-data";

export function TableLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {legendItems.map((item) => (
        <div key={item.status} className="flex items-center gap-1.5">
          <div className={`h-4 w-4 rounded ${item.color}`} />
          <span className="text-xs text-gray-600">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
