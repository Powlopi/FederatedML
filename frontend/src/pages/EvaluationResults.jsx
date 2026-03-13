import React, { useState } from "react";

const EvaluationResults = () => {
  // Mock data - later we will fetch this from Flask!
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
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-gray-100">
        Model Evaluation Results
      </h1>
      <p className="text-gray-400 mb-6 text-sm">
        Evaluation metrics for all models involved in the federated learning
        process.
      </p>

      {/* Info Banner */}
      <div className="bg-gray-900/50 border border-gray-800 text-indigo-300 px-4 py-3 rounded-xl mb-8 text-sm shadow-sm flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
        Main Model v2 metrics are based on default values. Run aggregation in
        the Central Hub to update.
      </div>

      {/* Performance Summary Section */}
      <h2 className="text-xl font-semibold mb-4 text-gray-200">
        Performance Summary
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Best Accuracy", val: bestAcc.value, model: bestAcc.model },
          {
            label: "Best Precision",
            val: bestPrec.value,
            model: bestPrec.model,
          },
          { label: "Best Recall", val: bestRec.value, model: bestRec.model },
          { label: "Best F1 Score", val: bestF1.value, model: bestF1.model },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="bg-gray-900/60 border border-gray-800 p-5 rounded-2xl hover:border-indigo-500/30 transition-colors"
          >
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
              {stat.label}
            </p>
            <p className="text-3xl font-bold mb-1 text-gray-100">{stat.val}</p>
            <p className="text-emerald-400 text-xs flex items-center gap-1 font-mono">
              <span>↑</span> {stat.model}
            </p>
          </div>
        ))}
      </div>

      {/* Detailed Metrics Table */}
      <h2 className="text-xl font-semibold mb-4 text-gray-200">
        Detailed Metrics Table
      </h2>
      <div className="bg-gray-900/50 rounded-2xl border border-gray-800 overflow-hidden shadow-lg">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="text-xs text-gray-400 bg-gray-950/80 border-b border-gray-800 uppercase tracking-wider">
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
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {metricsData.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-gray-800/30 transition-colors"
              >
                <td className="px-6 py-4 font-medium text-gray-100">
                  {row.name}
                </td>
                <td className="px-6 py-4 font-mono">{row.accuracy}</td>
                <td className="px-6 py-4 font-mono">{row.precision}</td>
                <td className="px-6 py-4 font-mono">{row.recall}</td>
                <td className="px-6 py-4 font-mono text-indigo-300">
                  {row.f1}
                </td>
                <td className="px-6 py-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {row.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EvaluationResults;
