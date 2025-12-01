import React from 'react';
import Button from "../../components/Button";
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

// Main homepage with team info and navigation
const HomePage = function() {
  const navigate = useNavigate(); // Hook for changing pages
  
  // When user clicks "Get Started" button
  function handleGetStarted() {
    console.log('Get started clicked!');
    navigate("../AITextDetectorPage"); // Go to the AI detector page
  };

  return (
    <div className="homepage">
      {/* Header at the top */}
      <header className="homepage-header">
        <div className="logo">AI-CD</div>
      </header>

      {/* Main content area */}
      <main className="main-content">
        {/* Button section */}
        <section className="cta-section">
          <Button onClick={handleGetStarted} size="large">
            Get Started
          </Button>
        </section>

        {/* Team description box */}
        <section className="team-description">
          <div className="description-content">
            <h2>About Team JackBoys</h2>
            <p>
              We are Team JackBoys, final-year Computer Science students at UCT who love tackling big problems with creative tech. Our capstone project is all about one hot topic right now which is AI-generated content.
            </p>
            <p>
              With tools like ChatGPT and other large language models popping up everywhere, it is getting harder to tell if something was written by a human or a machine. That is where we come in. We are building the AI Content Detector (AI-CD), a web app that lets you paste in text and find out whether it is likely AI-generated.
            </p>
            <p>
              The theme of our project is trust and transparency in the AI age. While our prototype currently focuses on text detection, we have left room to grow so one day the detector could check images and audio too.
            </p>
            <p>
              We are mixing React, Flask and Hugging Face transformers to make this happen. At the end of the day our mission is simple, help people know what is real, what is AI and maybe have a little fun while doing it.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;