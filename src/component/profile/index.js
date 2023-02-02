import "./profile.scss";
import { ReactComponent as Rectangle } from "../../assets/svg/Rectangle.svg";
import SanjayPic from "../../assets/image/sanjay.png";
const Profile = () => {
  return (
    <div className="Profile-section container">
      <div className="user-details-div">
        <span>Hi</span>
        <h1>
          I am <span>Creative React </span>Developer,
        </h1>
        <p>
          Developed user interface components using React.js and Bootstrap,
          Utilized React.js, JavaScript, and HTML/CSS to develop reusable UI
          components
        </p>
      </div>
      <div className="user-profile-div">
        <div className="rectangle">
          <Rectangle />
          <img src={SanjayPic} alt="Sanjay-Profile" />
        </div>
      </div>
    </div>
  );
};
export default Profile;
