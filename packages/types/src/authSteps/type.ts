// TS authentication steps inteface objects

import { StepType } from "@rever/constants";
import {
  UseFormRegister,
  FieldErrors,
  UseFormGetValues,
  UseFormSetValue,
  UseFormTrigger,
  SubmitHandler,
  FieldValues,
  UseFormClearErrors,
} from "react-hook-form";

// Interface for common form props used in authentication steps
export interface CommonFormProps<T extends FieldValues> {
  register: UseFormRegister<T>;
  getValues: UseFormGetValues<T>;
  setValue: UseFormSetValue<T>;
  trigger: UseFormTrigger<T>;
  errors: FieldErrors<T>;
  clearErrors: UseFormClearErrors<T>;
}

// Interface for email step props in authentication flow
export interface EmailStepProps<T extends FieldValues>
  extends CommonFormProps<T> {
  setShowStep: (step: StepType) => void;
  isEmailValid: boolean;
  showStep: StepType;
  handleEmailCheck: () => void;
  isLoaderFormSubmit: boolean;
}

// Interface for password step props in authentication flow
export interface PasswordStepProps<T extends FieldValues>
  extends CommonFormProps<T> {
  isPasswordEmpty: boolean;
  handleSubmit: (
    fn: SubmitHandler<T>,
  ) => (e?: React.BaseSyntheticEvent) => Promise<void>;
  submitForm: SubmitHandler<T>;
  isLoaderFormSubmit: boolean;
  handleForgotPwd: () => void;
}

// Interface for OTP step props in authentication flow
export interface OtpStepProps<T extends FieldValues>
  extends CommonFormProps<T> {
  isOtpValid: boolean;
  handleContinue?: () => void;
  resendOtp?: () => void;
  isLoaderFormSubmit?: boolean;
}

// Interface for register step props
export interface RegisterStepProps {
  showStep: number;
  setShowStep: (e: number) => void;
}

// Interface for login step props
export interface LoginStepProps {
  showStep: StepType;
  setShowStep: (e: StepType) => void;
}
