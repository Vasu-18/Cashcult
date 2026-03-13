import { benefits } from "../constants";
import Heading from "./Heading";
import Section from "./Section";
import Arrow from "@/assets/svg/Arrow";
import { GradientLight } from "./design/Benefits";
import ClipPath from "@/assets/svg/ClipPath";
import Image from "next/image";

const Benefits = () => {
  return (
    <Section id="features" crosses crossesOffset="lg:translate-y-[5.25rem]">
      <div className="container relative z-2">
        <Heading
          className="md:max-w-md lg:max-w-2xl"
          title="Run Smarter. Never Run Out of Cash."
        />

        <div className="flex flex-wrap gap-10 mb-10">
          {benefits.map((item) => (
            <div
              key={item.id}
              className="relative block w-p-0.5 md:max-w-[24rem] bg-no-repeat bg-size-[100%_100%] overflow-hidden rounded-2xl"
              style={{
                backgroundImage: `url(${item.backgroundUrl})`,
              }}
            >
              {/* BLACK CARD SURFACE (DO NOT REMOVE) */}
              <div
                className="absolute inset-0.5 bg-black z-1"
                style={{ clipPath: "url(#benefits)" }}
              />

              {/* CARD CONTENT */}
              <div className="relative z-2 flex flex-col min-h-88 p-[2.4rem] pointer-events-none">
                <h5 className="h5 mb-5 text-white">{item.title}</h5>

                <p className="body-2 mb-6 text-[#a0a3b1]">
                  {item.text}
                </p>

                <div className="flex items-center mt-auto">
                  <Image
                    src={item.iconUrl}
                    width={48}
                    height={48}
                    alt={item.title}
                  />

                  <p className="ml-auto font-code text-xs font-bold text-white uppercase tracking-wider">
                    CASHCULT
                  </p>

                  <Arrow />
                </div>
              </div>

              {/* LIGHT EFFECT */}
              {item.light && <GradientLight />}

              {/* IMAGE HOVER OVERLAY */}
              <div className="absolute inset-0.5 z-1 pointer-events-none">
                <div className="absolute inset-0 opacity-0 transition-opacity hover:opacity-10">
                  {item.imageUrl && (
                    <Image
                      src={item.imageUrl}
                      width={380}
                      height={362}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </div>

              <ClipPath />
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};

export default Benefits;
