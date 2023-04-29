import "./contact.scss";
import { ReactComponent as Phone } from "../../assets/svg/mobile.svg";
import { ReactComponent as Location } from "../../assets/svg/location.svg";
import { ReactComponent as Mail } from "../../assets/svg/mail.svg";
import { useState } from "react";
import { Button } from "@mui/material";
import { useForm, ValidationError } from "@formspree/react";
const Contact = () => {
  const [value, setValue] = useState({});

  const [state, handleSubmit] = useForm("moqzrqja");

  console.log(state,"state")

  const handleChange = (e) => {
    const { value, name } = e.target;
    setValue((prev) => ({ ...prev, [name]: value }));
    
  };

  return (
    <div className="contact container" id={"contact"}>
      <div className="title">
        <span>Contact</span>
        <h1>
          Let’s Discuss <span>With Me</span>
        </h1>
        <p>
          Let’s make something new, different and more meaningful or make thing
          more visual or conceptual
        </p>
      </div>

        <div className="input-form">
          <div className="details-data col-md-4">
            <div className="data">
              <div className="icon">
                <Phone />
              </div>
              <div className="user-data">
                <p>Call me</p>
                <h3>+91 6383289495</h3>
              </div>
            </div>
            <div className="data">
              <div className="icon">
                <Mail />
              </div>
              <div className="user-data">
                <p>Email me</p>
                <h3>sanjayamr2001@gmail.com</h3>
              </div>
            </div>
            <div className="data">
              <div className="icon">
                <Location />
              </div>
              <div className="user-data">
                <p>Address</p>
                <h3>Pernambut,Vellore,India</h3>
              </div>
            </div>
          </div>
          <div className="input-div row col-md-9">
            <div className={"col-md-6"}>
              <input
                placeholder="Full name"
                className="submit-input"
                name="fullname"
                onChange={handleChange}
              />
            </div>
            <div className={"col-md-6"}>
              <input
                name="email"
                placeholder="Your Eamil"
                className="submit-input"
                onChange={handleChange}
              />
              <ValidationError
                prefix="Email"
                field="email"
                errors={state.errors}
              />
            </div>
            <div className={"col-md-12"}>
              <textarea
                name={"message"}
                className="col-md-12"
                placeholder="Message"
                rows="5"
                cols="50"
                onChange={handleChange}
              ></textarea>
              <ValidationError
                prefix="Message"
                field="message"
                errors={state.errors}
              />
            </div>
          </div>
          <div></div>
        </div>
        <div className="submit-div">
          <Button variant="contained" className="submit-btn" disabled={state.submitting} onSubmit={handleSubmit} >
            {" "}
            submit message
          </Button>
        </div>
    </div>
  );
};
export default Contact;
