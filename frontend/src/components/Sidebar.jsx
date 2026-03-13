import { Link, useLocation } from "react-router-dom";
import { Icons } from "./Icons";

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { name: "Overview", path: "/", icon: Icons.Dashboard },
    { name: "Central Model", path: "/main", icon: Icons.Cloud },
    { name: "Campus 1", path: "/campus-1", icon: Icons.Server },
    { name: "Campus 2", path: "/campus-2", icon: Icons.Server },
    { name: "Evaluation Results", path: "/evaluation", icon: Icons.Chart },
  ];

  return (
    <aside className="w-full md:w-72 bg-gray-950 border-b md:border-b-0 md:border-r border-gray-800 flex flex-col z-20">
      <div className="p-6 md:p-8 flex items-center gap-3 border-b border-gray-800/50">
        <div className="w-10 h-8 rounded-lg bg-linear-to-br shadow-lg flex items-center justify-center">
          <img src="/logo.svg" alt="logo" className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-100">
          Federated<p className="text-indigo-400 break-normal">Learning</p>
        </h2>
      </div>

      <nav className="flex-1 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
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
