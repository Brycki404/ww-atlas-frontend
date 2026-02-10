// ------------------------------
// LOCATION ROW
// ------------------------------
export type MarkerLocation = {
  id: number;
  user_id: string;
  name: string;
  description: string | null;
  x: number;
  y: number;
  z: number;
  created_at: string;
  updated_at: string;
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