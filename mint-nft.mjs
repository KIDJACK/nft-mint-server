import { Lucid, Blockfrost } from "lucid-cardano";
import { config } from "dotenv";

config();

export async function mintNFT(toAddress) {
  const lucid = await Lucid.new(
    new Blockfrost(
      "https://cardano-preprod.blockfrost.io/api/v0",
      process.env.BLOCKFROST_API_KEY
    ),
    process.env.NETWORK
  );

  lucid.selectWalletFromPrivateKey(process.env.PRIVATE_KEY);

  const policy = lucid.utils.nativeScriptFromJson({
    keyHash: process.env.KEY_HASH,
    type: "sig",
  });

  const policyId = lucid.utils.mintingPolicyToId(policy);
  const assetName = "Delegater's NFT";
  const assetNameHex = Buffer.from(assetName, "utf8").toString("hex");
  const unit = policyId + assetNameHex;

  const metadata = {
    [policyId]: {
      [assetName]: {
        name: assetName,
        image: "ipfs://Qmbb11GKDcBUXQxd8yhtnPnYJm178Lp9J5rSC9jjsxxQ4n",
        mediaType: "image/jpeg",
        description: "This is a commemorative NFT for delegators.",
      },
    },
  };

  const tx = await lucid
    .newTx()
    .attachMintingPolicy(policy)
    .mintAssets({ [unit]: 1n })
    .attachMetadata(721, metadata)
    .payToAddress(toAddress, { [unit]: 1n })
    .complete();

  const signedTx = await tx.sign().complete();
  const txHash = await signedTx.submit();

  console.log("? Minted to:", toAddress, "Tx:", txHash);
  return txHash;
}
