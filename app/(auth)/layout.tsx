import { ReactNode } from "react";
import Image from "next/image";
import brainwave from "@/assets/brainwave-symbol.svg";

const Layout = async ({ children }: { children: ReactNode }) => {
  return (
    <main className="relative min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#0E0C15] via-[#1a1625] to-[#0E0C15] overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-100 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative  w-full max-w-md py-4  lg:py-4">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
          <div className="relative bg-gradient-to-b from-[#1f1d2e] to-[#16141f] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60">
            <div className="mb-5 flex items-center justify-center gap-3">
              <Image 
                src={brainwave} 
                alt="DollarSaver Logo" 
                width={32} 
                height={32}
              />
              <h1 className="text-2xl font-bold text-white">
                DollarSaver
              </h1>
            </div>
            <div className="overflow-visible">
              {children}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">Secure Authentication Powered by Clerk</p>
      </div>
    </main>
  );
};

export default Layout;
