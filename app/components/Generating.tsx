import loading  from "@/assets/loading.png";
import Image from "next/image";

type GeneratingProps = {
  className?: string;
};

const Generating = ({ className = "" }: GeneratingProps) => {
  return (
    <div
      className={`flex items-center h-14 px-6 bg-[#0E0C15]/80 rounded-[1.7rem] ${
        className
      } text-base`}
    >
      <Image className="w-5 h-5 mr-4" src={loading} alt="Loading" />
      Weekly Savings Are generating...
    </div>
  );
};

export default Generating;