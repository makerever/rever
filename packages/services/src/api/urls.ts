// API endpoint paths

export const AUTH_API = {
  EMAIL_REGISTRED: "/signup/email-start",
  EMAIL_VERIFY: "/signup/email-verify",
  SIGNUP: "/signup/complete",
  LOGIN: "/login",
  OTP_VERIFY: "/login/email-verify/",
  LOGIN_OTP: "/login/email-start/",
  LOGIN_OTP_SUBMIT: "/login/email-verify/",
  FORGOT_PASSWORD: "/password/forgot",
  RESET_FORGOT_PASSWORD: "/password/reset",
  CHANGE_PASSWORD: "/password/change",
  GET_LOGGED_IN_USER_DETAILS: "/me/",
  UPDATE_ORG: "/organization/",
};

// Vendor API Endpoints
export const VENDOR_API = {
  MANAGE_VENDORS: "/vendors/",
};

// BIll API Endpoints
export const BILL_API = {
  MANAGE_BILLS: "/bills/",
  SEND_BILL_APPROVAL: "/approval/send/bill/",
  UNDER_APPROVAL_BILLS: "/approval/assigned/bill/",
  APPROVE_REJECT_BILL: "/approval/action/bill/",
  BILL_SUMMARY: "/bills/summary/",
  BARGRAPH_DATA: "/bills/summary/monthly/",
};

// Attachment API Endpoints
export const ATTACHMENT_API = {
  ADD_ATTACH: "/attachment/upload/",
  GET_ATTACH: "/attachment/list/",
  DELETE_ATTACH: "/attachment/",
};

// Approval API Endpoints
export const APPROVAL_API = {
  GET_APPROVAL: "/approval/setting/",
  DISABLE_APPROVAL: "/approval/setting/",
  ENABLE_APPROVAL: "/approval/setting/",
  ASSIGN_APPROVER: "/approval/assign/",
};

// MEMBER API Endpoints
export const MEMBER_API = {
  INVITE_USER: "/invite-user/",
  COMPLETE_INVITE_USER: "/user/",
  GET_MEMBERS_LIST: "/users/organization",
  MANAGE_MEMEBER: "/users/",
  INVITED_USER: "/users/invited/",
};

// Notification API Endpoints
export const NOTIFICATION_API = {
  MANAGE_NOTIFICATION: "/notification/settings/",
};
