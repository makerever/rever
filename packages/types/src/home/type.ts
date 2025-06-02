// Types for Dashboard(Home Page)

import { SingleValue } from "react-select";
import { Dispatch, SetStateAction } from "react";
import { Option } from "../common/type";

// Interface for card component on dashboard
export interface CardProps {
  heading: string;
  icon: React.ReactNode;
  value: string;
}

// Interface for graph card component on dashboard
export interface BarChartProps {
  heading: string;
  months: string[];
  years: number[];
  totalAmount: number[];
  totalBills: number[];
  barChartFilter?: SingleValue<Option>;
  setBarChartFilter?: Dispatch<SetStateAction<SingleValue<Option>>>;
}

export interface PieChartProps {
  heading: string;
  barChartFilter?: SingleValue<Option>;
  setBarChartFilter?: Dispatch<SetStateAction<SingleValue<Option>>>;
  radialSeries: number[];
  totalAmount: string | number;
}

export interface barGraphDataType {
  month: string;
  year: number;
  total_amount: number;
  total_count: number;
  by_status: {
    in_review: {
      count: number;
      total: number;
    };
  };
}

export interface barGraphStateDataType {
  months: string[];
  years: number[];
  totalAmount: number[];
  totalBills: number[];
}
