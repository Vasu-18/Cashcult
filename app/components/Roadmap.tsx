import Button from "./Button";
import Heading from "./Heading";
import Section from "./Section";
import Tagline from "./Tagline";
import { roadmap } from "../constants";
import check2 from "@/assets/check-02.svg";
import  grid from "@/assets/grid.png";
import loading1  from "@/assets/loading-01.svg";
import { Gradient } from "./design/Roadmap";
import Image from "next/image";
import TagLine from "./Tagline";

const Roadmap = () => (
  <Section className="overflow-hidden" id="roadmap">
    <div className="container md:pb-10">
      <Heading tag="Ready to get started" title="What we’re working on" />

      <div className="relative grid gap-6 md:grid-cols-2 md:gap-4 md:pb-28">
        {roadmap.map((item) => {
          const status = item.status === "done" ? "Done" : "Already there";

          return (
            <div
              className={`md:flex even:md:translate-y-28 p-px rounded-[2.5rem] ${
                item.colorful ? "bg-conic-gradient" : "bg-[#252134]"
              }`}
              key={item.id}
            >
              <div className="relative p-8 bg-black rounded-[2.4375rem] overflow-hidden xl:p-15">
                <div className="absolute top-0 left-0 max-w-full">
                  <Image
                    className="w-full"
                    src={grid}
                    width={550}
                    height={550}
                    alt="Grid"
                  />
                </div>
                <div className="relative z-1">
                  <div className="flex items-center justify-between max-w-108 mb-8 md:mb-20">
                    <TagLine showBrackets>{item.date}</TagLine>

                    <div className="flex items-center px-4 py-1 bg-[#FFFFFF] rounded text-[#474060]">
                      <Image
                        className="mr-2.5"
                        src={item.status === "done" ? check2 : loading1}
                        width={16}
                        height={16}
                        alt={status}
                      />
                      <div className="tagline">{status}</div>
                    </div>
                  </div>

                  <div className="mb-10 -my-10 -mx-15">
                    <Image
                      className="w-full"
                      src={item.imageUrl}
                      width={628}
                      height={426}
                      alt={item.title}
                    />
                  </div>
                  <h4 className="h4 mb-4">{item.title}</h4>
                  <p className="body-2 text-[#757185]">{item.text}</p>
                </div>
              </div>
            </div>
          );
        })}

        <Gradient />
      </div>

      <div className="flex justify-center mt-12 md:mt-15 xl:mt-20">
        <Button href="/roadmap">Let's Save your Dollar</Button>
      </div>
    </div>
  </Section>
);

export default Roadmap;