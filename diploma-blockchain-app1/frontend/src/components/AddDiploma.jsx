// src/components/AddDiploma.jsx
import { useState } from "react";
import { useContract } from "../hooks/useContract";

// ── Icônes SVG inline ────────────────────────
const IconPlus     = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);
const IconLoader   = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
    className="animate-spin">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);
const IconCheck    = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// ── Champs du formulaire ─────────────────────
const FIELDS = [
  { key: "cne",          label: "CNE",          placeholder: "Ex : R123456789", type: "text" },
  { key: "studentName",  label: "Nom complet",   placeholder: "Ex : Fatima Zahra Alaoui", type: "text" },
  { key: "degree",       label: "Diplôme",       placeholder: "Ex : Master, Licence, Doctorat", type: "text" },
  { key: "fieldOfStudy", label: "Filière",       placeholder: "Ex : Génie Informatique", type: "text" },
  { key: "university",   label: "Université",    placeholder: "Ex : Université Mohammed V", type: "text" },
  { key: "year",         label: "Année",         placeholder: new Date().getFullYear().toString(), type: "number" },
];

const EMPTY_FORM = { cne: "", studentName: "", degree: "", fieldOfStudy: "", university: "", year: "" };

export default function AddDiploma() {
  const [form, setForm]       = useState(EMPTY_FORM);
  const [status, setStatus]   = useState("idle"); // idle | loading | success | error
  const [txHash, setTxHash]   = useState("");
  const [errMsg, setErrMsg]   = useState("");
  const [touched, setTouched] = useState({});

  const { addDiploma, isConnecting } = useContract();

  // ── Validation ───────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.cne.trim())          errs.cne = "CNE requis";
    if (!form.studentName.trim())  errs.studentName = "Nom requis";
    if (!form.degree.trim())       errs.degree = "Diplôme requis";
    if (!form.fieldOfStudy.trim()) errs.fieldOfStudy = "Filière requise";
    if (!form.university.trim())   errs.university = "Université requise";
    const y = Number(form.year);
    if (!form.year || y < 1900 || y > 2100) errs.year = "Année invalide (1900–2100)";
    return errs;
  };

  const errors  = validate();
  const isValid = Object.keys(errors).length === 0;

  const handleChange = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const handleBlur   = (key)      => setTouched(t => ({ ...t, [key]: true }));

  // ── Submit ───────────────────────────────────
  const handleSubmit = async () => {
    setTouched(Object.fromEntries(FIELDS.map(f => [f.key, true])));
    if (!isValid) return;

    setStatus("loading");
    setErrMsg("");
    try {
      const receipt = await addDiploma(form);
      setTxHash(receipt.hash);
      setStatus("success");
      setForm(EMPTY_FORM);
      setTouched({});
    } catch (err) {
      const msg = err?.reason ?? err?.message ?? "Erreur inconnue";
      setErrMsg(msg.length > 120 ? msg.slice(0, 120) + "…" : msg);
      setStatus("error");
    }
  };

  const isBusy = status === "loading" || isConnecting;

  return (
    <section className="glass p-8 animate-fade-up" style={{ animationDelay: "0.1s", opacity: 0 }}>

      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(245,200,66,0.12)", border: "1px solid rgba(245,200,66,0.25)" }}>
          <span style={{ fontSize: 20 }}>🎓</span>
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold" style={{ color: "#e8edf5" }}>
            Enregistrer un Diplôme
          </h2>
          <p className="text-xs" style={{ color: "#8fa3bf" }}>
            Les données seront inscrites de façon permanente sur la blockchain
          </p>
        </div>
      </div>

      {/* Formulaire — grille 2 colonnes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger">
        {FIELDS.map(({ key, label, placeholder, type }) => {
          const hasErr = touched[key] && errors[key];
          return (
            <div key={key} className="animate-fade-up" style={{ opacity: 0 }}>
              <label className="block text-xs font-medium mb-1.5"
                style={{ color: hasErr ? "#f87171" : "#8fa3bf", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                {label}
              </label>
              <input
                type={type}
                value={form[key]}
                placeholder={placeholder}
                onChange={e => handleChange(key, e.target.value)}
                onBlur={() => handleBlur(key)}
                disabled={isBusy}
                className="w-full px-4 py-2.5 rounded-lg text-sm transition-all duration-200 outline-none disabled:opacity-50"
                style={{
                  background:   "rgba(7,20,40,0.8)",
                  border:       `1px solid ${hasErr ? "rgba(248,113,113,0.5)" : "rgba(245,200,66,0.15)"}`,
                  color:        "#e8edf5",
                  fontFamily:   "'DM Sans', sans-serif",
                  boxShadow:    hasErr ? "0 0 0 3px rgba(248,113,113,0.08)" : "none",
                }}
                onFocus={e => {
                  e.target.style.border  = "1px solid rgba(245,200,66,0.5)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(245,200,66,0.08)";
                }}
                onBlurCapture={e => {
                  if (!hasErr) {
                    e.target.style.border    = "1px solid rgba(245,200,66,0.15)";
                    e.target.style.boxShadow = "none";
                  }
                }}
              />
              {hasErr && (
                <p className="text-xs mt-1" style={{ color: "#f87171" }}>{errors[key]}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Bouton */}
      <button
        onClick={handleSubmit}
        disabled={isBusy}
        className="mt-7 w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background:  isBusy ? "rgba(245,200,66,0.4)" : "linear-gradient(135deg, #f5c842, #c9a000)",
          color:       "#040d1a",
          fontFamily:  "'DM Sans', sans-serif",
          letterSpacing: "0.02em",
          boxShadow:   isBusy ? "none" : "0 4px 20px rgba(245,200,66,0.2)",
        }}
      >
        {isBusy ? <><IconLoader />&nbsp;Enregistrement…</> : <><IconPlus />&nbsp;Enregistrer sur la Blockchain</>}
      </button>

      {/* Feedback succès */}
      {status === "success" && (
        <div className="mt-4 rounded-lg px-4 py-3 flex items-start gap-3 animate-fade-in"
          style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.25)" }}>
          <span style={{ color: "#34d399", marginTop: 2 }}><IconCheck /></span>
          <div>
            <p className="text-sm font-medium" style={{ color: "#34d399" }}>Diplôme enregistré avec succès !</p>
            {txHash && (
              <p className="text-xs mt-0.5 break-all mono" style={{ color: "#8fa3bf" }}>
                Tx : {txHash}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Feedback erreur */}
      {status === "error" && (
        <div className="mt-4 rounded-lg px-4 py-3 animate-fade-in"
          style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)" }}>
          <p className="text-sm font-medium" style={{ color: "#f87171" }}>Erreur lors de l'enregistrement</p>
          <p className="text-xs mt-0.5" style={{ color: "#8fa3bf" }}>{errMsg}</p>
        </div>
      )}
    </section>
  );
}
