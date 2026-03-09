import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";
import axios from "axios";

// --- SHARED COMPONENTS ---
const StatusBadge = ({ status }) => (
  <span
    className={`px-3 py-1 rounded-full text-xs font-medium ${status.includes("Online") ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border border-rose-500/30"}`}
  >
    {status}
  </span>
);

// --- PAGE: NETWORK OVERVIEW (The "Upper Center" Home) ---
const Overview = () => {
  const [statuses, setStatuses] = useState({
    main: "Checking...",
    campus1: "Checking...",
    campus2: "Checking...",
  });

  const check = async () => {
    const ports = { main: 5000, campus1: 5001, campus2: 5002 };
    for (const [key, port] of Object.entries(ports)) {
      try {
        await axios.get(`http://127.0.0.1:${port}/api/status`);
        setStatuses((prev) => ({ ...prev, [key]: "Online 🟢" }));
      } catch {
        setStatuses((prev) => ({ ...prev, [key]: "Offline 🔴" }));
      }
    }
  };

  useEffect(() => {
    check();
  }, []);

  return (
    <div className="flex flex-col items-center pt-12 animate-in fade-in duration-700">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold bg-linear-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">
          Network Control
        </h1>
        <p className="text-gray-500 font-light italic">
          Select a node to manage local operations
        </p>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            name: "Central Cloud",
            path: "/cloud",
            color: "text-blue-400",
            status: statuses.main,
          },
          {
            name: "Campus 1",
            path: "/campus-1",
            color: "text-emerald-400",
            status: statuses.campus1,
          },
          {
            name: "Campus 2",
            path: "/campus-2",
            color: "text-emerald-400",
            status: statuses.campus2,
          },
        ].map((node) => (
          <Link
            to={node.path}
            key={node.name}
            className="group bg-gray-900/50 border border-gray-800 p-8 rounded-3xl hover:border-indigo-500/50 transition-all hover:shadow-[0_0_30px_-10px_rgba(99,102,241,0.3)]"
          >
            <h2 className={`text-2xl font-semibold mb-4 ${node.color}`}>
              {node.name}
            </h2>
            <StatusBadge status={node.status} />
            <div className="mt-6 text-xs text-gray-500 group-hover:text-indigo-400 transition-colors">
              Open Management →
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

// --- PAGE: CAMPUS TRAINING (Separate Route) ---
const CampusPage = ({ id, port }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const trainModel = async () => {
    setLoading(true);
    setLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] Starting Local Training...`,
    ]);
    try {
      // This will call your Flask route for training
      const res = await axios.post(`http://127.0.0.1:${port}/api/train`);
      setLogs((prev) => [...prev, `✅ ${res.data.message}`]);
    } catch (err) {
      setLogs((prev) => [...prev, `❌ Training Failed: ${err.message}`]);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto pt-10 animate-in slide-in-from-bottom-4 duration-500">
      <Link to="/" className="text-gray-500 hover:text-white mb-8 inline-block">
        ← Back to Network
      </Link>
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-10">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold text-emerald-400">
            Campus {id} Node
          </h1>
          <button
            onClick={trainModel}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg"
          >
            {loading ? "Training..." : "Run Local Training"}
          </button>
        </div>

        <div className="bg-black/50 rounded-2xl p-6 font-mono text-sm h-64 overflow-y-auto border border-gray-800 text-emerald-500/80">
          <div className="text-gray-600 mb-2 border-b border-gray-800 pb-2 uppercase tracking-widest text-[10px]">
            Local Execution Logs
          </div>
          {logs.map((log, i) => (
            <div key={i} className="mb-1">
              {log}
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-gray-700 italic">
              Ready for local computation...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#030712] text-gray-100 font-sans selection:bg-indigo-500/30">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/campus-1" element={<CampusPage id="1" port="5001" />} />
          <Route path="/campus-2" element={<CampusPage id="2" port="5002" />} />
          <Route
            path="/cloud"
            element={
              <div className="p-20 text-center">
                <Link to="/">Go Back</Link>
                <h1 className="text-4xl">
                  Cloud Aggregation Page (Coming Next)
                </h1>
              </div>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}
