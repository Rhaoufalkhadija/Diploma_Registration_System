// src/App.jsx
import { useState, useEffect } from "react";
import AddDiploma    from "./components/AddDiploma";
import SearchDiploma from "./components/SearchDiploma";
import axios         from "axios";
import { API_BASE_URL } from "./config/contract";

// ── Onglets de navigation ────────────────────
const TABS = [
  { id: "search", label: "Consulter",    emoji: "🔍" },
  { id: "add",    label: "Enregistrer",  emoji: "🎓" },
];

// ── Barre de stats ───────────────────────────
function StatsBar() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/stats`)
      .then(r => setStats(r.data.stats))
      .catch(() => {});
  }, []);

  return (
    <div className="flex items-center gap-6 px-6 py-3 rounded-xl mb-8"
      style={{ background: "rgba(7,20,40,0.5)", border: "1px solid rgba(245,200,66,0.1)" }}>

      {/* Point vert connecté */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full animate-pulse-slow" style={{ background: "#34d399" }} />
        <span className="text-xs" style={{ color: "#8fa3bf" }}>Blockchain connectée</span>
      </div>

      <div className="h-4 w-px" style={{ background: "rgba(245,200,66,0.1)" }} />

      {/* Total diplômes */}
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: "#8fa3bf" }}>Diplômes enregistrés :</span>
        <span className="text-sm font-semibold mono" style={{ color: "#f5c842" }}>
          {stats ? stats.totalDiplomas : "—"}
        </span>
      </div>

      <div className="h-4 w-px hidden sm:block" style={{ background: "rgba(245,200,66,0.1)" }} />

      {/* Adresse contrat */}
      <div className="hidden sm:flex items-center gap-2 overflow-hidden">
        <span className="text-xs shrink-0" style={{ color: "#8fa3bf" }}>Contrat :</span>
        <span className="text-xs mono truncate" style={{ color: "#8fa3bf", maxWidth: 160 }}>
          {stats?.contractAddress || "—"}
        </span>
      </div>
    </div>
  );
}

// ── App ──────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState("search");

  return (
    <div className="min-h-screen px-4 py-10" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-2xl mx-auto">

        {/* ── En-tête ──────────────────────────── */}
        <header className="text-center mb-10 animate-fade-up" style={{ opacity: 0 }}>
          {/* Sceau / logo */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
            style={{ background: "rgba(245,200,66,0.1)", border: "1px solid rgba(245,200,66,0.3)", boxShadow: "0 0 32px rgba(245,200,66,0.12)" }}>
            <span style={{ fontSize: 30 }}>📜</span>
          </div>

          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2"
            style={{ color: "#e8edf5", letterSpacing: "-0.02em" }}>
            Registre des Diplômes
          </h1>

          <p className="text-sm" style={{ color: "#8fa3bf" }}>
            Système de certification académique décentralisé sur la blockchain
          </p>

          {/* Ligne décorative */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="w-12 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(245,200,66,0.4))" }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#f5c842" }} />
            <div className="w-12 h-px" style={{ background: "linear-gradient(to left, transparent, rgba(245,200,66,0.4))" }} />
          </div>
        </header>

        {/* ── Stats blockchain ─────────────────── */}
        <StatsBar />

        {/* ── Onglets de navigation ─────────────── */}
        <div className="flex gap-2 mb-6 p-1 rounded-xl"
          style={{ background: "rgba(7,20,40,0.6)", border: "1px solid rgba(245,200,66,0.1)" }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  background:  isActive ? "rgba(245,200,66,0.15)" : "transparent",
                  color:       isActive ? "#f5c842" : "#8fa3bf",
                  border:      isActive ? "1px solid rgba(245,200,66,0.25)" : "1px solid transparent",
                  fontFamily:  "'DM Sans', sans-serif",
                }}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Contenu actif ────────────────────── */}
        <div key={activeTab}>
          {activeTab === "search" && <SearchDiploma />}
          {activeTab === "add"    && <AddDiploma />}
        </div>

        {/* ── Footer ───────────────────────────── */}
        <footer className="text-center mt-10">
          <p className="text-xs" style={{ color: "rgba(143,163,191,0.45)" }}>
            Données chiffrées · Immuables · Vérifiables publiquement
          </p>
        </footer>

      </div>
    </div>
  );
}
