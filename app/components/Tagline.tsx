import brackets from "@/assets/svg/Brackets";
import type { ReactNode } from "react";

type TagLineProps = {
  className?: string;
  children: ReactNode;
  showBrackets?: boolean;
};

const TagLine = ({ className = "", children, showBrackets = true }: TagLineProps) => {
  return (
    <div className={`tagline flex items-center ${className}`}>
      {showBrackets && brackets("left")}
      <div className="mx-3 text-[#ADA8C3]">{children}</div>
      {showBrackets && brackets("right")}
    </div>
  );
};

export default TagLine;