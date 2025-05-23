import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { exec } from "child_process";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/mint", async (req, res) => {
  const address = req.body.address;
  if (!address) {
    return res.status(400).send("address is required");
  }

  console.log("Received mint request for:", address);

  // mint-nft.mjs ‚ð CLI Œo—R‚ÅŒÄ‚Ño‚·
  const cmd = `node mint-nft.mjs ${address}`;
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error("Mint error:", error);
      return res.status(500).send(stderr || "Error minting NFT");
    }
    return res.send(stdout);
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`NFT mint server running on port ${port}`);
});
