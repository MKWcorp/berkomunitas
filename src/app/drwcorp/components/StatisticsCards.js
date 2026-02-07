export default function StatisticsCards({ statistics }) {
  if (!statistics) return null;

  return (
    <div className="flex gap-3 text-xs">
      <div className="flex items-center gap-1">
        <span className="font-semibold text-gray-900">{statistics.total}</span>
        <span className="text-gray-600">Total</span>
      </div>
      <div className="border-l border-gray-300"></div>
      <div className="flex items-center gap-1">
        <span className="font-semibold text-green-600">{statistics.matched}</span>
        <span className="text-gray-600">Matched</span>
      </div>
      <div className="border-l border-gray-300"></div>
      <div className="flex items-center gap-1">
        <span className="font-semibold text-yellow-600">{statistics.ambiguous}</span>
        <span className="text-gray-600">Ambiguous</span>
      </div>
      <div className="border-l border-gray-300"></div>
      <div className="flex items-center gap-1">
        <span className="font-semibold text-red-600">{statistics.unmatched}</span>
        <span className="text-gray-600">Unmatched</span>
      </div>
    </div>
  );
}
