import { useEffect } from "react";
import { API_URL } from "../main";
import { useNavigate } from "react-router-dom";

export default function DiscordCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!code) return;

    fetch(`${API_URL}/auth/discord`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
      .then((res) => res.json())
      .then((data) => {
        localStorage.setItem("user_id", data.user_id);
        localStorage.setItem("discord_username", data.discord_username);
        localStorage.setItem("discord_avatar", data.discord_avatar);

        // This respects the basename="/ww-atlas-frontend"
        window.location.href = "/ww-atlas-frontend/";
      });
  }, [navigate]);

  return <p style={{ color: "white" }}>Logging in…</p>;
}