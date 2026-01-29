import React from "react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

function AllTestimonials() {
  return (
    <div>
      <Navbar />
      <section id="testimonials">
        <div class="container">
          <div class="heading">
            <h2>What our Clients say</h2>
          </div>
          <div class="row">
            <div class="item">
              <img src="img/person1.jpg" alt="Mohamed Ramadan" />
              <h3>Mohamed Ramadan</h3>
              <p>
                Lorem ipsum, dolor sit amet consectetur adipisicing elit.
                Quibusdam cupiditate molestias recusandae iusto eius vero.
              </p>
            </div>
            <div class="item">
              <img src="img/person2.jpg" alt="Islam Mohamed" />
              <h3>Islam Mohamed</h3>
              <p>
                Lorem ipsum, dolor sit amet consectetur adipisicing elit.
                Quibusdam cupiditate molestias recusandae iusto eius vero.
              </p>
            </div>
            <div class="item">
              <img src="img/person3.jpg" alt="Mostafa Ashraf" />
              <h3>Mostafa Ashraf</h3>
              <p>
                Lorem ipsum, dolor sit amet consectetur adipisicing elit.
                Quibusdam cupiditate molestias recusandae iusto eius vero.
              </p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default AllTestimonials;
