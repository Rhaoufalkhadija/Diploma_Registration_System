// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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
        bool exists;
    }

    mapping(string => Diploma) private diplomas;

    event DiplomaAdded(string cne, string name);

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

        diplomas[cne] = Diploma(name, degree, university, year, true);

        emit DiplomaAdded(cne, name);
    }

    function getDiploma(string memory cne)
        public
        view
        returns (
            string memory,
            string memory,
            string memory,
            uint,
            bool
        )
    {
        Diploma memory d = diplomas[cne];

        return (
            d.name,
            d.degree,
            d.university,
            d.year,
            d.exists
        );
    }
}
