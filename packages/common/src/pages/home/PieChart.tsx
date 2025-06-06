"use client";

import dynamic from "next/dynamic";
import { PieChartProps } from "@rever/types";
import { overviewOptions } from "@rever/constants";
import { PageLoader, SelectComponent } from "@rever/common";
import { useSidebarStore } from "@rever/stores";
import { formatNumber } from "@rever/utils";
import { useUserStore } from "@rever/stores";
import { useMemo } from "react";

// Dynamically import the Chart component from react-apexcharts (client-side only)
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Function to display Graphs - based on type ("bar", "radialBar")
const PieChart = ({
  heading,
  barChartFilter,
  setBarChartFilter,
  radialSeries,
  totalAmount = "0",
  isDataLoading,
}: PieChartProps) => {
  // Get sidebar collapsed state from store
  const sidebarCollapsed = useSidebarStore((state) => state.isCollapsed);
  const orgDetails = useUserStore((state) => state.user?.organization);

  // ApexCharts options for radial (donut) chart
  const radialOptions = useMemo<ApexCharts.ApexOptions>(
    () => ({
      chart: {
        type: "donut",
        height: 400,
        stacked: true,
      },
      labels: ["Under review", "Under approval", "Approved"],
      colors: ["#916AFC", "#FDA759", "#5CC08D"],
      plotOptions: {
        pie: {
          startAngle: -90,
          endAngle: 90,
          offsetY: 20,
          expandOnClick: true,
          donut: {
            size: "60%",
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: "14px",
                fontWeight: 600,
                color: "#333",
                formatter: function () {
                  return `Total Amount`;
                },
              },
              value: {
                show: true,
                fontSize: "18px",
                fontWeight: 700,
                color: "#333",
                formatter: function () {
                  return `${formatNumber(totalAmount, orgDetails?.currency)}`;
                },
              },
              total: {
                show: true,
                formatter: function () {
                  return `${formatNumber(totalAmount, orgDetails?.currency)}`;
                },
                label: "Total Amount",
                fontSize: "14px",
                fontWeight: "500",
                color: "#333",
              },
            },
          },
        },
      },
      states: {
        hover: {
          filter: {
            type: "none",
          },
        },
        active: {
          filter: {
            type: "none",
          },
        },
      },
      stroke: {
        show: true,
        curve: "smooth",
        width: 5,
        lineCap: "round",
        colors: ["#fff"],
      },
      dataLabels: {
        enabled: false,
      },
      legend: {
        show: true,
        position: "bottom",
        horizontalAlign: "center",
        fontSize: "14px",
        formatter: function (seriesName, opts) {
          const color = opts.w.globals.colors[opts.seriesIndex];
          const value = opts.w.globals.series[opts.seriesIndex];
          return `
        <div style="display: flex; align-items: start; gap: 10px;">
          <div style="
          width: 16px;
          margin-top: 4px;
          height: 7px;
          background: ${color};
          border-radius: 4px;
        "></div>
          <div style="display: flex; flex-direction: column; align-items: flex-start;">
            <span style="font-weight: 500; color: #1E293B; margin-bottom: 4px">${seriesName}</span>
            <span style="color: #1E293B; font-weight: 600;">${value}%</span>
          </div>
        `;
        },
        markers: {
          size: 0,
        },
        itemMargin: {
          horizontal: 20,
        },
      },
      tooltip: {
        enabled: true,
        style: {
          fontSize: "16px",
        },
        custom: function ({ series, seriesIndex, w }) {
          const label = w.globals.labels[seriesIndex];
          const value = series[seriesIndex];
          return `
        <div style="
          padding: 10px 12px;
          background: white;
          border: 2px solid ${w.globals.colors[seriesIndex]};
          border-radius: 5px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          color: #333;
        ">
          <div style="
            display: flex;
            align-items: center;
            flex-direction: column;
            justify-content: center;
            justify-items: center;
            width: 100%;
          ">
            <p style="color: ${w.globals.colors[seriesIndex]}; font-weight:700;">
              ${label}
            </p>
            <p style="text-align: center;">${value}%</p>
          </div>
        </div>`;
        },
      },
    }),
    [orgDetails?.currency, totalAmount],
  );

  return (
    <>
      {/* Card container */}
      <div className="rounded-md shadow-4xl min-h-96 p-5 pb-0 pr-0">
        {/* Header: Title and filter dropdown */}
        <div className="flex items-center justify-between pr-5">
          <p className="font-semibold text-slate-800">{heading}</p>
          <div className="w-40">
            <SelectComponent
              options={overviewOptions}
              value={barChartFilter}
              onChange={(e) => setBarChartFilter?.(e)}
            />
          </div>
        </div>

        {/* Render radial (donut) chart if type is "radialBar" */}

        <div
          className={`transition-all grid sm:place-self-center duration-300 overflow-x-auto sm:overflow-visible custom_scrollbar ${
            sidebarCollapsed ? "sm:w-[calc(100%-80px)]" : "w-[calc(100%)]"
          }`}
        >
          {isDataLoading ? (
            <PageLoader />
          ) : (
            <div className="h-96 min-h-96">
              <Chart
                options={radialOptions}
                series={radialSeries}
                type="donut"
                height={350}
                key={`${radialSeries.join("-")}-${totalAmount}`}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PieChart;
