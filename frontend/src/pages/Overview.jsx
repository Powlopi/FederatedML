import { useState, useEffect } from "react";
import axios from "axios";
import { Icons } from "../components/Icons";
import StatusBadge from "../components/StatusBadge";

const Overview = () => {
  const [statuses, setStatuses] = useState({
    main: "Checking...",
    campus1: "Checking...",
    campus2: "Checking...",
  });

  const [metrics, setMetrics] = useState({
    version: "RFC v1.0",
    accuracy: "--",
    f1: "--",
    lastSync: "Checking...",
  });

  useEffect(() => {
    // 1. Check Node Statuses
    const checkStatuses = async () => {
      const ports = { main: 5000, campus1: 5001, campus2: 5002 };
      for (const [key, port] of Object.entries(ports)) {
        try {
          await axios.get(`http://127.0.0.1:${port}/api/status`);
          setStatuses((prev) => ({ ...prev, [key]: "Online" }));
        } catch {
          setStatuses((prev) => ({ ...prev, [key]: "Offline" }));
        }
      }
    };

    // 2. Fetch Global Metrics from Central Hub
    const fetchGlobalMetrics = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:5000/api/global_metrics");
        if (res.data && res.data.status === "success") {
          const acc = res.data.accuracy;
          const f1 = res.data.f1;

          setMetrics({
            version: res.data.version || "RFC Latest",
            accuracy: acc
              ? acc <= 1
                ? (acc * 100).toFixed(2) + "%"
                : acc + "%"
              : "--",
            f1: f1 ? parseFloat(f1).toFixed(2) : "--",
            lastSync: res.data.last_sync || "Unknown",
          });
        }
      } catch (err) {
        console.log(
          "Could not fetch global metrics. Hub might be offline or model is untrained.",
        );
      }
    };

    checkStatuses();
    fetchGlobalMetrics();
  }, []);

  // Helper to determine if a node is online for styling the network map
  const isOnline = (status) => status === "Online";

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto space-y-8 font-sans">
      {/* HUD Header / Version Timeline */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#0a0f1c] border border-indigo-500/20 backdrop-blur-md rounded-2xl p-5 shadow-[0_0_20px_rgba(79,70,229,0.05)]">
        <div className="flex items-center gap-3 mb-4 sm:mb-0">
          <div className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse ring-4 ring-indigo-500/20"></div>
          <h2 className="text-indigo-200 font-bold tracking-widest uppercase text-sm">
            System Overview
          </h2>
        </div>

        {/* Version Timeline */}
        <div className="flex items-center gap-3 text-xs sm:text-sm font-mono text-gray-400">
          <span className="opacity-40">Init</span>
          <span className="text-indigo-500/50">→</span>
          <span className="opacity-40">Train</span>
          <span className="text-indigo-500/50">→</span>
          <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 rounded-md font-bold shadow-[0_0_10px_rgba(79,70,229,0.2)]">
            {metrics.version}
          </span>
        </div>
      </div>

      {/* TOP METRICS*/}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Global Model */}
        <div className="bg-linear-to-b from-[#0e1526] to-[#0a0f1c] border border-gray-800 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-4 right-4 text-indigo-500/20 group-hover:text-indigo-500/40 transition-colors">
            <Icons.Brain size={48} />
          </div>
          <p className="text-gray-400 text-xs font-semibold tracking-wider uppercase mb-1">
            Global Model
          </p>
          <h3 className="text-2xl font-bold text-gray-100 mb-1">
            {metrics.version}
          </h3>
          <p className="text-[10px] text-indigo-400 font-mono">
            Sync: {metrics.lastSync}
          </p>
        </div>

        {/* Avg. Accuracy */}
        <div className="bg-linear-to-b from-[#0e1526] to-[#0a0f1c] border border-gray-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-4 right-4 text-blue-500/20">
            <Icons.Chart size={48} />
          </div>
          <p className="text-gray-400 text-xs font-semibold tracking-wider uppercase mb-1">
            Avg. Accuracy
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-gray-100">
              {metrics.accuracy}
            </h3>
            {metrics.accuracy !== "--" && (
              <span className="text-emerald-400 text-xs font-bold">↑</span>
            )}
          </div>
          {/* Faux Sparkline for visual effect */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-blue-600 to-indigo-500 opacity-50"></div>
        </div>

        {/* Global F1 Score */}
        <div className="bg-linear-to-b from-[#0e1526] to-[#0a0f1c] border border-gray-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-4 right-4 text-emerald-500/20">
            <Icons.CheckCircle size={48} />
          </div>
          <p className="text-gray-400 text-xs font-semibold tracking-wider uppercase mb-1">
            Global F1 Score
          </p>
          <h3 className="text-3xl font-bold text-gray-100">{metrics.f1}</h3>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-emerald-600 to-teal-500 opacity-50"></div>
        </div>

        {/* Active Nodes */}
        <div className="bg-linear-to-b from-[#0e1526] to-[#0a0f1c] border border-gray-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-4 right-4 text-amber-500/20">
            <Icons.Server size={48} />
          </div>
          <p className="text-gray-400 text-xs font-semibold tracking-wider uppercase mb-1">
            Active Nodes
          </p>
          <div className="flex items-baseline gap-1">
            <h3 className="text-3xl font-bold text-gray-100">
              {Object.values(statuses).filter(isOnline).length}
            </h3>
            <span className="text-gray-500 text-lg">/3</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-amber-600 to-orange-500 opacity-50"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* NETWORK TOPOLOGY VISUALIZATION (Replacing the generic static display) */}
        <div className="lg:col-span-2 bg-[#080c17] border border-indigo-900/30 rounded-2xl p-6 relative shadow-inner flex flex-col min-h-100">
          <h2 className="text-lg font-semibold text-gray-100 mb-2 flex items-center gap-2 relative z-10">
            <Icons.Server className="text-indigo-400" /> Network Topology
          </h2>
          <p className="text-xs text-gray-500 font-mono mb-8 relative z-10">
            Live Connection Map
          </p>

          <div className="flex-1 flex flex-col items-center justify-center relative w-full mt-4">
            {/* Connecting Lines (SVG) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              {/* Central to Campus 1 */}
              <path
                d="M 50% 15% C 30% 40%, 25% 60%, 25% 75%"
                fill="none"
                stroke={isOnline(statuses.campus1) ? "#4f46e5" : "#1f2937"}
                strokeWidth="2"
                strokeDasharray={isOnline(statuses.campus1) ? "6 6" : "none"}
                className={
                  isOnline(statuses.campus1)
                    ? "animate-[dash_20s_linear_infinite]"
                    : ""
                }
              />
              {/* Central to Campus 2 */}
              <path
                d="M 50% 15% C 70% 40%, 75% 60%, 75% 75%"
                fill="none"
                stroke={isOnline(statuses.campus2) ? "#4f46e5" : "#1f2937"}
                strokeWidth="2"
                strokeDasharray={isOnline(statuses.campus2) ? "6 6" : "none"}
                className={
                  isOnline(statuses.campus2)
                    ? "animate-[dash_20s_linear_infinite]"
                    : ""
                }
              />
            </svg>

            {/* Central Node */}
            <div className="relative z-10 flex flex-col items-center mb-16">
              <div
                className={`border-2 rounded-xl p-5 mb-3 backdrop-blur-md ${isOnline(statuses.main) ? "bg-indigo-900/40 border-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.4)]" : "bg-gray-900 border-gray-700"}`}
              >
                <Icons.Brain
                  className={
                    isOnline(statuses.main)
                      ? "text-indigo-300 w-8 h-8"
                      : "text-gray-600 w-8 h-8"
                  }
                />
              </div>
              <h3 className="text-sm font-bold text-gray-100 bg-[#080c17] px-2">
                Central Model
              </h3>
              <p className="text-[10px] text-gray-500 font-mono mb-2 bg-[#080c17] px-2">
                Port 5000
              </p>
              <StatusBadge status={statuses.main} />
            </div>

            {/* Client Nodes */}
            <div className="w-full flex justify-around relative z-10 px-4 sm:px-12">
              {/* Campus 1 */}
              <div className="flex flex-col items-center">
                <div
                  className={`border-2 rounded-xl p-4 mb-3 backdrop-blur-md ${isOnline(statuses.campus1) ? "bg-indigo-900/20 border-indigo-400/50 shadow-[0_0_15px_rgba(79,70,229,0.2)]" : "bg-gray-900 border-gray-800"}`}
                >
                  <Icons.Server
                    className={
                      isOnline(statuses.campus1)
                        ? "text-indigo-400"
                        : "text-gray-600"
                    }
                  />
                </div>
                <h3 className="text-sm font-bold text-gray-200 bg-[#080c17] px-2">
                  Campus 1
                </h3>
                <p className="text-[10px] text-gray-500 font-mono mb-2 bg-[#080c17] px-2">
                  Port 5001
                </p>
                <StatusBadge status={statuses.campus1} />
              </div>

              {/* Campus 2 */}
              <div className="flex flex-col items-center">
                <div
                  className={`border-2 rounded-xl p-4 mb-3 backdrop-blur-md ${isOnline(statuses.campus2) ? "bg-indigo-900/20 border-indigo-400/50 shadow-[0_0_15px_rgba(79,70,229,0.2)]" : "bg-gray-900 border-gray-800"}`}
                >
                  <Icons.Server
                    className={
                      isOnline(statuses.campus2)
                        ? "text-indigo-400"
                        : "text-gray-600"
                    }
                  />
                </div>
                <h3 className="text-sm font-bold text-gray-200 bg-[#080c17] px-2">
                  Campus 2
                </h3>
                <p className="text-[10px] text-gray-500 font-mono mb-2 bg-[#080c17] px-2">
                  Port 5002
                </p>
                <StatusBadge status={statuses.campus2} />
              </div>
            </div>
          </div>
        </div>

        {/* MODEL HISTORY TIMELINE */}
        <div className="bg-linear-to-b from-[#0e1526] to-[#080c17] border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-100 mb-6 flex items-center gap-2">
            <Icons.Brain className="text-indigo-400" /> Aggregation History
          </h2>

          <div className="relative border-l-2 border-indigo-900/50 ml-3 space-y-8 mt-4">
            {/* Latest Update */}
            <div className="relative pl-6">
              <span className="absolute -left-2.25 top-1.5 w-4 h-4 rounded-full bg-indigo-500 border-4 border-[#0e1526] shadow-[0_0_10px_rgba(79,70,229,0.5)]"></span>
              <h3 className="text-indigo-300 font-bold text-sm tracking-wide">
                {metrics.version} Synced
              </h3>
              <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                Global weights successfully distributed to all active edge
                nodes.
              </p>
              <div className="mt-2 inline-block bg-gray-900/80 border border-gray-800 px-2 py-1 rounded text-[10px] font-mono text-gray-500">
                {metrics.lastSync}
              </div>
            </div>

            {/* Previous State */}
            <div className="relative pl-6 opacity-60">
              <span className="absolute -left-1.75 top-1.5 w-3 h-3 rounded-full bg-gray-600 border-2 border-[#0e1526]"></span>
              <h3 className="text-gray-300 font-medium text-sm">
                Awaiting Next Round
              </h3>
              <p className="text-gray-500 text-xs mt-1">
                Local models currently training...
              </p>
            </div>

            {/* Initial Boot */}
            <div className="relative pl-6 opacity-40">
              <span className="absolute -left-1.75 top-1.5 w-3 h-3 rounded-full bg-gray-700 border-2 border-[#0e1526]"></span>
              <h3 className="text-gray-400 font-medium text-sm">
                Initial System Boot
              </h3>
              <p className="text-gray-500 text-xs mt-1 font-mono">
                System Startup
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Required CSS for the dashed line animation on the network map */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes dash {
          to {
            stroke-dashoffset: -50;
          }
        }
      `,
        }}
      />
    </div>
  );
};

export default Overview;
