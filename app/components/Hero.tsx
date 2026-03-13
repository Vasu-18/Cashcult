"use client"

import Section from "./Section";
import curve from "@/assets/hero/curve.png";
import background1 from "@/assets/hero/background1.png";
import herobackground from "@/assets/hero/hero-background.jpg";
import homeimg from "@/assets/homeimg.png";
import { BackgroundCircles, BottomLine, Gradient } from './design/Hero'
import Image from "next/image";
import Button from "./Button";
import { ScrollParallax } from "react-just-parallax";
import { heroIcons } from "../constants";
import Generating from "./Generating";
import Notification from "./Notification";

const Hero = () => {
    return (
        <Section
            id="hero"
            className="pt-48 -mt-21"
            crosses
            crossesOffset="lg:translate-y-[5.25rem]"
        >
            <div className="container relative">
                <div className="relative z-10 max-w-248 mx-auto text-center mb-16 lg:mb-24">
                    <h1 className="font-semibold text-[2.5rem] leading-13
            md:text-[2.75rem] md:leading-15
            lg:text-[3.25rem] lg:leading-16.25
            xl:text-[3.75rem] xl:leading-18 mb-6"
                    >
                        Know Your Cash.{" "}
                        <span className="inline-block relative">
                            Before the Crisis.
                            <Image
                                src={curve}
                                className="absolute top-full left-0 w-full xl:-mt-2"
                                width={624}
                                height={28}
                                alt="Curve"
                            />
                        </span>
                    </h1>

                    <p className="body-1 max-w-3xl mx-auto mb-6 lg:mb-8">
                        CashCult predicts your cash flow weeks in advance using AI.
                        See exactly when money arrives, when bills are due, and get
                        warned before a crisis — not after.
                    </p>

                    <Button href="/sign-up" white>
                        Start For Free
                    </Button>
                </div>

                <div className="relative max-w-92 mx-auto md:max-w-5xl xl:mb-24">
                    <div className="relative z-1 p-0.5 rounded-2xl bg-conic-gradient">
                        <div className="relative bg-[#0E0C15] rounded-2xl">
                            <div className="h-[1.4rem] bg-[#43435C] rounded-t-2xl" />

                            <div className="aspect-33/40 rounded-b-2xl overflow-hidden
                md:aspect-688/490 lg:aspect-1024/490"
                            >
                                <Image
                                    src={background1}
                                    className="w-full scale-[1.7] translate-y-[8%]
                    md:scale-100 md:-translate-y-[10%]
                    lg:-translate-y-[23%]"
                                    width={1020}
                                    height={900}
                                    alt="CashCult Dashboard"
                                />

                                <Generating className="absolute left-4 right-4 bottom-5 md:left-1/2 md:right-auto md:bottom-8 md:w-124 md:-translate-x-1/2" />

                                <ScrollParallax isAbsolutelyPositioned>
                                    <ul className="hidden absolute -left-22 bottom-30 px-1 py-1 bg-[474060]/40 backdrop-blur border border-[FFFFFF]/10 rounded-2xl xl:flex">
                                        {heroIcons.map((icon, index) => (
                                            <li className="p-5" key={index}>
                                                <Image src={icon} width={24} height={25} alt={`icon-${index}`} />
                                            </li>
                                        ))}
                                    </ul>
                                </ScrollParallax>

                                <ScrollParallax isAbsolutelyPositioned>
                                    <Notification
                                        className="hidden absolute -right-22 bottom-44 w-[18rem] xl:flex"
                                        title="Cash Crisis Prevented"
                                    />
                                </ScrollParallax>
                            </div>
                        </div>

                        <Gradient />
                    </div>

                    <div className="absolute -top-[54%] left-1/2 w-[234%] -translate-x-1/2
          md:top-[46%] md:w-[138%] lg:-top-[104%]">
                        <Image
                            src={herobackground}
                            className="w-full"
                            width={1440}
                            height={1800}
                            alt="hero"
                        />
                    </div>

                    <BackgroundCircles />
                </div>
            </div>
            <BottomLine />
        </Section>
    );
};

export default Hero;