import { motion } from "motion/react";
import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { BrandMark } from "./components/Brand";

const Home = lazy(() => import("./pages/Home"));
const MomentFocus = lazy(() => import("./pages/MomentFocus"));
const Studio = lazy(() => import("./pages/Studio"));
const Overlay = lazy(() => import("./pages/Overlay"));
const Fan = lazy(() => import("./pages/Fan"));
const About = lazy(() => import("./pages/About"));
const Guide = lazy(() => import("./pages/Guide"));

function RouteLoading() {
  return (
    <div className="route-loading" role="status">
      <BrandMark size={44} />
      <span>Loading match intelligence</span>
    </div>
  );
}

/** Entrance choreography for every route (overlay stays untouched: it is a broadcast source). */
function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="page-transition"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const location = useLocation();
  const overlay = location.pathname.startsWith("/overlay");

  useEffect(() => {
    if (!location.hash) window.scrollTo({ top: 0 });
  }, [location.pathname, location.hash]);

  const routes = (
    <Routes location={location}>
      <Route path="/" element={<Home />} />
      <Route path="/moment" element={<MomentFocus />} />
      <Route path="/studio" element={<Studio />} />
      <Route path="/overlay" element={<Overlay />} />
      <Route path="/fan" element={<Fan />} />
      <Route path="/about" element={<About />} />
      <Route path="/guide" element={<Guide />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  return (
    <Suspense fallback={<RouteLoading />}>
      {overlay ? routes : <PageTransition key={location.pathname}>{routes}</PageTransition>}
    </Suspense>
  );
}
