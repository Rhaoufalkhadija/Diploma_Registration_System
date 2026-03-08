// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DiplomaRegistry {
    address public admin;

    constructor() {
        admin = msg.sender;
    }

    struct Diploma {
        string name;
        string degree;
        string university;
        uint year;
        bytes32 hash; // preuve cryptographique
        bool exists;
    }

    mapping(string => Diploma) private diplomas;

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can add diploma");
        _;
    }

    function addDiploma(
        string memory cne,
        string memory name,
        string memory degree,
        string memory university,
        uint year
    ) public onlyAdmin {
        require(!diplomas[cne].exists, "Diploma already exists");

        bytes32 diplomaHash = keccak256(abi.encodePacked(name, degree, university, year, cne));

        diplomas[cne] = Diploma(name, degree, university, year, diplomaHash, true);
    }

    function getDiploma(string memory cne)
        public
        view
        returns (
            string memory,
            string memory,
            string memory,
            uint,
            bytes32,
            bool
        )
    {
        Diploma memory d = diplomas[cne];
        return (d.name, d.degree, d.university, d.year, d.hash, d.exists);
    }
}