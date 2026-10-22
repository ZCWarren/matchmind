import { Navigate, Route, Routes } from "react-router-dom";
import Studio from "./pages/Studio";
import Overlay from "./pages/Overlay";
import Fan from "./pages/Fan";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/studio" replace />} />
      <Route path="/studio" element={<Studio />} />
      <Route path="/overlay" element={<Overlay />} />
      <Route path="/fan" element={<Fan />} />
      <Route path="*" element={<Navigate to="/studio" replace />} />
    </Routes>
  );
}
