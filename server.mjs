// .env を読み込む
import dotenv from "dotenv";
dotenv.config(); 

import express from "express";
import cors from "cors";
import { Lucid, Blockfrost } from "lucid-cardano";

// ユーティリティ関数：文字列 → Hex
function stringToHex(str) {
  return Buffer.from(str, "utf8").toString("hex");
}

// Express初期化
const app = express();
app.use(cors());
app.use(express.json()); // JSONボディを受け取る

// Lucid初期化
const lucid = await Lucid.new(
  new Blockfrost(
    "https://cardano-preprod.blockfrost.io/api/v0",
    process.env.BLOCKFROST_API_KEY
  ),
  "Preprod"
);

// 秘密鍵を.envから取得して選択
const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  console.error("PRIVATE_KEY が .env に設定されていません");
  process.exit(1);
}
lucid.selectWalletFromPrivateKey(privateKey);

// POST /mint エンドポイント
app.post("/mint", async (req, res) => {
  try {
    const toAddress = req.body.address;
    if (!toAddress) {
      return res.status(400).json({ error: "宛先アドレスを指定してください" });
    }

    // ポリシー作成（KeyHashは.envから取得）
    const policy = lucid.utils.nativeScriptFromJson({
      type: "sig",
      keyHash: process.env.KEY_HASH,
    });
    const policyId = lucid.utils.mintingPolicyToId(policy);

    // アセット名とHex変換
    const assetName = process.env.ASSET_NAME || "DelegatersNFT";
    const assetNameHex = stringToHex(assetName);
    const unit = policyId + assetNameHex;

    // メタデータ（CIP-25準拠）
    const metadata = {
      "721": {
        [policyId]: {
          [assetName]: {
            name: "Delegater's NFT",
            image: process.env.NFT_IMAGE_URL,
            mediaType: "image/jpeg",
            description: "Exclusive NFT for Cardano Delegaters",
            artist: "GAIN SPO",
            publisher: "GAme INdustreal Japan Pool",
            url: "https://x.com/GAIN_SPO",
            type: "Deregate Check NFT",
          },
        },
        version: "1.0",
      },
    };

    // トランザクション作成 → 署名 → 送信
    const tx = await lucid
      .newTx()
      .attachMintingPolicy(policy)
      .mintAssets({ [unit]: 1n })
      .attachMetadata(721, metadata)
      .payToAddress(toAddress, { [unit]: 1n })
      .complete();

    const signedTx = await tx.sign().complete();
    const txHash = await signedTx.submit();

    // 成功レスポンス
    res.json({ txHash });
  } catch (err) {
    console.error("Mint処理でエラー:", err);
    res.status(500).json({ error: "Mintに失敗しました", detail: err.message });
  }
});

// サーバー起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`NFT Mintサーバーが http://localhost:${PORT} で起動中`);
});
