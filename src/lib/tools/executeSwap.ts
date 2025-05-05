import { ethers } from "ethers";

import { getEthereumPriceUsd } from "../ethPriceLoader";
import {
  getAddressesByChainId,
  getErc20Info,
  getEstimatedGasForApproval,
  getEstimatedUniswapCosts,
} from "./utils";
import {
  getERC20Contract,
  getExistingUniswapAllowance,
} from "./utils/get-erc20-info";
import {
  getErc20ApprovalToolClient,
  getUniswapToolClient,
} from "./vincentTools";

const BASE_RPC_URL = process.env.BASE_RPC_URL;
const BASE_CHAIN_ID = "8453";
const WETH_ADDRESS: string =
  getAddressesByChainId(BASE_CHAIN_ID).WETH_ADDRESS || "";
const USDC_ADDRESS: string =
  getAddressesByChainId(BASE_CHAIN_ID).USDC_ADDRESS || "";

async function addApproval({
  baseProvider,
  nativeEthBalance,
  walletAddress,
  wethAmount,
  wEthDecimals,
}: {
  baseProvider: ethers.providers.StaticJsonRpcProvider;
  nativeEthBalance: ethers.BigNumber;
  wEthDecimals: ethers.BigNumber;
  walletAddress: string;
  wethAmount: number;
}): Promise<ethers.BigNumber> {
  const approvalGasCost = await getEstimatedGasForApproval(
    baseProvider,
    BASE_CHAIN_ID,
    WETH_ADDRESS!,
    (wethAmount * 5).toFixed(18).toString(),
    wEthDecimals.toString(),
    walletAddress,
  );

  const requiredApprovalGasCost = approvalGasCost.estimatedGas.mul(
    approvalGasCost.maxFeePerGas,
  );

  console.log("requiredApprovalGasCost", requiredApprovalGasCost);

  if (nativeEthBalance.lt(requiredApprovalGasCost)) {
    throw new Error(
      `Not enough ETH to pay for gas for token approval - balance is ${nativeEthBalance.toString()}, needed ${requiredApprovalGasCost.toString()}`,
    );
  }

  const erc20ApprovalToolClient = getErc20ApprovalToolClient({
    vincentAppVersion: 11,
  });
  const toolExecutionResult = await erc20ApprovalToolClient.execute({
    amountIn: (wethAmount * 5).toFixed(18).toString(), // Approve 5x the amount to spend so we don't wait for approval tx's every time we run
    chainId: BASE_CHAIN_ID,
    pkpEthAddress: walletAddress,
    rpcUrl: BASE_RPC_URL,
    tokenIn: WETH_ADDRESS!,
  });

  console.log("ERC20 Approval Vincent Tool Response:", toolExecutionResult);
  console.log("Logs from approval tool exec:", toolExecutionResult.logs);

  const approvalResult = JSON.parse(toolExecutionResult.response as string);
  if (approvalResult.status === "success" && approvalResult.approvalTxHash) {
    console.log("Approval successful. Waiting for transaction confirmation...");

    const receipt = await baseProvider.waitForTransaction(
      approvalResult.approvalTxHash,
    );

    if (receipt.status === 1) {
      console.log(
        "Approval transaction confirmed:",
        approvalResult.approvalTxHash,
      );
    } else {
      console.error(
        "Approval transaction failed:",
        approvalResult.approvalTxHash,
      );
      throw new Error(
        `Approval transaction failed for hash: ${approvalResult.approvalTxHash}`,
      );
    }
  } else {
    console.log("Approval action failed");
    throw new Error(JSON.stringify(approvalResult, null, 2));
  }

  return approvalGasCost.estimatedGas.mul(approvalGasCost.maxFeePerGas);
}

