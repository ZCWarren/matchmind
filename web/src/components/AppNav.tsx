import { List, Play, Sparkle, X } from "@phosphor-icons/react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import Brand from "./Brand";
import { EASE } from "./fx";
import JudgeTourModal from "./JudgeTourModal";

export default function AppNav({ matchId }: { matchId?: string }) {
  const [tourOpen, setTourOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const location = useLocation();
  useMotionValueEvent(scrollY, "change", (value) => setScrolled(value > 24));

  const query = matchId ? `?match=${matchId}` : "";
  const links = [
    { to: `/moment${query}`, path: "/moment", label: "Moment" },
    { to: `/studio${query}`, path: "/studio", label: "Studio" },
    { to: `/fan${query}`, path: "/fan", label: "Fan" },
    { to: `/overlay?bg=1${matchId ? `&match=${matchId}` : ""}`, path: "/overlay", label: "Overlay" },
    { to: "/about", path: "/about", label: "About" },
    { to: "/guide", path: "/guide", label: "Guide" },
  ];
  const base = import.meta.env.BASE_URL;

  return (
    <>
      <motion.header
        className={`app-nav ${scrolled ? "scrolled" : ""}`}
        initial={{ y: -28, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
      >
        <Link to="/" className="nav-brand" aria-label="MatchMind home">
          <Brand />
        </Link>
        <nav className="nav-links" aria-label="Product surfaces">
          {links.map((link) => {
            const active = location.pathname === link.path;
            return (
              <NavLink key={link.label} to={link.to} className={active ? "active" : ""}>
                {active && (
                  <motion.span
                    className="nav-active-pill"
                    layoutId="nav-active-pill"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="nav-actions">
          <button type="button" className="nav-tour-btn" onClick={() => setTourOpen(true)}>
            <Sparkle size={14} weight="fill" /> 90s tour
          </button>
          <div className="nav-media">
            <a href={`${base}promo.mp4`} target="_blank" rel="noreferrer" className="nav-film">
              <span className="nav-film-icon"><Play size={10} weight="fill" /></span> Film
            </a>
            <a href={`${base}teaser.mp4`} target="_blank" rel="noreferrer" className="nav-teaser">15s</a>
          </div>
          <button
            type="button"
            className="nav-menu-btn"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={18} /> : <List size={18} />}
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="nav-sheet"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
            {links.map((link, index) => (
              <motion.div
                key={link.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * index, duration: 0.5, ease: EASE }}
              >
                <Link to={link.to} onClick={() => setMenuOpen(false)}>{link.label}</Link>
              </motion.div>
            ))}
            <div className="nav-sheet-foot">
              <button type="button" onClick={() => { setMenuOpen(false); setTourOpen(true); }}>
                <Sparkle size={14} weight="fill" /> 90s tour
              </button>
              <a href={`${base}promo.mp4`} target="_blank" rel="noreferrer"><Play size={12} weight="fill" /> Watch film</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <JudgeTourModal open={tourOpen} onClose={() => setTourOpen(false)} matchId={matchId} />
    </>
  );
}
