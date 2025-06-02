"use client";

import { StepperProps } from "@rever/types";
import { Check } from "lucide-react";

const Stepper = ({ steps, activeStep }: StepperProps) => {
  return (
    <div className="flex items-center w-full justify-between mb-8 relative">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          {/* Circle */}
          <div className="relative flex flex-col items-center">
            <div
              className={`flex items-center justify-center min-w-8 min-h-8 w-8 h-8 rounded-full text-2xs font-semibold
                ${activeStep > step.id ? "bg-primary-600 text-white" : activeStep === step.id ? "bg-primary-500 text-white" : "bg-slate-300 text-slate-700"}
              `}
            >
              {activeStep > step.id ? <Check width={16} /> : step.id}
            </div>

            {/* Label */}
            <div className="mt-2 text-2xs text-center text-slate-600 w-max">
              {step.label}
            </div>
          </div>

          {/* Line */}
          {index !== steps.length - 1 && (
            <div
              style={{ width: "calc(100% - 20%)" }}
              className="-z-10 absolute top-4 left-1/2 transform -translate-x-1/2 h-0.5 bg-slate-300"
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default Stepper;
