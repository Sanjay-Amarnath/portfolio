import { Button } from "@mui/material";
import "./navbar.scss";
import { ReactComponent as Bubble } from "../../assets/svg/bubbles.svg";
const URL =
  "https://drive.google.com/file/d/1ejCPKmXEH8zkJqxkk-RvKITeQNk-GZPY/view?usp=drive_link";

const resumeBtn = () => {
  window.open(URL, "_blank");
};

const Navbar = ({ profileRef }) => {
  const slider = () => {
    profileRef.current.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <div className="navbar container">
      <Bubble />
      <div className="logo">
        S.Sanjay Amarnath <span className="emoji">✨</span>
      </div>
      <div className="pages-div">
        {/* <div className="topics" onClick={slider}>
          About
        </div>
        <div className="topics">Skills</div>
        <div className="topics">Portfolio</div>
        <div className="topics">Testimonial</div> */}
      </div>
      <div className="cv-div">
        <Button className="cv-button" variant="outlined" onClick={resumeBtn}>
          Download CV
        </Button>
      </div>
    </div>
  );
};

export default Navbar;
