export const legendItems = [
  { status: "blank" as const, label: "Blank Table", color: "bg-white border border-gray-300" },
  { status: "running" as const, label: "Running Table", color: "bg-blue-200" },
];

export function TableLegend() {
  return (
    <div className="flex items-center gap-4">
      {legendItems.map((item) => (
        <div key={item.status} className="flex items-center gap-1.5">
          <div className={`w-4 h-4 rounded ${item.color}`} />
          <span className="text-xs text-gray-600">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
