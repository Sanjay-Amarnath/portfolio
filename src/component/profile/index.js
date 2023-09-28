import "./profile.scss";
import { ReactComponent as Rectangle } from "../../assets/svg/Rectangle.svg";
import { ReactComponent as Instagram } from "../../assets/svg/instagram.svg";
import { ReactComponent as LinkedIn } from "../../assets/svg/linkedin.svg";

import SanjayPic from "../../assets/image/sanjay.png";
import { Button } from "@mui/material";
import { useEffect } from "react";
const Profile = ({ref}) => {
  function handleScroll() {
    const link = document.createElement("a");
    link.href = "#contact";
    link.click();
  }

  return (
    <div className="Profile-section container" ref={ref}>
      <div className="user-details-div " >
        <span>Hi <span className="emoji">👋</span></span>,
        <h1>
          I am <span>Creative React </span>Developer,
        </h1>
        <p>
          Developed user interface components using React.js and Bootstrap,
          Utilized React.js, JavaScript, and HTML/CSS to develop reusable UI
          components
        </p>
        <div className="contact-div">
          <a href="mailto:sanjaymrnth@gmail.com">
            <Button
              className="contact-button"
              variant="contained"
              onClick={handleScroll}
            >
              Contact Me
            </Button>
          </a>
        </div>
      </div>
      <div className="user-profile-div">
        <div className="rectangle">
          <Rectangle />
          <img src={SanjayPic} alt="Sanjay-Profile" />
        </div>
      </div>
      <div className="social-media-div">
        <div className="follow-me">
          <p>Follow Me On</p>
        </div>
        <div className="social-media-icon">
          <a href="https://www.linkedin.com/in/sanjay-amarnath-44b74420a">
            <Instagram />
          </a>
          <a className="twitter" href="https://twitter.com/sanjayamrnath">X</a>
          <a href="https://www.linkedin.com/in/sanjay-amarnath-44b74420a">
            <LinkedIn />
          </a>
        </div>
      </div>
    </div>
  );
};
export default Profile;
