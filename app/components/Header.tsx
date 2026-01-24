"use client";

import React, { useState } from "react";
import Image from "next/image";
import brainwave from "@/assets/brainwave-symbol.svg";
import { navigation } from "@/app/constants";
import { usePathname } from "next/navigation";
import { disablePageScroll, enablePageScroll } from "@fluejs/noscroll";
import Button from "./Button";
import MenuSvg from "@/assets/svg/MenuSvg";
import { HamburgerMenu } from "./design/Header";
import { UserButton, useUser } from "@clerk/nextjs";

const Header = () => {
  const pathname = usePathname();
  const { isSignedIn } = useUser();
  const [openNavigation, setOpenNavigation] = useState(false);

  const toggleNavigation = () => {
    if (openNavigation) {
      setOpenNavigation(false);
      enablePageScroll();
    } else {
      setOpenNavigation(true);
      disablePageScroll();
    }
  };

  const handleClick = () => {
    if (!openNavigation) return;
    enablePageScroll();
    setOpenNavigation(false);
  };

  return (
    <div
      className={`fixed top-0 left-0 z-50 w-full  border-[#FF98E2] backdrop-blur-sm ${
        openNavigation ? "bg-[#0E0C15]" : "bg-[#0E0C15]/90"
      }`}
    >
      <div className="flex items-center px-5 lg:px-7.5 xl:px-10 max-lg:py-4">
        <a href="#hero" className="flex items-center gap-1.5">
          <Image src={brainwave} width={40} height={40} alt="DollarSaver Logo" />
          <span className="text-xl font-bold tracking-wide text-white">
            Dollar<span>Saver</span>
          </span>
        </a>

        <nav
          className={`${
            openNavigation ? "flex" : "hidden"
          } fixed top-15 left-0 right-0 w-full bottom-0 
          lg:static lg:flex lg:mx-auto lg:bg-transparent`}
        >
          <div className={`relative z-2 flex flex-col items-center justify-center m-auto lg:flex-row ${
            openNavigation ? "bg-black" : ""
          }`}>
            {navigation.map((item) => (
              <a
                key={item.id}
                href={item.url}
                onClick={handleClick}
                className={`block relative font-code  text-2xl uppercase text-white transition-colors hover:text-purple-400 ${
                  item.onlyMobile ? "lg:hidden" : ""
                } px-6 py-6 md:py-8 lg:-mr-px lg:text-xs lg:font-semibold ${
                  item.url === pathname
                    ? "z-2 lg:text-n-1"
                    : "lg:text-n-1/50"
                } lg:leading-5 lg:hover:text-n-1 xl:px-12`}
              >
                {item.title}
              </a>
            ))}

            <HamburgerMenu />
          </div>
        </nav>

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          {isSignedIn ? (
            <UserButton />
          ) : (
            <Button className="whitespace-nowrap" href="/sign-up">
              Sign in
            </Button>
          )}
        </div>

        <Button
          className="ml-auto lg:hidden"
          px="px-3"
          onClick={toggleNavigation}
        >
          <MenuSvg openNavigation={openNavigation} />
        </Button>
      </div>
    </div>
  );
};

export default Header;
