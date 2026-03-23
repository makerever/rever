"use client";

import { Button } from "@rever/common";
import { OtpInput } from "@rever/common";
import { Label } from "@rever/common";
import { OtpStepProps } from "@rever/types";
import { CircleCheck } from "lucide-react";
import { FieldValues, Path } from "react-hook-form";
import { useTranslate } from "@rever/i18n";

export default function OtpStep<T extends FieldValues>({
  register,
  setValue,
  trigger,
  isOtpValid,
  handleContinue,
  resendOtp,
  isLoaderFormSubmit,
  otpSending,
}: OtpStepProps<T>) {
  const translate = useTranslate();
  return (
    <div className="w-full">
      <div className={handleContinue ? "mb-5" : ""}>
        <Label htmlFor="otp" text={translate("auth.otp")} />
        <OtpInput
          trigger={trigger}
          name={"otp" as Path<T>}
          length={6}
          register={register}
          setValue={setValue}
          handleContinue={handleContinue}
        />
        <div className="flex justify-between font-medium items-center text-success-600 text-xs mt-2">
          <div className="flex items-center gap-1">
            <CircleCheck width={16} height={16} />
            <span>{translate("auth.otp_sent")}</span>
          </div>
          <div
            onClick={resendOtp}
            className={`${otpSending ? "text-slate-300" : "text-primary-800 cursor-pointer underline"} flex items-center gap-1`}
          >
            <span>{otpSending ? translate("auth.please_wait") : translate("auth.resend_otp")}</span>
          </div>
        </div>
      </div>

      {handleContinue ? (
        <Button
          onClick={handleContinue}
          disabled={isOtpValid}
          name={translate("buttons.continue")}
          button_type="primary"
          icon_type={isLoaderFormSubmit ? "loader" : null}
          width="w-full"
        />
      ) : null}
    </div>
  );
}
