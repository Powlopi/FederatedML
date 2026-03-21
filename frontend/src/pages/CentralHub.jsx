import React, { useState, useEffect } from "react";
import axios from "axios";
import { Icons } from "../components/Icons";
import StatusBadge from "../components/StatusBadge";

const CentralHub = () => {
  // SPLIT LOADING STATES
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [isAggregating, setIsAggregating] = useState(false);

  const [retrievalStatus, setRetrievalStatus] = useState("");
  const [aggregationLogs, setAggregationLogs] = useState([]);
  const [statuses, setStatuses] = useState({
    campus1: "Checking...",
    campus2: "Checking...",
  });

  // Track session clicks
  const [retrievedCampus1, setRetrievedCampus1] = useState(false);
  const [retrievedCampus2, setRetrievedCampus2] = useState(false);

  // Track what the Hub already has saved on the hard drive
  const [hubModelsPresent, setHubModelsPresent] = useState({
    campus1: false,
    campus2: false,
  });

  // 1. Initial State Load
  useEffect(() => {
    const fetchData = async () => {
      // A. Check Campus Nodes Status
      try {
        const campusUrls = {
          campus1: "https://campus-1-production.up.railway.app",
          campus2: "https://campus-2-production.up.railway.app",
        };

        for (const [key, url] of Object.entries(campusUrls)) {
          try {
            await axios.get(`${url}/api/status`);
            setStatuses((prev) => ({ ...prev, [key]: "Online" }));
          } catch (err) {
            console.error(`Could not reach ${key}:`, err);
            setStatuses((prev) => ({ ...prev, [key]: "Offline" }));
          }
        }
      } catch (err) {
        setRetrievalStatus("Error fetching network status.");
      }
      // B. Check Hub Status for existing files
      try {
        const hubRes = await axios.get(
          "http://main-hub-production-38c4.up.railway.app/api/status",
        );
        if (hubRes.data && hubRes.data.models_present) {
          setHubModelsPresent({
            campus1: hubRes.data.models_present.campus1,
            campus2: hubRes.data.models_present.campus2,
          });
        }
      } catch (err) {
        console.error("Could not reach Hub for status check.");
      }
    };

    fetchData();
  }, []);

  // 2. Action: Retrieve Local Model (PULL)
  const retrieveLocalModel = async (campusId) => {
    if (campusId === "1") setLoading1(true);
    if (campusId === "2") setLoading2(true);
    setRetrievalStatus("");

    try {
      const res = await axios.get(
        `http://main-hub-production-38c4.up.railway.app/api/retrieve_local_model/${campusId}`,
      );
      if (res.data.status === "success") {
        setRetrievalStatus(
          `Success: Hospital ${campusId} model retrieved and saved locally on the central hub.`,
        );
        if (campusId === "1") setRetrievedCampus1(true);
        if (campusId === "2") setRetrievedCampus2(true);
      } else {
        setRetrievalStatus(`Error: ${res.data.message}`);
      }
    } catch (err) {
      setRetrievalStatus(
        `Network Error pulling model for Hospital ${campusId}: ${err.message}`,
      );
    }

    if (campusId === "1") setLoading1(false);
    if (campusId === "2") setLoading2(false);
  };

  // 3. Action: Trigger Federated Averaging
  const performAggregation = async () => {
    setIsAggregating(true);
    setAggregationLogs([]);
    setRetrievalStatus("");
    setAggregationLogs([
      "[10:14:00] >> Starting Federated Aggregation on both models...",
    ]);

    try {
      const res = await axios.get(
        "http://main-hub-production-38c4.up.railway.app/api/aggregate_models",
      );

      setTimeout(() => {
        setAggregationLogs((prev) => [
          ...prev,
          `[10:14:02] >> Federated Averaging complete. Trees successfully combined.`,
        ]);
      }, 1000);

      setTimeout(() => {
        setAggregationLogs((prev) => [
          ...prev,
          `[SUCCESS] ${res.data.message}`,
        ]);
        setIsAggregating(false);
      }, 2500);
    } catch (err) {
      setAggregationLogs((prev) => [
        ...prev,
        `[ERROR] Aggregation Failed: ${err.message}`,
      ]);
      setIsAggregating(false);
    }
  };

  // THE FIX: Check if we clicked the button OR if the hub already sees the files!
  const hasModel1 = retrievedCampus1 || hubModelsPresent.campus1;
  const hasModel2 = retrievedCampus2 || hubModelsPresent.campus2;
  const isReadyForFedAvg = hasModel1 && hasModel2;

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto space-y-8 font-sans pb-12">
      {/* HEADER: Hub Control Module */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#0a0f1c] border border-indigo-500/20 backdrop-blur-md rounded-2xl p-6 shadow-[0_0_20px_rgba(79,70,229,0.05)]">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-indigo-500/20 p-2 rounded-lg border border-indigo-500/30">
              <Icons.Brain className="text-indigo-400" size={24} />
            </div>
            <h1 className="text-2xl font-bold text-gray-100 uppercase tracking-widest">
              Central Aggregation Hub
            </h1>
          </div>
        </div>
      </div>

      {/* UPLINK TERMINALS (Retrieval Section) */}
      <div className="space-y-4">
        <h2 className="text-sm font-mono text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          Data Uplink Terminals
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Campus 1 Terminal */}
          <div className="bg-linear-to-br from-[#0e1526] to-[#0a0f1c] border border-gray-800 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <Icons.Server size={100} />
            </div>

            <div className="flex justify-between items-start mb-6 relative z-10">
              <div>
                <h2 className="text-gray-100 font-bold text-lg">
                  Campus 1 Node
                </h2>
                <p className="text-[10px] text-gray-500 font-mono mt-1">
                  IP: Localhost • Port: 5001
                </p>
              </div>
              <StatusBadge status={statuses.campus1} />
            </div>

            <button
              onClick={() => retrieveLocalModel("1")}
              disabled={loading1}
              className={`relative w-full py-4 rounded-xl font-bold uppercase tracking-wider text-xs transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden
                ${
                  loading1
                    ? "bg-rose-900/50 text-rose-300 border border-rose-800 cursor-not-allowed"
                    : "bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(225,29,72,0.3)] border border-rose-500"
                }`}
            >
              {loading1 ? (
                <>
                  <span className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin"></span>
                  Establishing Uplink...
                </>
              ) : (
                "Retrieve Model - Campus 1"
              )}
            </button>
          </div>

          {/* Campus 2 Terminal */}
          <div className="bg-linear-to-br from-[#0e1526] to-[#0a0f1c] border border-gray-800 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <Icons.Server size={100} />
            </div>

            <div className="flex justify-between items-start mb-6 relative z-10">
              <div>
                <h2 className="text-gray-100 font-bold text-lg">
                  Campus 2 Node
                </h2>
                <p className="text-[10px] text-gray-500 font-mono mt-1">
                  IP: Localhost • Port: 5002
                </p>
              </div>
              <StatusBadge status={statuses.campus2} />
            </div>

            <button
              onClick={() => retrieveLocalModel("2")}
              disabled={loading2}
              className={`relative w-full py-4 rounded-xl font-bold uppercase tracking-wider text-xs transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden
                ${
                  loading2
                    ? "bg-rose-900/50 text-rose-300 border border-rose-800 cursor-not-allowed"
                    : "bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(225,29,72,0.3)] border border-rose-500"
                }`}
            >
              {loading2 ? (
                <>
                  <span className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin"></span>
                  Establishing Uplink...
                </>
              ) : (
                "Retrieve Model - Campus 2"
              )}
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {retrievalStatus && (
          <div className="bg-[#050b14] border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-xs font-mono flex items-start gap-3 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
            <Icons.CheckCircle className="shrink-0 mt-0.5" size={16} />
            <span>{retrievalStatus}</span>
          </div>
        )}
      </div>

      {/* STORAGE REGISTRY (Data Drive Modules) */}
      <div className="space-y-4">
        <h2 className="text-sm font-mono text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 bg-indigo-500 rounded-sm"></span>
          Local Storage Registry
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              node: "Campus 1 Data",
              status: statuses.campus1,
              file: "local_model_campus1.pkl",
              isStored: hasModel1,
            },
            {
              node: "Campus 2 Data",
              status: statuses.campus2,
              file: "local_model_campus2.pkl",
              isStored: hasModel2,
            },
          ].map((row, idx) => (
            <div
              key={idx}
              className={`relative flex flex-col p-6 rounded-2xl border backdrop-blur-md transition-all duration-500 ${
                row.isStored
                  ? "bg-linear-to-br from-emerald-900/10 to-[#080c17] border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.05)]"
                  : "bg-linear-to-br from-[#0e1526] to-[#080c17] border-gray-800"
              }`}
            >
              {/* Left Side Accent Line */}
              <div
                className={`absolute left-0 top-6 bottom-6 w-1 rounded-r-md ${row.isStored ? "bg-emerald-500" : "bg-gray-700"}`}
              ></div>

              {/* Header: Node & Network Status */}
              <div className="flex justify-between items-start mb-5 pl-2">
                <div className="flex items-center gap-2">
                  <Icons.Server
                    size={18}
                    className={
                      row.isStored ? "text-emerald-400" : "text-gray-500"
                    }
                  />
                  <h3 className="text-gray-200 font-bold tracking-wide">
                    {row.node}
                  </h3>
                </div>
                <StatusBadge status={row.status} />
              </div>

              {/* File Payload Info */}
              <div className="bg-[#050b14] rounded-lg p-4 mb-6 border border-gray-800/80 flex flex-col gap-1.5 shadow-inner pl-2">
                <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                  Model Parameter File
                </span>
                <span
                  className={`font-mono text-sm truncate ${row.isStored ? "text-emerald-300" : "text-gray-400"}`}
                >
                  {row.file}
                </span>
              </div>

              {/* Storage Status Footer */}
              <div className="mt-auto flex items-center justify-between border-t border-gray-800/60 pt-4 pl-2">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                  Hub Storage
                </span>

                {row.isStored ? (
                  <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-md border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                    <Icons.CheckCircle size={14} />
                    <span className="text-[10px] font-mono uppercase font-bold tracking-widest">
                      Verified & Secure
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-rose-400 bg-rose-500/5 px-3 py-1.5 rounded-md border border-rose-500/20">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                    <span className="text-[10px] font-mono uppercase font-bold tracking-widest">
                      Awaiting Pull
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AGGREGATION ENGINE */}
      <div className="space-y-4">
        <h2 className="text-sm font-mono text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <Icons.Brain size={16} className="text-indigo-500" />
          FedAvg Processing Engine
        </h2>

        <div
          className={`border rounded-2xl p-6 transition-all duration-500 ${
            isReadyForFedAvg
              ? "bg-linear-to-b from-indigo-900/20 to-[#080c17] border-indigo-500/40 shadow-[0_0_30px_rgba(79,70,229,0.1)]"
              : "bg-[#080c17] border-gray-800"
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex-1">
              {isReadyForFedAvg ? (
                <>
                  <h3 className="text-indigo-300 font-bold mb-1">
                    System Ready
                  </h3>
                  <p className="text-gray-400 text-xs font-mono">
                    Both local models verified in hub storage. Ready to compile
                    global weights.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-gray-400 font-bold mb-1">
                    Awaiting Data
                  </h3>
                  <p className="text-gray-500 text-xs font-mono">
                    Retrieve models from all connected nodes to unlock
                    aggregation protocols.
                  </p>
                </>
              )}
            </div>

            <button
              onClick={performAggregation}
              disabled={!isReadyForFedAvg || isAggregating}
              className={`relative px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all duration-300 overflow-hidden shrink-0 w-full sm:w-auto
                ${
                  !isReadyForFedAvg
                    ? "bg-gray-900 text-gray-600 border border-gray-800 cursor-not-allowed"
                    : isAggregating
                      ? "bg-indigo-900/50 text-indigo-300 border border-indigo-800 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] border border-indigo-400"
                }`}
            >
              {isAggregating ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></span>
                  Processing...
                </span>
              ) : (
                "Execute FedAvg"
              )}
            </button>
          </div>

          {/* TERMINAL LOG OUTPUT */}
          {(aggregationLogs.length > 0 || isAggregating) && (
            <div className="mt-6 bg-black rounded-xl border border-gray-800 overflow-hidden relative group">
              {/* Terminal Header */}
              <div className="bg-[#111] px-4 py-2 border-b border-gray-800 flex justify-between items-center">
                <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                  Compiler Terminal
                </span>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-rose-500/50"></div>
                  <div className="w-2 h-2 rounded-full bg-amber-500/50"></div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500/50"></div>
                </div>
              </div>

              {/* Terminal Body */}
              <div className="p-5 font-mono text-xs h-48 overflow-y-auto space-y-2">
                {aggregationLogs.map((log, i) => (
                  <div
                    key={i}
                    className={`leading-relaxed ${
                      log.includes("[ERROR]")
                        ? "text-rose-400"
                        : log.includes("[SUCCESS]")
                          ? "text-emerald-400 font-bold bg-emerald-900/20 px-2 py-1 inline-block rounded"
                          : "text-indigo-300 opacity-90"
                    }`}
                  >
                    {log}
                  </div>
                ))}
                {isAggregating && (
                  <div className="text-indigo-500 animate-pulse mt-2">_</div>
                )}
              </div>

              {/* Scanline overlay effect */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0),rgba(255,255,255,0),rgba(255,255,255,0.02))] pointer-events-none background-size-100-2 shrink-0 z-10 opacity-50"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CentralHub;
