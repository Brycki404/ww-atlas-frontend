import { Routes, Route } from "react-router-dom";
import MapPage from "./components/MapPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MapPage />} />
    </Routes>
  );
}