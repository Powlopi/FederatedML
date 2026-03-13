import { useState } from "react";
import axios from "axios";

// --- PAGE: CAMPUS TRAINING ---
const CampusPage = ({
  id,
  port,
  locationName = "Local Node",
  records = 2400,
}) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState(null);

  // --- Helper to add logs cleanly ---
  const addLog = (message) => {
    setLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${message}`,
    ]);
  };

  // --- ACTION 1: RETRIEVE GLOBAL MODEL ---
  const retrieveGlobalModelFromHub = async () => {
    setLoading(true);
    addLog(">> Communicating with Central aggregation server...");
    try {
      const res = await axios.get(
        `http://localhost:${port}/api/retrieve_global_model`,
      );
      addLog(">> Global model parameter download initiated.");

      setTimeout(() => {
        addLog(`[SUCCESS] ${res.data.message}`);
        setLoading(false);
      }, 1500);
    } catch (err) {
      const actualError = err.response?.data?.message || err.message;
      addLog(`[ERROR] Sync Failed: ${actualError}`);
      setLoading(false);
    }
  };

  // --- SAFETY HELPER: Only formats if the number actually exists ---
  const formatMetric = (val) => {
    if (val === undefined || val === null) return undefined;
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    return num <= 1 ? (num * 100).toFixed(2) + "%" : num + "%";
  };

  // --- ACTION 2: RUN INITIAL TEST (EVALUATE MODEL) ---
  const runTest = async (sampleSize) => {
    setLoading(true);
    addLog(`>> Requesting evaluation with ${sampleSize} test samples...`);

    try {
      const res = await axios.post(`http://localhost:${port}/api/evaluate`, {
        sample_size: sampleSize,
      });

      // Extract Global
      const g_acc = res.data.global_metrics?.accuracy || res.data.accuracy;
      const g_f1 = res.data.global_metrics?.f1 || res.data.f1;

      // Extract Local (just in case your Evaluate route returns both!)
      const l_acc = res.data.local_metrics?.accuracy;
      const l_f1 = res.data.local_metrics?.f1;

      addLog(`[SUCCESS] Evaluation complete.`);

      setMetrics((prev) => ({
        ...(prev || {}),
        // Update global
        global_metrics: g_acc
          ? {
              accuracy: formatMetric(g_acc),
              f1: formatMetric(g_f1),
            }
          : prev?.global_metrics,

        // Update local ONLY if the evaluate route actually provided it
        ...(l_acc && {
          local_metrics: {
            accuracy: formatMetric(l_acc),
            f1: formatMetric(l_f1),
          },
        }),
        test_size: sampleSize,
      }));
    } catch (err) {
      const actualError = err.response?.data?.message || err.message;
      addLog(`[ERROR] Evaluation failed: ${actualError}`);
    }
    setLoading(false);
  };

  /// --- ACTION 3: RETRAIN LOCAL MODEL ---
  const handleRetrain = async () => {
    setLoading(true);
    addLog(`>> Initiating retraining sequence with Campus-${id} local data...`);

    try {
      const res = await axios.post(`http://localhost:${port}/api/retrain`);

      // Extract Local metrics matching your Python jsonify structure
      const l_acc = res.data.local_metrics?.accuracy;
      const l_f1 = res.data.local_metrics?.f1;

      addLog(`[SUCCESS] ${res.data.message || "Retraining complete."}`);

      setMetrics((prev) => ({
        ...(prev || {}),
        // THE FIX: Check if it's strictly not undefined, so 0 doesn't break it!
        ...(l_acc !== undefined && {
          local_metrics: {
            accuracy: formatMetric(l_acc),
            f1: formatMetric(l_f1),
          },
        }),
      }));
    } catch (err) {
      const actualError = err.response?.data?.message || err.message;
      addLog(`[ERROR] Retraining failed: ${actualError}`);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 shadow-2xl">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-gray-800/80 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-100 tracking-tight uppercase">
              Campus {id} ({locationName})
            </h1>
            <p className="text-gray-500 text-sm mt-2 font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Isolated Execution Environment • LOCAL:{port}
            </p>
          </div>
          {/* Start Sequence button removed from here! */}
        </div>

        {/* SYNCHRONIZATION SECTION */}
        <div className="flex flex-col md:flex-row items-center justify-between bg-[#0a1120] border border-gray-800/80 rounded-xl p-5 shadow-inner mb-6 gap-4">
          <div>
            <h3 className="text-gray-200 font-semibold mb-1">
              Model Synchronization
            </h3>
            <p className="text-gray-500 text-sm">
              Download the latest aggregated global model from the central
              server.
            </p>
          </div>
          <button
            onClick={retrieveGlobalModelFromHub}
            disabled={loading}
            className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 whitespace-nowrap"
          >
            {loading ? "Syncing..." : "Retrieve Global Model"}
          </button>
        </div>

        {/* NEW: EXECUTION CONTROLS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Evaluate Controls */}
          <div className="bg-[#0a1120] border border-gray-800/80 rounded-xl p-5 shadow-inner">
            <h3 className="text-gray-200 font-semibold border-b border-gray-800 pb-2 mb-3">
              1. Evaluate Global Model
            </h3>
            <p className="text-gray-500 text-xs mb-4">
              Select test sample size to evaluate current model performance.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[25, 50, 100].map((size) => (
                <button
                  key={size}
                  onClick={() => runTest(size)}
                  disabled={loading}
                  className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-sm py-2 px-3 rounded-lg disabled:opacity-50 transition-colors"
                >
                  {size} Samples
                </button>
              ))}
            </div>
          </div>

          {/* Retrain Controls */}
          <div className="bg-[#0a1120] border border-gray-800/80 rounded-xl p-5 shadow-inner">
            <h3 className="text-gray-200 font-semibold border-b border-gray-800 pb-2 mb-3">
              2. Local Retraining
            </h3>
            <p className="text-gray-500 text-xs mb-4">
              Trigger local training loop using new Campus-{id} patient data.
            </p>
            <button
              onClick={handleRetrain}
              disabled={loading}
              className="w-full bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 font-medium py-2 px-4 rounded-lg disabled:opacity-50 transition-colors"
            >
              {loading ? "Processing..." : `Retrain with Campus-${id} Data`}
            </button>
          </div>
        </div>

        {/* METRICS & INFO CARDS SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#0a1120] border border-gray-800/80 rounded-xl p-5 shadow-inner">
            <h3 className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-4 border-b border-gray-800 pb-2">
              Configuration
            </h3>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex justify-between">
                <span className="text-gray-500">Algorithm</span>
                <span className="font-mono text-indigo-400">Random Forest</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-500">Training Records</span>
                <span className="font-mono text-blue-400">{records}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-500">Test Samples</span>
                <span className="font-mono text-blue-400">
                  {metrics?.test_size || "--"}
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-[#0a1120] border border-gray-800/80 rounded-xl p-5 shadow-inner">
            <h3 className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-4 border-b border-gray-800 pb-2 flex justify-between">
              <span>Evaluation Results</span>
              {metrics ? (
                <span className="text-emerald-400">Computed</span>
              ) : (
                <span className="text-amber-500/50 animate-pulse">
                  Pending...
                </span>
              )}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-800 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1 h-full bg-indigo-500"></div>
                <div className="text-gray-500 text-[10px] uppercase mb-1">
                  Global Model
                </div>
                <div className="text-indigo-400 font-mono text-lg">
                  {metrics?.global_metrics
                    ? metrics.global_metrics.accuracy
                    : "--"}
                </div>
                <div className="text-gray-600 text-[10px] mt-1">
                  F1:{" "}
                  {metrics?.global_metrics ? metrics.global_metrics.f1 : "--"}
                </div>
              </div>
              <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-800 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1 h-full bg-rose-500"></div>
                <div className="text-gray-500 text-[10px] uppercase mb-1">
                  Local Model
                </div>
                <div className="text-rose-400 font-mono text-lg">
                  {metrics?.local_metrics
                    ? metrics.local_metrics.accuracy
                    : "--"}
                </div>
                <div className="text-gray-600 text-[10px] mt-1">
                  F1: {metrics?.local_metrics ? metrics.local_metrics.f1 : "--"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TERMINAL SECTION */}
        <div className="bg-[#050b14] rounded-xl p-6 font-mono text-sm h-64 overflow-y-auto border border-gray-800/80 text-emerald-400/90 shadow-inner relative">
          <div className="sticky top-0 bg-[#050b14]/90 backdrop-blur pb-3 mb-3 border-b border-gray-800 uppercase tracking-widest text-[10px] text-gray-500 z-10">
            Node Execution Terminal
          </div>
          {logs.map((log, i) => (
            <div
              key={i}
              className={`mb-2 ${log.includes("[ERROR]") ? "text-rose-400" : ""} ${log.includes("[SUCCESS]") ? "text-indigo-400 font-bold" : ""}`}
            >
              {log}
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-gray-600 italic animate-pulse">
              System ready. Waiting for execution command...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default CampusPage;
