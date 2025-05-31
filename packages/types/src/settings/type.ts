// Interface types for setting pages

// Interface for member data returned from API
export interface MemberDataAPIType {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  status: string;
}

// Interface for member data returned from API
export interface InvitedMemberDataAPIType {
  id: number;
  email: string;
  invited_by: string;
  organization: string;
  role: string;
  status: string;
}

// Interface for API response containing list of members
export interface MembersListApiResponse {
  members: MemberDataAPIType[];
}

// Interface for invited member data
export interface InvitedMemberDataType {
  id: number;
  email: string;
  invited_by: string;
  organization: string;
  role: string;
}
