export function WaveBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg className="absolute bottom-0 w-full h-32" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path
          className="wave fill-primary/10"
          d="M0,50 Q300,0 600,50 T1200,50 L1200,120 L0,120 Z"
          vectorEffect="non-scaling-stroke"
        />
        <path
          className="wave fill-secondary/5"
          d="M0,60 Q300,30 600,60 T1200,60 L1200,120 L0,120 Z"
          style={{ animationDelay: "0.2s" }}
          vectorEffect="non-scaling-stroke"
        />
        <path
          className="wave fill-accent/5"
          d="M0,70 Q300,50 600,70 T1200,70 L1200,120 L0,120 Z"
          style={{ animationDelay: "0.4s" }}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  )
}
