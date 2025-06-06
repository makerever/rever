// TS types for stores

// Type for organization object
type Organization = {
  id: string;
  name: string;
  currency?: string;
  date_format?: string;
  member_count?: number;
  matching_type?: string;
};

// Type for logged-in user properties
export type LoggedUserProps = {
  id: string | undefined;
  first_name: string | undefined;
  last_name: string | undefined;
  email: string | undefined;
  role: string | undefined;
  organization: Organization;
  timezone: string | undefined;
};

// Type for sidebar state properties
export type SidebarStateProps = {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  setCollapse: (value: boolean) => void;
};

// Type for theme mode
type ThemeMode = "light" | "dark";

// Interface for theme store properties
export interface ThemeStoreProps {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

// Type for user store properties
export type UserStoreProps = {
  user: LoggedUserProps | null;
  setUser: (user: LoggedUserProps) => void;
  logout: () => void;
};
