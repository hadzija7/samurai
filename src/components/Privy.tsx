'use client';

import {PrivyProvider} from '@privy-io/react-auth';

export default function Privy({children}: {children: React.ReactNode}) {
  return (
    <PrivyProvider
      appId="cm8skhxot00m1b2k8v2y7lvia"
      clientId="client-WY5i4HCyQnTQeyfcVZFRpgWm8J9ncVp9o5e39f7yxtXFW"
      config={{
        // Customize Privy's appearance in your app
        appearance: {
          accentColor: '#1A5F7A', // primary-blue
          logo: 'https://your-logo-url',
          showWalletLoginFirst: true,
          defaultWalletProvider: 'embedded-wallet',
          theme: {
            brand: {
              colors: {
                primary: {
                  300: '#75C2F6', // light-blue
                  400: '#1A5F7A', // primary-blue
                  500: '#1A5F7A', // primary-blue
                  600: '#0D3B66', // navy-blue
                },
                success: {
                  400: '#2D936C', // primary-green
                  500: '#2D936C', // primary-green
                },
                warning: {
                  400: '#FFC20A', // primary-yellow
                  500: '#FFC20A', // primary-yellow
                },
                danger: {
                  400: '#F18F01', // amber
                  500: '#F18F01', // amber
                },
              },
            },
            fonts: {
              body: 'system-ui, sans-serif',
            },
            radii: {
              base: '8px',
              xl: '12px',
            },
            shadows: {
              modal: '0 8px 20px rgba(0, 0, 0, 0.3)',
            },
          },
        },
        // Create embedded wallets for users who don't have a wallet
        embeddedWallets: {
          createOnLogin: 'users-without-wallets'
        },
        loginMethods: ['wallet', 'email', 'google', 'discord']
      }}
    >
      {children}
    </PrivyProvider>
  );
}