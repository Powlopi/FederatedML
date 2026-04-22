import React, { useState, useEffect } from "react";
import axios from "axios";
import { BarChart, Server, XCircle, RefreshCw } from "lucide-react"; // <-- Added RefreshCw

const EvaluationResults = () => {
  const [metricsData, setMetricsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Extracted fetch logic so the button can use it
  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(
        "https://main-hub-production-07dd.up.railway.app/api/metrics",
      );
      setMetricsData(res.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching metrics:", err);
      setError("Failed to establish uplink with the evaluation server.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Initial load
  useEffect(() => {
    fetchMetrics();
  }, []);

  const getBest = (metric) => {
    if (metricsData.length === 0) return { value: "0.0000", model: "N/A" };

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

  const getThemeColor = (name) => {
    if (!name) return "slate";
    if (name.includes("Aggregated") || name.includes("Main Model v2"))
      return "indigo";
    if (name.includes("Campus")) return "teal";
    return "slate";
  };

  // Prevent full unmount on reload so the UI doesn't jump aggressively
  if (isLoading && metricsData.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 text-indigo-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mr-3"></div>
        Fetching Telemetry Data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-6 rounded-xl font-mono text-sm flex items-center gap-3">
        <XCircle size={20} />
        {error}
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8 font-sans pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#0a0f1c] border border-indigo-500/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 shadow-[0_0_20px_rgba(79,70,229,0.05)] gap-4 sm:gap-0">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-indigo-500/20 p-2 rounded-lg border border-indigo-500/30">
              <BarChart className="text-indigo-400" size={24} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-100 uppercase tracking-widest">
              Evaluation Results
            </h1>
          </div>
          <p className="text-gray-400 text-xs sm:text-sm max-w-2xl mt-2 leading-relaxed">
            Comparative telemetry for all neural network states. Use these
            metrics to evaluate the efficacy of the Federated Averaging process
            against local baselines.
          </p>
        </div>

        {/* 3. NEW REFRESH BUTTON */}
        <button
          onClick={fetchMetrics}
          disabled={isLoading}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-xs font-mono font-bold uppercase tracking-widest transition-all shrink-0 w-full sm:w-auto justify-center ${
            isLoading
              ? "bg-indigo-900/50 text-indigo-400 border-indigo-500/30 cursor-not-allowed"
              : "bg-indigo-600/10 hover:bg-indigo-500/20 text-indigo-300 border-indigo-500/50 hover:shadow-[0_0_15px_rgba(79,70,229,0.2)] active:scale-95"
          }`}
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          {isLoading ? "Syncing..." : "Sync Telemetry"}
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 sm:px-5 py-3 sm:py-4 rounded-xl text-[10px] sm:text-xs font-mono shadow-[0_0_15px_rgba(245,158,11,0.1)] flex items-start sm:items-center gap-3">
        <Server className="shrink-0 mt-0.5 sm:mt-0" size={16} />
        <p>
          <strong className="text-amber-300">SYSTEM NOTICE:</strong> Main Model
          v2 metrics are currently based on default initialization values.
          Execute an aggregation cycle in the Central Hub to compile latest
          weights.
        </p>
      </div>

      {/* PERFORMANCE SUMMARY */}
      <div>
        <h2 className="text-xs sm:text-sm font-mono text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-indigo-500 rounded-sm"></span>
          Global Best Achievements
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              label: "Peak Accuracy",
              val: bestAcc.value,
              model: bestAcc.model,
              color: "from-blue-900/40 to-[#0e1526]",
              border: "border-blue-500/30",
            },
            {
              label: "Peak Precision",
              val: bestPrec.value,
              model: bestPrec.model,
              color: "from-purple-900/40 to-[#0e1526]",
              border: "border-purple-500/30",
            },
            {
              label: "Peak Recall",
              val: bestRec.value,
              model: bestRec.model,
              color: "from-emerald-900/40 to-[#0e1526]",
              border: "border-emerald-500/30",
            },
            {
              label: "Peak F1 Score",
              val: bestF1.value,
              model: bestF1.model,
              color: "from-indigo-900/40 to-[#0e1526]",
              border: "border-indigo-500/30",
            },
          ].map((stat, idx) => (
            <div
              key={idx}
              className={`bg-linear-to-br ${stat.color} border ${stat.border} p-3 sm:p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden group hover:shadow-[0_0_20px_rgba(79,70,229,0.15)] transition-all`}
            >
              <p className="text-gray-400 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest mb-1 sm:mb-2 z-10 relative truncate">
                {stat.label}
              </p>
              <div className="z-10 relative">
                <p className="text-xl sm:text-3xl font-bold mb-2 sm:mb-3 text-gray-100 font-mono">
                  {stat.val}
                </p>
                <p className="text-indigo-300 text-[8px] sm:text-[10px] uppercase font-bold tracking-wider bg-indigo-500/10 border border-indigo-500/20 inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 rounded truncate max-w-full">
                  ★ {stat.model}
                </p>
              </div>
              <div className="absolute -bottom-4 -right-4 text-white/5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                <BarChart size={80} className="sm:w-25 sm:h-25" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DETAILED METRICS MATRIX */}
      <div
        className={
          isLoading
            ? "opacity-50 pointer-events-none transition-opacity duration-300"
            : "transition-opacity duration-300"
        }
      >
        <h2 className="text-xs sm:text-sm font-mono text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-indigo-500 rounded-sm animate-pulse"></span>
          Model Telemetry Matrix
        </h2>

        <div className="grid grid-cols-2 gap-3 sm:gap-6">
          {metricsData.map((row) => {
            const theme = getThemeColor(row.name);

            const cardStyle =
              theme === "indigo"
                ? "bg-gradient-to-r from-indigo-900/20 to-[#080c17] border-indigo-500/40 shadow-[0_0_20px_rgba(79,70,229,0.1)] lg:scale-[1.02]"
                : theme === "teal"
                  ? "bg-gradient-to-r from-teal-900/10 to-[#080c17] border-teal-500/20"
                  : "bg-gradient-to-r from-slate-900/30 to-[#080c17] border-slate-700/50";

            const barColor =
              theme === "indigo"
                ? "bg-indigo-500"
                : theme === "teal"
                  ? "bg-teal-500"
                  : "bg-slate-500";
            const textColor =
              theme === "indigo"
                ? "text-indigo-300"
                : theme === "teal"
                  ? "text-teal-300"
                  : "text-slate-300";

            return (
              <div
                key={row.id}
                className={`rounded-xl sm:rounded-2xl border p-3 sm:p-6 flex flex-col justify-between transition-all ${cardStyle}`}
              >
                {/* Card Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start mb-4 sm:mb-6 border-b border-gray-800/50 pb-3 sm:pb-4 gap-2 lg:gap-0">
                  <div className="w-full">
                    <h3
                      className={`text-sm sm:text-xl font-bold tracking-wide mb-1 truncate ${textColor}`}
                    >
                      {row.name}
                    </h3>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${barColor}`}
                      ></span>
                      <span className="text-[9px] sm:text-xs font-mono uppercase tracking-widest text-gray-500">
                        {row.status}
                      </span>
                    </div>
                  </div>

                  {/* F1 Hero Metric */}
                  <div className="text-left lg:text-right mt-1 lg:mt-0">
                    <p className="text-[8px] sm:text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-0 sm:mb-1">
                      Overall F1
                    </p>
                    <p
                      className={`text-lg sm:text-2xl font-mono font-bold ${textColor}`}
                    >
                      {row.f1}
                    </p>
                  </div>
                </div>

                {/* Progress Bars */}
                <div className="space-y-3 sm:space-y-4">
                  {[
                    { label: "Accuracy", value: row.accuracy },
                    { label: "Precision", value: row.precision },
                    { label: "Recall", value: row.recall },
                  ].map((metric, i) => (
                    <div
                      key={i}
                      className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4"
                    >
                      <div className="flex justify-between items-center sm:w-20">
                        <span className="text-[8px] sm:text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                          {metric.label}
                        </span>
                        <span className="text-[9px] font-mono text-gray-300 sm:hidden">
                          {metric.value}
                        </span>
                      </div>

                      <div className="flex-1 h-1.5 sm:h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800 relative w-full">
                        <div
                          className={`absolute top-0 left-0 h-full rounded-full ${barColor} shadow-[0_0_10px_currentColor] transition-all duration-1000 ease-out`}
                          style={{
                            width: `${parseFloat(metric.value) * 100}%`,
                          }}
                        ></div>
                      </div>

                      <div className="hidden sm:block w-12 text-right text-xs font-mono text-gray-300">
                        {metric.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EvaluationResults;
