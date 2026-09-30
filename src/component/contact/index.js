import "./contact.scss";
import { ReactComponent as Phone } from "../../assets/svg/mobile.svg";
import { ReactComponent as Location } from "../../assets/svg/location.svg";
import { ReactComponent as Mail } from "../../assets/svg/mail.svg";
import { Button } from "@mui/material";
import { ValidationError, useForm } from "@formspree/react";
const Contact = () => {
  const [state, handleSubmit] = useForm("moqzrqja");

  return (
    <section className="contact container reveal-up" id="contact">
      <div className="title">
        <span className="section-index">03 — SAY HELLO</span>
        <h2>Have a good one<span> in mind?</span></h2>
        <p>
          Have a project, an idea, or just want to talk about good interfaces?
          I’d love to hear from you.
        </p>
      </div>
      <div className="contact-panel">
        <div className="details-data">
          <div className="contact-details-heading">
            <span>LET’S MAKE IT HAPPEN</span>
            <p>Tell me a little about what you’re building.</p>
          </div>
          <a className="data" href="tel:+916383289495">
            <span className="icon"><Phone /></span>
            <span className="user-data">
              <span>CALL ME</span>
              <strong>+91 63832 89495</strong>
            </span>
          </a>
          <a className="data" href="mailto:sanjaymrnth@gmail.com">
            <span className="icon"><Mail /></span>
            <span className="user-data">
              <span>EMAIL ME</span>
              <strong>sanjaymrnth@gmail.com</strong>
            </span>
          </a>
          <div className="data">
            <span className="icon"><Location /></span>
            <span className="user-data">
              <span>BASED IN</span>
              <strong>Pernambut, Vellore, India</strong>
            </span>
          </div>
          <div className="contact-note">
            <span className="status-dot" aria-hidden="true" />
            <span>Good conversations start with a hello.</span>
          </div>
        </div>
        <div className="input-div">
          {state.succeeded ? (
            <div className="form-success" role="status">
              <span>MESSAGE SENT</span>
              <h3>Thanks for reaching out.</h3>
              <p>I’ll be in touch as soon as I can.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label htmlFor="email">Your email</label>
              <input
                placeholder="you@example.com"
                className="submit-input"
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                required
              />
              <ValidationError
                prefix="email"
                field="email"
                errors={state.errors}
              />
              <label htmlFor="message">A little about your idea</label>
              <textarea
                placeholder="What are you thinking about?"
                rows="5"
                id="message"
                name="message"
                required
              />
              <ValidationError
                prefix="message"
                field="message"
                errors={state.errors}
              />
              <Button
                variant="contained"
                type="submit"
                className="submit-btn"
                disabled={state.submitting}
              >
                {state.submitting ? "Sending..." : "Send a message"}
                <span aria-hidden="true">↗</span>
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
export default Contact;
