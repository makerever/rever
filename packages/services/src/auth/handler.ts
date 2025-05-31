// API function for user authentication

import {
  ChangePasswordProps,
  CompleteSignupProps,
  EmailRegiseredProps,
  EmailVerifyProps,
  LoginCredentialsProps,
  OrgDataProps,
  OtpVerifyProps,
  PasswordResetProps,
  SignupProps,
} from "@rever/types";
import axiosInstance from "../api/axios";
import { AUTH_API } from "../api/urls";
import { profileSettingSchemaValues } from "@rever/validations";

// Check if email is already registered
export const checkEmailRegisteredApi = async (
  credentials: EmailRegiseredProps,
) => {
  const response = await axiosInstance.post(
    AUTH_API.EMAIL_REGISTRED,
    credentials,
  );
  return response;
};

// Login with email and password
export const loginApi = async (credentials: LoginCredentialsProps) => {
  const response = await axiosInstance.post(AUTH_API.LOGIN, credentials);
  return response;
};

// Verify email for signup
export const signupEmailVerifyApi = async (credentials: EmailVerifyProps) => {
  const response = await axiosInstance.post(AUTH_API.EMAIL_VERIFY, credentials);
  return response;
};

// Signup with email and password
export const SignupApi = async (credentials: SignupProps) => {
  const response = await axiosInstance.post(AUTH_API.SIGNUP, credentials);
  return response;
};

// Complete signup process (additional details)
export const completeSignupApi = async (credentials: CompleteSignupProps) => {
  const response = await axiosInstance.post(AUTH_API.SIGNUP, credentials);
  return response;
};

// Request OTP for login
export const loginViaOtpApi = async (credentials: EmailRegiseredProps) => {
  const response = await axiosInstance.post(AUTH_API.LOGIN_OTP, credentials);
  return response;
};

// Submit OTP for login
export const loginViaOtpSubmitApi = async (credentials: OtpVerifyProps) => {
  const response = await axiosInstance.post(
    AUTH_API.LOGIN_OTP_SUBMIT,
    credentials,
  );
  return response;
};

// Request password reset (forgot password)
export const forgotPasswordApi = async (credentials: EmailRegiseredProps) => {
  const response = await axiosInstance.post(
    AUTH_API.FORGOT_PASSWORD,
    credentials,
  );
  return response;
};

// Reset password using token from forgot password
export const resetForgotPasswordApi = async (
  credentials: PasswordResetProps,
) => {
  const response = await axiosInstance.post(
    AUTH_API.RESET_FORGOT_PASSWORD,
    credentials,
  );
  return response;
};

// Change password for logged-in user
export const changePasswordApi = async (credentials: ChangePasswordProps) => {
  const response = await axiosInstance.post(
    AUTH_API.CHANGE_PASSWORD,
    credentials,
  );
  return response;
};

// Get details of the currently logged-in user
export const getLoggedInUserDetails = async () => {
  const response = await axiosInstance.get(AUTH_API.GET_LOGGED_IN_USER_DETAILS);
  return response;
};

// Update organization details
export const updateOrgApi = async (orgData: OrgDataProps) => {
  const response = await axiosInstance.patch(AUTH_API.UPDATE_ORG, orgData);
  return response;
};

// Update user profile settings
export const updateProfileApi = async (
  userData: profileSettingSchemaValues,
) => {
  const response = await axiosInstance.patch(
    AUTH_API.GET_LOGGED_IN_USER_DETAILS,
    userData,
  );
  return response;
};
