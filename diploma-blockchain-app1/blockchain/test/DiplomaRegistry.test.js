// blockchain/test/DiplomaRegistry.test.js
// ─────────────────────────────────────────────
//  Tests unitaires — DiplomaRegistry
//  Usage : npx hardhat test
//          npx hardhat coverage
// ─────────────────────────────────────────────

const { expect }       = require("chai");
const { ethers }       = require("hardhat");
const { loadFixture }  = require("@nomicfoundation/hardhat-toolbox/network-helpers");

// ── Fixture partagée ────────────────────────
async function deployFixture() {
  const [admin, other] = await ethers.getSigners();
  const Factory        = await ethers.getContractFactory("DiplomaRegistry");
  const contract       = await Factory.deploy();
  await contract.waitForDeployment();
  return { contract, admin, other };
}

const SAMPLE = {
  cne:          "R123456789",
  studentName:  "Fatima Zahra Alaoui",
  degree:       "Master",
  fieldOfStudy: "Génie Informatique",
  university:   "Université Mohammed V",
  year:         2024,
};

// ─────────────────────────────────────────────
describe("DiplomaRegistry", () => {

  // ── Déploiement ────────────────────────────
  describe("Déploiement", () => {
    it("doit définir l'admin comme le déployeur", async () => {
      const { contract, admin } = await loadFixture(deployFixture);
      expect(await contract.admin()).to.equal(admin.address);
    });

    it("doit initialiser totalDiplomas à 0", async () => {
      const { contract } = await loadFixture(deployFixture);
      expect(await contract.totalDiplomas()).to.equal(0n);
    });
  });

  // ── Ajout de diplôme ───────────────────────
  describe("addDiploma", () => {
    it("doit ajouter un diplôme valide", async () => {
      const { contract } = await loadFixture(deployFixture);
      await contract.addDiploma(
        SAMPLE.cne, SAMPLE.studentName, SAMPLE.degree,
        SAMPLE.fieldOfStudy, SAMPLE.university, SAMPLE.year
      );
      expect(await contract.totalDiplomas()).to.equal(1n);
    });

    it("doit émettre l'événement DiplomaAdded", async () => {
      const { contract } = await loadFixture(deployFixture);
      await expect(
        contract.addDiploma(
          SAMPLE.cne, SAMPLE.studentName, SAMPLE.degree,
          SAMPLE.fieldOfStudy, SAMPLE.university, SAMPLE.year
        )
      ).to.emit(contract, "DiplomaAdded").withArgs(
        SAMPLE.cne, SAMPLE.studentName, SAMPLE.degree,
        SAMPLE.fieldOfStudy, SAMPLE.university, SAMPLE.year,
        ethers.AbiCoder.defaultAbiCoder, // hash — vérifié séparément
        ethers.AbiCoder.defaultAbiCoder  // issuedAt
      );
    });

    it("doit rejeter un doublon sur le même CNE", async () => {
      const { contract } = await loadFixture(deployFixture);
      await contract.addDiploma(
        SAMPLE.cne, SAMPLE.studentName, SAMPLE.degree,
        SAMPLE.fieldOfStudy, SAMPLE.university, SAMPLE.year
      );
      await expect(
        contract.addDiploma(
          SAMPLE.cne, "Autre Nom", SAMPLE.degree,
          SAMPLE.fieldOfStudy, SAMPLE.university, SAMPLE.year
        )
      ).to.be.revertedWithCustomError(contract, "DiplomaAlreadyExists");
    });

    it("doit rejeter si appelé par un non-admin", async () => {
      const { contract, other } = await loadFixture(deployFixture);
      await expect(
        contract.connect(other).addDiploma(
          SAMPLE.cne, SAMPLE.studentName, SAMPLE.degree,
          SAMPLE.fieldOfStudy, SAMPLE.university, SAMPLE.year
        )
      ).to.be.revertedWithCustomError(contract, "NotAdmin");
    });

    it("doit rejeter un CNE vide", async () => {
      const { contract } = await loadFixture(deployFixture);
      await expect(
        contract.addDiploma("", SAMPLE.studentName, SAMPLE.degree,
          SAMPLE.fieldOfStudy, SAMPLE.university, SAMPLE.year)
      ).to.be.revertedWithCustomError(contract, "InvalidInput");
    });

    it("doit rejeter une année invalide", async () => {
      const { contract } = await loadFixture(deployFixture);
      await expect(
        contract.addDiploma(SAMPLE.cne, SAMPLE.studentName, SAMPLE.degree,
          SAMPLE.fieldOfStudy, SAMPLE.university, 1800)
      ).to.be.revertedWithCustomError(contract, "InvalidInput");
    });
  });

  // ── Lecture de diplôme ─────────────────────
  describe("getDiploma", () => {
    it("doit retourner les données correctes", async () => {
      const { contract } = await loadFixture(deployFixture);
      await contract.addDiploma(
        SAMPLE.cne, SAMPLE.studentName, SAMPLE.degree,
        SAMPLE.fieldOfStudy, SAMPLE.university, SAMPLE.year
      );
      const d = await contract.getDiploma(SAMPLE.cne);
      expect(d.studentName).to.equal(SAMPLE.studentName);
      expect(d.degree).to.equal(SAMPLE.degree);
      expect(d.university).to.equal(SAMPLE.university);
      expect(Number(d.year)).to.equal(SAMPLE.year);
    });

    it("doit lever DiplomaNotFound pour un CNE inconnu", async () => {
      const { contract } = await loadFixture(deployFixture);
      await expect(contract.getDiploma("INCONNU"))
        .to.be.revertedWithCustomError(contract, "DiplomaNotFound");
    });
  });

  // ── Vérification d'intégrité ───────────────
  describe("verifyDiploma", () => {
    it("doit retourner isValid=true pour des données correctes", async () => {
      const { contract } = await loadFixture(deployFixture);
      await contract.addDiploma(
        SAMPLE.cne, SAMPLE.studentName, SAMPLE.degree,
        SAMPLE.fieldOfStudy, SAMPLE.university, SAMPLE.year
      );
      const r = await contract.verifyDiploma(
        SAMPLE.cne, SAMPLE.studentName, SAMPLE.degree,
        SAMPLE.fieldOfStudy, SAMPLE.university, SAMPLE.year
      );
      expect(r.isValid).to.be.true;
    });

    it("doit retourner isValid=false si les données sont altérées", async () => {
      const { contract } = await loadFixture(deployFixture);
      await contract.addDiploma(
        SAMPLE.cne, SAMPLE.studentName, SAMPLE.degree,
        SAMPLE.fieldOfStudy, SAMPLE.university, SAMPLE.year
      );
      const r = await contract.verifyDiploma(
        SAMPLE.cne, "NOM FALSIFIÉ", SAMPLE.degree,
        SAMPLE.fieldOfStudy, SAMPLE.university, SAMPLE.year
      );
      expect(r.isValid).to.be.false;
    });
  });

  // ── Transfert admin ────────────────────────
  describe("transferAdmin", () => {
    it("doit transférer l'admin correctement", async () => {
      const { contract, other } = await loadFixture(deployFixture);
      await contract.transferAdmin(other.address);
      expect(await contract.admin()).to.equal(other.address);
    });

    it("doit émettre AdminTransferred", async () => {
      const { contract, admin, other } = await loadFixture(deployFixture);
      await expect(contract.transferAdmin(other.address))
        .to.emit(contract, "AdminTransferred")
        .withArgs(admin.address, other.address);
    });

    it("doit rejeter l'adresse zéro", async () => {
      const { contract } = await loadFixture(deployFixture);
      await expect(contract.transferAdmin(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(contract, "ZeroAddress");
    });
  });
});