import { useEffect, useState } from "react";
import Map3D from "./Map3D";
import CreateLocationModal from "./CreateLocationModal";
import LocationDetailsPanel from "./LocationDetailsPanel";
import type { LocationRow } from "../types/my_types";
import { USER_ID, API_URL } from "../main";

export default function MapPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationRow | null>(null);

  const [selectedLocation, setSelectedLocation] = useState<LocationRow | null>(null);
  const [showMine, setShowMine] = useState(false);
  const [locations, setLocations] = useState<LocationRow[]>([]);

  const username = localStorage.getItem("discord_username");
  const avatar = localStorage.getItem("discord_avatar");

  // NEW STATE YOU WERE MISSING
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<"newest" | "oldest">("newest");

  // Fetch all locations
  async function refreshLocations() {
    const res = await fetch(`${API_URL}/locations`);
    const data = await res.json();
    setLocations(data);
  }

  // Delete a location
  async function handleDelete(id: number) {
    await fetch(`${API_URL}/locations/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: USER_ID }),
    });

    refreshLocations();
    setSelectedLocation(null);
  }

  // Open modal in edit mode
  function handleEdit(location: LocationRow) {
    setEditingLocation(location);
    setShowCreateModal(true);
  }

  useEffect(() => {
    refreshLocations();
  }, []);

  // -----------------------------
  // FILTER + SORT PIPELINE
  // -----------------------------

  // 1. Search filter
  const searched = locations.filter((loc) =>
    loc.name.toLowerCase().includes(search.toLowerCase())
  );

  // 2. Sort by updated_at
  const sorted = [...searched].sort((a, b) => {
    const tA = new Date(a.updated_at ?? a.created_at).getTime();
    const tB = new Date(b.updated_at ?? b.created_at).getTime();
    return sortMode === "newest" ? tB - tA : tA - tB;
  });

  // 3. ShowMine filter happens inside Map3D
  //    (Map3D already filters based on showMine + USER_ID)

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

        {/* Discord Login */}
        <button
          onClick={() => {
            const redirect = encodeURIComponent(
              import.meta.env.VITE_DISCORD_REDIRECT_URI_PROD
            );

            const url =
              `https://discord.com/oauth2/authorize?client_id=${import.meta.env.VITE_DISCORD_CLIENT_ID}` +
              `&redirect_uri=${redirect}` +
              `&response_type=code&scope=identify`;

            window.location.href = url;
          }}
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "20px",
            background: "#5865F2",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Login with Discord
        </button>

        {username && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <img
              src={`https://cdn.discordapp.com/avatars/${USER_ID}/${avatar}.png`}
              style={{ width: 32, height: 32, borderRadius: "50%" }}
            />
            <span>Logged in as {username}</span>
          </div>
        )}

        {/* Create Location */}
        <button
          onClick={() => {
            setEditingLocation(null);
            setShowCreateModal(true);
          }}
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

        {/* Show Mine */}
        <button
          onClick={() => setShowMine(!showMine)}
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "10px",
            background: "#333",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          {showMine ? "Show All" : "Show My Markers"}
        </button>

        {/* Search */}
        <input
          placeholder="Search markers…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "10px",
            borderRadius: "6px",
            border: "none",
          }}
        />

        {/* Sort */}
        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as "newest" | "oldest")}
          style={{ width: "100%", marginTop: "10px" }}
        >
          <option value="newest">Newest Updated</option>
          <option value="oldest">Oldest Updated</option>
        </select>
      </div>

      {/* 3D Map */}
      <div style={{ flex: 1, position: "relative" }}>
        <Map3D
          USER_ID={USER_ID}
          locations={sorted}
          onSelectLocation={setSelectedLocation}
          selectedLocation={selectedLocation}
          showMine={showMine}
        />
      </div>

      {/* Details Panel */}
      <LocationDetailsPanel
        location={selectedLocation}
        onClose={() => setSelectedLocation(null)}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <CreateLocationModal
          mode={editingLocation ? "edit" : "create"}
          initialData={editingLocation}
          onSubmit={() => {
            refreshLocations();
            setShowCreateModal(false);
            setEditingLocation(null);
          }}
          onClose={() => {
            setShowCreateModal(false);
            setEditingLocation(null);
          }}
        />
      )}
    </div>
  );
}