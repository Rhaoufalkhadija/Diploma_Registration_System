// ─────────────────────────────────────────────────────────────────────────────
//  server.js — Backend API REST pour DiplomaRegistry
//  Usage : node server.js  |  NODE_ENV=production node server.js
// ─────────────────────────────────────────────────────────────────────────────

"use strict";

const express  = require("express");
const cors     = require("cors");
const helmet   = require("helmet");
const morgan   = require("morgan");
const rateLimit = require("express-rate-limit");
const { ethers } = require("ethers");
require("dotenv").config();

// ─────────────────────────────────────────────
//  CONFIGURATION — variables d'environnement
// ─────────────────────────────────────────────

const CONFIG = {
  PORT:             process.env.PORT             || 3001,
  RPC_URL:          process.env.RPC_URL          || "http://127.0.0.1:8545",
  CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS || "",
  ADMIN_PRIVATE_KEY:process.env.ADMIN_PRIVATE_KEY|| "",
  NODE_ENV:         process.env.NODE_ENV         || "development",
  RATE_LIMIT_MAX:   parseInt(process.env.RATE_LIMIT_MAX || "100"),
};

// Validation au démarrage
if (!CONFIG.CONTRACT_ADDRESS) {
  console.error("❌  CONTRACT_ADDRESS manquant dans le fichier .env");
  process.exit(1);
}
if (!CONFIG.ADMIN_PRIVATE_KEY) {
  console.error("❌  ADMIN_PRIVATE_KEY manquant dans le fichier .env");
  process.exit(1);
}

// ─────────────────────────────────────────────
//  ABI — aligné avec DiplomaRegistry.sol v2
// ─────────────────────────────────────────────

const ABI = [
  // Lecture
  "function getDiploma(string cne) view returns (string studentName, string degree, string fieldOfStudy, string university, uint16 year, bytes32 diplomaHash, uint256 issuedAt)",
  "function diplomaExistsForCNE(string cne) view returns (bool)",
  "function verifyDiploma(string cne, string studentName, string degree, string fieldOfStudy, string university, uint16 year) view returns (bool isValid, bytes32 storedHash, bytes32 computedHash)",
  "function totalDiplomas() view returns (uint256)",
  "function admin() view returns (address)",
  "function getAllCNEs() view returns (string[])",

  // Écriture
  "function addDiploma(string cne, string studentName, string degree, string fieldOfStudy, string university, uint16 year)",
  "function transferAdmin(address newAdmin)",

  // Events
  "event DiplomaAdded(string indexed cne, string studentName, string degree, string fieldOfStudy, string university, uint16 year, bytes32 diplomaHash, uint256 issuedAt)",
];

// ─────────────────────────────────────────────
//  BLOCKCHAIN — provider + signers
// ─────────────────────────────────────────────

let provider;
let adminWallet;
let contract;
let contractWithSigner;

async function initBlockchain() {
  try {
    provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);

    // Vérification de la connexion
    const network = await provider.getNetwork();
    console.log(`  🌐  Connecté au réseau : ${network.name} (chainId: ${network.chainId})`);

    adminWallet       = new ethers.Wallet(CONFIG.ADMIN_PRIVATE_KEY, provider);
    contract          = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, ABI, provider);
    contractWithSigner= contract.connect(adminWallet);

    // Vérification que le contrat répond
    const total = await contract.totalDiplomas();
    console.log(`  📜  Contrat opérationnel — ${total} diplôme(s) enregistré(s)`);
    console.log(`  🔐  Admin wallet : ${adminWallet.address}`);
  } catch (err) {
    console.error("❌  Erreur de connexion blockchain :", err.message);
    process.exit(1);
  }
}

// ─────────────────────────────────────────────
//  APP EXPRESS
// ─────────────────────────────────────────────

const app = express();

// ── Middlewares de sécurité ──────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST"],
}));
app.use(express.json({ limit: "10kb" }));

