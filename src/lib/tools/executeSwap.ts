import { ethers } from "ethers";

import { getEthereumPriceUsd } from "../ethPriceLoader";
import {
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

async function addApproval({
  baseProvider,
  nativeEthBalance,
  walletAddress,
  amount,
  tokenDecimals,
  tokenAddress,
}: {
  baseProvider: ethers.providers.StaticJsonRpcProvider;
  nativeEthBalance: ethers.BigNumber;
  tokenDecimals: ethers.BigNumber;
  walletAddress: string;
  amount: number;
  tokenAddress: string;
}): Promise<ethers.BigNumber> {
  const approvalGasCost = await getEstimatedGasForApproval(
    baseProvider,
    BASE_CHAIN_ID,
    tokenAddress,
    (amount * 5).toFixed(tokenDecimals.toNumber()).toString(),
    tokenDecimals.toString(),
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
    amountIn: (amount * 5).toFixed(tokenDecimals.toNumber()).toString(), // Approve 5x the amount to spend so we don't wait for approval tx's every time we run
    chainId: BASE_CHAIN_ID,
    pkpEthAddress: walletAddress,
    rpcUrl: BASE_RPC_URL,
    tokenIn: tokenAddress,
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
  tokenInAddress,
  tokenOutAddress,
  tokenOutInfo,
  walletAddress,
  amount,
  tokenInBalance,
  tokenInDecimals,
}: {
  approvalGasCost: ethers.BigNumber;
  baseProvider: ethers.providers.StaticJsonRpcProvider;
  nativeEthBalance: ethers.BigNumber;
  tokenInAddress: string;
  tokenOutAddress: string;
  tokenOutInfo: { decimals: ethers.BigNumber };
  tokenInBalance: ethers.BigNumber;
  tokenInDecimals: ethers.BigNumber;
  walletAddress: string;
  amount: number;
}): Promise<string> {
  const { gasCost, swapCost } = await getEstimatedUniswapCosts({
    amountIn: amount.toFixed(tokenInDecimals.toNumber()).toString(),
    pkpEthAddress: walletAddress,
    tokenInAddress: tokenInAddress,
    tokenInDecimals: tokenInDecimals,
    tokenOutAddress: tokenOutAddress,
    tokenOutDecimals: tokenOutInfo.decimals,
    userChainId: BASE_CHAIN_ID,
    userRpcProvider: baseProvider,
  });

  if (swapCost.amountOutMin.gt(tokenInBalance)) {
    throw new Error(
      `Not enough tokens to swap - balance is ${tokenInBalance.toString()}, needed ${swapCost.amountOutMin.toString()}`,
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
    amountIn: amount.toFixed(tokenInDecimals.toNumber()).toString(),
    chainId: BASE_CHAIN_ID,
    pkpEthAddress: walletAddress,
    rpcUrl: BASE_RPC_URL,
    tokenIn: tokenInAddress,
    tokenOut: tokenOutAddress,
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
  tokenIn: string,
  tokenOut: string,
  walletAddress: string,
): Promise<void> {
  try {
    console.log("Executing swap...", {
      purchaseAmount,
      walletAddress,
      tokenIn,
      tokenOut,
    });

    const baseProvider = new ethers.providers.StaticJsonRpcProvider(
      { skipFetchSetup: true, url: BASE_RPC_URL as string },
      {
        chainId: 8453, // Base mainnet chainId
        name: "base",
      },
    );

    const tokenInContract = getERC20Contract(tokenIn, baseProvider);

    const tokenInDecimals: any = await tokenInContract.decimals();
    const tokenInName = await tokenInContract.name();
    const tokenInBalance = await tokenInContract.balanceOf(walletAddress);
    const tokenOutInfo = await getErc20Info(baseProvider, tokenOut);
    const ethPriceUsd = await getEthereumPriceUsd();
    const existingAllowance = await getExistingUniswapAllowance(
      BASE_CHAIN_ID,
      getERC20Contract(tokenIn, baseProvider),
      walletAddress,
    );
    const nativeEthBalance = await baseProvider.getBalance(walletAddress);

    if (!nativeEthBalance.gt(0)) {
      throw new Error(
        `No native eth balance on account ${walletAddress} - please fund this account with ETH to pay for gas`,
      );
    }

    if (!tokenInBalance.gt(0)) {
      throw new Error(
        `No token balance for account ${walletAddress} - please fund this account with ${tokenInName} to swap`,
      );
    }

    const usdAmountStr = purchaseAmount.toString();
    const tokenPriceStr = ethPriceUsd.toString();

    const amount = parseFloat(usdAmountStr) / parseFloat(tokenPriceStr);
    const tokenToSpend = ethers.utils.parseEther(
      amount.toFixed(tokenInDecimals.toNumber()),
    );

    console.log("Job details", {
      ethPriceUsd,
      purchaseAmount,
      usdAmountStr,
      walletAddress,
      amount,
      tokenPriceStr,
      existingAllowance: existingAllowance.toString(),
      nativeEthBalance: nativeEthBalance.toString(),
      tokenToSpend: tokenToSpend.toString(),
    });

    const needsApproval = existingAllowance.lte(tokenToSpend);

    let approvalGasCost = ethers.BigNumber.from(0);

    if (needsApproval) {
      approvalGasCost = await addApproval({
        amount,
        baseProvider,
        nativeEthBalance,
        tokenAddress: tokenIn,
        tokenDecimals: tokenInDecimals,
        walletAddress,
      });
    }

    const swapHash = await handleSwapExecution({
      amount,
      approvalGasCost,
      baseProvider,
      nativeEthBalance,
      tokenInAddress: tokenIn,
      tokenInBalance,
      tokenInDecimals,
      tokenOutAddress: tokenOut,
      tokenOutInfo,
      walletAddress,
    });

    console.log("Swap hash: ", swapHash);
  } catch (e) {
    const err = e as Error;
    console.error(err.message, err.stack);
    throw e;
  }
}
