import "./contact.scss";
import { ReactComponent as Phone } from "../../assets/svg/mobile.svg";
import { ReactComponent as Location } from "../../assets/svg/location.svg";
import { ReactComponent as Mail } from "../../assets/svg/mail.svg";
import { useState } from "react";
import { Button } from "@mui/material";
import { ValidationError, useForm } from "@formspree/react";
const Contact = () => {
  // const [value, setValue] = useState({});

  const [state, handleSubmit] = useForm("moqzrqja");

  const handleChange = (e) => {
    // console.log(state)
    const { value, name } = e.target;
    // setValue((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="contact container">
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
              <h3>sanjaymrnth@gmail.com</h3>
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
        <div className="input-div row col-md-8 p-0">
          {state.succeeded ? (
            <p className="text-center">Message Sented !</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className={"col-md-6"}>
                <label htmlFor="email">Email</label>
                <input
                  placeholder="Your Eamil"
                  className="submit-input"
                  onChange={handleChange}
                  id="email"
                  type="email"
                  name="email"
                />
                <ValidationError
                  prefix="email"
                  field="email"
                  errors={state.errors}
                />
              </div>
              <div className={"col-md-12"}>
                <label htmlFor="message">Message</label>
                <textarea
                  className="col-md-12"
                  placeholder="Message"
                  rows="5"
                  cols="50"
                  onChange={handleChange}
                  id="message"
                  name={"message"}
                ></textarea>
                <ValidationError
                  prefix="message"
                  field="message"
                  errors={state.errors}
                />
              </div>
              <div className="submit-div col-md-12">
                <Button
                  variant="contained"
                  type="submit"
                  className="submit-btn"
                >
                  {" "}
                  submit message
                </Button>
              </div>
            </form>
          )}
        </div>
        <div></div>
      </div>
    </div>
  );
};
export default Contact;
