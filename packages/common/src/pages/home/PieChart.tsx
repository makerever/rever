// Pie Chart component to display a donut chart with custom styling and tooltips

"use client";

import dynamic from "next/dynamic";
import { PieChartProps } from "@rever/types";
import { CustomTooltip, PageLoader, SelectComponent } from "@rever/common";
import { useSidebarStore } from "@rever/stores";
import { useState, useRef, useMemo, useCallback } from "react";
import { Info } from "lucide-react";
import { overviewOptions } from "@rever/constants";

// Dynamically import ApexCharts to prevent SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Constants for chart styling
const CHART_CONFIG = {
  DONUT_SIZE: "65%",
  STROKE_WIDTH: 6,
  STROKE_COLOR: "#fff",
  FONT_FAMILY: "Geist",
  LEGEND_FONT_SIZE: "14px",
  TOOLTIP_FONT_SIZE: "16px",
  DEFAULT_BORDER_COLOR: "#666666",
} as const;

// Map of chart labels to keys for callback
const CHART_LABEL_KEYS = {
  "Under review": "underReview",
  "Under approval": "underApproval",
  Approved: "approved",
  Rejected: "rejected",
  "Ledger entry": "posted",
} as const;

const PieChart = ({
  heading,
  series,
  labels,
  colors,
  isDataLoading,
  onSliceClick,
  isSelected,
  isTooltip,
  barChartFilter,
  setBarChartFilter,
  billAllData,
  chartHeight,
}: PieChartProps) => {
  // Sidebar collapsed state to calculate responsive chart width
  const sidebarCollapsed = useSidebarStore((state) => state.isCollapsed);

  // Track selected slice index for click logic; _ prefix avoids lint warning
  const [_selectedSliceIndex, setSelectedSliceIndex] = useState<number | null>(
    null,
  );

  // Prevent rapid multiple clicks while ApexCharts is updating
  const isUpdatingRef = useRef(false);

  // This ensures legends only show for visible pie slices
  const filteredData = useMemo(() => {
    const filtered = series.reduce<{
      series: number[];
      labels: string[];
      colors: string[];
      originalIndices: number[]; // Track original indices for click handling
    }>(
      (acc, value, index) => {
        // Only include items with non-zero values
        if (value > 0) {
          acc.series.push(value);
          acc.labels.push(labels[index]);
          acc.colors.push(colors[index]);
          acc.originalIndices.push(index);
        }
        return acc;
      },
      { series: [], labels: [], colors: [], originalIndices: [] },
    );
    return filtered;
  }, [series, labels, colors]);

  const {
    series: filteredSeries,
    labels: filteredLabels,
    colors: filteredColors,
    originalIndices,
  } = filteredData;

  // Custom legend formatter for consistent styling
  const generateLegendItem = useCallback(
    (seriesName: string, opts: any): string => {
      const backgroundColor = opts.w.globals.colors[opts.seriesIndex];
      return `
      <div style="display:flex;align-items:center;gap:6px;white-space:nowrap;">
        <div style="
          width:12px;
          height:12px;
          background:${backgroundColor};
          border-radius:50%;
          flex-shrink:0;
        "></div>
        <span style="
          font-weight:500;
          color:#0E1010;
          font-size:12px;
        ">${seriesName}</span>
      </div>`;
    },
    [],
  );

  // Custom tooltip formatter for enhanced display
  const generateCustomTooltip = useCallback(
    ({ series, seriesIndex, w }: any) => {
      const label = w.globals.labels[seriesIndex];
      const value = series[seriesIndex];

      return `
        <div style="padding:8px; background: white; font-size: 12px;">
          <p style="
            color: #0E1010; 
            font-weight: 600;
            margin: 0 0 2px 0;
          ">${label}</p>
          <p style="
            font-weight: 500; 
            color: #738184;
            margin: 0;
          ">${value} bills</p>
      </div>`;
    },
    [],
  );

  const handleDataPointSelection = useCallback(
    (event: any, chartContext: any, config: any) => {
      if (isUpdatingRef.current) return; // prevent rapid clicks

      const index = config.dataPointIndex;
      if (index !== -1) {
        isUpdatingRef.current = true;

        // Delay to allow ApexCharts DOM updates
        setTimeout(() => {
          setSelectedSliceIndex((prev) => (prev === index ? null : index));

          // Map filtered index back to original index
          const originalIndex = originalIndices[index];
          const label = labels[originalIndex];

          if (onSliceClick && label in CHART_LABEL_KEYS) {
            onSliceClick(
              CHART_LABEL_KEYS[label as keyof typeof CHART_LABEL_KEYS],
            );
          }

          isUpdatingRef.current = false;
        }, 0);
      }
    },
    [originalIndices, labels, onSliceClick],
  );

  const chartOptions = useMemo<ApexCharts.ApexOptions>(
    () => ({
      chart: {
        type: "donut",
        height: 400,
        fontFamily: CHART_CONFIG.FONT_FAMILY,
        animations: {
          enabled: true, // Can be set to false for better performance if not needed
          speed: 800,
        },
        events: {
          dataPointSelection: handleDataPointSelection,
        },
      },
      labels: filteredLabels,
      colors: filteredColors,
      plotOptions: {
        pie: {
          expandOnClick: false,
          donut: { size: CHART_CONFIG.DONUT_SIZE },
        },
      },
      states: {
        hover: { filter: { type: "none" } },
        active: {
          allowMultipleDataPointsSelection: false,
          filter: { type: "none" },
        },
      },
      stroke: {
        show: true,
        width: CHART_CONFIG.STROKE_WIDTH,
        colors: [CHART_CONFIG.STROKE_COLOR],
      },
      dataLabels: { enabled: false },
      legend: {
        show: true,
        position: "bottom",
        horizontalAlign: "center",
        fontSize: CHART_CONFIG.LEGEND_FONT_SIZE,
        fontFamily: CHART_CONFIG.FONT_FAMILY,
        formatter: generateLegendItem,
        markers: { size: 0 },
        itemMargin: { horizontal: 16, vertical: 4 },
      },
      tooltip: {
        enabled: true,
        style: { fontSize: CHART_CONFIG.TOOLTIP_FONT_SIZE },
        custom: generateCustomTooltip,
      },
    }),
    [
      filteredLabels,
      filteredColors,
      handleDataPointSelection,
      generateLegendItem,
      generateCustomTooltip,
    ],
  );

  // Compute responsive width once
  const chartContainerWidth = useMemo(
    () => (sidebarCollapsed ? "sm:w-[calc(100%-80px)]" : "w-[calc(100%)]"),
    [sidebarCollapsed],
  );

  // Memoize chart key to prevent unnecessary re-renders
  const chartKey = useMemo(() => `pie-chart-${series.join("-")}`, [series]);

  return (
    <div
      className={`rounded-[20px] p-4 bg-white border ${isSelected ? "border-primary-600 dashboard-card-active-shadow" : "border-secondary-200"}`}
    >
      {/* Header with title and optional tooltip */}

      <div className="flex items-center justify-between">
        <p className="text-neutral-1100 font-medium text-xl">{heading}</p>
        {barChartFilter ? (
          <div className="w-40">
            <SelectComponent
              options={overviewOptions}
              value={barChartFilter}
              onChange={(e) => setBarChartFilter?.(e)}
            />
          </div>
        ) : null}
        {isTooltip && (
          <CustomTooltip
            content={
              <div>
                Bills segregated by their current <br /> stage in the approval
                workflow
              </div>
            }
            side="top"
          >
            <Info className="text-slate-500" width={16} />
          </CustomTooltip>
        )}
      </div>

      {/* Chart container */}
      <div
        className={`transition-all grid sm:place-self-center duration-300 overflow-x-auto sm:overflow-visible custom_scrollbar ${chartContainerWidth}`}
      >
        {isDataLoading ? (
          <PageLoader
            className={`${chartHeight ? chartHeight : "h-71.5 min-h-71.5"}`}
          />
        ) : (
          <div
            className={`${chartHeight ? chartHeight : "h-71.5 min-h-71.5"} flex justify-center items-center`}
          >
            <Chart
              options={chartOptions}
              series={filteredSeries}
              type="donut"
              height={chartHeight ? 275 : 300}
              key={chartKey} // ensures re-render on series change
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PieChart;