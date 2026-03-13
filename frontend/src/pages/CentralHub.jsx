import React, { useState, useEffect } from "react";
import axios from "axios";
// Make sure these paths are correct for your project structure
import { Icons } from "../components/Icons";
import StatusBadge from "../components/StatusBadge";
import AppLayout from "../components/AppLayout";

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

  // NEW: Track what the Hub already has saved on the hard drive
  const [hubModelsPresent, setHubModelsPresent] = useState({
    campus1: false,
    campus2: false,
  });

  // 1. Initial State Load
  useEffect(() => {
    const fetchData = async () => {
      // A. Check Campus Nodes Status
      try {
        const ports = { campus1: 5001, campus2: 5002 };
        for (const [key, port] of Object.entries(ports)) {
          try {
            await axios.get(`http://127.0.0.1:${port}/api/status`);
            setStatuses((prev) => ({ ...prev, [key]: "Online" }));
          } catch {
            setStatuses((prev) => ({ ...prev, [key]: "Offline" }));
          }
        }
      } catch (err) {
        setRetrievalStatus("Error fetching network status.");
      }

      // B. NEW: Check Hub Status for existing files
      try {
        const hubRes = await axios.get("http://localhost:5000/api/status");
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
        `http://localhost:5000/api/retrieve_local_model/${campusId}`,
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
      const res = await axios.get("http://localhost:5000/api/aggregate_models");

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
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto space-y-12">
      {/* HEADER AND RETRIEVAL SECTION */}
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-100">
          Central Aggregation Hub
        </h1>
        <p className="text-gray-500 max-w-md">
          This node is responsible for receiving parameters from Campus 1 and
          Campus 2 to update the global RFC model.
        </p>

        <div className="flex items-center gap-6">
          <div className="bg-gray-900 p-5 rounded-xl flex items-center gap-4 flex-1">
            <h2 className="text-gray-100 font-medium text-lg">
              Hospital 1 Node
            </h2>
            <StatusBadge status={statuses.campus1} />
            <button
              onClick={() => retrieveLocalModel("1")}
              disabled={loading1}
              className="bg-rose-600/90 text-white font-semibold py-3 px-8 rounded-xl disabled:opacity-50 flex items-center gap-2"
            >
              {loading1 ? "Pulling..." : "Retrieve Model - Hospital 1"}
            </button>
          </div>

          <div className="bg-gray-900 p-5 rounded-xl flex items-center gap-4 flex-1">
            <h2 className="text-gray-100 font-medium text-lg">
              Hospital 2 Node
            </h2>
            <StatusBadge status={statuses.campus2} />
            <button
              onClick={() => retrieveLocalModel("2")}
              disabled={loading2}
              className="bg-rose-600/90 text-white font-semibold py-3 px-8 rounded-xl disabled:opacity-50 flex items-center gap-2"
            >
              {loading2 ? "Pulling..." : "Retrieve Model - Hospital 2"}
            </button>
          </div>
        </div>

        {retrievalStatus && (
          <div className="bg-emerald-600/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl text-sm italic font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            {retrievalStatus}
          </div>
        )}
      </div>

      {/* STORAGE STATUS TABLE */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-200">
          Local Model Storage Status
        </h2>
        <div className="bg-gray-900/50 rounded-2xl border border-gray-800 overflow-hidden shadow-lg">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs text-gray-400 bg-gray-950 uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium">
                  Node
                </th>
                <th scope="col" className="px-6 py-4 font-medium">
                  Network Status
                </th>
                <th scope="col" className="px-6 py-4 font-medium">
                  Model File
                </th>
                <th scope="col" className="px-6 py-4 font-medium">
                  Stored Locally (on Hub)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {[
                {
                  node: "Hospital 1",
                  status: statuses.campus1,
                  file: "local_model_campus1.pkl",
                  isStored: hasModel1, // Smart variable!
                },
                {
                  node: "Hospital 2",
                  status: statuses.campus2,
                  file: "local_model_campus2.pkl",
                  isStored: hasModel2, // Smart variable!
                },
              ].map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-gray-800/30 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-gray-100">
                    {row.node}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-6 py-4 font-mono text-gray-300">
                    {row.file}
                  </td>
                  <td
                    className={`px-6 py-4 font-medium ${row.isStored ? "text-emerald-400" : "text-rose-300"}`}
                  >
                    {row.isStored ? "Yes" : "No"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AGGREGATION SECTION */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-200">
          Federated Averaging (FedAvg)
        </h2>
        {isReadyForFedAvg ? (
          <div className="bg-gray-900 p-6 rounded-xl space-y-4">
            <p className="text-gray-400 font-mono text-xs">
              READY FOR AGGREGATION. Perform aggregation to update the global
              model.
            </p>
            <button
              onClick={performAggregation}
              disabled={isAggregating}
              className="bg-rose-600 hover:bg-rose-500 text-white font-semibold py-3 px-8 rounded-xl disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isAggregating
                ? "Aggregating Trees..."
                : "Perform Federated Averaging"}
            </button>
          </div>
        ) : (
          <div className="bg-indigo-600/10 border border-indigo-500/30 text-indigo-300 p-4 rounded-xl text-sm italic font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            Retrieve models from both Hospital 1 and Hospital 2 before
            aggregating.
          </div>
        )}

        {aggregationLogs.length > 0 && (
          <div className="bg-[#050b14] rounded-xl p-6 font-mono text-sm h-40 overflow-y-auto border border-gray-800/80 text-emerald-400/90 shadow-inner mt-4">
            {aggregationLogs.map((log, i) => (
              <div
                key={i}
                className={`mb-2 ${log.includes("[ERROR]") ? "text-rose-400" : ""} ${log.includes("[SUCCESS]") ? "text-emerald-400 font-bold" : ""}`}
              >
                {log}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CentralHub;
