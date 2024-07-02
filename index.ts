import fs from "fs";
import * as ethers from "ethers";
import {
  MY_SEED_PHRASE_WITH_MISSING_WORDS,
  MISSING_WORD_POSITION,
} from "./put-your-seed-phrase-here";

console.log("Finding matches...");

const incompleteSeed = MY_SEED_PHRASE_WITH_MISSING_WORDS.split(" ");
const incompleteSeedLength = incompleteSeed.length;

const filePath = "./bip-39-wordlist.txt";
const provider = ethers.getDefaultProvider("homestead");

const main = async () => {
  try {
    const data = fs.readFileSync(filePath, "utf8");

    const lines = data.split("\n");

    const seedWords = [];
    lines.forEach((line, index) => {
      seedWords.push(line.trim());
    });

    for (let i = 0; i < seedWords.length; i++) {
      const seedWord = seedWords[i];
      const potentialSeedPhrase = Array.from(incompleteSeed)
        .splice(MISSING_WORD_POSITION, 0, seedWord)
        .join(" ")
        .trim();

      if (ethers.utils.isValidMnemonic(potentialSeedPhrase)) {
        const walletNode = ethers.HDNode.fromMnemonic(potentialSeedPhrase);
        const wallets = [];
        for (let i = 0; i < 100; i++) {
          const path = `m/44'/60'/0'/0/${i}`; // Ethereum default path
          const derivedWallet = walletNode.derivePath(path);
          wallets.push(derivedWallet);
        }
        for (let i = 0; i < wallets.length; i++) {
          const wallet = wallets[i];
          const walletBalance = await provider.getBalance(wallet.address);
          if (walletBalance.gt(ethers.constants.Zero)) {
            console.log(
              "Match found!",
              "Address: ",
              wallet.address,
              "private key:",
              wallet.privateKey
            );
          }
        }
      }
    }
  } catch (err) {
    console.error(err);
  }
};
