"use client";
import { usePrivy, useSendTransaction, useWallets } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import "./dashboard.css";
import { BASE_CHAIN_ID, Transaction } from "@/lib/utils";

export default function Dashboard() {
  const { login, logout, authenticated, ready } = usePrivy();
  const { wallets } = useWallets();
  const { messages, input, handleInputChange, handleSubmit, status } =
    useChat();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txStatus, setTxStatus] = useState<string>("");
  const { sendTransaction } = useSendTransaction();

  useEffect(() => {
    console.log("Wallets: ", wallets);
    console.log("Ready: ", ready);
  }, [authenticated, wallets]);

  useEffect(() => {
    console.log("Messsages: ", messages);
  }, [messages]);

  const initTransactions = async () => {
    try {
      // Import the storeTransactions function
      const { storeTransactions } = await import("@/lib/transactions");

      // Store empty array to reset transactions
      const result = await storeTransactions([]);

      if (result.success) {
        console.log("Transactions reset successfully");
        setTransactions([]);
      } else {
        console.error("Failed to reset transactions:", result.error);
      }
    } catch (error) {
      console.error("Error initializing transactions:", error);
    }
  };

  useEffect(() => {
    initTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { transactions: fetchedTransactions, error } = await import(
        "@/lib/transactions"
      ).then((module) => module.retrieveTransactions());

      if (error) {
        throw new Error(error);
      }

      console.log("Stored transactions: ", fetchedTransactions);
      if (fetchedTransactions && fetchedTransactions.length > 0) {
        setTransactions(fetchedTransactions);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setTxStatus(
        `Error loading transactions: ${error instanceof Error ? error.message : String(error)}`,
      );

      // Clear error message after 5 seconds
      setTimeout(() => {
        setTxStatus("");
      }, 5000);
    }
  };

  useEffect(() => {
    if (status == "ready") {
      fetchTransactions();
    }
  }, [status]);

  const handleChat = async (e: any) => {
    e.preventDefault();
    messages.push({
      role: "system",
      content: JSON.stringify({
        userAddress: wallets[0].address,
        chainId: wallets[0].chainId,
      }),
      id: crypto.randomUUID(),
      parts: [],
    });
    handleSubmit();
  };

  const submitTransactions = async () => {
    try {
      if (
        !wallets ||
        wallets.length === 0 ||
        !transactions ||
        transactions.length === 0
      ) {
        setTxStatus("No wallet or transactions available");
        return;
      }

      const embeddedWallet = wallets.find(
        (wallet) => wallet.walletClientType === "privy",
      );

      if (!embeddedWallet) {
        setTxStatus("No embedded Privy wallet found");
        return;
      }

      // Display pending status
      setTxStatus("Preparing to submit transactions...");
      console.log("Preparing to submit transactions...");

      for (let i = 0; i < transactions.length; i++) {
        const tx = transactions[i];

        // Prepare transaction parameters
        const txParams = {
          to: tx.to,
          data: tx.data,
          value: tx.value,
        };

        setTxStatus(
          `Sending transaction ${i + 1} of ${transactions.length}...`,
        );
        console.log("Sending transaction:", txParams);

        // Send transaction using Privy wallet
        // const txHash = await embeddedWallet.sendTransaction({
        //   to: txParams.to,
        //   data: txParams.data,
        //   value: txParams.value
        // });

        const txHash = await sendTransaction(
          {
            to: txParams.to,
            data: txParams.data,
            value: txParams.value,
            chainId: BASE_CHAIN_ID,
          },
          {
            address: embeddedWallet.address,
          },
        );

        setTxStatus(`Transaction ${i + 1} submitted with hash: ${txHash}`);
        console.log("Transaction submitted with hash:", txHash);
      }

      // Clear transactions after successful submission
      setTransactions([]);
      setTxStatus("All transactions completed successfully!");

      // Clear status after 5 seconds
      setTimeout(() => {
        setTxStatus("");
      }, 5000);
    } catch (error) {
      console.error("Error submitting transactions:", error);
      setTxStatus(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  return (
    <div className="dashboard-container">
      {/* Wallet status top-right */}
      <div className="wallet-status-container">
        {authenticated ? (
          <div className="wallet-info">
            <span className="wallet-address">
              {wallets[0]?.address.slice(0, 6)}...
              {wallets[0]?.address.slice(-4)}
            </span>
            <button onClick={logout} className="logout-button">
              logout
            </button>
          </div>
        ) : (
          <button onClick={login} className="privy-login-button">
            <span className="katana-icon">🗡</span>
            Connect
          </button>
        )}
      </div>

      {/* Chat interface */}
      <div className="samurai-chat">
        <div className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className="message">
              {msg.role !== "system" &&
                (msg.role === "user" ? "User: " : "AI: ")}
              {msg.role !== "system" ? msg.content : ""}
            </div>
          ))}
        </div>
        <div className="chat-input">
          <form onSubmit={handleChat}>
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message..."
            />
          </form>
          <button
            disabled={
              !authenticated || !transactions || transactions.length === 0
            }
            onClick={submitTransactions}
            className="send-button"
          >
            Execute transaction
          </button>
          {txStatus && <div className="transaction-status">{txStatus}</div>}
        </div>
      </div>
    </div>
  );
}
