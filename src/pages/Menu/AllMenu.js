import React from "react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

function AllMenu() {
  return (
    <div>
      <Navbar />
      <section id="menu">
        <div class="container">
          <div class="heading">
            <span class="text-primary">Set Menu</span>
            <h2>Our Popular Menu</h2>
          </div>
          <div class="row">
            <div class="col">
              {/* <!-- item 1 --> */}
              <div class="item">
                <img src="img/menu-1.png" alt="Espresso" />
                <div class="details">
                  <h3>Espresso</h3>
                  <p>
                    Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                    Impedit, qui.
                  </p>
                </div>
                <div class="price">
                  <p class="text-primary">$19.99</p>
                </div>
              </div>

              {/* <!-- item 2 --> */}
              <div class="item">
                <img src="img/menu-2.png" alt="Americano" />
                <div class="details">
                  <h3>Americano</h3>
                  <p>
                    Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                    Impedit, qui.
                  </p>
                </div>
                <div class="price">
                  <p class="text-primary">$14.99</p>
                </div>
              </div>

              {/* <!-- item 3 --> */}
              <div class="item">
                <img src="img/menu-3.png" alt="Cappuccino" />
                <div class="details">
                  <h3>Cappuccino</h3>
                  <p>
                    Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                    Impedit, qui.
                  </p>
                </div>
                <div class="price">
                  <p class="text-primary">$12.99</p>
                </div>
              </div>

              {/* <!-- item 4 --> */}
              <div class="item">
                <img src="img/menu-4.png" alt="Cappuchino" />
                <div class="details">
                  <h3>Cappuchino</h3>
                  <p>
                    Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                    Impedit, qui.
                  </p>
                </div>
                <div class="price">
                  <p class="text-primary">$12.99</p>
                </div>
              </div>
            </div>

            <div class="col">
              {/* <!-- item 5 --> */}
              <div class="item">
                <img src="img/menu-5.png" alt="Espresso" />
                <div class="details">
                  <h3>Espresso</h3>
                  <p>
                    Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                    Impedit, qui.
                  </p>
                </div>
                <div class="price">
                  <p class="text-primary">$18.99</p>
                </div>
              </div>

              {/* <!-- item 6 --> */}
              <div class="item">
                <img src="img/menu-6.png" alt="Flat White" />
                <div class="details">
                  <h3>Flat White</h3>
                  <p>
                    Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                    Impedit, qui.
                  </p>
                </div>
                <div class="price">
                  <p class="text-primary">$15.99</p>
                </div>
              </div>

              {/* <!-- item 7 --> */}
              <div class="item">
                <img src="img/menu-7.png" alt="Cortado" />
                <div class="details">
                  <h3>Cortado</h3>
                  <p>
                    Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                    Impedit, qui.
                  </p>
                </div>
                <div class="price">
                  <p class="text-primary">$12.99</p>
                </div>
              </div>

              {/* <!-- item 8 --> */}
              <div class="item">
                <img src="img/menu-8.png" alt="Mocha" />
                <div class="details">
                  <h3>Mocha</h3>
                  <p>
                    Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                    Impedit, qui.
                  </p>
                </div>
                <div class="price">
                  <p class="text-primary">$12.99</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default AllMenu;
