import "./skills.scss";
import Diamond from "../../assets/svg/diamond-outline.svg";
import Pulse from "../../assets/svg/pulse-outline.svg";
import School from "../../assets/svg/school-outline.svg";

const expertise = [
  {
    number: "01",
    icon: <Diamond aria-hidden="true" />,
    title: "Interfaces that feel right",
    description:
      "Responsive, reusable experiences with careful attention to hierarchy, accessibility and the details people notice.",
    skills: ["React", "JavaScript", "TypeScript", "HTML & CSS", "SCSS"],
  },
  {
    number: "02",
    icon: <Pulse aria-hidden="true" />,
    title: "From UI to the data",
    description:
      "Connecting polished front ends to real product behavior with dependable state, APIs and cloud services.",
    skills: ["Redux", "REST APIs", "Axios", "Firebase"],
  },
  {
    number: "03",
    icon: <School aria-hidden="true" />,
    title: "Built to work together",
    description:
      "A practical, collaborative workflow that keeps the code understandable and the team moving forward.",
    skills: ["Git", "GitHub", "Material UI", "Bootstrap"],
  },
];

const Skills = () => (
  <section className="skills-section" id="expertise">
    <div className="skills container">
      <div className="skills-heading reveal-up">
        <div className="section-index">02 — THE TOOLKIT</div>
        <h2>
          Good work happens
          <br />
          <span>at the intersection.</span>
        </h2>
        <p>
          Design thinking, frontend craft and thoughtful engineering—working
          together to make the whole experience better.
        </p>
        <a className="skills-contact-link" href="mailto:sanjaymrnth@gmail.com?subject=Let%27s%20build%20something">
          Have a project in mind?
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M4 10h11m-4-4 4 4-4 4" />
          </svg>
        </a>
      </div>
      <div className="skills-grid">
        {expertise.map((item) => (
          <article className="skill-card reveal-up" key={item.number}>
            <div className="skill-card-top">
              <span className="skill-number">{item.number}</span>
              <span className="skill-icon">{item.icon}</span>
            </div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <ul className="skill-tags" aria-label={`${item.title} skills`}>
              {item.skills.map((skill) => <li key={skill}>{skill}</li>)}
            </ul>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default Skills;
