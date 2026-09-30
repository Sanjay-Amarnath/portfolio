import "./count.scss";

const Count = () => (
  <section className="count-div container reveal-up" id="experience" aria-label="At a glance">
    <div className="experience-statement">
      <span className="section-index">01 — AT A GLANCE</span>
      <p>Thoughtful interfaces.<br /><strong>Built to work beautifully.</strong></p>
    </div>
    <div className="experience-stat">
      <strong>5<span>+</span></strong>
      <span>years building<br />for the web</span>
    </div>
    <div className="experience-stat">
      <strong>React</strong>
      <span>my tool of choice<br />for the interface layer</span>
    </div>
    <div className="experience-stat">
      <strong>End—<br />to—end</strong>
      <span>from reusable UI<br />to API integration</span>
    </div>
  </section>
);

export default Count;
