import { Broadcast, DeviceMobile, Graph, House, Info, Play } from "@phosphor-icons/react";
import { Link, NavLink } from "react-router-dom";
import Brand from "./Brand";

export default function AppNav({ matchId }: { matchId?: string }) {
  const query = matchId ? `?match=${matchId}` : "";
  const links = [
    { to: "/", label: "Home", icon: House, end: true },
    { to: `/moment${query}`, label: "Moment", icon: Graph },
    { to: `/studio${query}`, label: "Studio", icon: Broadcast },
    { to: `/fan${query}`, label: "Fan", icon: DeviceMobile },
    { to: "/guide", label: "Guide", icon: Info },
  ];
  return (
    <header className="app-nav">
      <Link to="/" aria-label="MatchMind home"><Brand /></Link>
      <nav aria-label="Product surfaces">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={label} to={to} end={end} className={({ isActive }) => isActive ? "active" : ""}>
            <Icon size={15} weight="bold" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="nav-proof nav-media">
        <a href={`${import.meta.env.BASE_URL}promo.mp4`} target="_blank" rel="noreferrer"><Play size={12} weight="fill" /> Film</a>
        <a href={`${import.meta.env.BASE_URL}teaser.mp4`} target="_blank" rel="noreferrer">15s cut</a>
      </div>
    </header>
  );
}
