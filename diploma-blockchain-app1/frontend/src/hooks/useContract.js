// src/hooks/useContract.js
// ─────────────────────────────────────────────
//  Hook pour interagir avec le smart contract
//  via MetaMask (BrowserProvider)
// ─────────────────────────────────────────────

import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI } from "../config/contract";

export function useContract() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [account, setAccount]           = useState(null);
  const [error, setError]               = useState(null);

  /** Connecte MetaMask et retourne le contrat signé */
  const getSignedContract = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask non détecté. Veuillez l'installer.");
    }
    setIsConnecting(true);
    setError(null);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      setAccount(await signer.getAddress());
      return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  /** Ajoute un diplôme sur la blockchain */
  const addDiploma = useCallback(async (data) => {
    const contract = await getSignedContract();
    const tx = await contract.addDiploma(
      data.cne.trim(),
      data.studentName.trim(),
      data.degree.trim(),
      data.fieldOfStudy.trim(),
      data.university.trim(),
      Number(data.year)
    );
    return await tx.wait(1);
  }, [getSignedContract]);

  return { addDiploma, getSignedContract, isConnecting, account, error, setError };
}