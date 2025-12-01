import React from "react";

interface MetricCardProps {
  title: string;
  value: string;
  description?: string;
}

export const AnalyticsMetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  description,
}) => {
  return (
    <div className="bg-white/10 p-4 rounded-lg shadow-md border border-white/20">
      <h3 className="text-sm font-medium text-gray-400">{title}</h3>
      <p className="text-2xl font-bold text-white">{value}</p>
      {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
    </div>
  );
};
