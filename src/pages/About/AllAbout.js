import React from "react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

function AllAbout() {
  return (
    <div>
      <Navbar />
      <section id="about">
        <div class="container">
          <div class="row">
            <img src="img/about-img.png" alt="Coffee" />
            <div class="about-content">
              <h2>
                <span class="text-primary">Caffeine Cove</span> About Info
              </h2>
              <p>
                Caffeine Cove began as a small neighborhood cafe with a passion
                for great coffee and a welcoming atmosphere. Today, it's a go-to
                spot for coffee lovers seeking quality and comfort.
              </p>
              <div class="item">
                <h3>A Cozy Escape</h3>
                <p>
                  Lorem ipsum, dolor sit amet consectetur adipisicing elit.
                  Nesciunt, consectetur animi incidunt minus voluptatum
                  accusantium velit sunt soluta neque quo.
                </p>
              </div>
              <div class="item">
                <h3>Quality &amp; sustainability</h3>
                <p>
                  Lorem ipsum dolor, sit amet consectetur adipisicing elit.
                  Impedit voluptate aliquam totam quia fuga cupiditate vitae sed
                  in ea porro.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default AllAbout;
