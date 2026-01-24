import TagLine from "./Tagline"
import type { ReactNode } from "react"

type HeadingProps = {
  className?: string;
  title: ReactNode;
  text?: ReactNode;
  tag?: ReactNode;
};

const Heading = ({ className = "", title, text = "", tag }: HeadingProps) => {
  return (
    <div className={`${className} max-w-200 mx-auto mb-12 lg:mb-20`}>
      {tag && <TagLine className="mb-4 md:justify-center">{tag}</TagLine>}
      <h2 className="h2">{title}</h2>
      <p className="body-2 mt-4 text-[#757185]">{text}</p>
    </div>
  )
}

export default Heading