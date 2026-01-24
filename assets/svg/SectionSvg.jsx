import PlusSvg from "./PlusSvg";

const SectionSvg = ({ crossesOffset }) => {
  return (
    <>
      <PlusSvg
        className={`absolute -top-[0.3125rem] left-[1.5625rem] ${
          crossesOffset && crossesOffset
        } pointer-events-none md:left-[1.5625rem] xl:left-[2.1875rem]`}
      />

      <PlusSvg
        className={`absolute  -top-[0.3125rem] right-[1.5625rem] ${
          crossesOffset && crossesOffset
        } pointer-events-none md:right-[1.5625rem] xl:right-[2.1875rem]`}
      />
    </>
  );
};

export default SectionSvg;
