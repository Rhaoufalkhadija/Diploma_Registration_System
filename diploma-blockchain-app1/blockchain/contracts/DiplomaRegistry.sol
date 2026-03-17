// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title DiplomaRegistry
 * @author Diploma Blockchain App
 * @notice Système d'enregistrement immuable de diplômes sur la blockchain
 * @dev Seul l'admin peut enregistrer des diplômes. Les données sont inaltérables.
 */
contract DiplomaRegistry {

    // ─────────────────────────────────────────────
    //  STATE VARIABLES
    // ─────────────────────────────────────────────

    address public admin;
    uint256 public totalDiplomas;

    // ─────────────────────────────────────────────
    //  STRUCTS
    // ─────────────────────────────────────────────

    /**
     * @notice Représente un diplôme enregistré sur la blockchain
     * @param studentName    Nom complet de l'étudiant
     * @param degree         Intitulé du diplôme (ex: Licence, Master, Doctorat)
     * @param fieldOfStudy   Filière ou spécialité
     * @param university     Établissement délivrant le diplôme
     * @param year           Année d'obtention
     * @param diplomaHash    Empreinte cryptographique (keccak256) des données
     * @param issuedAt       Timestamp de l'enregistrement sur la blockchain
     * @param exists         Indique si le diplôme a été enregistré
     */
    struct Diploma {
        string  studentName;
        string  degree;
        string  fieldOfStudy;
        string  university;
        uint16  year;
        bytes32 diplomaHash;
        uint256 issuedAt;
        bool    exists;
    }

    // ─────────────────────────────────────────────
    //  MAPPINGS
    // ─────────────────────────────────────────────

    /// @dev CNE => Diploma
    mapping(string => Diploma) private diplomas;

    /// @dev Liste des CNE enregistrés (pour itération off-chain)
    string[] private cneList;

    // ─────────────────────────────────────────────
    //  EVENTS
    // ─────────────────────────────────────────────

    /**
     * @notice Émis lors de l'ajout d'un nouveau diplôme
     */
    event DiplomaAdded(
        string  indexed cne,
        string  studentName,
        string  degree,
        string  fieldOfStudy,
        string  university,
        uint16  year,
        bytes32 diplomaHash,
        uint256 issuedAt
    );

    /**
     * @notice Émis lors d'un transfert de l'administration
     */
    event AdminTransferred(address indexed previousAdmin, address indexed newAdmin);

    // ─────────────────────────────────────────────
    //  ERRORS (Solidity 0.8+ custom errors — moins cher en gas)
    // ─────────────────────────────────────────────

    error NotAdmin();
    error DiplomaAlreadyExists(string cne);
    error DiplomaNotFound(string cne);
    error InvalidInput(string reason);
    error ZeroAddress();

    // ─────────────────────────────────────────────
    //  MODIFIERS
    // ─────────────────────────────────────────────

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    modifier diplomaExists(string memory cne) {
        if (!diplomas[cne].exists) revert DiplomaNotFound(cne);
        _;
    }

    modifier diplomaNotExists(string memory cne) {
        if (diplomas[cne].exists) revert DiplomaAlreadyExists(cne);
        _;
    }

    // ─────────────────────────────────────────────
    //  CONSTRUCTOR
    // ─────────────────────────────────────────────

    constructor() {
        admin = msg.sender;
        emit AdminTransferred(address(0), msg.sender);
    }

    // ─────────────────────────────────────────────
    //  ADMIN FUNCTIONS
    // ─────────────────────────────────────────────

    /**
     * @notice Ajoute un diplôme pour un étudiant identifié par son CNE
     * @dev Seul l'admin peut appeler cette fonction. Le CNE doit être unique.
     * @param cne          Code National Étudiant (identifiant unique)
     * @param studentName  Nom complet de l'étudiant
     * @param degree       Intitulé du diplôme
     * @param fieldOfStudy Filière / spécialité
     * @param university   Université ayant délivré le diplôme
     * @param year         Année d'obtention
     */
    function addDiploma(
        string memory cne,
        string memory studentName,
        string memory degree,
        string memory fieldOfStudy,
        string memory university,
        uint16 year
    )
        external
        onlyAdmin
        diplomaNotExists(cne)
    {
        // ── Validations ──────────────────────────
        if (bytes(cne).length == 0)          revert InvalidInput("CNE vide");
        if (bytes(studentName).length == 0)  revert InvalidInput("Nom vide");
        if (bytes(degree).length == 0)       revert InvalidInput("Diplome vide");
        if (bytes(university).length == 0)   revert InvalidInput("Universite vide");
        if (year < 1900 || year > 2100)      revert InvalidInput("Annee invalide");

        // ── Hash cryptographique ─────────────────
        bytes32 hash = keccak256(
            abi.encodePacked(cne, studentName, degree, fieldOfStudy, university, year)
        );

        // ── Stockage ────────────────────────────
        diplomas[cne] = Diploma({
            studentName:  studentName,
            degree:       degree,
            fieldOfStudy: fieldOfStudy,
            university:   university,
            year:         year,
            diplomaHash:  hash,
            issuedAt:     block.timestamp,
            exists:       true
        });

        cneList.push(cne);
        totalDiplomas++;

        emit DiplomaAdded(cne, studentName, degree, fieldOfStudy, university, year, hash, block.timestamp);
    }

    /**
     * @notice Transfère l'administration du contrat à une nouvelle adresse
     * @param newAdmin Adresse du nouvel administrateur
     */
    function transferAdmin(address newAdmin) external onlyAdmin {
        if (newAdmin == address(0)) revert ZeroAddress();
        emit AdminTransferred(admin, newAdmin);
        admin = newAdmin;
    }

    // ─────────────────────────────────────────────
    //  VIEW FUNCTIONS
    // ─────────────────────────────────────────────

    /**
     * @notice Récupère les informations complètes d'un diplôme via le CNE
     * @param cne Code National Étudiant
     * @return studentName   Nom de l'étudiant
     * @return degree        Intitulé du diplôme
     * @return fieldOfStudy  Filière
     * @return university    Université
     * @return year          Année d'obtention
     * @return diplomaHash   Hash keccak256 des données
     * @return issuedAt      Timestamp d'enregistrement
     */
    function getDiploma(string memory cne)
        external
        view
        diplomaExists(cne)
        returns (
            string memory studentName,
            string memory degree,
            string memory fieldOfStudy,
            string memory university,
            uint16  year,
            bytes32 diplomaHash,
            uint256 issuedAt
        )
    {
        Diploma memory d = diplomas[cne];
        return (
            d.studentName,
            d.degree,
            d.fieldOfStudy,
            d.university,
            d.year,
            d.diplomaHash,
            d.issuedAt
        );
    }

    /**
     * @notice Vérifie si un diplôme existe pour un CNE donné
     * @param cne Code National Étudiant
     * @return bool true si le diplôme existe
     */
    function diplomaExistsForCNE(string memory cne) external view returns (bool) {
        return diplomas[cne].exists;
    }

    /**
     * @notice Vérifie l'intégrité d'un diplôme en recalculant son hash
     * @dev Permet à quiconque de vérifier que les données n'ont pas été altérées
     * @param cne          CNE de l'étudiant
     * @param studentName  Nom à vérifier
     * @param degree       Diplôme à vérifier
     * @param fieldOfStudy Filière à vérifier
     * @param university   Université à vérifier
     * @param year         Année à vérifier
     * @return isValid     true si le hash correspond (données intactes)
     * @return storedHash  Hash stocké sur la blockchain
     * @return computedHash Hash recalculé depuis les paramètres fournis
     */
    function verifyDiploma(
        string memory cne,
        string memory studentName,
        string memory degree,
        string memory fieldOfStudy,
        string memory university,
        uint16 year
    )
        external
        view
        diplomaExists(cne)
        returns (bool isValid, bytes32 storedHash, bytes32 computedHash)
    {
        storedHash   = diplomas[cne].diplomaHash;
        computedHash = keccak256(
            abi.encodePacked(cne, studentName, degree, fieldOfStudy, university, year)
        );
        isValid = (storedHash == computedHash);
    }

    /**
     * @notice Retourne la liste de tous les CNE enregistrés
     * @dev Usage off-chain uniquement — peut être coûteux si grande liste
     * @return Liste des CNE
     */
    function getAllCNEs() external view onlyAdmin returns (string[] memory) {
        return cneList;
    }
}
