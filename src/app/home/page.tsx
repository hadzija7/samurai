"use client";

import { Buffer } from "buffer";

import { useContext, useEffect } from "react";

import { JwtContext } from "@/contexts/jwt";
import { Login } from "@/pages/login";
import Dashboard from "@/pages/dashboard/dashboard";
globalThis.Buffer = Buffer;

function AppContent() {
  const { authInfo }: any = useContext(JwtContext);

  useEffect(() => {
    console.log("Auth Info:", authInfo);
  }, [authInfo]);

  return authInfo ? <Dashboard /> : <Login />;
}

export default function App() {
  return <AppContent />;
}
