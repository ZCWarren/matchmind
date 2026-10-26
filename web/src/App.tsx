import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

const Home = lazy(() => import("./pages/Home"));
const MomentFocus = lazy(() => import("./pages/MomentFocus"));
const Studio = lazy(() => import("./pages/Studio"));
const Overlay = lazy(() => import("./pages/Overlay"));
const Fan = lazy(() => import("./pages/Fan"));
const About = lazy(() => import("./pages/About"));
const Guide = lazy(() => import("./pages/Guide"));

export default function App() {
  return (
    <Suspense fallback={<div className="route-loading" role="status">MATCHMIND / Loading match intelligence</div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/moment" element={<MomentFocus />} />
        <Route path="/studio" element={<Studio />} />
        <Route path="/overlay" element={<Overlay />} />
        <Route path="/fan" element={<Fan />} />
        <Route path="/about" element={<About />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
