import { useState } from "react";
import { USER_ID, API_URL } from "../main";

interface Props {
  onClose: () => void;
}

export default function CreateLocationModal({ onClose }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [x, setX] = useState<number>(0);
  const [y, setY] = useState<number>(0);
  const [z, setZ] = useState<number>(0);

  const handleSubmit = async () => {
    const payload = {
      user_id: USER_ID,
      name,
      description,
      x: Number(x),
      y: Number(y),
      z: Number(z),
    };

    try {
      const res = await fetch(`${API_URL}/locations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("Created:", data);

      onClose();
    } catch (err) {
      console.error("Error creating location:", err);
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
        <h2>Create Location</h2>

        <label>Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
        />

        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
        />

        <label>X</label>
        <input
          type="number"
          value={x}
          onChange={(e) => setX(Number(e.target.value))}
          style={{ width: "100%", marginBottom: "10px" }}
        />

        <label>Y</label>
        <input
          type="number"
          value={y}
          onChange={(e) => setY(Number(e.target.value))}
          style={{ width: "100%", marginBottom: "10px" }}
        />

        <label>Z</label>
        <input
          type="number"
          value={z}
          onChange={(e) => setZ(Number(e.target.value))}
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
            Create
          </button>
        </div>
      </div>
    </div>
  );
}