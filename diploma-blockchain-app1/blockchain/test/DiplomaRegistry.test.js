// ─────────────────────────────────────────────────────────────────────────────
//  hardhat.config.js — Configuration Hardhat pour DiplomaRegistry
//  Usage :
//    npx hardhat node                                              → nœud local
//    npx hardhat run scripts/deploy.js --network localhost         → déploiement local
//    npx hardhat run scripts/deploy.js --network sepolia           → déploiement Sepolia
//    npx hardhat verify --network sepolia <CONTRACT_ADDRESS>       → vérification Etherscan
//    npx hardhat test                                              → tests
//    npx hardhat coverage                                          → couverture de code
//    npx hardhat size-contracts                                    → taille des contrats
// ─────────────────────────────────────────────────────────────────────────────

require("@nomicfoundation/hardhat-toolbox");
require("hardhat-contract-sizer");
require("dotenv").config();

// ─────────────────────────────────────────────
//  VARIABLES D'ENVIRONNEMENT
// ─────────────────────────────────────────────

const {
  // Clé privée du compte déployeur (avec ou sans préfixe 0x)
  DEPLOYER_PRIVATE_KEY = "",

  // Clé API Infura pour les réseaux publics
  INFURA_API_KEY = "",

  // Clé API Alchemy (alternative à Infura — souvent plus stable)
  ALCHEMY_API_KEY = "",

  // Clé API Etherscan pour la vérification on-chain
  ETHERSCAN_API_KEY = "",

  // Clé API CoinMarketCap pour les rapports de gas en USD
  COINMARKETCAP_API_KEY = "",

  // Forking : URL d'un nœud à forker (optionnel)
  FORK_URL = "",
} = process.env;

// ── Validation au démarrage ──────────────────
const requiredForDeploy = ["sepolia", "mainnet"];
const activeNetwork     = process.env.HARDHAT_NETWORK ?? "hardhat";

if (requiredForDeploy.includes(activeNetwork)) {
  if (!DEPLOYER_PRIVATE_KEY) {
    throw new Error(`❌  DEPLOYER_PRIVATE_KEY manquant dans .env (réseau : ${activeNetwork})`);
  }
  if (!INFURA_API_KEY && !ALCHEMY_API_KEY) {
    throw new Error(`❌  INFURA_API_KEY ou ALCHEMY_API_KEY requis pour le réseau : ${activeNetwork}`);
  }
}

// ── Normalisation de la clé privée ──────────
const deployerAccount = DEPLOYER_PRIVATE_KEY
  ? [DEPLOYER_PRIVATE_KEY.startsWith("0x")
      ? DEPLOYER_PRIVATE_KEY
      : `0x${DEPLOYER_PRIVATE_KEY}`]
  : [];

// ── URLs RPC (Alchemy en priorité, Infura en fallback) ──
const rpcUrl = (network) =>
  ALCHEMY_API_KEY
    ? `https://eth-${network}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
    : `https://${network}.infura.io/v3/${INFURA_API_KEY}`;

// ─────────────────────────────────────────────
//  CONFIGURATION HARDHAT
// ─────────────────────────────────────────────

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {

  // ── Compilateur Solidity ─────────────────────
  solidity: {
    compilers: [
      {
        version: "0.8.19",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,           // 200 = bon équilibre coût déploiement / appel
          },
          viaIR:      false,     // Activer pour contrats très complexes
          evmVersion: "paris",   // Compatible avec la majorité des réseaux EVM
          metadata: {
            // Nécessaire pour la vérification Etherscan reproductible
            bytecodeHash: "ipfs",
          },
        },
      },
    ],
  },

  // ── Réseaux ──────────────────────────────────
  networks: {

    // ┌─ Réseau interne Hardhat (tests unitaires rapides) ─┐
    hardhat: {
      chainId: 31337,
      mining: {
        auto:     true,    // Un bloc par transaction (mode dev)
        interval: 0,
      },
      accounts: {
        count:           10,
        accountsBalance: "10000000000000000000000", // 10 000 ETH par compte
      },
      // Décommenter pour forker un réseau public (ex: mainnet)
      // forking: FORK_URL
      //   ? { url: FORK_URL, enabled: true }
      //   : undefined,
      loggingEnabled: false,
    },

    // ┌─ Nœud local (npx hardhat node) ──────────┐
    localhost: {
      url:     "http://127.0.0.1:8545",
      chainId: 31337,
    },

    // ┌─ Réseau de test Sepolia ──────────────────┐
    sepolia: {
      url:      rpcUrl("sepolia"),
      chainId:  11155111,
      accounts: deployerAccount,
      gasPrice: "auto",
      confirmations:  2,
      timeoutBlocks: 200,
    },

    // ┌─ Réseau principal Ethereum (production) ──┐
    mainnet: {
      url:      rpcUrl("mainnet"),
      chainId:  1,
      accounts: deployerAccount,
      gasPrice: "auto",
      confirmations:  3,
      timeoutBlocks: 300,
      // Garde-fou : limite le gas pour éviter les déploiements accidentels
      gas:           3_000_000,
      gasMultiplier: 1.2,
    },
  },

  // ── Vérification Etherscan ───────────────────
  // npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
      mainnet: ETHERSCAN_API_KEY,
    },
    customChains: [],
  },

  // ── Rapport de gas ───────────────────────────
  // Activé uniquement si REPORT_GAS=true dans .env
  // npx hardhat test → affiche le rapport automatiquement
  gasReporter: {
    enabled:          process.env.REPORT_GAS === "true",
    currency:         "USD",
    coinmarketcap:    COINMARKETCAP_API_KEY || undefined,
    outputFile:       "reports/gas-report.txt",
    noColors:         true,
    reportFormat:     "terminal",
    showTimeSpent:    true,
    showMethodSig:    true,
    excludeContracts: ["Mock"],
    src:              "./contracts",
  },

  // ── Taille des contrats ───────────────────────
  // npx hardhat size-contracts
  // Limite EIP-170 : 24 576 bytes — échoue si dépassée
  contractSizer: {
    alphaSort:         true,
    disambiguatePaths: false,
    runOnCompile:      true,
    strict:            true,
    only:              ["DiplomaRegistry"],
  },

  // ── Coverage ─────────────────────────────────
  // npx hardhat coverage → génère ./coverage/index.html
  solcoverOptions: {
    istanbulReporter: ["html", "lcov", "text"],
    skipFiles:        ["mocks/"],
  },

  // ── Chemins ──────────────────────────────────
  paths: {
    sources:   "./contracts",
    tests:     "./test",
    cache:     "./cache",
    artifacts: "./artifacts",
  },

  // ── Mocha ────────────────────────────────────
  mocha: {
    timeout:  60_000,  // 60s pour les tx réseau
    reporter: "spec",  // Affichage détaillé des tests
    bail:     false,   // Continue même si un test échoue
  },
};
