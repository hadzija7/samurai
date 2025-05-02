"use client";

import React, {
  createContext,
  useCallback,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { jwt } from "@lit-protocol/vincent-sdk";

const { decode, isExpired } = jwt;

import { APP_ID, REDIRECT_URI } from "../config";
import { useVincentWebAppClient } from "@/hooks/useVincentWebAppClient";
const APP_JWT_KEY = `${APP_ID}-jwt`;

export interface AuthInfo {
  jwt: string;
  pkp: {
    address: string;
    publicKey: string;
  };
}

interface JwtContextType {
  authInfo: AuthInfo | null | undefined;
  logWithJwt: (token: string | null) => void;
  logOut: () => void;
}

export const JwtContext = createContext<JwtContextType>({
  authInfo: undefined,
  logWithJwt: () => {},
  logOut: () => {},
});

interface JwtProviderProps {
  children: ReactNode;
}

export const JwtProvider: React.FC<JwtProviderProps> = ({ children }) => {
  const vincentWebAppClient = useVincentWebAppClient();
  const [authInfo, setAuthInfo] = useState<AuthInfo | null | undefined>(
    undefined,
  );

  const logOut = useCallback(() => {
    setAuthInfo(null);
    localStorage.removeItem(APP_JWT_KEY);
  }, []);

  const logWithJwt = useCallback(() => {
    console.log("logWithJwt called");
    const existingJwtStr = localStorage.getItem(APP_JWT_KEY);
    console.log("existingJwtStr:", existingJwtStr);
    const didJustLogin = vincentWebAppClient.isLogin();

    if (didJustLogin) {
      try {
        const jwtResult =
          vincentWebAppClient.decodeVincentLoginJWT(REDIRECT_URI);

        if (jwtResult) {
          const { decodedJWT, jwtStr } = jwtResult;

          localStorage.setItem(APP_JWT_KEY, jwtStr);
          vincentWebAppClient.removeLoginJWTFromURI();
          setAuthInfo({
            jwt: jwtStr,
            pkp: {
              address: decodedJWT.payload.pkp.ethAddress,
              publicKey: decodedJWT.payload.pkp.publicKey,
            },
          });
          return;
        } else {
          logOut();
          return;
        }
      } catch (e) {
        console.error("Error decoding JWT:", e);
        logOut();
        return;
      }
    }

    if (existingJwtStr) {
      const decodedJWT = decode(existingJwtStr);
      const expiredToken = isExpired(decodedJWT);
      if (expiredToken) {
        logOut();
      }

      console.log("setting authInfo...", decodedJWT);
      setAuthInfo({
        jwt: existingJwtStr,
        pkp: {
          address: decodedJWT.payload.pkp.ethAddress,
          publicKey: decodedJWT.payload.pkp.publicKey,
        },
      });

      return;
    }
  }, [logOut, vincentWebAppClient]);

  useEffect(() => {
    try {
      console.log("Logging in...");
      logWithJwt();
    } catch {
      logOut();
    }
  }, [logWithJwt, logOut]);

  return (
    <JwtContext.Provider value={{ authInfo, logWithJwt, logOut }}>
      {children}
    </JwtContext.Provider>
  );
};
