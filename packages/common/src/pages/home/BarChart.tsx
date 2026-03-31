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
import { useTranslate } from "@rever/i18n";

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
  const translate = useTranslate();
  const sidebarCollapsed = useSidebarStore((state) => state.isCollapsed);
  const orgDetails = useUserStore((state) => state.user?.organization);

  const areaSeries = [
    {
      name: translate("home.charts.bills"),
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
        fontFamily: "Geist",
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
        gradientToColors: ["#91EF62"],
        inverseColors: false,
        opacityFrom: 0.6,
        opacityTo: 0.1,
        stops: [0, 100],
      },
    },
    colors: ["#91EF62"],
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
          fontFamily: "Geist",
          colors: "#738184",
          fontSize: "12px",
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
      crosshairs: { show: false },
    },
    yaxis: {
      labels: {
        style: {
          fontFamily: "Geist",
          colors: "#738184",
          fontSize: "12px",
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
            font-family: Geist;
          ">
            <div style="padding: 6px; font-size: 12px; display: flex; align-items: center; flex-direction: column; width: 100%;">
              <p style="color: #0E1010; font-weight: 600;">${month}, ${year}: ${formatNumber(
                amount,
                orgDetails?.currency,
              )}</p>
              <p style="text-align: center; color: #738184; font-weight: 500; margin-top: 2px;">${bills} ${translate("home.charts.bills")}</p>
            </div>
          </div>
        `;
      },
    },
  };

  return (
    <div className="rounded-[20px] p-4 bg-white border border-secondary-200">
      <div className="flex items-center justify-between">
        <p className="text-neutral-1100 font-medium text-xl">{heading}</p>
        <div className="w-40">
          <SelectComponent
            options={barChartOptions.map((opt) => ({ ...opt, label: translate(`overview_options.${opt.value}`) }))}
            value={barChartFilter}
            onChange={(e) => setBarChartFilter?.(e)}
          />
        </div>
      </div>

      <div
        className={`transition-all grid sm:place-self-center duration-300 ${
          windowWidth > 450 ? "" : "pr-5"
        } overflow-x-auto sm:overflow-visible custom_scrollbar ${
          sidebarCollapsed ? "sm:w-[calc(100%-160px)]" : "w-full"
        }`}
      >
        {isDataLoading ? (
          <PageLoader className="h-71.5 min-h-71.5" />
        ) : (
          <div className="h-71.5 min-h-71.5">
            <Chart
              options={areaOptions}
              series={areaSeries}
              type="area"
              height={300}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(AreaChart);