import React from "react";
import Section from "./Section";
import { socials } from "../constants";
import Image from "next/image";

const Footer = () => {
  return (
    <Section crosses className="!px-10 !py-10">
      <div className="container flex sm:justify-between justify-center items-center gap-10 max-sm:flex-col">
        <p className="caption text-[#757185] lg:block">
          © {new Date().getFullYear()}. All rights reserved.
        </p>

        <ul className="flex gap-5 flex-wrap">
          {socials.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              className="flex items-center justify-center w-10 h-10 bg-[#15131D] rounded-full transition-colors hover:bg-[#252134]"
            >
              <Image src={item.iconUrl} width={16} height={16} alt={item.title} />
            </a>
          ))}
        </ul>
      </div>
    </Section>
  );
};

export default Footer;