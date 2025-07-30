// This component is used to render chart on the home page

"use client";

import dynamic from "next/dynamic";
import { BarChartProps } from "@rever/types";
import { barChartOptions } from "@rever/constants";
import { SelectComponent } from "@rever/common";
import { useSidebarStore } from "@rever/stores";
import { formatNumber } from "@rever/utils";
import { useUserStore } from "@rever/stores";
import { memo } from "react";
import { PageLoader } from "@rever/common";
import React from "react";

// Dynamically import the Chart component
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

function AreaChart({
  heading,
  months,
  years,
  totalAmount,
  totalBills,
  barChartFilter,
  setBarChartFilter,
  isDataLoading,
}: BarChartProps) {
  const sidebarCollapsed = useSidebarStore((state) => state.isCollapsed);
  const orgDetails = useUserStore((state) => state.user?.organization);

  const areaSeries = [
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

  const areaOptions: ApexCharts.ApexOptions = {
    chart: {
      type: "area",
      height: 350,
      toolbar: {
        show: false,
      },
    },
    grid: {
      show: true,
      borderColor: "#E4E4E7",
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
    dataLabels: {
      enabled: false,
      style: {
        fontFamily: "Inter",
      },
    },
    stroke: {
      curve: "smooth",
      width: 2,
    },
    fill: {
      type: "gradient",
      gradient: {
        shade: "light",
        type: "vertical",
        shadeIntensity: 0.5,
        gradientToColors: ["#916AFC"],
        inverseColors: false,
        opacityFrom: 0.8,
        opacityTo: 0.3,
        stops: [0, 100],
      },
    },
    colors: ["#916AFC"],
    xaxis: {
      tooltip: {
        enabled: false,
      },
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
          );
        },
      },
    },
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
            <div style="display: flex; align-items: center; flex-direction: column; width: 100%;">
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
    <div className="rounded-md shadow-4xl min-h-96">
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

      <div
        className={`transition-all grid sm:place-self-center duration-300 ${
          windowWidth > 450 ? "px-5" : "pr-5"
        } md:pl-5 overflow-x-auto sm:overflow-visible custom_scrollbar ${
          sidebarCollapsed ? "sm:w-[calc(100%-80px)]" : "w-[100%]"
        }`}
      >
        {isDataLoading ? (
          <PageLoader />
        ) : (
          <div className="h-96 min-h-96">
            <Chart
              options={areaOptions}
              series={areaSeries}
              type="area"
              height={350}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(AreaChart);