// ── Logging ──────────────────────────────────
if (CONFIG.NODE_ENV !== "test") {
  app.use(morgan(CONFIG.NODE_ENV === "production" ? "combined" : "dev"));
}

// ── Rate limiting ────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      CONFIG.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, error: "Trop de requêtes. Réessayez dans 15 minutes." },
});
app.use("/api/", limiter);

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────

/**
 * Valide qu'un CNE n'est pas vide et ne contient pas de caractères dangereux
 */
function validateCNE(cne) {
  if (!cne || typeof cne !== "string") return false;
  const trimmed = cne.trim();
  return trimmed.length > 0 && trimmed.length <= 50 && /^[a-zA-Z0-9\-_]+$/.test(trimmed);
}

/**
 * Sérialise un résultat de diplôme (gère BigInt)
 */
function serializeDiploma(cne, d) {
  return {
    cne,
    studentName:  d.studentName,
    degree:       d.degree,
    fieldOfStudy: d.fieldOfStudy,
    university:   d.university,
    year:         Number(d.year),
    diplomaHash:  d.diplomaHash,
    issuedAt:     Number(d.issuedAt),
    issuedAtDate: new Date(Number(d.issuedAt) * 1000).toISOString(),
  };
}

/**
 * Wrapper async pour capturer les erreurs dans les routes
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ─────────────────────────────────────────────
//  ROUTES
// ─────────────────────────────────────────────

/**
 * GET /api/health
 * Vérification de l'état du serveur et de la blockchain
 */
app.get("/api/health", asyncHandler(async (req, res) => {
  const [block, total] = await Promise.all([
    provider.getBlockNumber(),
    contract.totalDiplomas(),
  ]);

  res.json({
    success: true,
    status:  "ok",
    blockchain: {
      connected:     true,
      rpcUrl:        CONFIG.RPC_URL,
      latestBlock:   block,
      totalDiplomas: Number(total),
      contractAddress: CONFIG.CONTRACT_ADDRESS,
    },
    server: {
      env:     CONFIG.NODE_ENV,
      uptime:  Math.floor(process.uptime()),
    },
  });
}));

// ─────────────────────────────────────────────

/**
 * GET /api/diploma/:cne
 * Récupère un diplôme par CNE
 */
app.get("/api/diploma/:cne", asyncHandler(async (req, res) => {
  const cne = req.params.cne?.trim();

  if (!validateCNE(cne)) {
    return res.status(400).json({ success: false, error: "CNE invalide." });
  }

  const exists = await contract.diplomaExistsForCNE(cne);
  if (!exists) {
    return res.status(404).json({ success: false, error: `Aucun diplôme trouvé pour le CNE : ${cne}` });
  }

  const d = await contract.getDiploma(cne);
  res.json({ success: true, diploma: serializeDiploma(cne, d) });
}));

// ─────────────────────────────────────────────

/**
 * POST /api/diploma
 * Ajoute un nouveau diplôme (admin uniquement)
 * Body : { cne, studentName, degree, fieldOfStudy, university, year }
 */
app.post("/api/diploma", asyncHandler(async (req, res) => {
  const { cne, studentName, degree, fieldOfStudy, university, year } = req.body;

  // ── Validation ───────────────────────────────
  const errors = [];
  if (!validateCNE(cne))                   errors.push("CNE invalide ou manquant.");
  if (!studentName?.trim())                errors.push("studentName manquant.");
  if (!degree?.trim())                     errors.push("degree manquant.");
  if (!fieldOfStudy?.trim())               errors.push("fieldOfStudy manquant.");
  if (!university?.trim())                 errors.push("university manquant.");
  if (!year || year < 1900 || year > 2100) errors.push("year invalide (1900–2100).");

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  // ── Vérification doublon ─────────────────────
  const alreadyExists = await contract.diplomaExistsForCNE(cne.trim());
  if (alreadyExists) {
    return res.status(409).json({ success: false, error: `Un diplôme existe déjà pour le CNE : ${cne}` });
  }

  // ── Envoi transaction ────────────────────────
  const tx = await contractWithSigner.addDiploma(
    cne.trim(),
    studentName.trim(),
    degree.trim(),
    fieldOfStudy.trim(),
    university.trim(),
    Number(year)
  );

  const receipt = await tx.wait(1);

  res.status(201).json({
    success: true,
    message: "Diplôme enregistré avec succès sur la blockchain.",
    transaction: {
      hash:        tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed:     receipt.gasUsed?.toString(),
    },
  });
}));

