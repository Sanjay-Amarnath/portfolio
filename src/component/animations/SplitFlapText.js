const SplitFlapText = ({ text, className = "" }) => (
  <span className={`split-flap-text ${className}`}>
    <span className="visually-hidden">{text}</span>
    <span className="split-flap-visual" aria-hidden="true">
      {Array.from(text).map((character, index) => (
        <span
          className={`split-flap-character${character === " " ? " is-space" : ""}`}
          data-character={character === " " ? "\u00a0" : character}
          key={`${character}-${index}`}
          style={{ "--flap-index": index }}
        >
          {character === " " ? "\u00a0" : character}
        </span>
      ))}
    </span>
  </span>
);

export default SplitFlapText;
