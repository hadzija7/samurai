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
          theme: 'light',
          accentColor: '#676FFF',
          logo: 'https://your-logo-url'
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