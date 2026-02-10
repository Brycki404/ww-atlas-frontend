import type { MarkerLocation } from "../types/my_types";

interface LocationDetailsProps {
  location: MarkerLocation;
  onClose: () => void;
}

export default function LocationDetailsPanel({ location, onClose }: LocationDetailsProps) {
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
      <p>{new Date(location.created_at).toLocaleString()}</p>

      <hr style={{ margin: "20px 0", opacity: 0.2 }} />

      <h3>Screenshots</h3>
      <p style={{ opacity: 0.6 }}>Coming soon…</p>

      <h3>Comments</h3>
      <p style={{ opacity: 0.6 }}>Coming soon…</p>
    </div>
  );
}