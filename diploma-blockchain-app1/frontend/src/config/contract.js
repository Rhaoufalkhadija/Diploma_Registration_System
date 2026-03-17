// src/config/contract.js
// ─────────────────────────────────────────────
//  Ce fichier est auto-généré par deploy.js
//  Ne pas modifier manuellement.
//  Pour mettre à jour : npx hardhat run scripts/deploy.js --network <network>
// ─────────────────────────────────────────────

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";
export const API_BASE_URL     = import.meta.env.VITE_API_BASE_URL     || "http://localhost:3001";

export const ABI = [
  "function addDiploma(string cne, string studentName, string degree, string fieldOfStudy, string university, uint16 year)",
  "function getDiploma(string cne) view returns (string studentName, string degree, string fieldOfStudy, string university, uint16 year, bytes32 diplomaHash, uint256 issuedAt)",
  "function diplomaExistsForCNE(string cne) view returns (bool)",
  "function verifyDiploma(string cne, string studentName, string degree, string fieldOfStudy, string university, uint16 year) view returns (bool isValid, bytes32 storedHash, bytes32 computedHash)",
  "function totalDiplomas() view returns (uint256)",
  "function admin() view returns (address)",
];