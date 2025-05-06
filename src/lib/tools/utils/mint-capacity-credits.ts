import { Wallet, providers } from "ethers";
import { LIT_RPC, LIT_NETWORK } from "@lit-protocol/constants";
import { LitContracts } from "@lit-protocol/contracts-sdk";

const delegateePrivateKey = process.env.VINCENT_DELEGATEE_PRIVATE_KEY;

export async function mintCapacityCredits() {
  const ethersSigner = new Wallet(
    delegateePrivateKey as string,
    new providers.JsonRpcProvider({
      skipFetchSetup: true,
      url: LIT_RPC.CHRONICLE_YELLOWSTONE as string,
    }),
  );

  const litContractClient = new LitContracts({
    signer: ethersSigner,
    network: LIT_NETWORK.Datil,
  });
  await litContractClient.connect();

  const capacityCreditInfo = await litContractClient.mintCapacityCreditsNFT({
    requestsPerKilosecond: 80,
    // requestsPerDay: 14400,
    // requestsPerSecond: 10,
    daysUntilUTCMidnightExpiration: 1,
  });

  console.log(capacityCreditInfo);
}