// ─────────────────────────────────────────────

/**
 * POST /api/diploma/verify
 * Vérifie l'intégrité cryptographique d'un diplôme
 * Body : { cne, studentName, degree, fieldOfStudy, university, year }
 */
app.post("/api/diploma/verify", asyncHandler(async (req, res) => {
  const { cne, studentName, degree, fieldOfStudy, university, year } = req.body;

  if (!validateCNE(cne)) {
    return res.status(400).json({ success: false, error: "CNE invalide." });
  }

  const exists = await contract.diplomaExistsForCNE(cne.trim());
  if (!exists) {
    return res.status(404).json({ success: false, error: `Aucun diplôme trouvé pour le CNE : ${cne}` });
  }

  const result = await contract.verifyDiploma(
    cne.trim(),
    studentName?.trim() ?? "",
    degree?.trim() ?? "",
    fieldOfStudy?.trim() ?? "",
    university?.trim() ?? "",
    Number(year)
  );

  res.json({
    success: true,
    isValid:      result.isValid,
    storedHash:   result.storedHash,
    computedHash: result.computedHash,
    message: result.isValid
      ? "✅ Diplôme authentique — données intactes."
      : "❌ Diplôme invalide — les données ne correspondent pas au hash enregistré.",
  });
}));

// ─────────────────────────────────────────────

/**
 * GET /api/stats
 * Statistiques globales du registre
 */
app.get("/api/stats", asyncHandler(async (req, res) => {
  const total = await contract.totalDiplomas();
  res.json({
    success: true,
    stats: {
      totalDiplomas:   Number(total),
      contractAddress: CONFIG.CONTRACT_ADDRESS,
      network:         CONFIG.RPC_URL,
    },
  });
}));

// ─────────────────────────────────────────────
//  ERROR HANDLERS
// ─────────────────────────────────────────────

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route introuvable : ${req.method} ${req.path}` });
});

// Erreur globale
app.use((err, req, res, _next) => {
  const isDev = CONFIG.NODE_ENV === "development";

  // Erreurs blockchain connues
  if (err.code === "CALL_EXCEPTION") {
    return res.status(400).json({ success: false, error: "Erreur contrat : " + (err.reason ?? err.message) });
  }
  if (err.code === "INSUFFICIENT_FUNDS") {
    return res.status(402).json({ success: false, error: "Fonds insuffisants pour la transaction." });
  }

  console.error("🔴 Erreur serveur :", err);
  res.status(500).json({
    success: false,
    error:   isDev ? err.message : "Erreur interne du serveur.",
    ...(isDev && { stack: err.stack }),
  });
});

// ─────────────────────────────────────────────
//  DÉMARRAGE
// ─────────────────────────────────────────────

async function start() {
  console.log("\n" + "─".repeat(60));
  console.log("  🎓  DiplomaRegistry — Serveur API");
  console.log("─".repeat(60) + "\n");

  await initBlockchain();

  app.listen(CONFIG.PORT, () => {
    console.log(`\n  🚀  Serveur démarré sur http://localhost:${CONFIG.PORT}`);
    console.log(`  🌍  Environnement : ${CONFIG.NODE_ENV}`);
    console.log("\n" + "─".repeat(60) + "\n");
  });
}

start();

module.exports = app; // export pour les tests