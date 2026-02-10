import { useEffect } from "react";
import { API_URL } from "../main";

export default function DiscordCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!code) return;

    const redirect_uri = window.location.origin + "/discord-callback";

    fetch(`${API_URL}/auth/discord`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        redirect_uri,
        client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
        client_secret: import.meta.env.VITE_DISCORD_CLIENT_SECRET,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        localStorage.setItem("user_id", data.user_id);
        window.location.href = "/";
      });
  }, []);

  return <p style={{ color: "white" }}>Logging in…</p>;
}