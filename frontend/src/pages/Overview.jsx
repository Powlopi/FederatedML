import { useState, useEffect } from "react";
import axios from "axios";
import { Icons } from "../components/Icons";
import MetricCard from "../components/MetricCard";
import StatusBadge from "../components/StatusBadge";

// --- PAGE: NETWORK OVERVIEW ---
const Overview = () => {
  const [statuses, setStatuses] = useState({
    main: "Checking...",
    campus1: "Checking...",
    campus2: "Checking...",
  });

  useEffect(() => {
    const check = async () => {
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
    check();
  }, []);

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* Metrics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <MetricCard
          title="Global Model"
          value="RFC v1.0"
          IconComponent={Icons.Brain}
        />
        <MetricCard
          title="Avg. Accuracy"
          value="69.83%"
          IconComponent={Icons.Chart}
        />
        <MetricCard
          title="Global F1 Score"
          value="0.52"
          IconComponent={Icons.CheckCircle}
        />
        <MetricCard
          title="Active Nodes"
          value={
            Object.values(statuses).filter((s) => s === "Online").length + "/3"
          }
          IconComponent={Icons.Server}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Node Status (Static Display) */}
        <div className="lg:col-span-2 bg-gray-900/30 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-100 mb-6 flex items-center gap-2">
            <Icons.Server /> Network Node Status
          </h2>
          <div className="space-y-4">
            {[
              {
                id: "Cloud",
                name: "Central Model",
                desc: "Port 5000 • Central Node",
                status: statuses.main,
              },
              {
                id: "Campus 1",
                name: "Campus 1 Dataset",
                desc: "Port 5001 • Local Node",
                status: statuses.campus1,
              },
              {
                id: "Campus 2",
                name: "Campus 2 Dataset",
                desc: "Port 5002 • Local Node",
                status: statuses.campus2,
              },
            ].map((node) => (
              <div
                key={node.id}
                className="bg-gray-950/50 border border-gray-800/60 p-5 rounded-xl flex justify-between items-center"
              >
                <div>
                  <h3 className="text-gray-200 font-medium">{node.name}</h3>
                  <p className="text-gray-500 text-xs mt-1 font-mono">
                    {node.desc}
                  </p>
                </div>
                <StatusBadge status={node.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Model History */}
        <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-100 mb-6 flex items-center gap-2">
            <Icons.Brain /> Aggregation History
          </h2>
          <div className="relative border-l border-gray-800 ml-3 space-y-8">
            <div className="relative pl-6">
              <span className="absolute -left-1.25 top-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-gray-900"></span>
              <h3 className="text-gray-300 font-medium text-sm">
                RFC Main Model Synced
              </h3>
              <p className="text-gray-500 text-xs mt-1">
                March 10, 2026 • 14:30 PM
              </p>
            </div>
            <div className="relative pl-6 opacity-50">
              <span className="absolute -left-1.25 top-1.5 w-2 h-2 rounded-full bg-gray-600 ring-4 ring-gray-900"></span>
              <h3 className="text-gray-400 font-medium text-sm">
                Initial System Boot
              </h3>
              <p className="text-gray-500 text-xs mt-1">
                March 10, 2026 • 10:00 AM
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
