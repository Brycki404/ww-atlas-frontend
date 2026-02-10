import { useEffect, useState } from "react";
import type { LocationRow, CommentRow, ScreenshotRow } from "../types/my_types";
import { USER_ID, API_URL } from "../main";

interface LocationDetailsProps {
  location: LocationRow | null;
  onClose: () => void;
  onDelete: (id: number) => void;
  onEdit: (loc: LocationRow) => void;
}

export default function LocationDetailsPanel({
  location,
  onClose,
  onDelete,
  onEdit,
}: LocationDetailsProps) {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [newComment, setNewComment] = useState("");

  const [screenshots, setScreenshots] = useState<ScreenshotRow[]>([]);
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [screenshotCaption, setScreenshotCaption] = useState("");

  // Fetch comments + screenshots when location changes
  useEffect(() => {
    if (!location) return;

    fetch(`${API_URL}/locations/${location.id}/comments`)
      .then((res) => res.json())
      .then(setComments);

    fetch(`${API_URL}/locations/${location.id}/screenshots`)
      .then((res) => res.json())
      .then(setScreenshots);
  }, [location]);

  if (!location) {
    return (
      <div
        style={{
          width: "0px",
          transition: "width 0.3s ease",
          overflow: "hidden",
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: "300px",
        background: "#111",
        color: "white",
        padding: "20px",
        borderLeft: "1px solid #333",
        transition: "width 0.3s ease",
        overflowY: "auto",
      }}
    >
      <button
        onClick={onClose}
        style={{
          background: "#333",
          color: "white",
          border: "none",
          padding: "8px 12px",
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        Close
      </button>

      {/* Edit/Delete buttons */}
      {location.user_id === USER_ID && (
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <button
            onClick={() => onEdit(location)}
            style={{
              padding: "8px 12px",
              background: "#4caf50",
              border: "none",
              borderRadius: "6px",
              color: "white",
              cursor: "pointer",
            }}
          >
            Edit
          </button>

          <button
            onClick={() => onDelete(location.id)}
            style={{
              padding: "8px 12px",
              background: "#d9534f",
              border: "none",
              borderRadius: "6px",
              color: "white",
              cursor: "pointer",
            }}
          >
            Delete
          </button>
        </div>
      )}

      <h2>{location.name}</h2>

      <p style={{ opacity: 0.8 }}>
        {location.description || "No description"}
      </p>

      <h3>Coordinates</h3>
      <p>
        X: {location.x} <br />
        Y: {location.y} <br />
        Z: {location.z}
      </p>

      <h3>Created</h3>
      {location.user_id === USER_ID && (
        <span
          style={{
            display: "inline-block",
            background: "#4caf50",
            padding: "4px 8px",
            borderRadius: "6px",
            fontSize: "12px",
            marginBottom: "6px",
          }}
        >
          Created by You
        </span>
      )}

      <p>
        {location.created_at
          ? new Date(location.created_at).toLocaleString()
          : "Unknown"}
      </p>

      <hr style={{ margin: "20px 0", opacity: 0.2 }} />

      {/* Screenshots */}
      <h3>Screenshots</h3>

      <input
        value={screenshotUrl}
        onChange={(e) => setScreenshotUrl(e.target.value)}
        placeholder="Image URL"
        style={{ width: "100%", marginBottom: "10px" }}
      />

      <input
        value={screenshotCaption}
        onChange={(e) => setScreenshotCaption(e.target.value)}
        placeholder="Caption (optional)"
        style={{ width: "100%", marginBottom: "10px" }}
      />

      <button
        onClick={async () => {
          await fetch(`${API_URL}/locations/${location.id}/screenshots`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: USER_ID,
              url: screenshotUrl,
              caption: screenshotCaption,
            }),
          });

          setScreenshotUrl("");
          setScreenshotCaption("");

          const res = await fetch(`${API_URL}/locations/${location.id}/screenshots`);
          setScreenshots(await res.json());
        }}
        style={{
          padding: "8px 12px",
          background: "#4caf50",
          border: "none",
          borderRadius: "6px",
          color: "white",
          cursor: "pointer",
          marginBottom: "10px",
        }}
      >
        Add Screenshot
      </button>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {screenshots.map((s) => (
          <div key={s.id} style={{ position: "relative" }}>
            <img
              src={s.url}
              style={{ width: "100%", borderRadius: "6px" }}
            />

            {s.caption && (
              <p style={{ opacity: 0.8, marginTop: "4px" }}>{s.caption}</p>
            )}

            {s.user_id === USER_ID && (
              <button
                onClick={async () => {
                  await fetch(`${API_URL}/screenshots/${s.id}`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ user_id: USER_ID }),
                  });

                  const res = await fetch(`${API_URL}/locations/${location.id}/screenshots`);
                  setScreenshots(await res.json());
                }}
                style={{
                  marginTop: "5px",
                  padding: "4px 8px",
                  background: "#d9534f",
                  border: "none",
                  borderRadius: "4px",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Delete Screenshot
              </button>
            )}
          </div>
        ))}
      </div>

      <hr style={{ margin: "20px 0", opacity: 0.2 }} />

      {/* Comments */}
      <h3>Comments</h3>

      <textarea
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        placeholder="Write a comment…"
        style={{ width: "100%", marginBottom: "10px" }}
      />

      <button
        onClick={async () => {
          await fetch(`${API_URL}/locations/${location.id}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: USER_ID,
              body: newComment,
            }),
          });

          setNewComment("");

          const res = await fetch(`${API_URL}/locations/${location.id}/comments`);
          setComments(await res.json());
        }}
        style={{
          padding: "8px 12px",
          background: "#4caf50",
          border: "none",
          borderRadius: "6px",
          color: "white",
          cursor: "pointer",
          marginBottom: "10px",
        }}
      >
        Post Comment
      </button>

      {comments.map((c) => (
        <div
          key={c.id}
          style={{
            marginBottom: "14px",
            display: "flex",
            gap: "10px",
            alignItems: "flex-start",
          }}
        >
          {/* Avatar */}
          <img
            src={`https://cdn.discordapp.com/avatars/${c.discord_id}/${c.discord_avatar}.png`}
            alt="avatar"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              flexShrink: 0,
            }}
          />

          {/* Comment content */}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, opacity: 0.9 }}>
              {c.discord_username}
            </div>

            <p style={{ margin: "4px 0", opacity: 0.85 }}>{c.body}</p>

            <small style={{ opacity: 0.5 }}>
              {new Date(c.created_at).toLocaleString()}
            </small>

            {/* Delete button if owner */}
            {c.user_id === USER_ID && (
              <button
                onClick={async () => {
                  await fetch(`${API_URL}/comments/${c.id}`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ user_id: USER_ID }),
                  });

                  const res = await fetch(
                    `${API_URL}/locations/${location.id}/comments`
                  );
                  setComments(await res.json());
                }}
                style={{
                  marginTop: "6px",
                  padding: "4px 8px",
                  background: "#d9534f",
                  border: "none",
                  borderRadius: "4px",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            )}

            <hr style={{ opacity: 0.1, marginTop: "10px" }} />
          </div>
        </div>
      ))}
    </div>
  );
}