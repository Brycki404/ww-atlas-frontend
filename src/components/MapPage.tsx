import { useState } from "react";
import Map3D from "./Map3D";
import CreateLocationModal from "./CreateLocationModal";
import LocationDetailsPanel from "./LocationDetailsPanel";
import type { MarkerLocation } from "../types/my_types";

export default function MapPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<MarkerLocation | null>(null);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <div
        style={{
          width: "300px",
          background: "#222",
          color: "white",
          padding: "20px",
        }}
      >
        <h2>WW Atlas</h2>

        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "10px",
            background: "#444",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          + Create Location
        </button>
      </div>

      {/* 3D Map */}
      <div style={{ flex: 1, position: "relative", background: "red" }}>
        <Map3D
          onSelectLocation={setSelectedLocation}
          selectedLocation={selectedLocation}
        />
      </div>

      {/* Details Panel */}
      <LocationDetailsPanel
        location={selectedLocation}
        onClose={() => setSelectedLocation(null)}
      />

      {/* Create Location Modal */}
      {showCreateModal && (
        <CreateLocationModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}