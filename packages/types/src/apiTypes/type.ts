// Interface types for api's

// For email registration
export interface EmailRegiseredProps {
  email: string;
}

// For login credentials
export interface LoginCredentialsProps {
  email?: string;
  password?: string;
  remember_me?: boolean;
}

// For email verification
export interface EmailVerifyProps {
  email: string;
  code: string;
}

// For OTP verification
export interface OtpVerifyProps {
  email: string;
  code: string;
}

// For signup
export interface SignupProps {
  email: string;
  otp: string;
}

// For completing signup
export interface CompleteSignupProps {
  email?: string;
  first_name?: string;
  last_name?: string;
  org_name?: string;
  password?: string;
}

// For password reset
export interface PasswordResetProps {
  email: string;
  code: string;
  new_password: string;
}

// For changing password
export interface ChangePasswordProps {
  old_password: string;
  new_password: string;
}

// For billing address
export interface billingAddress {
  id?: string;
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string | null;
}

// For vendor bank details
export interface bankDetailsTypes {
  id?: string;
  account_holder_name?: string | null;
  account_number?: string | null;
  bank_name?: string | null;
}

// For organization data
export interface OrgDataProps {
  name?: string;
  date_format?: string;
  currency?: string;
  matching_type?: string | number;
}

// For enabling approval
export interface EnableApprovalProps {
  model_name?: string;
  approval_enabled?: boolean;
}

// For inviting a member
export interface InviteMemberFormData {
  displayName?: string;
  email: string;
  role: string;
}

// For approving or rejecting a bill
export interface ApproveRejectBillProps {
  action: string;
  comment?: string;
}

// For notification setting
export interface ManageNotificationProps {
  notify_on_approval_request?: boolean;
  notify_on_approval_result?: boolean;
}
