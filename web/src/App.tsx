import { Navigate, Route, Routes } from "react-router-dom";
import Studio from "./pages/Studio";
import Overlay from "./pages/Overlay";
import Fan from "./pages/Fan";
import About from "./pages/About";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/studio" replace />} />
      <Route path="/studio" element={<Studio />} />
      <Route path="/overlay" element={<Overlay />} />
      <Route path="/fan" element={<Fan />} />
      <Route path="/about" element={<About />} />
      <Route path="*" element={<Navigate to="/studio" replace />} />
    </Routes>
  );
}
