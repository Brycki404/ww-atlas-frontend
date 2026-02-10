// ------------------------------
// LOCATION ROW
// ------------------------------
export type LocationRow = {
  id: number;
  user_id: string;
  name: string;
  description: string | null;
  x: number;
  y: number;
  z: number;
  created_at: string;
  updated_at: string;

  discord_username?: string | null;
  discord_avatar?: string | null;
  discord_id?: string | null;
};

// ------------------------------
// COMMENT ROW
// ------------------------------
export type CommentRow = {
  id: number;
  location_id: number;
  user_id: string;
  body: string;
  created_at: string;

  // Added from JOIN
  discord_username: string | null;
  discord_avatar: string | null;
  discord_id: string | null;
};

// ------------------------------
// SCREENSHOT ROW
// ------------------------------
export type ScreenshotRow = {
  id: number;
  location_id: number;
  user_id: string;
  url: string;
  caption: string | null;
  created_at: string;
};