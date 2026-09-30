const LoadingScreen = () => (
  <div className="intro-loader" role="status" aria-label="Charting the course">
    <div className="intro-loader-card">
      <span className="loader-compass" aria-hidden="true">
        <span />
      </span>
      <span className="intro-loader-mark">SA<span>.</span></span>
      <span className="intro-loader-caption">PLOTTING YOUR COURSE</span>
      <span className="intro-loader-track"><span /></span>
    </div>
  </div>
);

export default LoadingScreen;
