import React, { useState } from "react";

const EvaluationResults = () => {
  // We'll use mock data to match your screenshot initially.
  // Later, you can fetch this from your Flask backend!
  const [metricsData, setMetricsData] = useState([
    {
      id: 1,
      name: "Main Model v1",
      accuracy: "0.7243",
      precision: "0.7434",
      recall: "0.6847",
      f1: "0.7128",
      status: "Available",
    },
    {
      id: 2,
      name: "Campus-1 v2",
      accuracy: "0.7092",
      precision: "0.7333",
      recall: "0.6571",
      f1: "0.6931",
      status: "Available",
    },
    {
      id: 3,
      name: "Campus-2 v2",
      accuracy: "0.7088",
      precision: "0.7528",
      recall: "0.6212",
      f1: "0.6807",
      status: "Available",
    },
    {
      id: 4,
      name: "Main Model v2 (Aggregated)",
      accuracy: "0.7090",
      precision: "0.7431",
      recall: "0.6391",
      f1: "0.6869",
      status: "Available",
    },
  ]);

  // Helper function to find the best metric and who owns it
  const getBest = (metric) => {
    let bestVal = 0;
    let bestModel = "";
    metricsData.forEach((model) => {
      const val = parseFloat(model[metric]);
      if (val > bestVal) {
        bestVal = val;
        bestModel = model.name;
      }
    });
    return { value: bestVal.toFixed(4), model: bestModel };
  };

  const bestAcc = getBest("accuracy");
  const bestPrec = getBest("precision");
  const bestRec = getBest("recall");
  const bestF1 = getBest("f1");

  return (
    <div
      className="p-8 text-white min-h-screen"
      style={{ backgroundColor: "#0f172a" }}
    >
      <h1 className="text-3xl font-bold mb-2">Model Evaluation Results</h1>
      <p className="text-gray-400 mb-6 text-sm">
        Evaluation metrics for all models involved in the federated learning
        process.
      </p>

      {/* Info Banner */}
      <div className="bg-slate-800 border border-slate-700 text-blue-300 px-4 py-3 rounded mb-8 text-sm shadow-sm">
        Main Model v2 metrics are based on default values. Run aggregation in
        the Federated Aggregation tab to update.
      </div>

      {/* Performance Summary Section */}
      <h2 className="text-xl font-semibold mb-4">Performance Summary</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        {/* Summary Card 1 */}
        <div>
          <p className="text-gray-400 text-sm mb-1">Best Accuracy</p>
          <p className="text-3xl font-bold mb-1">{bestAcc.value}</p>
          <p className="text-green-400 text-xs flex items-center">
            <span className="mr-1">↑</span> {bestAcc.model}
          </p>
        </div>

        {/* Summary Card 2 */}
        <div>
          <p className="text-gray-400 text-sm mb-1">Best Precision</p>
          <p className="text-3xl font-bold mb-1">{bestPrec.value}</p>
          <p className="text-green-400 text-xs flex items-center">
            <span className="mr-1">↑</span> {bestPrec.model}
          </p>
        </div>

        {/* Summary Card 3 */}
        <div>
          <p className="text-gray-400 text-sm mb-1">Best Recall</p>
          <p className="text-3xl font-bold mb-1">{bestRec.value}</p>
          <p className="text-green-400 text-xs flex items-center">
            <span className="mr-1">↑</span> {bestRec.model}
          </p>
        </div>

        {/* Summary Card 4 */}
        <div>
          <p className="text-gray-400 text-sm mb-1">Best F1 Score</p>
          <p className="text-3xl font-bold mb-1">{bestF1.value}</p>
          <p className="text-green-400 text-xs flex items-center">
            <span className="mr-1">↑</span> {bestF1.model}
          </p>
        </div>
      </div>

      {/* Detailed Metrics Table */}
      <h2 className="text-xl font-semibold mb-4 mt-8">
        Detailed Metrics Table
      </h2>
      <div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden shadow-lg">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="text-xs text-gray-400 bg-slate-800/80 border-b border-slate-700">
            <tr>
              <th scope="col" className="px-6 py-4 font-medium">
                Model
              </th>
              <th scope="col" className="px-6 py-4 font-medium">
                Accuracy
              </th>
              <th scope="col" className="px-6 py-4 font-medium">
                Precision
              </th>
              <th scope="col" className="px-6 py-4 font-medium">
                Recall
              </th>
              <th scope="col" className="px-6 py-4 font-medium">
                F1 Score
              </th>
              <th scope="col" className="px-6 py-4 font-medium">
                Model File Status
              </th>
            </tr>
          </thead>
          <tbody>
            {metricsData.map((row) => (
              <tr
                key={row.id}
                className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
              >
                <td className="px-6 py-4 font-medium text-white">{row.name}</td>
                <td className="px-6 py-4">{row.accuracy}</td>
                <td className="px-6 py-4">{row.precision}</td>
                <td className="px-6 py-4">{row.recall}</td>
                <td className="px-6 py-4">{row.f1}</td>
                <td className="px-6 py-4">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EvaluationResults;
