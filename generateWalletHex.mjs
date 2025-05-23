import { generatePrivateKey, getAddressDetails, Lucid } from "lucid-cardano";

const lucid = await Lucid.new(undefined, "Preprod");

// �@ �閧���iBase16�j
const sk = generatePrivateKey(); // ed25519_sk...
console.log("Private Key:\n", sk);

// �A �A�h���X�iBech32�j
lucid.selectWalletFromPrivateKey(sk);
const addr = await lucid.wallet.address();
console.log("\nBech32 Address:\n", addr);

// �B Base16�A�h���X�i��payment credential��hash�����j
const details = getAddressDetails(addr);
console.log("\nPayment Key Hash (Base16):\n", details.paymentCredential.hash);
