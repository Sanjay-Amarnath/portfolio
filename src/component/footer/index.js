import "./footer.scss";

const Footer = () => (
  <footer className="footer-div">
    <a className="footer-brand" href="#top">
      Sanjay Amarnath<span>.</span>
    </a>
    <span className="footer-note">Made with curiosity & a little extra care.</span>
    <span className="footer-copyright">© {new Date().getFullYear()} ALL RIGHTS RESERVED</span>
  </footer>
);

export default Footer;
