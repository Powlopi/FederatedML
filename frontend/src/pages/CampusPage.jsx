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

  // --- ACTION: RETRIEVE GLOBAL MODEL ---
  const retrieveGlobalModelFromHub = async () => {
    setLoading(true);
    setLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] >> Communicating with Central aggregation server...`,
    ]);
    try {
      const res = await axios.get(
        `http://localhost:${port}/api/retrieve_global_model`,
      );
      setLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] >> Global model parameter download initiated.`,
      ]);

      setTimeout(() => {
        setLogs((prev) => [...prev, `[SUCCESS] ${res.data.message}`]);
        setLoading(false);
      }, 1500);
    } catch (err) {
      const actualError = err.response?.data?.message || err.message;
      setLogs((prev) => [...prev, `[ERROR] Sync Failed: ${actualError}`]);
      setLoading(false);
    }
  };

  // --- ACTION: TRAIN LOCAL MODEL ---
  const trainModel = async () => {
    setLoading(true);
    setMetrics(null);
    setLogs([
      `[${new Date().toLocaleTimeString()}] >> Retrieving Main Global Model...`,
    ]);

    try {
      const res = await axios.post(`http://localhost:${port}/api/train`);

      // We use timeouts here to simulate a realistic sequence
      setTimeout(() => {
        setLogs((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] >> Main model evaluated on local test data (n=${res.data.test_size}).`,
        ]);
      }, 1000);

      setTimeout(() => {
        setLogs((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] >> Initializing local training on ${res.data.train_size} records...`,
        ]);
      }, 2500);

      setTimeout(() => {
        setLogs((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] >> Local model trained and evaluated.`,
        ]);
      }, 4000);

      setTimeout(() => {
        setLogs((prev) => [...prev, `[SUCCESS] ${res.data.message}`]);
        setMetrics(res.data); // Show the metrics!
        setLoading(false);
      }, 5000);
    } catch (err) {
      // This forces React to read the Python error message
      const actualError = err.response?.data?.message || err.message;
      setLogs((prev) => [...prev, `[ERROR] Execution Failed: ${actualError}`]);
      setLoading(false);
    }
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
          <button
            onClick={trainModel}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
              ></path>
            </svg>
            {loading ? "Processing Sequence..." : "Start Node Sequence"}
          </button>
        </div>

        {/* NEW: SYNCHRONIZATION SECTION */}
        <div className="flex flex-col md:flex-row items-center justify-between bg-[#0a1120] border border-gray-800/80 rounded-xl p-5 shadow-inner mb-8 gap-4">
          <div>
            <h3 className="text-gray-200 font-semibold mb-1">
              Model Synchronization
            </h3>
            <p className="text-gray-500 text-sm">
              Download the latest aggregated global model from the central
              server before beginning local training.
            </p>
          </div>
          <button
            onClick={retrieveGlobalModelFromHub}
            disabled={loading}
            className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              ></path>
            </svg>
            {loading ? "Syncing..." : "Retrieve Global Model"}
          </button>
        </div>

        {/* METRICS & INFO CARDS SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Card 1: Static Architecture */}
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
                <span className="font-mono text-blue-400">50</span>
              </li>
            </ul>
          </div>

          {/* Card 2: Dynamic Evaluation Metrics */}
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

            {metrics ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-800 text-center">
                  <div className="text-gray-500 text-[10px] uppercase mb-1">
                    Global Model
                  </div>
                  <div className="text-amber-400 font-mono text-lg">
                    {metrics.global_metrics.accuracy}
                  </div>
                  <div className="text-gray-600 text-[10px] mt-1">
                    F1: {metrics.global_metrics.f1}
                  </div>
                </div>
                <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-800 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500"></div>
                  <div className="text-gray-500 text-[10px] uppercase mb-1">
                    Local Model
                  </div>
                  <div className="text-emerald-400 font-mono text-lg">
                    {metrics.local_metrics.accuracy}
                  </div>
                  <div className="text-gray-600 text-[10px] mt-1">
                    F1: {metrics.local_metrics.f1}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-600 text-sm italic py-4">
                Execute sequence to view model comparison.
              </div>
            )}
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
