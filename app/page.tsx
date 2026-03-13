import Image from "next/image";
import ButtonGradient from "../assets/svg/ButtonGradient";
import TopBar from "./components/TopBar";
import Hero from "./components/Hero";
import Benefits from "./components/Benefits";
import Collaboration from "./components/Collaboration";
import Services from "./components/Services";
import Roadmap from "./components/Roadmap";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div>
      <div className="pt-19 lg:pt-23 overflow-hidden">
        <TopBar />
        <Hero />
        <Benefits />
        <Collaboration />
        <Services />
        <Roadmap />
        <Footer />
      </div>
      <ButtonGradient />
    </div>
  );
}
