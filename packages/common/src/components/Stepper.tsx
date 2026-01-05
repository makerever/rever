"use client";

import { StepperProps } from "@rever/types";
import { Check } from "lucide-react";

const Stepper = ({ steps, activeStep }: StepperProps) => {
  return (
    <div className="flex items-center w-full justify-between mb-12 relative">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          {/* Circle */}
          <div className="relative flex flex-col items-center">
            <div className="flex items-center mr-3">
              <div
                className={`flex items-center justify-center min-w-8 min-h-8 w-8 h-8 rounded-full text-sm font-semibold
                ${activeStep > step.id ? "bg-primary-600 text-neutral-1100" : activeStep === step.id ? "bg-primary-100 text-primary-800" : "bg-secondary-200 text-neutral-1100"}
              `}
              >
                {activeStep > step.id ? <Check width={16} /> : step.id}{" "}
              </div>

              <span className="ms-3 text-neutral-1100 text-sm font-semibold">
                {step.label}
              </span>
            </div>
          </div>

          {/* Line */}
          {index !== steps.length - 1 && (
            <div className="stepper-count-line -z-10 absolute top-4 left-1/2 transform -translate-x-1/2 h-px bg-secondary-200" />
          )}
        </div>
      ))}
    </div>
  );
};

export default Stepper;
