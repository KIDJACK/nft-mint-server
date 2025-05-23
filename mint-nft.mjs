// nft-mint.mjs

import { Lucid, Blockfrost } from "lucid-cardano";
import dotenv from "dotenv";
dotenv.config();

// コマンドライン引数から宛先アドレスを取得
const toAddress = process.argv[2];
if (!toAddress) {
  console.error("宛先アドレスを指定してください");
  process.exit(1);
}

// Lucid初期化（Blockfrost使用）
const lucid = await Lucid.new(
  new Blockfrost(
    "https://cardano-preprod.blockfrost.io/api/v0",
    process.env.BLOCKFROST_API_KEY
  ),
  "Preprod"
);

// 秘密鍵（.envから読み込み）
const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  console.error("PRIVATE_KEY が .env に設定されていません");
  process.exit(1);
}
lucid.selectWalletFromPrivateKey(privateKey);

// ミントポリシー（事前に一致するKeyHashを使う）
const policy = lucid.utils.nativeScriptFromJson({
  type: "sig",
  keyHash: process.env.KEY_HASH,
});
const policyId = lucid.utils.mintingPolicyToId(policy);

// アセット名とユニット（Hex明示）
const assetName = "DelegatersNFT";
const assetNameHex = "44656c656761746572734e4654"; // Hexで指定
const unit = policyId + assetNameHex;

// CIP-25 v1 メタデータ
const metadata = {
  "721": {
    [policyId]: {
      [assetName]: {
        name: "Delegater's NFT",
        image: process.env.NFT_IMAGE_URL,
        mediaType: "image/jpeg",
        description: "Exclusive NFT for Cardano Delegaters",
      },
    },
    version: "1.0",
  },
};

// トランザクション作成・署名・送信
const tx = await lucid
  .newTx()
  .attachMintingPolicy(policy)
  .mintAssets({ [unit]: 1n })
  .attachMetadata(721, metadata)
  .payToAddress(toAddress, { [unit]: 1n })
  .complete();

const signedTx = await tx.sign().complete();
const txHash = await signedTx.submit();

console.log("NFT発行成功！ Tx Hash:", txHash);
