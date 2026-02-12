import { useEffect, useState } from "react";
import { USER_ID, API_URL } from "../main";
import type { LocationRow } from "../types/my_types";

interface CreateLocationModalProps {
  initialData?: LocationRow | null;
  mode: "create" | "edit";
  onSubmit: () => void;
  onClose: () => void;
}

export default function CreateLocationModal({
  initialData,
  mode,
  onSubmit,
  onClose,
}: CreateLocationModalProps) {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string | null>("");
  const [x, setX] = useState<string>("0");
  const [y, setY] = useState<string>("0");
  const [z, setZ] = useState<string>("0");

  // Pre-fill fields when editing
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description ?? "");
      setX(initialData.x != null ? String(initialData.x) : "0");
      setY(initialData.y != null ? String(initialData.y) : "0");
      setZ(initialData.z != null ? String(initialData.z) : "0");
    }
  }, [initialData]);

  const handleSubmit = async () => {
    const payload = {
      user_id: USER_ID,
      name,
      description: description?.trim() === "" ? null : description,
      x: Number(x),
      y: Number(y),
      z: Number(z),
    };

    try {
      const url =
        mode === "create"
          ? `${API_URL}/locations`
          : `${API_URL}/locations/${initialData?.id}`;

      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("Saved:", data);

      onSubmit(); // refresh locations + close modal
    } catch (err) {
      console.error("Error saving location:", err);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: "400px",
          background: "#333",
          padding: "20px",
          borderRadius: "8px",
          color: "white",
        }}
      >
        <h2>{mode === "create" ? "Create Location" : "Edit Location"}</h2>

        <label>Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
        />

        <label>Description</label>
        <textarea
          value={description ?? ""}
          onChange={(e) => setDescription(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
        />

        <label>X</label>
        <input
          type="number"
          placeholder="0"
          value={x}
          onChange={(e) => {
            const v = e.target.value;

            // Allow empty or "-" while typing
            if (v === "" || v === "-") {
              setX(v);
              return;
            }

            // Only update if it's a valid number
            if (!isNaN(Number(v))) {
              setX(v);
            }
          }}
          onBlur={() => {
            // Normalize on blur
            if (x === "" || x === "-") {
              setX("0");
            }
          }}
          style={{ width: "100%", marginBottom: "10px" }}
        />

        <label>Y</label>
        <input
          type="number"
          placeholder="0"
          value={y}
          onChange={(e) => {
            const v = e.target.value;

            // Allow empty or "-" while typing
            if (v === "" || v === "-") {
              setY(v);
              return;
            }

            // Only update if it's a valid number
            if (!isNaN(Number(v))) {
              setY(v);
            }
          }}
          onBlur={() => {
            // Normalize on blur
            if (y === "" || y === "-") {
              setY("0");
            }
          }}
          style={{ width: "100%", marginBottom: "10px" }}
        />

        <label>Z</label>
        <input
          type="number"
          placeholder="0"
          value={z}
          onChange={(e) => {
            const v = e.target.value;

            // Allow empty or "-" while typing
            if (v === "" || v === "-") {
              setZ(v);
              return;
            }

            // Only update if it's a valid number
            if (!isNaN(Number(v))) {
              setZ(v);
            }
          }}
          onBlur={() => {
            // Normalize on blur
            if (z === "" || z === "-") {
              setZ("0");
            }
          }}
          style={{ width: "100%", marginBottom: "10px" }}
        />

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px",
              background: "#555",
              border: "none",
              borderRadius: "6px",
              color: "white",
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            style={{
              padding: "10px",
              background: "#4caf50",
              border: "none",
              borderRadius: "6px",
              color: "white",
            }}
          >
            {mode === "create" ? "Create" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}