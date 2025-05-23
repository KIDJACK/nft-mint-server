// .env ��ǂݍ���
import dotenv from "dotenv";
dotenv.config(); 

import express from "express";
import cors from "cors";
import { Lucid, Blockfrost } from "lucid-cardano";

// ���[�e�B���e�B�֐��F������ �� Hex
function stringToHex(str) {
  return Buffer.from(str, "utf8").toString("hex");
}

// Express������
const app = express();
app.use(cors());
app.use(express.json()); // JSON�{�f�B���󂯎��

// Lucid������
const lucid = await Lucid.new(
  new Blockfrost(
    "https://cardano-preprod.blockfrost.io/api/v0",
    process.env.BLOCKFROST_API_KEY
  ),
  "Preprod"
);

// �閧����.env����擾���đI��
const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  console.error("PRIVATE_KEY �� .env �ɐݒ肳��Ă��܂���");
  process.exit(1);
}
lucid.selectWalletFromPrivateKey(privateKey);

// POST /mint �G���h�|�C���g
app.post("/mint", async (req, res) => {
  try {
    const toAddress = req.body.address;
    if (!toAddress) {
      return res.status(400).json({ error: "����A�h���X���w�肵�Ă�������" });
    }

    // �|���V�[�쐬�iKeyHash��.env����擾�j
    const policy = lucid.utils.nativeScriptFromJson({
      type: "sig",
      keyHash: process.env.KEY_HASH,
    });
    const policyId = lucid.utils.mintingPolicyToId(policy);

    // �A�Z�b�g����Hex�ϊ�
    const assetName = process.env.ASSET_NAME || "DelegatersNFT";
    const assetNameHex = stringToHex(assetName);
    const unit = policyId + assetNameHex;

    // ���^�f�[�^�iCIP-25�����j
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

    // �g�����U�N�V�����쐬 �� ���� �� ���M
    const tx = await lucid
      .newTx()
      .attachMintingPolicy(policy)
      .mintAssets({ [unit]: 1n })
      .attachMetadata(721, metadata)
      .payToAddress(toAddress, { [unit]: 1n })
      .complete();

    const signedTx = await tx.sign().complete();
    const txHash = await signedTx.submit();

    // �������X�|���X
    res.json({ txHash });
  } catch (err) {
    console.error("Mint�����ŃG���[:", err);
    res.status(500).json({ error: "Mint�Ɏ��s���܂���", detail: err.message });
  }
});

// �T�[�o�[�N��
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`NFT Mint�T�[�o�[�� http://localhost:${PORT} �ŋN����`);
});
