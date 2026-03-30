import React from "react";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";

function App() {
  return (
    <div>
      <Navbar />
      <section id="home">
        <div className="container">
          <div className="home-content">
            <div className="content-text">
              <h3>Black coffee is awesome.</h3>
              <h1>TIME DISCOVER COFFEE HOUSE</h1>
              <p>
                We care about quality and sustainability, sourcing ethically and
                using eco-friendly practices-because great coffee should make a
                difference.
              </p>
              <a href="#" className="btn">
                Explore More <i className="fa-solid fa-cart-shopping" />
              </a>
            </div>
            <img src="img/coffee-home.png" alt="Coffee Home" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default App;
