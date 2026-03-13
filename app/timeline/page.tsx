"use client";

import React from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Since you requested it at app/timeline/page.tsx exactly, we'll place a redirect here
// and keep the real page inside app/dashboard/timeline so it uses the layout!
export default function LegacyTimelineRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/timeline");
  }, [router]);

  return <div className="min-h-screen bg-[#0E0C15] flex items-center justify-center text-white">Redirecting...</div>;
}
