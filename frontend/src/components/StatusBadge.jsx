import React from "react";

const StatusBadge = ({ status }) => {
  const isOnline = status === "Online";
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 w-max shadow-sm ${
        isOnline
          ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/30"
          : "text-rose-400 bg-rose-500/10 border border-rose-500/30"
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full animate-pulse ${isOnline ? "bg-emerald-400" : "bg-rose-400"}`}
      ></span>
      {isOnline ? "Online" : "Offline"}
    </span>
  );
};

export default StatusBadge;
