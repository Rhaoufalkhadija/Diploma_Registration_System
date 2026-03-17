// src/components/SearchDiploma.jsx
import { useState } from "react";
import axios from "axios";
import QRCodeDisplay from "./QRCodeDisplay";
import { API_BASE_URL } from "../config/contract";

// ── Icônes ───────────────────────────────────
const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);
const IconLoader = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
    className="animate-spin">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);
const IconShield = ({ valid }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke={valid ? "#34d399" : "#f87171"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    {valid && <polyline points="9 12 11 14 15 10"/>}
    {!valid && <><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>}
  </svg>
);

// ── DiplomaCard ──────────────────────────────
function DiplomaCard({ diploma }) {
  const fields = [
    { label: "Étudiant",    value: diploma.studentName },
    { label: "Diplôme",     value: diploma.degree },
    { label: "Filière",     value: diploma.fieldOfStudy },
    { label: "Université",  value: diploma.university },
    { label: "Année",       value: diploma.year },
    {
      label: "Enregistré le",
      value: diploma.issuedAtDate
        ? new Date(diploma.issuedAtDate).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })
        : "—",
    },
  ];

  return (
    <div className="mt-6 animate-fade-up" style={{ opacity: 0 }}>

      {/* Badge vérifié */}
      <div className="flex items-center gap-2 mb-4 px-4 py-2.5 rounded-lg"
        style={{ background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.2)" }}>
        <IconShield valid={true} />
        <span className="text-sm font-medium" style={{ color: "#34d399" }}>Diplôme authentique — vérifié sur la blockchain</span>
      </div>

      {/* Grille infos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 stagger">
        {fields.map(({ label, value }) => (
          <div key={label} className="rounded-lg px-4 py-3 animate-fade-up"
            style={{ background: "rgba(7,20,40,0.6)", border: "1px solid rgba(245,200,66,0.08)", opacity: 0 }}>
            <p className="text-xs mb-0.5" style={{ color: "#8fa3bf", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
            <p className="text-sm font-medium" style={{ color: "#e8edf5" }}>{value ?? "—"}</p>
          </div>
        ))}
      </div>

      {/* Hash cryptographique */}
      <div className="mt-3 rounded-lg px-4 py-3"
        style={{ background: "rgba(7,20,40,0.6)", border: "1px solid rgba(245,200,66,0.08)" }}>
        <p className="text-xs mb-1" style={{ color: "#8fa3bf", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Hash cryptographique (keccak256)
        </p>
        <p className="text-xs break-all mono" style={{ color: "#f5c842" }}>{diploma.diplomaHash}</p>
      </div>

      {/* QR Code */}
      <QRCodeDisplay diploma={diploma} />
    </div>
  );
}

// ── SearchDiploma ────────────────────────────
export default function SearchDiploma() {
  const [cne, setCne]       = useState("");
  const [diploma, setDiploma] = useState(null);
  const [status, setStatus] = useState("idle");  // idle | loading | success | not_found | error
  const [errMsg, setErrMsg] = useState("");

  const handleSearch = async () => {
    const trimmed = cne.trim();
    if (!trimmed) return;

    setStatus("loading");
    setDiploma(null);
    setErrMsg("");

    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/diploma/${encodeURIComponent(trimmed)}`);
      if (data.success && data.diploma) {
        setDiploma(data.diploma);
        setStatus("success");
      } else {
        setStatus("not_found");
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        setStatus("not_found");
      } else {
        setErrMsg(err?.response?.data?.error ?? err.message ?? "Erreur réseau");
        setStatus("error");
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const isBusy = status === "loading";

  return (
    <section className="glass p-8 animate-fade-up" style={{ animationDelay: "0.2s", opacity: 0 }}>

      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(245,200,66,0.12)", border: "1px solid rgba(245,200,66,0.25)" }}>
          <span style={{ fontSize: 20 }}>🔍</span>
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold" style={{ color: "#e8edf5" }}>
            Consulter un Diplôme
          </h2>
          <p className="text-xs" style={{ color: "#8fa3bf" }}>
            Recherchez par Code National Étudiant (CNE)
          </p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="flex gap-3">
        <input
          type="text"
          value={cne}
          placeholder="Entrez le CNE de l'étudiant…"
          onChange={e => setCne(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isBusy}
          className="flex-1 px-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-200 disabled:opacity-50"
          style={{
            background:  "rgba(7,20,40,0.8)",
            border:      "1px solid rgba(245,200,66,0.15)",
            color:       "#e8edf5",
            fontFamily:  "'DM Sans', sans-serif",
          }}
          onFocus={e => {
            e.target.style.border    = "1px solid rgba(245,200,66,0.5)";
            e.target.style.boxShadow = "0 0 0 3px rgba(245,200,66,0.08)";
          }}
          onBlur={e => {
            e.target.style.border    = "1px solid rgba(245,200,66,0.15)";
            e.target.style.boxShadow = "none";
          }}
        />
        <button
          onClick={handleSearch}
          disabled={isBusy || !cne.trim()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background:   "linear-gradient(135deg, #f5c842, #c9a000)",
            color:        "#040d1a",
            fontFamily:   "'DM Sans', sans-serif",
            whiteSpace:   "nowrap",
            boxShadow:    "0 4px 20px rgba(245,200,66,0.2)",
          }}
        >
          {isBusy ? <IconLoader /> : <IconSearch />}
          {isBusy ? "Recherche…" : "Rechercher"}
        </button>
      </div>

      {/* Skeleton loader */}
      {isBusy && (
        <div className="mt-6 space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-12 rounded-lg shimmer-line" style={{ opacity: 0.6 }} />
          ))}
        </div>
      )}

      {/* Résultat */}
      {status === "success" && diploma && <DiplomaCard diploma={diploma} />}

      {/* Non trouvé */}
      {status === "not_found" && (
        <div className="mt-5 rounded-lg px-4 py-3 flex items-center gap-3 animate-fade-in"
          style={{ background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.2)" }}>
          <IconShield valid={false} />
          <div>
            <p className="text-sm font-medium" style={{ color: "#f87171" }}>Diplôme introuvable</p>
            <p className="text-xs" style={{ color: "#8fa3bf" }}>Aucun diplôme enregistré pour le CNE « {cne.trim()} »</p>
          </div>
        </div>
      )}

      {/* Erreur réseau */}
      {status === "error" && (
        <div className="mt-5 rounded-lg px-4 py-3 animate-fade-in"
          style={{ background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.2)" }}>
          <p className="text-sm font-medium" style={{ color: "#f87171" }}>Erreur de connexion</p>
          <p className="text-xs mt-0.5" style={{ color: "#8fa3bf" }}>{errMsg}</p>
        </div>
      )}
    </section>
  );
}
