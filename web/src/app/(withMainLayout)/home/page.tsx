// Renders Home page UI

"use client";

import {
  BarChart,
  Card,
  PageLoader,
  PieChart,
  SelectComponent,
} from "@rever/common";
import { barChartOptions, overviewOptions } from "@rever/constants";
import { getBarGraphDataAPI, getBillsSummaryApi } from "@rever/services";
import { barGraphDataType, barGraphStateDataType, Option } from "@rever/types";
import {
  CircleCheck,
  CircleDollarSign,
  FileCheck,
  FileClock,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { SingleValue } from "react-select";

// Home page main component
const Home = () => {
  // State for header filter dropdown
  const [headerFilter, setHeaderFilter] = useState<SingleValue<Option>>(
    overviewOptions[0]
  );

  // State for bar chart filter
  const [barChartFilter, setBarChartFilter] = useState<SingleValue<Option>>(
    barChartOptions[0]
  );

  // State for radial chart filter
  const [radialChartFilter, setRadialChartFilter] = useState<
    SingleValue<Option>
  >(overviewOptions[0]);

  // Loading state for the page
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBarChartLoading, setIsBarChartLoading] = useState<boolean>(true);
  const [isPieChartLoading, setIsPieChartLoading] = useState<boolean>(true);

  const [billSummaryData, setBillsSummaryData] = useState({
    total: {
      amount: 0,
      count: 0,
    },
    in_review: {
      amount: 0,
      count: 0,
    },
    under_approval: {
      amount: 0,
      count: 0,
    },
    approved: {
      amount: 0,
      count: 0,
    },
  });

  const [billStageSegregation, setBillStageSegregation] = useState([
    {
      amount: 0,
      count: 0,
    },
    {
      amount: 0,
      count: 0,
    },
    {
      amount: 0,
      count: 0,
    },
    {
      amount: 0,
      count: 0,
    },
    {
      amount: 0,
      count: 0,
    },
  ]);

  const [barGraphData, setBarGraphData] = useState<barGraphStateDataType>({
    months: [],
    years: [],
    totalAmount: [],
    totalBills: [],
  });

  const getBillsSummaryBarData = useCallback(
    async (filterKey: string | number, retries = 10) => {
      setIsBarChartLoading(true);
      const response = await getBarGraphDataAPI(filterKey);

      if (response.status === 200) {
        const data = Array.isArray(response?.data?.data)
          ? response?.data?.data?.reverse()
          : [];

        if (response?.data?.status === "processing" && retries > 0) {
          setTimeout(() => {
            getBillsSummaryBarData(filterKey, retries - 1);
          }, 1000);
        } else if (Array.isArray(data)) {
          setBarGraphData({
            months: data.map((item: barGraphDataType) => item?.month || ""),
            years: data.map((item: barGraphDataType) => item?.year || 0),
            totalAmount: data.map(
              (item: barGraphDataType) => item?.total_amount || 0
            ),
            totalBills: data.map(
              (item: barGraphDataType) => item?.total_count || 0
            ),
          });
          setIsLoading(false);
          setIsBarChartLoading(false);
        }
      } else {
        setBarGraphData({
          months: [],
          years: [],
          totalAmount: [],
          totalBills: [],
        });
        setIsLoading(false);
        setIsBarChartLoading(false);
      }
    },
    [setBarGraphData, setIsLoading, setIsBarChartLoading]
  );

  const getBillsSummaryCards = useCallback(
    async (filterKey: string | number) => {
      const response = await getBillsSummaryApi(filterKey);
      if (response?.data?.status === "processing") {
        getBillsSummaryCards(headerFilter?.value || "");
      }
      if (response?.status === 200) {
        const data = response?.data?.data;
        setBillsSummaryData({
          total: {
            amount: data?.total_amount || 0,
            count: data?.total_count || 0,
          },
          in_review: {
            amount: data?.by_status?.in_review?.total || 0,
            count: data?.by_status?.in_review?.count || 0,
          },
          under_approval: {
            amount: data?.by_status?.under_approval?.total || 0,
            count: data?.by_status?.under_approval?.count || 0,
          },
          approved: {
            amount: data?.by_status?.approved?.total || 0,
            count: data?.by_status?.approved?.count || 0,
          },
        });
        setIsLoading(false);
      }
    },
    [headerFilter?.value]
  );

  const getBillsSummaryPieData = useCallback(
    async (filterKey: string | number) => {
      setIsPieChartLoading(true);
      const response = await getBillsSummaryApi(filterKey);
      if (response?.data?.status === "processing") {
        getBillsSummaryPieData(radialChartFilter?.value || "");
      }
      if (response?.status === 200) {
        const data = response?.data?.data || {};

        // If valid data found, prepare pie chart percentage breakdown
        if (Object.keys(data).length > 0) {
          setBillStageSegregation([
            {
              amount: data?.by_status?.in_review?.total || 0,
              count: data?.by_status?.in_review?.count || 0,
            },
            {
              amount: data?.by_status?.under_approval?.total || 0,
              count: data?.by_status?.under_approval?.count || 0,
            },
            {
              amount: data?.by_status?.approved?.total || 0,
              count: data?.by_status?.approved?.count || 0,
            },
            {
              amount: data?.by_status?.rejected?.total || 0,
              count: data?.by_status?.rejected?.count || 0,
            },
            {
              amount: data?.by_status?.posted?.total || 0,
              count: data?.by_status?.posted?.count || 0,
            },
          ]);
          setIsPieChartLoading(false);
          setIsLoading(false);
        } else {
          setIsPieChartLoading(false);
        }
        setIsPieChartLoading(false);
        setIsLoading(false);
      }
    },
    [radialChartFilter?.value]
  );

  useEffect(() => {
    getBillsSummaryBarData(barChartFilter?.value || "");
  }, [barChartFilter, getBillsSummaryBarData]);

  useEffect(() => {
    getBillsSummaryCards(headerFilter?.value || "");
  }, [getBillsSummaryCards, headerFilter]);

  useEffect(() => {
    getBillsSummaryPieData(radialChartFilter?.value || "");
  }, [getBillsSummaryPieData, radialChartFilter]);

  return (
    <>
      <div className="rounded-b-[20px] bg-white p-4 h-28 border border-secondary-200 flex items-end justify-start">
        {/* Header section with overview title and filter */}
        <div className="flex items-center justify-between w-full h-8">
          <p className="text-neutral-1100 text-2xl font-medium">Overview</p>
          <div className="w-40">
            {/* Dropdown for overview filter */}
            <SelectComponent
              options={overviewOptions}
              value={headerFilter}
              onChange={(e) => {
                setHeaderFilter(e);
              }}
            />
          </div>
        </div>
      </div>

      {/* Show content only when not loading */}
      {isLoading ? (
        <PageLoader />
      ) : (
        <div className="lg:flex items-start">
          {/* Cards showing summary statistics */}
          <div className="lg:w-1/3">
            <Card
              heading="Total"
              icon={<CircleDollarSign width={20} />}
              value={billSummaryData?.total}
            />
            <Card
              heading="Under review"
              icon={<FileClock width={20} />}
              value={billSummaryData?.in_review}
            />
            <Card
              heading="Under approval"
              icon={<FileCheck width={20} />}
              value={billSummaryData?.under_approval}
            />
            <Card
              heading="Approved"
              icon={<CircleCheck width={20} />}
              value={billSummaryData?.approved}
            />
          </div>

          {/* Graphs section: Analytics (bar) and Insights (radial bar) */}
          <div className="lg:w-2/3">
            {/* Bar chart for analytics */}
            <BarChart
              heading="Total bills"
              months={barGraphData?.months}
              years={barGraphData?.years}
              totalAmount={barGraphData?.totalAmount}
              totalBills={barGraphData?.totalBills}
              barChartFilter={barChartFilter}
              setBarChartFilter={setBarChartFilter}
              isDataLoading={isBarChartLoading}
            />

            {/* Radial pie chart for insights */}
            <PieChart
              series={billStageSegregation.map((v) => v?.count)}
              billAllData={billStageSegregation}
              isDataLoading={isPieChartLoading}
              heading="Bills by stage"
              labels={[
                "Under review",
                "Under approval",
                "Approved",
                "Rejected",
                "Ledger entry",
              ]}
              colors={["#F5D670", "#79D7EC", "#AAD57B", "#E57C98", "#8582E5"]}
              barChartFilter={radialChartFilter}
              setBarChartFilter={setRadialChartFilter}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Home;
