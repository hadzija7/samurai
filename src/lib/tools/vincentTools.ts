import { ethers } from "ethers";

import { LIT_RPC } from "@lit-protocol/constants";
import { getVincentToolClient } from "@lit-protocol/vincent-sdk";

const VINCENT_DELEGATEE_PRIVATE_KEY = process.env.VINCENT_DELEGATEE_PRIVATE_KEY;

export const ethersSigner = new ethers.Wallet(
  VINCENT_DELEGATEE_PRIVATE_KEY as string,
  new ethers.providers.StaticJsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE),
);

export const IPFS_CIDS_INDEX_BY_APP_VERSION = {
  11: {
    ERC20_APPROVAL_TOOL: "QmPZ46EiurxMb7DmE9McFyzHfg2B6ZGEERui2tnNNX7cky",
    SPENDING_LIMIT_POLICY: "QmZrG2DFvVDgo3hZgpUn31TUgrHYfLQA2qEpAo3tnKmzhQ",
    UNISWAP_SWAP_TOOL: "QmZbh52JYnutuFURnpwfywfiiHuFoJpqFyFzNiMtbiDNkK",
  },
} as const;

export function getErc20ApprovalToolClient({
  vincentAppVersion,
}: {
  vincentAppVersion: number;
}) {
  if (!(vincentAppVersion in IPFS_CIDS_INDEX_BY_APP_VERSION)) {
    throw new Error(
      `Invalid vincentAppVersion: ${vincentAppVersion}. It must be a key in IPFS_CIDS_INDEX_BY_APP_VERSION.`,
    );
  }

  return getVincentToolClient({
    ethersSigner,
    vincentToolCid:
      IPFS_CIDS_INDEX_BY_APP_VERSION[
        vincentAppVersion as keyof typeof IPFS_CIDS_INDEX_BY_APP_VERSION // Checked explicitly above
      ].ERC20_APPROVAL_TOOL,
  });
}

export function getUniswapToolClient({
  vincentAppVersion,
}: {
  vincentAppVersion: number;
}) {
  if (!(vincentAppVersion in IPFS_CIDS_INDEX_BY_APP_VERSION)) {
    throw new Error(
      `Invalid vincentAppVersion: ${vincentAppVersion}. It must be a key in IPFS_CIDS_INDEX_BY_APP_VERSION.`,
    );
  }

  return getVincentToolClient({
    ethersSigner,
    vincentToolCid:
      IPFS_CIDS_INDEX_BY_APP_VERSION[
        vincentAppVersion as keyof typeof IPFS_CIDS_INDEX_BY_APP_VERSION // Checked explicitly above
      ].UNISWAP_SWAP_TOOL,
  });
}
