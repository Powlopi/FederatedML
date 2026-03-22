import { useState } from "react";
import Sidebar from "./Sidebar";

const AppLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="h-screen bg-[#030712] text-gray-100 font-sans flex overflow-hidden selection:bg-indigo-500/30">
      {/* NEW: Dark overlay background when sidebar is open on mobile */}
      {isSidebarOpen && (
        <div
          className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${
            isSidebarOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* RESPONSIVE HEADER */}
        <header className="shrink-0 w-full bg-gray-900/40 backdrop-blur-xl border-b border-gray-800/50 p-4 md:p-6 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-gray-400 hover:text-gray-100 bg-gray-800/50 rounded-lg border border-gray-700"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <div>
              <h1 className="text-xl md:text-3xl font-semibold text-gray-100 tracking-tight">
                System Dashboard
              </h1>
              {/* Hide subtitle on very small screens to save space */}
              <p className="text-xs md:text-sm text-gray-500 mt-1 hidden sm:block">
                Federated Learning Architecture
              </p>
            </div>
          </div>

          <div className="text-[10px] md:text-xs font-mono bg-gray-950 px-2 md:px-3 py-1.5 rounded-lg border border-gray-800 text-gray-400">
            <span className="hidden md:inline">ENV: </span>LOCAL
          </div>
        </header>

        <div className="flex-1 p-4 md:p-10 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
