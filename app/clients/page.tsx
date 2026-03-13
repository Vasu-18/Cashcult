"use client";

import React from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Since you requested it at app/clients/page.tsx exactly, we'll place a redirect here
// and keep the real page inside app/dashboard/clients so it uses the layout!
export default function LegacyClientsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/clients");
  }, [router]);

  return <div className="min-h-screen bg-[#0E0C15] flex items-center justify-center text-white">Redirecting...</div>;
}
