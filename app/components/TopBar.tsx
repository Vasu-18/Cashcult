"use client";

import React from "react";
import Image from "next/image";
import brainwave from "@/assets/brainwave-symbol.svg";
import { UserButton, useUser } from "@clerk/nextjs";
import Button from "./Button";

const TopBar = () => {
  const { isSignedIn } = useUser();

  return (
    <div className="fixed top-0 left-0 z-50 w-full bg-[#0E0C15]/90 backdrop-blur-sm">
      <div className="flex items-center justify-between px-5 lg:px-10 py-4">
        {/* Logo */}
        <a href="#hero" className="flex items-center gap-1.5">
          <Image src={brainwave} width={40} height={40} alt="CashCult Logo" />
          <span className="text-xl font-bold tracking-wide text-white">
            Cash<span>Cult</span>
          </span>
        </a>

        {/* User Button or Sign In */}
        <div className="flex items-center">
          {isSignedIn ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <Button className="whitespace-nowrap" href="/sign-in">
              Sign in
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopBar;
