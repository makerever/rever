"use client";

import dynamic from "next/dynamic";
import { BarChartProps } from "@rever/types";
import { barChartOptions } from "@rever/constants";
import { SelectComponent } from "@rever/common";
import { useSidebarStore } from "@rever/stores";
import { formatNumber } from "@rever/utils";
import { useUserStore } from "@rever/stores";
import { memo } from "react";
import React from "react";

// Dynamically import the Chart component from react-apexcharts (client-side only)
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Function to display Graphs - based on type ("bar", "radialBar")
function BarChart({
  heading,
  months,
  years,
  totalAmount,
  totalBills,
  barChartFilter,
  setBarChartFilter,
}: BarChartProps) {
  // Get sidebar collapsed state from store
  const sidebarCollapsed = useSidebarStore((state) => state.isCollapsed);
  const orgDetails = useUserStore((state) => state.user?.organization);
  // Data for bar chart
  const barSeries = [
    {
      name: "Bills",
      data: totalAmount,
    },
  ];

  const [windowWidth, setWindowWidth] = React.useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 1024,
  );

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ApexCharts options for bar chart
  const barOptions: ApexCharts.ApexOptions = {
    chart: {
      type: "bar",
      height: 350,
      toolbar: {
        show: false,
      },
    },
    grid: {
      show: false,
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
    plotOptions: {
      bar: {
        horizontal: false,
        // columnWidth: months.length <= 4 ? "35%" : "75%",
        columnWidth:
          windowWidth < 450
            ? "90%" // wider bars for small screens
            : months.length <= 4
              ? "35%"
              : months.length > 4 && months.length <= 6
                ? "55%"
                : "75%",
        borderRadius: 4,
        barHeight: "100%",
      },
    },
    dataLabels: {
      enabled: false,
      style: {
        fontFamily: "Inter",
      },
    },
    xaxis: {
      categories: months.map((_, i) => i),
      labels: {
        formatter: function (val: string) {
          const idx = Number(val);
          const mon = months[idx]?.slice(0, 3) ?? "";
          const yr = years[idx] ? String(years[idx]) : "";
          const labelValue = windowWidth > 500 ? [mon, yr] : [mon + ", " + yr];
          return labelValue;
        },
        style: {
          fontFamily: "Inter",
          colors: "#71717A",
          fontSize: windowWidth < 450 ? "10px" : "12px",
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
      crosshairs: { show: false },
    },
    yaxis: {
      labels: {
        style: {
          fontFamily: "Inter",
          colors: "#71717A",
        },
        formatter: function (val: number) {
          return formatNumber(
            Math.round(val).toString(),
            orgDetails?.currency,
            undefined,
            true,
          ); // or use parseInt(val).toString() for whole numbers
        },
      },
    },
    fill: {
      type: "gradient",
      gradient: {
        shade: "light",
        type: "vertical",
        shadeIntensity: 0.5,
        gradientToColors: ["#BFD9F6"], // end color
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 0.9,
        stops: [0, 100],
      },
    },
    colors: ["#60A8FB"], // start color
    tooltip: {
      custom: function ({ series, seriesIndex, dataPointIndex }) {
        const bills = totalBills[dataPointIndex];
        const amount = series[seriesIndex][dataPointIndex];
        const month = months[dataPointIndex];
        const year = years[dataPointIndex];
        return `
          <div style="
            background: white;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            color: #333;
          ">
            <div 
              style="display: flex;
              align-items: center;
              flex-direction: column;
              justify-content: center;
              justify-items: center;
              width: 100%;
            ">
              <div style="padding:8px;background:#f2f3f2;width:100%;text-align:center">${month}, ${year}</div>
              <div style="padding:8px;">
                <div><strong>Bills:</strong> ${bills}</div>
                <div><strong>Total Amt:</strong> ${formatNumber(
                  amount,
                  orgDetails?.currency,
                )}</div>
              </div>
            </div>
          </div>
        `;
      },
    },
  };

  return (
    <>
      {/* Card container */}
      <div className="rounded-md shadow-4xl min-h-96">
        {/* Header: Title and filter dropdown */}
        <div className="flex items-center justify-between px-5 sm:pr-5 pt-5">
          <p className="font-semibold text-slate-800">{heading}</p>
          <div className="w-40">
            <SelectComponent
              options={barChartOptions}
              value={barChartFilter}
              onChange={(e) => setBarChartFilter?.(e)}
            />
          </div>
        </div>
        {/* Render bar chart if type is "bar" */}

        <div
          className={`transition-all grid sm:place-self-center duration-300 ${windowWidth > 450 ? "px-5" : "pr-5"}  md:pl-5 overflow-x-auto sm:overflow-visible custom_scrollbar ${
            sidebarCollapsed ? "sm:w-[calc(100%-80px)]" : "w-[100%]"
          }`}
        >
          <Chart
            options={barOptions}
            series={barSeries}
            type="bar"
            height={350}
          />
        </div>
      </div>
    </>
  );
}

export default memo(BarChart);
