// MapPage.tsx
import { useEffect, useState, useRef } from "react";
import Map3D from "./Map3D";
import * as THREE from "three";
import CreateLocationModal from "./CreateLocationModal";
import LocationDetailsPanel from "./LocationDetailsPanel";
import type { LocationRow } from "../types/my_types";
import { API_URL } from "../main";

export default function MapPage() {
  const mapRef = useRef<{ flyTo: (v: THREE.Vector3) => void }>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationRow | null>(null);

  const [selectedLocation, setSelectedLocation] = useState<LocationRow | null>(null);
  const [showMine, setShowMine] = useState(false);
  const [locations, setLocations] = useState<LocationRow[]>([]);

  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<"newest" | "oldest">("newest");

  // -----------------------------
  // AUTH STATE
  // -----------------------------
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  function getAuthHeaders() {
    const token = localStorage.getItem("auth_token");
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }

  // -----------------------------
  // DISCORD LOGIN HANDLER
  // -----------------------------
  async function finishDiscordLogin(code: string) {
    const res = await fetch(`${API_URL}/auth/discord`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    if (!res.ok) throw new Error("Discord login failed");

    const data = await res.json();

    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);

    window.history.replaceState({}, "", "/ww-atlas-frontend/");
  }

  // Detect OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) finishDiscordLogin(code);
  }, []);

  // -----------------------------
  // API HELPERS
  // -----------------------------
  async function refreshLocations() {
    const res = await fetch(`${API_URL}/locations`);
    setLocations(await res.json());
  }

  async function createLocation(data: {
    name: string;
    description?: string;
    x: number;
    y: number;
    z: number;
  }) {
    await fetch(`${API_URL}/locations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    refreshLocations();
  }

  async function updateLocation(id: number, data: any) {
    await fetch(`${API_URL}/locations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    refreshLocations();
  }

  async function deleteLocation(id: number) {
    await fetch(`${API_URL}/locations/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    });
    refreshLocations();
    setSelectedLocation(null);
  }

  async function addComment(locationId: number, body: string) {
    await fetch(`${API_URL}/locations/${locationId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ body }),
    });
  }

  async function deleteComment(id: number) {
    await fetch(`${API_URL}/comments/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    });
  }

  async function addScreenshot(locationId: number, data: { url: string; caption?: string }) {
    await fetch(`${API_URL}/locations/${locationId}/screenshots`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
  }

  async function deleteScreenshot(id: number) {
    await fetch(`${API_URL}/screenshots/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    });
  }

  useEffect(() => {
    refreshLocations();
  }, []);

  // -----------------------------
  // FILTER + SORT
  // -----------------------------
  const searched = locations.filter((loc) =>
    loc.name.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...searched].sort((a, b) => {
    const tA = new Date(a.updated_at ?? a.created_at).getTime();
    const tB = new Date(b.updated_at ?? b.created_at).getTime();
    return sortMode === "newest" ? tB - tA : tA - tB;
  });

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <div style={{ width: 300, background: "#222", color: "white", padding: 20 }}>
        <h2>WW Atlas</h2>

        {!user && (
          <button
            onClick={() => {
              const redirect = encodeURIComponent(import.meta.env.VITE_DISCORD_REDIRECT_URI_PROD);
              const url =
                `https://discord.com/oauth2/authorize?client_id=${import.meta.env.VITE_DISCORD_CLIENT_ID}` +
                `&redirect_uri=${redirect}` +
                `&response_type=code&scope=identify`;
              window.location.href = url;
            }}
          >
            Login with Discord
          </button>
        )}

        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img
              src={`https://cdn.discordapp.com/avatars/${user.discord_id}/${user.discord_avatar}.png`}
              style={{ width: 32, height: 32, borderRadius: "50%" }}
            />
            <span>Logged in as {user.discord_username}</span>
          </div>
        )}

        <button onClick={() => { setEditingLocation(null); setShowCreateModal(true); }}>
          + Create Location
        </button>

        <button onClick={() => setShowMine(!showMine)}>
          {showMine ? "Show All" : "Show My Markers"}
        </button>

        <input
          placeholder="Search markers…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={sortMode} onChange={(e) => setSortMode(e.target.value as any)}>
          <option value="newest">Newest Updated</option>
          <option value="oldest">Oldest Updated</option>
        </select>

        <h3>Fly To Marker</h3>
        <ul>
          {sorted.map((loc) => (
            <li
              key={loc.id}
              onClick={() => {
                mapRef.current?.flyTo(new THREE.Vector3(loc.x, loc.y, loc.z));
                setSelectedLocation(loc);
              }}
            >
              {loc.name}
            </li>
          ))}
        </ul>
      </div>

      {/* 3D Map */}
      <div style={{ flex: 1 }}>
        <Map3D
          ref={mapRef}
          USER_ID={user?.user_id ?? null}
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
        onDelete={deleteLocation}
        onEdit={(loc) => { setEditingLocation(loc); setShowCreateModal(true); }}

        onAddComment={addComment}
        onDeleteComment={deleteComment}

        onAddScreenshot={addScreenshot}
        onDeleteScreenshot={deleteScreenshot}
      />

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <CreateLocationModal
          mode={editingLocation ? "edit" : "create"}
          initialData={editingLocation}
          onSubmit={(data) => {
            if (editingLocation) updateLocation(editingLocation.id, data);
            else createLocation(data);
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