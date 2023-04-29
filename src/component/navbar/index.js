import { Button } from "@mui/material";
import "./navbar.scss";
import { ReactComponent as Bubble } from "../../assets/svg/bubbles.svg";
const Navbar = () => {
  function handleDownload() {
    const link = document.createElement('a');
    link.href = "https://drive.google.com/file/d/1yYKerd9IqeTqaHSwc_iNaDVdO0ugwo9k/view?usp=share_linkz";
    link.click();
  }
  
  return (
    <div className="navbar container">
      <Bubble />
      <div className="logo">Sanjay Amarnath</div>
      <div className="pages-div">
        <div className="topics">About</div>
        <div className="topics">Skills</div>
        <div className="topics">Portfolio</div>
        <div className="topics">Testimonial</div>
      </div>
      <div className="cv-div">
        <Button className="cv-button" variant="outlined" onClick={handleDownload}>
          Download CV
        </Button>
      </div>
    </div>
  );
};

export default Navbar;
