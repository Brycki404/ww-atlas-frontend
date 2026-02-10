import { Routes, Route } from "react-router-dom";
import MapPage from "./components/MapPage";
import DiscordCallback from "./components/DiscordCallback";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MapPage />} />
      <Route path="/discord/callback" element={<DiscordCallback />} />
    </Routes>
  );
}