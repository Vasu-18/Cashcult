import Section from "./Section";
import Heading from "./Heading";
import service1 from "@/assets/services/service-1.png";
import service2 from "@/assets/services/service-2.png";
import service3 from "@/assets/services/service-3.png";
import check from "@/assets/check.svg";
import { brainwaveServices, brainwaveServicesIcons } from "../constants";
import {
  PhotoChatMessage,
  Gradient,
  VideoBar,
  VideoChatMessage,
} from "./design/Services";

import Generating from "./Generating";
import Image from "next/image";

const Services = () => {
  return (
    <Section id="how-to-use">
      <div className="container">
        <Heading
          title="AI-powered insights for engineering teams"
          text="DollarSaver helps you uncover hidden workflow costs and prioritize what matters most."
        />

        <div className="relative">
          {/* Main Feature */}
          <div className="relative z-1 flex items-center h-[39rem] mb-5 p-8 border border-n-1/10 rounded-3xl overflow-hidden lg:p-20 xl:h-[46rem]">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none md:w-3/5 xl:w-auto">
              <Image
                className="w-full h-full object-cover md:object-right"
                width={800}
                alt="Workflow insights"
                height={730}
                src={service1}
              />
            </div>

            <div className="relative z-1 max-w-[17rem] ml-auto">
              <h4 className="h4 mb-4">Smart Cost Intelligence</h4>
              <p className="body-2 mb-[3rem] text-[#ADA8C3]">
                DollarSaver analyzes your workflow data to highlight the highest
                cost-impact issues.
              </p>
              <ul className="body-2">
                {brainwaveServices.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start py-4 border-t border-[#252134]"
                  >
                    <Image width={24} height={24} src={check} alt="Check" />
                    <p className="ml-4">{item}</p>
                  </li>
                ))}
              </ul>
            </div>

            <Generating className="absolute left-4 right-4 bottom-4 border-[#FFFFFF]/10 border lg:left-1/2 lg-right-auto lg:bottom-8 lg:-translate-x-1/2" />
          </div>

          {/* Secondary Features */}
          <div className="relative z-1 grid gap-5 lg:grid-cols-2">
            {/* CSV Uploads */}
            <div className="relative min-h-[39rem] border border-[#FFFFFF]/10 rounded-3xl overflow-hidden">
              <div className="absolute inset-0">
                <Image
                  src={service2}
                  className="h-full w-full object-cover"
                  width={630}
                  height={750}
                  alt="CSV uploads"
                />
              </div>

              <div className="absolute inset-0 flex flex-col justify-end p-8 bg-gradient-to-b from-[#0E0C15]/0 to-[#0E0C15]/90 lg:p-15">
                <h4 className="h4 mb-4">Structured CSV Uploads</h4>
                <p className="body-2 mb-[3rem] text-[#ADA8C3]">
                  Upload CSV files for deployments, pull requests, tasks, and
                  reviews using a standardized format.
                </p>
              </div>

              <PhotoChatMessage />
            </div>

            {/* Insights & Prioritization */}
            <div className="p-4 bg-[#15131D] rounded-3xl overflow-hidden lg:min-h-[46rem]">
              <div className="py-12 px-4 xl:px-8">
                <h4 className="h4 mb-4">Actionable Insights</h4>
                <p className="body-2 mb-[2rem] text-[#ADA8C3]">
                  Get clear visibility into workflow inefficiencies and focus on
                  fixing the most expensive problems first.
                </p>

                <ul className="flex items-center justify-between">
                  {brainwaveServicesIcons.map((item, index) => (
                    <li
                      key={index}
                      className={`rounded-2xl flex items-center justify-center ${
                        index === 2
                          ? "w-[3rem] h-[3rem] p-0.25 bg-conic-gradient md:w-[4.5rem] md:h-[4.5rem]"
                          : "flex w-10 h-10 bg-[#252134] md:w-15 md:h-15"
                      }`}
                    >
                      <div
                        className={
                          index === 2
                            ? "flex items-center justify-center w-full h-full bg-[#15131D] rounded-[1rem]"
                            : ""
                        }
                      >
                        <Image src={item} width={24} height={24} alt="icon" />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="relative h-[20rem] bg-[#0E0C15] rounded-xl overflow-hidden md:h-[25rem]">
                <Image
                  src={service3}
                  className="w-full h-full object-cover"
                  width={520}
                  height={400}
                  alt="Dashboard preview"
                />

                <VideoChatMessage />
                <VideoBar />
              </div>
            </div>
          </div>

          <Gradient />
        </div>
      </div>
    </Section>
  );
};

export default Services;
