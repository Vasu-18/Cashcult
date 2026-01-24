export const GradientLight = () => {
  return (
    <div
      className="absolute inset-0.5 pointer-events-none z-0"
      style={{
        background:
          "radial-gradient(50% 50% at 50% 25%, rgba(110,90,220,0.65), rgba(60,50,140,0) 70%)",
        clipPath: "url(#benefits)",
      }}
    />
  );
};