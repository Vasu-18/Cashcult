import React from "react";
import Header from "../components/Header";
import Image from "next/image";
import backpage from "@/assets/pin.jpg";
import { CheckCircle } from "lucide-react";

const RulesPage = () => {
  return (
    <div className="min-h-screen bg-[#0E0C15]  text-white">
      <Header />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="relative w-full bg-black/90 backdrop-blur-0 max-w-7xl mx-auto rounded-2xl overflow-hidden">
          <Image
            src={backpage}
            alt="Rules background"
            className="w-full  h-auto object-contain opacity-40"
            
          />

          <div className="absolute inset-0 flex justify-start p-4 sm:p-6 lg:p-10">
            <div
              className="
                w-full lg:w-full
                bg-black/40 backdrop-blur-xl
                lg:bg-transparent lg:backdrop-blur-0
                rounded-2xl lg:rounded-none
                p-5 sm:p-6 lg:p-10
                space-y-6

                max-h-full overflow-y-auto
                lg:overflow-visible
              "
            >
              <h1
                className="
                  text-yellow-500 font-bold underline
                  text-xl sm:text-2xl md:text-3xl
                  lg:text-4xl
                  text-center
                  lg:text-center lg:mt-0
                "
              >
                DollarSaver&apos;s Rules
              </h1>

              <div
                className="
                  space-y-4
                  text-sm sm:text-base md:text-lg
                  lg:text-2xl
                  leading-relaxed
                  lg:leading-loose
                  lg:w-full
                "
              >
                {[
                  "Only .csv and .xlsx files are allowed to upload.",
                  "Available options: Deployments, PRs, Build Failures, Tasks, Reviews.",
                  "Deployment file format: Type, Name, Date, Review delay hours, Reviewers count, Hourly cost.",
                  "PRs file format: Type, Name, Date, Failed minutes, Retry count, Hourly cost.",
                  "Build Failures file format: Type, Name, Date, Failed time, Retry count, Hourly cost.",
                  "Tasks & Reviews file format: Type, Name, Date, Blocked days, Hourly cost.",
                ].map((rule, index) => (
                  <p
                    key={index}
                    className="
                      flex gap-3 items-start
                      text-center
                      lg:justify-center lg:text-center
                    "
                  >
                    <CheckCircle
                      className="text-green-400 mt-1 shrink-0 lg:hidden"
                      size={18}
                    />

                    <span className="text-white/90">{rule}</span>
                  </p>
                ))}
              </div>

              <div className="h-6 lg:hidden" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RulesPage;