async function handleSwapExecution({
  approvalGasCost,
  baseProvider,
  nativeEthBalance,
  tokenOutInfo,
  walletAddress,
  wethAmount,
  wEthBalance,
  wEthDecimals,
}: {
  approvalGasCost: ethers.BigNumber;
  baseProvider: ethers.providers.StaticJsonRpcProvider;
  nativeEthBalance: ethers.BigNumber;
  tokenOutInfo: { decimals: ethers.BigNumber };
  wEthBalance: ethers.BigNumber;
  wEthDecimals: ethers.BigNumber;
  walletAddress: string;
  wethAmount: number;
}): Promise<void> {
  const { gasCost, swapCost } = await getEstimatedUniswapCosts({
    amountIn: wethAmount.toFixed(18).toString(),
    pkpEthAddress: walletAddress,
    tokenInAddress: WETH_ADDRESS,
    tokenInDecimals: wEthDecimals,
    tokenOutAddress: USDC_ADDRESS,
    tokenOutDecimals: tokenOutInfo.decimals,
    userChainId: BASE_CHAIN_ID,
    userRpcProvider: baseProvider,
  });

  if (swapCost.amountOutMin.gt(wEthBalance)) {
    throw new Error(
      `Not enough WETH to swap - balance is ${wEthBalance.toString()}, needed ${swapCost.amountOutMin.toString()}`,
    );
  }

  const requiredSwapGasCost = gasCost.estimatedGas.mul(gasCost.maxFeePerGas);
  if (!nativeEthBalance.sub(approvalGasCost).gte(requiredSwapGasCost)) {
    throw new Error(
      `Not enough ETH to pay for gas for swap - balance is ${nativeEthBalance.toString()}, needed ${requiredSwapGasCost.toString()}`,
    );
  }

  const uniswapToolClient = getUniswapToolClient({ vincentAppVersion: 11 });
  const uniswapSwapToolResponse = await uniswapToolClient.execute({
    amountIn: wethAmount.toFixed(18).toString(),
    chainId: BASE_CHAIN_ID,
    pkpEthAddress: walletAddress,
    rpcUrl: BASE_RPC_URL,
    tokenIn: WETH_ADDRESS,
    tokenOut: USDC_ADDRESS,
  });

  console.trace("Swap Vincent Tool Response:", uniswapSwapToolResponse);
  console.log("Logs from swap tool exec:", uniswapSwapToolResponse.logs);

  const swapResult = JSON.parse(uniswapSwapToolResponse.response as string);

  if (swapResult.status === "success" && swapResult.swapTxHash) {
    console.log("Swap successful. Waiting for transaction confirmation...");

    const receipt = await baseProvider.waitForTransaction(
      swapResult.swapTxHash,
    );

    if (receipt.status === 1) {
      console.log("Swap transaction confirmed:", swapResult.swapTxHash);
    } else {
      console.error("Swap transaction failed:", swapResult.swapTxHash);
      throw new Error(
        `Swap transaction failed for hash: ${swapResult.swapTxHash}`,
      );
    }
  } else {
    console.log("Swap action failed", swapResult);
    throw new Error(JSON.stringify(swapResult, null, 2));
  }

  return swapResult.swapTxHash;
}

export async function executeSwap(
  purchaseAmount: number,
  walletAddress: string,
): Promise<void> {
  try {
    console.log("Executing swap...", {
      purchaseAmount,
      walletAddress,
    });

    console.log("Base url: ", BASE_RPC_URL);
    const baseProvider = new ethers.providers.StaticJsonRpcProvider(
      { skipFetchSetup: true, url: BASE_RPC_URL as string },
      // BASE_RPC_URL,
      {
        chainId: 8453, // Base mainnet chainId
        name: "base",
      },
    );

    console.log("WETH Address: ", WETH_ADDRESS);
    const blockNumber = await baseProvider.getBlockNumber();
    console.log("Block number: ", blockNumber);

    const wethContract = getERC20Contract(WETH_ADDRESS!, baseProvider);

    console.log("Before decimals");
    const wEthDecimals = await wethContract.decimals();
    const wEthBalance = await wethContract.balanceOf(walletAddress);
    console.log("before tokenout");
    const tokenOutInfo = await getErc20Info(baseProvider, USDC_ADDRESS);
    console.log("Before Eth price...");
    const ethPriceUsd = await getEthereumPriceUsd();
    console.log("After Eth price...");
    const existingAllowance = await getExistingUniswapAllowance(
      BASE_CHAIN_ID,
      getERC20Contract(WETH_ADDRESS!, baseProvider),
      walletAddress,
    );
    const nativeEthBalance = await baseProvider.getBalance(walletAddress);

    console.log("after details...");

    if (!nativeEthBalance.gt(0)) {
      throw new Error(
        `No native eth balance on account ${walletAddress} - please fund this account with ETH to pay for gas`,
      );
    }

    if (!wEthBalance.gt(0)) {
      throw new Error(
        `No wEth balance for account ${walletAddress} - please fund this account with WETH to swap`,
      );
    }

    const usdAmountStr = purchaseAmount.toString();
    const wethPriceStr = ethPriceUsd.toString();

    const wethAmount = parseFloat(usdAmountStr) / parseFloat(wethPriceStr);
    const wethToSpend = ethers.utils.parseEther(wethAmount.toFixed(18));

    console.log("Job details", {
      ethPriceUsd,
      purchaseAmount,
      usdAmountStr,
      walletAddress,
      wethAmount,
      wethPriceStr,
      existingAllowance: existingAllowance.toString(),
      nativeEthBalance: nativeEthBalance.toString(),
      wethToSpend: wethToSpend.toString(),
    });

    const needsApproval = existingAllowance.lte(wethToSpend);

    let approvalGasCost = ethers.BigNumber.from(0);

    if (needsApproval) {
      approvalGasCost = await addApproval({
        // eslint-disable-next-line sort-keys-plus/sort-keys
        baseProvider,
        nativeEthBalance,
        walletAddress,
        wethAmount,
        wEthDecimals,
      });
    }

    const swapHash = await handleSwapExecution({
      // eslint-disable-next-line sort-keys-plus/sort-keys
      approvalGasCost,
      baseProvider,
      nativeEthBalance,
      tokenOutInfo,
      walletAddress,
      wethAmount,
      wEthBalance,
      wEthDecimals,
    });
  } catch (e) {
    // Catch-and-rethrow is usually an anti-pattern, but Agenda doesn't log failed job reasons to console
    // so this is our chance to log the job failure details using Consola before we throw the error
    // to Agenda, which will write the failure reason to the Agenda job document in Mongo
    const err = e as Error;
    console.error(err.message, err.stack);
    throw e;
  }
}
