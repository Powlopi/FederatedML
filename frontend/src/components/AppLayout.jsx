import Sidebar from "./Sidebar";

const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 font-sans flex flex-col md:flex-row selection:bg-indigo-500/30">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="w-full bg-gray-900/40 backdrop-blur-md border-b border-gray-800 p-6 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h1 className="text-3xl font-semibold text-gray-100">
              System Dashboard
            </h1>
            <p className="text-l text-gray-500 mt-1">
              Federated Learning Architecture
            </p>
          </div>
          <div className="text-xs font-mono bg-gray-950 px-3 py-1.5 rounded-lg border border-gray-800 text-gray-400">
            ENV: LOCAL_DEV
          </div>
        </header>
        <div className="p-6 md:p-10 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
};

export default AppLayout;
