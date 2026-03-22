import { Link, useLocation } from "react-router-dom";
import { Icons } from "./Icons";

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();

  const navItems = [
    { name: "Overview", path: "/", icon: Icons.Dashboard },
    { name: "Central Model", path: "/main", icon: Icons.Cloud },
    { name: "Campus 1", path: "/campus-1", icon: Icons.Server },
    { name: "Campus 2", path: "/campus-2", icon: Icons.Server },
    { name: "Evaluation Results", path: "/evaluation", icon: Icons.Chart },
  ];

  return (
    <aside
      className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-gray-950 border-r border-gray-800 flex flex-col z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      }`}
    >
      <div className="p-6 md:p-8 flex justify-between items-center border-b border-gray-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-8 rounded-lg shadow-lg flex items-center justify-center">
            <img src="/logo.svg" alt="logo" className="w-10 h-10" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-100 leading-tight">
            Federated <br className="hidden md:block" />
            <span className="text-indigo-400">Learning</span>
          </h2>
        </div>

        {/* Close Button (Mobile Only) */}
        <button
          onClick={() => setIsOpen(false)}
          className="md:hidden text-gray-500 hover:text-gray-300 p-1"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              // Close the mobile drawer when a link is clicked
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                isActive
                  ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-inner"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-900"
              }`}
            >
              <item.icon />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
