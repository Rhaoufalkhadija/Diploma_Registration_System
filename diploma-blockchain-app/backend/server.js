const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");

const app = express();

app.use(cors());
app.use(express.json());

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

const contractAddress = "METTRE_ADRESSE_CONTRACT";

const abi = [
  "function getDiploma(string memory cne) view returns(string,string,string,uint,bool)"
];

const contract = new ethers.Contract(contractAddress, abi, provider);

app.get("/diploma/:cne", async (req, res) => {

  try {

    const cne = req.params.cne;

    const result = await contract.getDiploma(cne);

    res.json({
      name: result[0],
      degree: result[1],
      university: result[2],
      year: result[3],
      exists: result[4]
    });

  } catch (error) {

    res.status(500).json({
      error: "Error retrieving diploma"
    });

  }

});

app.listen(3001, () => {
  console.log("Server running on port 3001");
});
