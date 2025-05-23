import { Blockfrost, Lucid } from "lucid-cardano";
import "dotenv/config";

const BLOCKFROST_API_KEY = process.env.BLOCKFROST_API_KEY;
const NETWORK = process.env.NETWORK?.toLowerCase() || "preprod";
const MINT_ADDRESS = process.env.MINT_ADDRESS; // addr_test...

// Lucidセットアップ
export async function initLucid() {
  const lucid = await Lucid.new(
    new Blockfrost(`https://cardano-${NETWORK}.blockfrost.io/api/v0`, BLOCKFROST_API_KEY),
    NETWORK
  );
  return lucid;
}

// 指定アドレスから2ADA以上のUTXOを受信したか確認（10秒間隔で最大10回リトライ）
export async function waitFor2AdaFrom(senderAddress) {
  const lucid = await initLucid();
  console.log(`?? ${senderAddress} からの2ADA受信を待機中...`);

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
          console.log(`? 2ADA以上の受信を確認しました (${ada} lovelace)`);
          return;
        }
      }
    }

    console.log(`? 受信確認リトライ中 (${i + 1}/${maxAttempts})...`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error("? 受信確認タイムアウト：2ADAの送金が確認できませんでした");
}
