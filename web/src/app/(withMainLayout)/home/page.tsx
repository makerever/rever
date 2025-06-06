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
import { useUserStore } from "@rever/stores";
import { barGraphDataType, barGraphStateDataType, Option } from "@rever/types";
import { formatNumber } from "@rever/utils";
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
    overviewOptions[0],
  );

  // State for bar chart filter
  const [barChartFilter, setBarChartFilter] = useState<SingleValue<Option>>(
    barChartOptions[0],
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
    total: 0,
    in_review: 0,
    under_approval: 0,
    approved: 0,
  });

  const [pieChartData, setPieChartData] = useState({
    total_amount: 0,
    series: [0, 0, 0] as number[],
  });

  const [barGraphData, setBarGraphData] = useState<barGraphStateDataType>({
    months: [],
    years: [],
    totalAmount: [],
    totalBills: [],
  });

  const orgDetails = useUserStore((state) => state.user?.organization);

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
              (item: barGraphDataType) => item?.total_amount || 0,
            ),
            totalBills: data.map(
              (item: barGraphDataType) => item?.total_count || 0,
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
    [setBarGraphData, setIsLoading, setIsBarChartLoading],
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
          total: data?.total_amount || 0,
          in_review: data?.by_status?.in_review?.total || 0,
          under_approval: data?.by_status?.under_approval?.total || 0,
          approved: data?.by_status?.approved?.total || 0,
        });
        setIsLoading(false);
      }
    },
    [headerFilter?.value],
  );

  const getBillsSummaryPieData = useCallback(
    async (filterKey: string | number) => {
      setIsPieChartLoading(true);
      const response = await getBillsSummaryApi(filterKey);
      if (response?.data?.status === "processing") {
        getBillsSummaryPieData(radialChartFilter?.value || "");
      }
      if (response?.status === 200) {
        const data = response?.data?.data;
        const total = data?.total_amount || 0;
        const inReview = data?.by_status?.in_review?.total || 0;
        const underApproval = data?.by_status?.under_approval?.total || 0;
        const approved = data?.by_status?.approved?.total || 0;

        const result = {
          total_amount: total,
          series: [
            total ? parseFloat(((inReview / total) * 100).toFixed(2)) : 0,
            total ? parseFloat(((underApproval / total) * 100).toFixed(2)) : 0,
            total ? parseFloat(((approved / total) * 100).toFixed(2)) : 0,
          ],
        };
        setPieChartData(result);
        setIsPieChartLoading(false);
        setIsLoading(false);
      }
    },
    [radialChartFilter?.value],
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
      {/* Show content only when not loading */}
      {isLoading ? (
        <PageLoader />
      ) : (
        <div className="flex flex-col gap-4 w-full">
          {/* Header section with overview title and filter */}
          <div className="flex items-center justify-between">
            <p className="text-slate-800 text-lg font-semibold">Overview</p>
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

          {/* Cards showing summary statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-4">
            <Card
              heading="Total"
              icon={<CircleDollarSign width={20} />}
              value={formatNumber(billSummaryData?.total, orgDetails?.currency)}
            />
            <Card
              heading="Under review"
              icon={<FileClock width={20} />}
              value={formatNumber(
                billSummaryData?.in_review,
                orgDetails?.currency,
              )}
            />
            <Card
              heading="Under approval"
              icon={<FileCheck width={20} />}
              value={formatNumber(
                billSummaryData?.under_approval,
                orgDetails?.currency,
              )}
            />
            <Card
              heading="Approved"
              icon={<CircleCheck width={20} />}
              value={formatNumber(
                billSummaryData?.approved,
                orgDetails?.currency,
              )}
            />
          </div>

          {/* Graphs section: Analytics (bar) and Insights (radial bar) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
            {/* Bar chart for analytics */}
            <BarChart
              heading="Analytics"
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
              heading="Insights"
              totalAmount={pieChartData?.total_amount}
              radialSeries={pieChartData.series}
              barChartFilter={radialChartFilter}
              setBarChartFilter={setRadialChartFilter}
              isDataLoading={isPieChartLoading}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Home;
