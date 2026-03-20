import { useState } from "react";
import axios from "axios";

const CampusPage = ({
  id,
  port,
  locationName = "Local Node",
  records = 2400,
}) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState(null);

  // NEW: State to track our additive sample size
  const [activeSampleSize, setActiveSampleSize] = useState(0);

  const addLog = (message) => {
    setLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${message}`,
    ]);
  };

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

  const formatMetric = (val) => {
    if (val === undefined || val === null) return "--";
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    return num <= 1 ? (num * 100).toFixed(2) + "%" : num + "%";
  };

  const [selectedSamples, setSelectedSamples] = useState(0);

  // --- MODIFIED: Handles dynamic sample additions ---
  const handleEvaluateClick = (action) => {
    let newSize = activeSampleSize;
    if (action === "50") newSize = 50;
    else if (action === "20")
      newSize = activeSampleSize === 0 ? 50 + 20 : activeSampleSize + 20;
    else if (action === "100") newSize = 100;

    setActiveSampleSize(newSize);
    runTest(newSize);
  };

  const runTest = async (sampleSize) => {
    setLoading(true);
    addLog(`>> Requesting evaluation with ${sampleSize} test samples...`);

    try {
      const res = await axios.post(`http://localhost:${port}/api/evaluate`, {
        sample_size: sampleSize,
      });

      const g_acc = res.data.global_metrics?.accuracy || res.data.accuracy;
      const g_f1 = res.data.global_metrics?.f1 || res.data.f1;

      addLog(`[SUCCESS] Evaluation complete on ${sampleSize} samples.`);

      setMetrics((prev) => ({
        ...(prev || {}),
        global_metrics: g_acc
          ? { accuracy: formatMetric(g_acc), f1: formatMetric(g_f1) }
          : prev?.global_metrics,
        test_size: sampleSize,
      }));
    } catch (err) {
      const actualError = err.response?.data?.message || err.message;
      addLog(`[ERROR] Evaluation failed: ${actualError}`);
    }
    setLoading(false);
  };

  const handleRetrain = async () => {
    setLoading(true);
    // The rubric requires retraining evaluation to test on 100 samples!
    setActiveSampleSize(100);
    addLog(`>> Retraining local model and testing on 100 samples...`);

    try {
      // Pass the required 100 sample size to the backend
      const res = await axios.post(`http://localhost:${port}/api/retrain`, {
        sample_size: 100,
      });

      const l_acc = res.data.local_metrics?.accuracy;
      const l_f1 = res.data.local_metrics?.f1;

      addLog(`[SUCCESS] ${res.data.message || "Retraining complete."}`);

      setMetrics((prev) => ({
        ...(prev || {}),
        ...(l_acc !== undefined && {
          local_metrics: {
            accuracy: formatMetric(l_acc),
            f1: formatMetric(l_f1),
          },
        }),
        test_size: 100, // Update UI to show it used 100
      }));
    } catch (err) {
      const actualError = err.response?.data?.message || err.message;
      addLog(`[ERROR] Retraining failed: ${actualError}`);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      {/* TWO COLUMN LAYOUT: Left is Dashboard, Right is Terminal */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT COLUMN: MAIN DASHBOARD */}
        <div className="grow bg-gray-900/50 border border-gray-800 rounded-2xl p-8 shadow-2xl">
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
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between bg-[#0a1120] border border-gray-800/80 rounded-xl p-5 shadow-inner mb-6 gap-4">
            <div>
              <h3 className="text-gray-200 font-semibold mb-1">
                Model Synchronization
              </h3>
              <p className="text-gray-500 text-sm">
                Download the latest global model.
              </p>
            </div>
            <button
              onClick={retrieveGlobalModelFromHub}
              disabled={loading}
              className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-6 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap"
            >
              {loading ? "Syncing..." : "Retrieve Global Model"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* EVALUATE BLOCK */}
            <div className="bg-[#0a1120] border border-gray-800/80 rounded-xl p-5 shadow-inner">
              <h3 className="text-gray-200 font-semibold border-b border-gray-800 pb-2 mb-3 flex justify-between items-center">
                1. Evaluate Global Model
                {/* Visual counter of currently selected samples */}
                <span className="text-indigo-400 text-sm bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  {selectedSamples} Samples
                </span>
              </h3>

              <p className="text-gray-500 text-xs mb-4">
                Select sample size then confirm to run evaluation.
              </p>

              {/* Selection Buttons - These now just update the local state */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button
                  onClick={() => setSelectedSamples(50)}
                  className="bg-gray-800/50 hover:bg-gray-700 text-gray-300 border border-gray-700 text-sm py-2 px-3 rounded-lg transition-colors"
                >
                  50 Samples
                </button>
                <button
                  onClick={() => setSelectedSamples((prev) => prev + 20)}
                  className="bg-gray-800/50 hover:bg-gray-700 text-gray-300 border border-gray-700 text-sm py-2 px-3 rounded-lg transition-colors"
                >
                  +20 Samples
                </button>
                <button
                  onClick={() => setSelectedSamples(100)}
                  className="bg-gray-800/50 hover:bg-gray-700 text-gray-300 border border-gray-700 text-sm py-2 px-3 rounded-lg transition-colors"
                >
                  100 Samples
                </button>
              </div>

              {/* Confirmation Button - This triggers the actual backend call */}
              <button
                onClick={() => {
                  handleEvaluateClick(selectedSamples.toString());
                  // Optional: Reset selection after clicking
                  // setSelectedSamples(0);
                }}
                disabled={loading || selectedSamples === 0}
                className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  selectedSamples > 0 && !loading
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20"
                    : "bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700"
                }`}
              >
                {loading
                  ? "Processing..."
                  : `Confirm Evaluation (${selectedSamples})`}
              </button>

              {selectedSamples > 0 && !loading && (
                <button
                  onClick={() => setSelectedSamples(0)}
                  className="w-full mt-2 text-[10px] text-gray-600 hover:text-gray-400 uppercase tracking-wider transition"
                >
                  Reset Selection
                </button>
              )}
            </div>

            {/* RETRAIN BLOCK */}
            <div className="bg-[#0a1120] border border-gray-800/80 rounded-xl p-5 shadow-inner">
              <h3 className="text-gray-200 font-semibold border-b border-gray-800 pb-2 mb-3">
                2. Local Retraining
              </h3>
              <p className="text-gray-500 text-xs mb-4">
                Retrains local data & tests on 100 samples.
              </p>
              <button
                onClick={handleRetrain}
                disabled={loading}
                className="w-full bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {loading ? "Processing..." : `Retrain with Campus-${id} Data`}
              </button>
            </div>
          </div>

          {/* METRICS TABLE SECTION */}
          <div className="bg-[#0a1120] border border-gray-800/80 rounded-xl p-5 shadow-inner">
            <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
              <h3 className="text-gray-400 text-xs font-bold tracking-widest uppercase">
                Evaluation Results
              </h3>
              <span className="text-blue-400 text-xs font-mono">
                Test Samples Used: {activeSampleSize || "--"}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-800/50 text-gray-400">
                  <tr>
                    <th className="p-3 rounded-tl-lg rounded-bl-lg">
                      Model Version
                    </th>
                    <th className="p-3">Accuracy</th>
                    <th className="p-3 rounded-tr-lg rounded-br-lg">
                      F1 Score
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  <tr className="hover:bg-gray-800/20 transition-colors">
                    <td className="p-3 font-medium text-indigo-300">
                      Global Model (From Hub)
                    </td>
                    <td className="p-3 font-mono text-gray-300">
                      {metrics?.global_metrics?.accuracy || "--"}
                    </td>
                    <td className="p-3 font-mono text-gray-300">
                      {metrics?.global_metrics?.f1 || "--"}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-800/20 transition-colors">
                    <td className="p-3 font-medium text-rose-300">
                      Local Model (Retrained)
                    </td>
                    <td className="p-3 font-mono text-gray-300">
                      {metrics?.local_metrics?.accuracy || "--"}
                    </td>
                    <td className="p-3 font-mono text-gray-300">
                      {metrics?.local_metrics?.f1 || "--"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TERMINAL */}
        <div className="w-full lg:w-100 shrink-0 bg-[#050b14] rounded-2xl p-6 font-mono text-sm border border-gray-800/80 shadow-2xl relative flex flex-col h-96">
          <div className="bg-[#050b14]/90 backdrop-blur pb-3 mb-3 border-b border-gray-800 uppercase tracking-widest text-[10px] text-gray-500 shrink-0">
            Node Execution Terminal
          </div>
          <div className="overflow-y-auto grow text-emerald-400/90 custom-scrollbar pr-2">
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
    </div>
  );
};
export default CampusPage;
