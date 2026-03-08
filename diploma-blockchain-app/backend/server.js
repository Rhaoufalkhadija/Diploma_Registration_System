const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");

const app = express();
app.use(cors());
app.use(express.json());

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const contractAddress = "METTRE_ADRESSE_CONTRACT";

const abi = [
  "function getDiploma(string memory cne) view returns(string,string,string,uint,bytes32,bool)"
];

const contract = new ethers.Contract(contractAddress, abi, provider);

app.get("/diploma/:cne", async (req, res) => {
    try {
        const result = await contract.getDiploma(req.params.cne);
        res.json({
            name: result[0],
            degree: result[1],
            university: result[2],
            year: result[3],
            hash: result[4],
            exists: result[5]
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(3001, () => {
    console.log("Backend running on port 3001");
});