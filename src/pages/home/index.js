import Count from "../../component/count/count";
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
    </>
  );
};
export default Home;
