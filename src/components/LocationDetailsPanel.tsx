// LocationDetailsPanel.tsx
import { useEffect, useState } from "react";
import type { LocationRow, CommentRow, ScreenshotRow } from "../types/my_types";
import { API_URL } from "../main";

interface Props {
  location: LocationRow | null;
  onClose: () => void;
  onDelete: (id: number) => void;
  onEdit: (loc: LocationRow) => void;

  onAddComment: (locationId: number, body: string) => Promise<void>;
  onDeleteComment: (id: number) => Promise<void>;

  onAddScreenshot: (locationId: number, data: { url: string; caption?: string }) => Promise<void>;
  onDeleteScreenshot: (id: number) => Promise<void>;
}

export default function LocationDetailsPanel({
  location,
  onClose,
  onDelete,
  onEdit,
  onAddComment,
  onDeleteComment,
  onAddScreenshot,
  onDeleteScreenshot,
}: Props) {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [screenshots, setScreenshots] = useState<ScreenshotRow[]>([]);
  const [newComment, setNewComment] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [screenshotCaption, setScreenshotCaption] = useState("");

  useEffect(() => {
    if (!location) return;

    fetch(`${API_URL}/locations/${location.id}/comments`)
      .then((res) => res.json())
      .then(setComments);

    fetch(`${API_URL}/locations/${location.id}/screenshots`)
      .then((res) => res.json())
      .then(setScreenshots);
  }, [location]);

  if (!location) return <div style={{ width: 0 }} />;

  return (
    <div className="details-panel">
      <button onClick={onClose}>Close</button>

      <button onClick={() => onEdit(location)}>Edit</button>
      <button onClick={() => onDelete(location.id)}>Delete</button>

      <h2>{location.name}</h2>
      <p>{location.description}</p>

      <h3>Screenshots</h3>
      <input value={screenshotUrl} onChange={(e) => setScreenshotUrl(e.target.value)} />
      <input value={screenshotCaption} onChange={(e) => setScreenshotCaption(e.target.value)} />

      <button
        onClick={async () => {
          await onAddScreenshot(location.id, {
            url: screenshotUrl,
            caption: screenshotCaption,
          });
          setScreenshotUrl("");
          setScreenshotCaption("");

          const res = await fetch(`${API_URL}/locations/${location.id}/screenshots`);
          setScreenshots(await res.json());
        }}
      >
        Add Screenshot
      </button>

      {screenshots.map((s) => (
        <div key={s.id}>
          <img src={s.url} />
          {s.caption && <p>{s.caption}</p>}
          <button
            onClick={async () => {
              await onDeleteScreenshot(s.id);
              const res = await fetch(`${API_URL}/locations/${location.id}/screenshots`);
              setScreenshots(await res.json());
            }}
          >
            Delete
          </button>
        </div>
      ))}

      <h3>Comments</h3>
      <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} />

      <button
        onClick={async () => {
          await onAddComment(location.id, newComment);
          setNewComment("");

          const res = await fetch(`${API_URL}/locations/${location.id}/comments`);
          setComments(await res.json());
        }}
      >
        Post Comment
      </button>

      {comments.map((c) => (
        <div key={c.id}>
          <strong>{c.discord_username}</strong>
          <p>{c.body}</p>
          <button
            onClick={async () => {
              await onDeleteComment(c.id);
              const res = await fetch(`${API_URL}/locations/${location.id}/comments`);
              setComments(await res.json());
            }}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}