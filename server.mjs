import express from "express";
import { mintNFT } from "./mint-nft.mjs";
import { waitFor2AdaFrom } from "./utils/waitForPayment.mjs";

const app = express();
app.use(express.json());

app.post("/mint", async (req, res) => {
  const address = req.body.address;
  console.log("Received mint request for:", address);

  try {
    await waitFor2AdaFrom(address); // © ‚±‚±‚Å2ADA‚ÌŽx•¥‚¢Šm”F
    const txHash = await mintNFT(address);
    res.status(200).send(txHash);
  } catch (err) {
    console.error("Mint failed:", err.message);
    res.status(500).send(err.message);
  }
});

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
