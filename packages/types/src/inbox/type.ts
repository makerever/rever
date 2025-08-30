//Types for notifications
export interface Message {
  id: string;
  subject: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  time_since_created: string;
  action_url?: string;
  object_id?: string;
  object_name?: string;
}
