import React from "react";

const MetricCard = ({ title, value, IconComponent }) => (
  <div className="bg-gray-900/60 border border-gray-800 p-6 rounded-2xl flex items-center justify-between hover:border-indigo-500/30 transition-colors">
    <div>
      <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
        {title}
      </h3>
      <p className="text-2xl font-bold text-gray-100 tracking-tight">{value}</p>
    </div>
    <div className="text-indigo-400 bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20">
      <IconComponent />
    </div>
  </div>
);

export default MetricCard;
