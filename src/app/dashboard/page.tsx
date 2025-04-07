'use client';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import './dashboard.css'

export default function Dashboard() {
  const { login, logout, authenticated, ready } = usePrivy();
  const { wallets } = useWallets();
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  useEffect(()=> {
    console.log("Authenticated: ", authenticated)
    console.log("Wallets: ", wallets)
    console.log("Ready: ", ready)
  }, [authenticated, wallets])

  useEffect(() => {
    console.log("Messsages: ", messages)
  }, [messages])

  return (
    <div className="dashboard-container">
      {/* Wallet status top-right */}
      <div className="wallet-status-container">
        {authenticated ? (
          <div className="wallet-info">
            <span className="wallet-address">
              {wallets[0]?.address.slice(0, 6)}...{wallets[0]?.address.slice(-4)}
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
              {msg.role !== 'system' && (msg.role === 'user' ? 'User: ' : 'AI: ')}
              {msg.role !== 'system' ? msg.content : ''}
            </div>
          ))}
        </div>
        <div className="chat-input">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
          />
          <button onClick={handleSubmit} className="send-button">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}