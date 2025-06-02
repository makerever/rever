import { InviteMemberFormData } from "@rever/types";
import axiosInstance from "../api/axios";
import { MEMBER_API } from "../api/urls";
import { inviteMemberSignupSchemaValues } from "@rever/validations";
import { inviteMemberSchemaValues } from "@rever/validations";

// Invite a new user to the platform
export const inviteUserApi = async (data: InviteMemberFormData) => {
  const response = await axiosInstance.post(MEMBER_API.INVITE_USER, data);
  return response;
};

// Complete the invitation process for a user using a token
export const completeInviteUserApi = async (
  token: string | string[],
  data: inviteMemberSignupSchemaValues,
) => {
  const response = await axiosInstance.post(
    `${MEMBER_API.COMPLETE_INVITE_USER}${token}/signup/complete/`,
    data,
  );
  return response;
};

// Get details of an invited user by their ID
export const getinvitedUserDetailsApi = async (id: string | string[]) => {
  const response = await axiosInstance.get(`${MEMBER_API.INVITED_USER}${id}/`);
  return response;
};

// Fetch the list of all members
export const getMembersListApi = async () => {
  const response = await axiosInstance.get(MEMBER_API.GET_MEMBERS_LIST);
  return response;
};

// Fetch the list of all invited members
export const getInvitedMembersListApi = async () => {
  const response = await axiosInstance.get(MEMBER_API.INVITED_USER);
  return response;
};

// Fetch details of a specific member by their ID
export const getMembersListByIdApi = async (id: string) => {
  const response = await axiosInstance.get(
    `${MEMBER_API.MANAGE_MEMEBER}${id}/`,
  );
  return response;
};

// Update an existing member's details by their ID
export const updateMemberApi = async (
  data: inviteMemberSchemaValues,
  id: string,
) => {
  const response = await axiosInstance.patch(
    `${MEMBER_API.MANAGE_MEMEBER}${id}/`,
    data,
  );
  return response;
};

// Delete a member by their ID
export const deleteMemberByIdApi = async (id: string | undefined) => {
  const response = await axiosInstance.delete(
    `${MEMBER_API.MANAGE_MEMEBER}${id}/`,
  );
  return response;
};
