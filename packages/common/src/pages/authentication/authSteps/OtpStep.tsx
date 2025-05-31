"use client";

import { Button } from "@rever/common";
import { OtpInput } from "@rever/common";
import { Label } from "@rever/common";
import { OtpStepProps } from "@rever/types";
import { CircleCheck } from "lucide-react";
import { FieldValues, Path } from "react-hook-form";

export default function OtpStep<T extends FieldValues>({
  register,
  setValue,
  trigger,
  isOtpValid,
  handleContinue,
  resendOtp,
  isLoaderFormSubmit,
}: OtpStepProps<T>) {
  return (
    <div className="w-full">
      <div className={handleContinue ? "mb-5" : ""}>
        <Label htmlFor="otp" text="One-Time password" />
        <OtpInput
          trigger={trigger}
          name={"otp" as Path<T>}
          length={6}
          register={register}
          setValue={setValue}
          handleContinue={handleContinue}
        />
        <div className="flex justify-between font-medium items-center text-primary-500 text-xs mt-1.5">
          <div className="flex items-center gap-1">
            <CircleCheck width={16} height={16} />
            <span>Enter the otp sent to your email</span>
          </div>
          <div
            onClick={resendOtp}
            className="text-slate-500 cursor-pointer flex items-center gap-1"
          >
            <span>Resend</span>
          </div>
        </div>
      </div>

      {handleContinue ? (
        <Button
          text="Continue"
          onClick={handleContinue}
          disabled={isOtpValid}
          className="text-white"
          isLoading={isLoaderFormSubmit}
        />
      ) : null}
    </div>
  );
}
