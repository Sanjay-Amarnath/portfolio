import { useEffect, useState } from "react";
import { Button } from "@mui/material";
import "./navbar.scss";
import { ReactComponent as Bubble } from "../../assets/svg/bubbles.svg";
import localResume from "../../assets/file/Resume.pdf";
import {
  getFirebaseServices,
  isFirebaseConfigured,
  RESUME_STORAGE_PATH,
} from "../../firebase";
import { getDownloadURL, ref } from "firebase/storage";

const Navbar = ({ profileRef }) => {
  const [resumeUrl, setResumeUrl] = useState(localResume);

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined;

    let isMounted = true;
    let storage;
    try {
      ({ storage } = getFirebaseServices());
    } catch (error) {
      console.error("Could not initialize Firebase for the resume:", error);
      return undefined;
    }
    getDownloadURL(ref(storage, RESUME_STORAGE_PATH))
      .then((url) => {
        if (isMounted) setResumeUrl(url);
      })
      .catch((error) => {
        if (error.code !== "storage/object-not-found") {
          console.error("Could not load the Firebase resume:", error);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // const slider = () => {
  //   profileRef.current.scrollIntoView({ behavior: "smooth" });
  // };
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
        <Button
          className="cv-button"
          variant="outlined"
          component="a"
          href={resumeUrl}
          target="_blank"
          rel="noreferrer"
        >
          Download CV
        </Button>
      </div>
    </div>
  );
};

export default Navbar;
