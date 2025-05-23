import { Blockfrost, Lucid } from "lucid-cardano";
import "dotenv/config";

const BLOCKFROST_API_KEY = process.env.BLOCKFROST_API_KEY;
const NETWORK = process.env.NETWORK?.toLowerCase() || "preprod";
const MINT_ADDRESS = process.env.MINT_ADDRESS; // addr_test...

// Lucid�Z�b�g�A�b�v
export async function initLucid() {
  const lucid = await Lucid.new(
    new Blockfrost(`https://cardano-${NETWORK}.blockfrost.io/api/v0`, BLOCKFROST_API_KEY),
    NETWORK
  );
  return lucid;
}

// �w��A�h���X����2ADA�ȏ��UTXO����M�������m�F�i10�b�Ԋu�ōő�10�񃊃g���C�j
export async function waitFor2AdaFrom(senderAddress) {
  const lucid = await initLucid();
  console.log(`?? ${senderAddress} �����2ADA��M��ҋ@��...`);

  const maxAttempts = 10;
  const delayMs = 10000;

  for (let i = 0; i < maxAttempts; i++) {
    const utxos = await lucid.utxosAt(MINT_ADDRESS);

    for (const utxo of utxos) {
      const inputTx = await lucid.txBuilder.txDetails(utxo.txHash);
      const sender = inputTx?.inputs?.[0]?.address;

      if (sender === senderAddress) {
        const ada = BigInt(utxo.assets.lovelace || 0n);
        if (ada >= 2_000_000n) {
          console.log(`? 2ADA�ȏ�̎�M���m�F���܂��� (${ada} lovelace)`);
          return;
        }
      }
    }

    console.log(`? ��M�m�F���g���C�� (${i + 1}/${maxAttempts})...`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error("? ��M�m�F�^�C���A�E�g�F2ADA�̑������m�F�ł��܂���ł���");
}
