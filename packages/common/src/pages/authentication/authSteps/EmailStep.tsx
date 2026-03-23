// Component to show Email Auth Step

"use client";

import { Button } from "@rever/common";
import { TextInput } from "@rever/common";
import { Label } from "@rever/common";
import { STEP } from "@rever/constants";
import { EmailStepProps } from "@rever/types";
import { FieldError, FieldValues, Path, PathValue } from "react-hook-form";
import { useTranslate } from "@rever/i18n";

const EmailStep = <T extends FieldValues>({
  register,
  getValues,
  setValue,
  errors,
  setShowStep,
  showStep,
  isEmailValid,
  clearErrors,
  handleEmailCheck,
  isLoaderFormSubmit,
}: EmailStepProps<T>) => {
  const translate = useTranslate();
  // Helper to clear specified fields
  const clearFields = (fields: Path<T>[]) => {
    fields.forEach((field) => {
      setValue(field, "" as PathValue<T, typeof field>);
    });
  };

  return (
    <>
      {/* Email input field with label */}
      <div className="mb-5">
        <Label htmlFor="email" text={translate("auth.email")} />
        <TextInput
          clearInput={() => {
            // Clear email and password fields, reset errors and step
            clearFields(["email" as Path<T>, "password" as Path<T>]);
            clearErrors("email" as Path<T>);
            setShowStep(STEP.EMAIL);
          }}
          register={register("email" as Path<T>)}
          id="email"
          placeholder={translate("placeholders.email_input")}
          clearIcon
          error={errors["email"] as FieldError}
          value={getValues("email" as Path<T>)}
          stepNo={showStep}
          onEnterPress={!isEmailValid ? () => handleEmailCheck() : () => {}}
          type="email"
          focusOnMount
        />
      </div>

      {/* Continue button only shown on email step */}
      {showStep === STEP.EMAIL && (
        <>
          <Button
            onClick={handleEmailCheck}
            disabled={isEmailValid || isLoaderFormSubmit}
            name={translate("buttons.continue")}
            button_type="primary"
            icon_type={isLoaderFormSubmit ? "loader" : null}
            width="w-full"
          />
        </>
      )}
    </>
  );
};

export default EmailStep;
