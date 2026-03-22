import { useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const CampusPage = ({
  id,
  port,
  locationName = "Local Node",
  records = 2400,
}) => {
  // --- 1. ROUTING & URL SETUP ---
  // Grab the ID from the URL (e.g., /campus/1) if it wasn't passed directly as a prop
  const { id: routeId } = useParams();
  const activeId = id || routeId;

  const CAMPUS_URLS = {
    1: "https://campus-1-production.up.railway.app",
    2: "https://campus-2-production.up.railway.app",
  };

  const currentCampusUrl = CAMPUS_URLS[activeId] || CAMPUS_URLS["1"];

  // --- 2. STATE ---
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [selectedSamples, setSelectedSamples] = useState(100);
  const [activeSampleSize, setActiveSampleSize] = useState(0);

  const addLog = (message) => {
    setLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${message}`,
    ]);
  };

  // --- 3. API FUNCTIONS ---
  const retrieveGlobalModelFromHub = async () => {
    setLoading(true);
    addLog(">> Commanding Local Node to sync with Central Hub...");

    try {
      // FIX: We are now telling the CURRENT CAMPUS to go fetch the model
      const res = await axios.get(
        `${currentCampusUrl}/api/retrieve_global_model`,
      );

      addLog(">> Global model parameter download initiated by Campus Node.");

      setTimeout(() => {
        // We can display the success message from the Python backend!
        addLog(`[SUCCESS] ${res.data.message || "Global model synchronized."}`);
        setLoading(false);
      }, 1000);
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

  const runTest = async () => {
    if (selectedSamples <= 0) return;
    setLoading(true);
    setActiveSampleSize(selectedSamples);
    addLog(`>> Requesting evaluation with ${selectedSamples} test samples...`);

    try {
      // Using the dynamic Railway URL based on the current campus
      const res = await axios.post(`${currentCampusUrl}/api/evaluate`, {
        sample_size: selectedSamples,
      });

      const g_acc = res.data.global_metrics?.accuracy || res.data.accuracy;
      const g_f1 = res.data.global_metrics?.f1 || res.data.f1;

      addLog(`[SUCCESS] Evaluation complete on ${selectedSamples} samples.`);

      setMetrics((prev) => ({
        ...(prev || {}),
        global_metrics: g_acc
          ? { accuracy: formatMetric(g_acc), f1: formatMetric(g_f1) }
          : prev?.global_metrics,
        test_size: selectedSamples,
      }));
    } catch (err) {
      const actualError = err.response?.data?.message || err.message;
      addLog(`[ERROR] Evaluation failed: ${actualError}`);
    }
    setLoading(false);
  };

  const handleRetrain = async () => {
    setLoading(true);
    setActiveSampleSize(100);
    addLog(`>> Retraining local model...`);

    try {
      // Using the dynamic Railway URL based on the current campus
      const res = await axios.post(`${currentCampusUrl}/api/retrain`, {
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
      }));
    } catch (err) {
      const actualError = err.response?.data?.message || err.message;
      addLog(`[ERROR] Retraining failed: ${actualError}`);
    }
    setLoading(false);
  };

  // --- 4. UI RENDER ---
  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row gap-6">
        {/* LEFT COLUMN: MAIN PIPELINE */}
        <div className="grow flex flex-col gap-6">
          {/* Node Header Info */}
          <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 shadow-lg flex justify-between items-center backdrop-blur-sm">
            <div>
              <h1 className="text-3xl font-bold text-gray-100 tracking-tight">
                Campus {activeId}{" "}
                <span className="text-gray-500 font-normal">
                  ({locationName})
                </span>
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded border border-emerald-400/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  ONLINE
                </span>
                <span className="text-gray-500 text-xs font-mono">
                  PORT: {port}
                </span>
                <span className="text-gray-500 text-xs font-mono">
                  RECORDS: {records}
                </span>
              </div>
            </div>
          </div>

          {/* Action Pipeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1: Sync */}
            <div className="bg-[#0a1120] border border-gray-800 rounded-xl p-5 flex flex-col justify-between hover:border-indigo-500/30 transition-colors">
              <div>
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold mb-3 border border-indigo-500/30">
                  1
                </div>
                <h3 className="text-gray-200 font-semibold mb-1">
                  Sync Global Model
                </h3>
                <p className="text-gray-500 text-xs mb-4">
                  Pull the latest aggregated weights from the Central Hub.
                </p>
              </div>
              <button
                onClick={retrieveGlobalModelFromHub}
                disabled={loading}
                className="w-full bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 py-2 rounded-lg font-medium transition-all text-sm"
              >
                {loading ? "Syncing..." : "Retrieve Model"}
              </button>
            </div>

            {/* Step 2: Custom Evaluate */}
            <div className="bg-[#0a1120] border border-gray-800 rounded-xl p-5 flex flex-col justify-between hover:border-emerald-500/30 transition-colors">
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold mb-3 border border-emerald-500/30">
                  2
                </div>
                <h3 className="text-gray-200 font-semibold mb-1">
                  Evaluate (Test)
                </h3>

                {/* CUSTOM SAMPLE SLIDER & INPUT */}
                <div className="mb-4 mt-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Sample Size</span>
                    {/* Replaced the span with a sleek number input for exact values */}
                    <input
                      type="number"
                      min="1"
                      max={records > 500 ? 500 : records}
                      // This prevents the '0' from getting stuck when you delete everything
                      value={selectedSamples === 0 ? "" : selectedSamples}
                      onChange={(e) => {
                        // parseInt automatically strips leading zeros (e.g., "075" becomes 75)
                        const val = parseInt(e.target.value, 10);
                        setSelectedSamples(isNaN(val) ? 0 : val);
                      }}
                      className="font-mono text-emerald-400 bg-gray-900 border border-gray-700 rounded px-2 py-0.5 w-16 text-right outline-none focus:border-emerald-500/50 focus:bg-gray-800 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <input
                    type="range"
                    min="1"
                    max={records > 500 ? 500 : records}
                    value={selectedSamples}
                    onChange={(e) => setSelectedSamples(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-gray-800 rounded-lg appearance-none"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setSelectedSamples(50)}
                      className="flex-1 text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-400 py-1 rounded"
                    >
                      50
                    </button>
                    <button
                      onClick={() => setSelectedSamples(100)}
                      className="flex-1 text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-400 py-1 rounded"
                    >
                      100
                    </button>
                    <button
                      onClick={() => setSelectedSamples(250)}
                      className="flex-1 text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-400 py-1 rounded"
                    >
                      250
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={runTest}
                disabled={loading || selectedSamples <= 0}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 py-2 rounded-lg font-medium transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Testing..." : `Run Test (${selectedSamples})`}
              </button>
            </div>

            {/* Step 3: Retrain */}
            <div className="bg-[#0a1120] border border-gray-800 rounded-xl p-5 flex flex-col justify-between hover:border-rose-500/30 transition-colors">
              <div>
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold mb-3 border border-rose-500/30">
                  3
                </div>
                <h3 className="text-gray-200 font-semibold mb-1">
                  Local Retrain
                </h3>
                <p className="text-gray-500 text-xs mb-4">
                  If accuracy drops, retrain the model with local student data
                  to fix drift.
                </p>
              </div>
              <button
                onClick={handleRetrain}
                disabled={loading}
                className="w-full bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/30 py-2 rounded-lg font-medium transition-all text-sm"
              >
                {loading ? "Processing..." : "Train Local Data"}
              </button>
            </div>
          </div>

          {/* Results Table */}
          {/* FIX: Changed overflow-hidden to overflow-x-auto */}
          <div className="bg-[#0a1120] border border-gray-800 rounded-xl p-0 overflow-x-auto shadow-inner">
            <div className="bg-gray-900/80 px-5 py-3 border-b border-gray-800 flex justify-between items-center min-w-125">
              <h3 className="text-gray-300 text-sm font-semibold tracking-wide">
                Performance Metrics
              </h3>
              {activeSampleSize > 0 && (
                <span className="text-gray-500 text-xs font-mono">
                  Latest test: {activeSampleSize} samples
                </span>
              )}
            </div>
            <table className="w-full text-left text-sm min-w-125">
              <thead className="bg-gray-800/30 text-gray-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 font-medium">Model Variant</th>
                  <th className="px-5 py-3 font-medium">Accuracy</th>
                  <th className="px-5 py-3 font-medium">F1 Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                <tr className="hover:bg-gray-800/20 transition-colors">
                  <td className="px-5 py-4 font-medium text-emerald-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Global Model (Incoming)
                  </td>
                  <td className="px-5 py-4 font-mono text-gray-300 text-lg">
                    {metrics?.global_metrics?.accuracy || "--"}
                  </td>
                  <td className="px-5 py-4 font-mono text-gray-300 text-lg">
                    {metrics?.global_metrics?.f1 || "--"}
                  </td>
                </tr>
                <tr className="hover:bg-gray-800/20 transition-colors">
                  <td className="px-5 py-4 font-medium text-rose-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    Local Model (Retrained)
                  </td>
                  <td className="px-5 py-4 font-mono text-gray-300 text-lg">
                    {metrics?.local_metrics?.accuracy || "--"}
                  </td>
                  <td className="px-5 py-4 font-mono text-gray-300 text-lg">
                    {metrics?.local_metrics?.f1 || "--"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: TERMINAL */}
        <div className="w-full xl:w-96 shrink-0 bg-[#050b14] rounded-2xl p-5 font-mono text-sm border border-gray-800/80 shadow-2xl flex flex-col min-h-125">
          <div className="flex items-center gap-2 pb-4 mb-2 border-b border-gray-800/80 shrink-0">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-gray-500 ml-2">
              Node Terminal
            </span>
          </div>
          <div className="overflow-y-auto grow text-emerald-400/90 custom-scrollbar pr-2 space-y-1.5 text-xs">
            {logs.map((log, i) => (
              <div
                key={i}
                className={`${log.includes("[ERROR]") ? "text-rose-400" : ""} ${log.includes("[SUCCESS]") ? "text-indigo-300 font-semibold" : ""}`}
              >
                {log}
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-gray-600 italic">
                System initialized. Awaiting commands...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampusPage;
