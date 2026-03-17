// ─────────────────────────────────────────────────────────────────────────────
//  deploy.js — Script de déploiement du contrat DiplomaRegistry
//  Usage : npx hardhat run scripts/deploy.js --network <network>
// ─────────────────────────────────────────────────────────────────────────────

const { ethers, network, artifacts } = require("hardhat");
const fs   = require("fs");
const path = require("path");

// ─────────────────────────────────────────────
//  CONFIGURATION
// ─────────────────────────────────────────────

/** Dossier où sera sauvegardé le fichier de déploiement */
const DEPLOYMENTS_DIR = path.join(__dirname, "..", "deployments");

/** Dossier frontend où sera copié l'ABI + adresse */
const FRONTEND_CONFIG_DIR = path.join(
  __dirname, "..", "..", "frontend", "src", "config"
);

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────

/**
 * Affiche un message formaté dans la console
 */
function log(emoji, message, value = "") {
  const val = value ? `\x1b[36m${value}\x1b[0m` : "";
  console.log(`  ${emoji}  ${message} ${val}`);
}

function separator() {
  console.log("\n" + "─".repeat(60) + "\n");
}

/**
 * Sauvegarde les infos de déploiement dans un fichier JSON
 * pour garder un historique par réseau
 */
function saveDeploymentInfo(networkName, address, deployer, txHash, blockNumber) {
  if (!fs.existsSync(DEPLOYMENTS_DIR)) {
    fs.mkdirSync(DEPLOYMENTS_DIR, { recursive: true });
  }

  const filePath = path.join(DEPLOYMENTS_DIR, `${networkName}.json`);

  // Charger l'historique existant si présent
  let history = [];
  if (fs.existsSync(filePath)) {
    try {
      history = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch {
      history = [];
    }
  }

  const entry = {
    address,
    deployer,
    txHash,
    blockNumber,
    deployedAt: new Date().toISOString(),
  };

  history.push(entry);
  fs.writeFileSync(filePath, JSON.stringify(history, null, 2));
  log("💾", "Déploiement sauvegardé dans", `deployments/${networkName}.json`);
}

/**
 * Copie l'ABI et l'adresse du contrat vers le frontend
 * pour que React puisse interagir avec le contrat
 */
async function syncFrontend(networkName, contractAddress) {
  try {
    const artifact = await artifacts.readArtifact("DiplomaRegistry");

    if (!fs.existsSync(FRONTEND_CONFIG_DIR)) {
      fs.mkdirSync(FRONTEND_CONFIG_DIR, { recursive: true });
    }

    // Écrire le fichier de config frontend
    const config = {
      contractAddress,
      network: networkName,
      abi: artifact.abi,
    };

    const configPath = path.join(FRONTEND_CONFIG_DIR, "contract.json");
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    log("⚛️ ", "Config frontend mise à jour dans", "frontend/src/config/contract.json");
  } catch (err) {
    console.warn("\n  ⚠️  Impossible de synchroniser le frontend :", err.message);
  }
}

// ─────────────────────────────────────────────
//  MAIN
// ─────────────────────────────────────────────

async function main() {
  separator();
  console.log("  🎓  DÉPLOIEMENT — DiplomaRegistry");
  separator();

  // ── Infos réseau ────────────────────────────
  const networkName = network.name;
  const [deployer]  = await ethers.getSigners();
  const balance     = await ethers.provider.getBalance(deployer.address);

  log("🌐", "Réseau           :", networkName);
  log("👤", "Déployeur        :", deployer.address);
  log("💰", "Balance          :", `${ethers.formatEther(balance)} ETH`);

  separator();

  // ── Déploiement ──────────────────────────────
  log("⏳", "Déploiement en cours...");

  const DiplomaFactory = await ethers.getContractFactory("DiplomaRegistry");
  const diploma        = await DiplomaFactory.deploy();

  log("⛓️ ", "Transaction hash :", diploma.deploymentTransaction()?.hash ?? "N/A");
  log("⏳", "En attente de confirmation...");

  await diploma.waitForDeployment();

  const contractAddress = await diploma.getAddress();
  const deployTx        = diploma.deploymentTransaction();
  const receipt         = await deployTx?.wait(1);

  separator();
  log("✅", "Contrat déployé à :", contractAddress);
  log("📦", "Block numéro      :", receipt?.blockNumber?.toString() ?? "N/A");
  log("⛽", "Gas utilisé       :", receipt?.gasUsed?.toString() ?? "N/A");
  separator();

  // ── Vérification post-déploiement ────────────
  log("🔍", "Vérification : lecture de l'admin...");
  const adminAddress = await diploma.admin();
  log("🔐", "Admin du contrat  :", adminAddress);

  if (adminAddress.toLowerCase() !== deployer.address.toLowerCase()) {
    throw new Error("❌ L'admin du contrat ne correspond pas au déployeur !");
  }
  log("✅", "Admin vérifié avec succès !");

  separator();

  // ── Persistance ──────────────────────────────
  saveDeploymentInfo(
    networkName,
    contractAddress,
    deployer.address,
    deployTx?.hash ?? "",
    receipt?.blockNumber ?? 0
  );

  await syncFrontend(networkName, contractAddress);

  separator();
  console.log("  🎉  Déploiement terminé avec succès !\n");

  // ── Conseil réseau ────────────────────────────
  if (networkName !== "localhost" && networkName !== "hardhat") {
    log(
      "🔎",
      "Vérifiez le contrat sur Etherscan :",
      `https://sepolia.etherscan.io/address/${contractAddress}`
    );
  }

  separator();
}

// ─────────────────────────────────────────────
//  ENTRYPOINT
// ─────────────────────────────────────────────

main().catch((error) => {
  console.error("\n  ❌  Erreur lors du déploiement :\n");
  console.error(error);
  process.exitCode = 1;
});