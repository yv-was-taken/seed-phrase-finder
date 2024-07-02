import fs from "fs";
import { ethers, HDNodeWallet, Wallet } from "ethers";
import {
  MY_SEED_PHRASE_WITH_MISSING_WORDS,
  MISSING_WORD_POSITION,
  CUSTOM_PROVIDER,
} from "./config";

console.log("Finding matches...");

const incompleteSeed = MY_SEED_PHRASE_WITH_MISSING_WORDS.split(" ");
const incompleteSeedLength = incompleteSeed.length;

const filePath = "./bip-39-wordlist.txt";
const provider = CUSTOM_PROVIDER
  ? new ethers.JsonRpcProvider(
    CUSTOM_PROVIDER 
    )
  : ethers.getDefaultProvider("homestead");
const isSeedPhraseValid = (seedPhrase) => {
  try {
    const wallet = Wallet.fromPhrase(seedPhrase);
    // If no error is thrown, the seed phrase is valid
    return true;
  } catch (error) {
    //    console.error(error);
    // If an error is thrown, the seed phrase is not valid
    return false;
  }
};

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
      const potentialSeedPhrase = incompleteSeed
        .toSpliced(MISSING_WORD_POSITION, 0, seedWord)
        .join(" ");

      if (isSeedPhraseValid(potentialSeedPhrase)) {
        const walletNode = Wallet.fromPhrase(potentialSeedPhrase);
        //    const path = walletNode.path;
        //    console.log(path);
        //    return;
        const wallets = [];
        for (let i = 0; i < 100; i++) {
          //m/44'/60'/0'/0/0
          const derivedWallet = walletNode.deriveChild(i);
          wallets.push(derivedWallet);
        }
        for (let i = 0; i < wallets.length; i++) {
          const wallet = wallets[i];
          const walletBalance = await provider.getBalance(wallet.address);
          if (walletBalance > BigInt("0")) {
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
    console.log("Search complete.");
  } catch (err) {
    console.error(err);
  }
};

main();
