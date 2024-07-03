import fs from "fs";
import { ethers, HDNodeWallet, Wallet, Mnemonic } from "ethers";
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
  ? new ethers.JsonRpcProvider(CUSTOM_PROVIDER)
  : ethers.getDefaultProvider("homestead");
const isSeedPhraseValid = (seedPhrase) => {
  try {
    const wallet = Wallet.fromPhrase(seedPhrase);
    // If no error is thrown, the seed phrase is valid
    return true;
  } catch (error) {
    // If an error is thrown, the seed phrase is not valid
    return false;
  }
};

const checkIfSeedPhraseHasTransactions = async (potentialSeedPhrase) => {
  const mnemonic = Mnemonic.fromPhrase(potentialSeedPhrase);

  // so ledger and metamask use different derivation methods for wallets from seed phrases. checking both.
  // making the assumption here that the first wallet in a seed phrase has executed a transaction.
  // these are the two standart derivation methods. any other wallet using non standard derivation methods please PR/create issue!!
  // assuming the first wallet in the derivation method has performed a transaction.
  // NOTE: in the case of the wallet being used as a vault, i.e., having performed zero transactions, this will not detect.
  const ledgerFirstWalletPath = ethers.getAccountPath(0);
  const metamaskFirstWalletPath = ethers.getIndexedAccountPath(0);

  const ledgerWallet = HDNodeWallet.fromMnemonic(
    mnemonic,
    ledgerFirstWalletPath
  );
  const metamaskWallet = HDNodeWallet.fromMnemonic(
    mnemonic,
    metamaskFirstWalletPath
  );

  const ledgerBalance = await provider.getBalance(ledgerWallet.address);

  const metamaskBalance = await provider.getBalance(metamaskWallet.address);

  if (ledgerBalance === 0 && metamaskBalance === 0) return;
  console.log("Match found!", "Seed Phrase: ", potentialSeedPhrase);
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

      if (isSeedPhraseValid(potentialSeedPhrase))
        await checkIfSeedPhraseHasTransactions(potentialSeedPhrase);
    }
    console.log("Search complete.");
  } catch (err) {
    console.error(err);
  }
};

main();
