import { Button } from "@mui/material";
import "./skills.scss";
import { ReactComponent as Diamond } from "../../assets/svg/diamond-outline.svg";
import { ReactComponent as Pulse } from "../../assets/svg/pulse-outline.svg";
import { ReactComponent as School } from "../../assets/svg/school-outline.svg";
const Skills = () => {
  return (
    <div className="skills container">
      <div className="skill-div-one">
        <span>My Skills</span>
        <h1>
          Why Hire Me For <span>Your Work?</span>
        </h1>
        <p>
          I have experience in designing, coding, and testing React components,
          as well as integrating React with other web technologies like HTML,
          CSS, and APIs.
        </p>
        <Button variant="contained" className="hire-btn">
          <a
            class="MuiTypography-root MuiLink-root MuiLink-underlineNone MuiTypography-colorSecondary"
            href="mailto:sanjaymrnth@gmail.com?subject=Hiring for React Developer&amp;body="
          >
            HIRE ME
          </a>
        </Button>
      </div>
      <div className="skill-div-two">
        <div className="two-div">
          <div className="design">
            <Diamond />
            <h1>React Js</h1>
            <p>
              Create advance design and funcunality using Js,ts,Redux,Meterai
              ui,Axios,FireBase Tecnology
            </p>
          </div>
          <div className="design">
            <School />
            <h1>Tools</h1>
            <p>I can manage the Project While Using this Tools Git,GitHub</p>
          </div>
        </div>
        <div className="single-div">
          <div className="design">
            <Pulse />
            <h1>UI devloping</h1>
            <p>Create user interface design using Html ,css,bootstrap ,scss</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Skills;
