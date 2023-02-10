import Contact from "../../component/contact";
import Count from "../../component/count/count";
import Footer from "../../component/footer";
import Navbar from "../../component/navbar";
import Profile from "../../component/profile";
import Skills from "../../component/skills/skills";

const Home = () => {
  return (
    <>
      <Navbar />
      <Profile />
      <Count />
      <Skills />
      <Contact />
      <Footer/>
    </>
  );
};
export default Home;
