// ─────────────────────────────────────────────────────────────────────────────
//  hardhat.config.js — Configuration Hardhat pour DiplomaRegistry
//  Usage :
//    npx hardhat node                          → nœud local
//    npx hardhat run scripts/deploy.js --network localhost
//    npx hardhat run scripts/deploy.js --network sepolia
//    npx hardhat test
//    npx hardhat coverage
// ─────────────────────────────────────────────────────────────────────────────

require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// ─────────────────────────────────────────────
//  VARIABLES D'ENVIRONNEMENT
// ─────────────────────────────────────────────

const {
  // Clé privée du compte déployeur (sans 0x)
  DEPLOYER_PRIVATE_KEY = "",

  // Clé API Infura pour accéder aux réseaux publics
  INFURA_API_KEY = "",

  // Clé API Etherscan pour vérifier le contrat on-chain
  ETHERSCAN_API_KEY = "",

  // Clé API CoinMarketCap pour les rapports de gas en USD
  COINMARKETCAP_API_KEY = "",
} = process.env;

// Préfixe 0x si absent
const deployerAccount = DEPLOYER_PRIVATE_KEY
  ? DEPLOYER_PRIVATE_KEY.startsWith("0x")
    ? DEPLOYER_PRIVATE_KEY
    : `0x${DEPLOYER_PRIVATE_KEY}`
  : undefined;

// ─────────────────────────────────────────────
//  CONFIGURATION HARDHAT
// ─────────────────────────────────────────────

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  // ── Compilateur Solidity ─────────────────────
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,          // 200 = bon équilibre deploy cost vs call cost
      },
      viaIR: false,         // Activer si le contrat devient très complexe
      evmVersion: "paris",  // Compatible avec la majorité des réseaux EVM
    },
  },

  // ── Réseaux ──────────────────────────────────
  networks: {

    // Nœud local Hardhat (développement)
    localhost: {
      url:     "http://127.0.0.1:8545",
      chainId: 31337,
    },

    // Réseau interne Hardhat (tests rapides, pas de nœud externe)
    hardhat: {
      chainId: 31337,
      mining: {
        auto:     true,         // Mine un bloc par transaction (mode dev)
        interval: 0,
      },
      accounts: {
        count:             10,  // Nombre de comptes de test générés
        accountsBalance: "10000000000000000000000", // 10 000 ETH par compte
      },
    },

    // Réseau de test Sepolia (Ethereum)
    sepolia: {
      url:      `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      chainId:  11155111,
      accounts: deployerAccount ? [deployerAccount] : [],
      gasPrice: "auto",
    },

    // Réseau principal Ethereum (production)
    mainnet: {
      url:      `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
      chainId:  1,
      accounts: deployerAccount ? [deployerAccount] : [],
      gasPrice: "auto",
    },
  },

  // ── Vérification Etherscan ───────────────────
  // npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
      mainnet: ETHERSCAN_API_KEY,
    },
  },

  // ── Rapport de gas ───────────────────────────
  // Affiché automatiquement après `npx hardhat test`
  gasReporter: {
    enabled:         true,
    currency:        "USD",
    coinmarketcap:   COINMARKETCAP_API_KEY || undefined,
    outputFile:      "gas-report.txt",
    noColors:        true,
    reportFormat:    "terminal",
    showTimeSpent:   true,
    excludeContracts: [],
    src:             "./contracts",
  },

  // ── Coverage ─────────────────────────────────
  // npx hardhat coverage
  solcoverOptions: {
    istanbulReporter: ["html", "lcov", "text"],
  },

  // ── Chemins personnalisés ────────────────────
  paths: {
    sources:   "./contracts",
    tests:     "./test",
    cache:     "./cache",
    artifacts: "./artifacts",
  },

  // ── Mocha (configuration des tests) ─────────
  mocha: {
    timeout: 60_000, // 60s pour laisser le temps aux tx réseau
  },
};