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
      .then(async (res) => {
        const text = await res.text();
        console.log("RAW RESPONSE:", text);
        return JSON.parse(text);
      })
      .then((data) => {
        console.log("PARSED DATA:", data);

        localStorage.setItem("user_id", data.user_id);
        localStorage.setItem("discord_username", data.discord_username);
        localStorage.setItem("discord_avatar", data.discord_avatar);

        window.location.href = "/ww-atlas-frontend/";
      })
      .catch((err) => {
        console.error("CALLBACK ERROR:", err);
      });
  }, [navigate]);

  return <p style={{ color: "white" }}>Logging in…</p>;
}