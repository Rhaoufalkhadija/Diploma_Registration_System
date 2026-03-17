// src/components/QRCodeDisplay.jsx
import { useState } from "react";
import QRCode from "react-qr-code";

const IconDownload = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const IconCopy = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

/**
 * Génère un QR Code pour les données d'un diplôme
 * avec options de téléchargement et copie du lien
 */
export default function QRCodeDisplay({ diploma }) {
  const [copied, setCopied] = useState(false);

  if (!diploma) return null;

  // Construit un objet minimal pour le QR code
  const qrPayload = JSON.stringify({
    cne:         diploma.cne,
    studentName: diploma.studentName,
    degree:      diploma.degree,
    university:  diploma.university,
    year:        diploma.year,
    hash:        diploma.diplomaHash,
  });

  // Télécharge le QR Code en SVG
  const handleDownload = () => {
    const svg  = document.getElementById("diploma-qr-svg");
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `diplome-${diploma.cne}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copie le payload dans le presse-papier
  const handleCopy = async () => {
    await navigator.clipboard.writeText(qrPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-6 animate-fade-in">
      {/* Séparateur */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px" style={{ background: "rgba(245,200,66,0.12)" }} />
        <span className="text-xs font-medium" style={{ color: "#8fa3bf", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          QR Code de vérification
        </span>
        <div className="flex-1 h-px" style={{ background: "rgba(245,200,66,0.12)" }} />
      </div>

      <div className="flex flex-col items-center gap-4">
        {/* QR Code avec fond blanc (nécessaire pour scanner) */}
        <div className="p-4 rounded-xl" style={{ background: "#fff", boxShadow: "0 4px 24px rgba(0,0,0,0.35)" }}>
          <QRCode
            id="diploma-qr-svg"
            value={qrPayload}
            size={180}
            bgColor="#ffffff"
            fgColor="#071428"
            level="H"
          />
        </div>

        {/* Sous-titre */}
        <p className="text-xs text-center" style={{ color: "#8fa3bf", maxWidth: 220 }}>
          Scannez ce code pour vérifier l'authenticité du diplôme
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
            style={{ background: "rgba(245,200,66,0.1)", color: "#f5c842", border: "1px solid rgba(245,200,66,0.2)" }}
          >
            <IconDownload /> Télécharger SVG
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
            style={{ background: "rgba(139,167,191,0.08)", color: "#8fa3bf", border: "1px solid rgba(139,167,191,0.15)" }}
          >
            <IconCopy /> {copied ? "Copié !" : "Copier données"}
          </button>
        </div>
      </div>
    </div>
  );
}
