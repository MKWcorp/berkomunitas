export default function StatisticsCards({ statistics }) {
  if (!statistics) return null;

  return (
    <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-3 text-xs w-full sm:w-auto mt-2 sm:mt-0">
      <div className="flex items-center gap-1 justify-center sm:justify-start">
        <span className="font-semibold text-gray-900">{statistics.total}</span>
        <span className="text-gray-600">Total</span>
      </div>
      <div className="hidden sm:block border-l border-gray-300"></div>
      <div className="flex items-center gap-1 justify-center sm:justify-start">
        <span className="font-semibold text-green-600">{statistics.matched}</span>
        <span className="text-gray-600">Matched</span>
      </div>
      <div className="hidden sm:block border-l border-gray-300"></div>
      <div className="flex items-center gap-1 justify-center sm:justify-start">
        <span className="font-semibold text-yellow-600">{statistics.ambiguous}</span>
        <span className="text-gray-600">Ambiguous</span>
      </div>
      <div className="hidden sm:block border-l border-gray-300"></div>
      <div className="flex items-center gap-1 justify-center sm:justify-start">
        <span className="font-semibold text-red-600">{statistics.unmatched}</span>
        <span className="text-gray-600">Unmatched</span>
      </div>
    </div>
  );
}
