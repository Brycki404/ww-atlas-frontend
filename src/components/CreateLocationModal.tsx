// CreateLocationModal.tsx
import { useEffect, useState } from "react";
import type { LocationRow } from "../types/my_types";

interface Props {
  initialData?: LocationRow | null;
  mode: "create" | "edit";
  onSubmit: (data: {
    name: string;
    description?: string | null;
    x: number;
    y: number;
    z: number;
  }) => void;
  onClose: () => void;
}

export default function CreateLocationModal({ initialData, mode, onSubmit, onClose }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState<string | null>("");
  const [x, setX] = useState("0");
  const [y, setY] = useState("0");
  const [z, setZ] = useState("0");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description ?? "");
      setX(String(initialData.x));
      setY(String(initialData.y));
      setZ(String(initialData.z));
    }
  }, [initialData]);

  function handleSubmit() {
    onSubmit({
      name,
      description: description?.trim() === "" ? null : description,
      x: Number(x),
      y: Number(y),
      z: Number(z),
    });
  }

  return (
    <div className="modal">
      <div className="modal-inner">
        <h2>{mode === "create" ? "Create Location" : "Edit Location"}</h2>

        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />

        <label>Description</label>
        <textarea value={description ?? ""} onChange={(e) => setDescription(e.target.value)} />

        <label>X</label>
        <input value={x} onChange={(e) => setX(e.target.value)} />

        <label>Y</label>
        <input value={y} onChange={(e) => setY(e.target.value)} />

        <label>Z</label>
        <input value={z} onChange={(e) => setZ(e.target.value)} />

        <button onClick={onClose}>Cancel</button>
        <button onClick={handleSubmit}>{mode === "create" ? "Create" : "Save"}</button>
      </div>
    </div>
  );
}