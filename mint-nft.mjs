// nft-mint.mjs

import { Lucid, Blockfrost } from "lucid-cardano";
import dotenv from "dotenv";
dotenv.config();

// �R�}���h���C���������父��A�h���X���擾
const toAddress = process.argv[2];
if (!toAddress) {
  console.error("����A�h���X���w�肵�Ă�������");
  process.exit(1);
}

// Lucid�������iBlockfrost�g�p�j
const lucid = await Lucid.new(
  new Blockfrost(
    "https://cardano-preprod.blockfrost.io/api/v0",
    process.env.BLOCKFROST_API_KEY
  ),
  "Preprod"
);

// �閧���i.env����ǂݍ��݁j
const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  console.error("PRIVATE_KEY �� .env �ɐݒ肳��Ă��܂���");
  process.exit(1);
}
lucid.selectWalletFromPrivateKey(privateKey);

// �~���g�|���V�[�i���O�Ɉ�v����KeyHash���g���j
const policy = lucid.utils.nativeScriptFromJson({
  type: "sig",
  keyHash: process.env.KEY_HASH,
});
const policyId = lucid.utils.mintingPolicyToId(policy);

// �A�Z�b�g���ƃ��j�b�g�iHex�����j
const assetName = "DelegatersNFT";
const assetNameHex = "44656c656761746572734e4654"; // Hex�Ŏw��
const unit = policyId + assetNameHex;

// CIP-25 v1 ���^�f�[�^
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

// �g�����U�N�V�����쐬�E�����E���M
const tx = await lucid
  .newTx()
  .attachMintingPolicy(policy)
  .mintAssets({ [unit]: 1n })
  .attachMetadata(721, metadata)
  .payToAddress(toAddress, { [unit]: 1n })
  .complete();

const signedTx = await tx.sign().complete();
const txHash = await signedTx.submit();

console.log("NFT���s�����I Tx Hash:", txHash);
