import React from "react";
import { Link } from "react-router-dom"; // ⬅️ صحح هذا السطر

function Footer() {
  return (
    <div>
      <footer id="footer">
        <div className="footer-top">
          {" "}
          {/* ⬅️ غير class إلى className */}
          <div className="container">
            {" "}
            {/* ⬅️ هنا أيضاً */}
            <div className="row">
              {" "}
              {/* ⬅️ وهنا */}
              <div className="col">
                {" "}
                {/* ⬅️ وهنا */}
                <h3>About Info</h3>
                <p>
                  Lorem ipsum dolor, sit amet consectetur adipisicing elit.
                  Odit, nihil?
                </p>
                <ul>
                  <li>
                    <i className="fa-solid fa-location-dot"></i> Address: Giza
                    Egypt
                  </li>
                  <li>
                    <i className="fa-solid fa-envelope"></i> E mail:
                    contact@monsieur.atef.com
                  </li>
                  <li>
                    <i className="fa-solid fa-phone"></i> Phone: 0123456789
                  </li>
                </ul>
              </div>
              <div className="col">
                {" "}
                {/* ⬅️ وهنا */}
                <h3>Quick Links</h3>
                <ul>
                  <li>
                    <Link to="/">Home</Link> {/* ⬅️ استخدم Link بدل a */}
                  </li>
                  <li>
                    <Link to="/about">About us</Link>
                  </li>
                  <li>
                    <Link to="/menu">Menu</Link>
                  </li>
                  <li>
                    <Link to="/testimonials">Testimonials</Link>
                  </li>
                  <li>
                    <Link to="/contact">Contact</Link>
                  </li>
                </ul>
              </div>
              <div className="col">
                {" "}
                {/* ⬅️ وهنا */}
                <h3>Follow Us On</h3>
                <ul>
                  <li>
                    <a href="#">
                      <i className="fa-brands fa-facebook-f"></i> Facebook
                    </a>
                  </li>
                  <li>
                    <a href="#">
                      <i className="fa-brands fa-twitter"></i> Twitter
                    </a>
                  </li>
                  <li>
                    <a href="#">
                      <i className="fa-brands fa-youtube"></i> YouTube
                    </a>
                  </li>
                  <li>
                    <a href="#">
                      <i className="fa-brands fa-instagram"></i> Instagram
                    </a>
                  </li>
                  <li>
                    <a href="#">
                      <i className="fa-brands fa-pinterest"></i> Pinterest
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="copyright">
          {" "}
          {/* ⬅️ وهنا */}
          <p>
            &copy; All rights reserved | Made by
            <strong>
              <a
                href="https://wa.me/01001204267"
                target="_blank"
                rel="noopener noreferrer"
              >
                Mohamed Atef
              </a>
            </strong>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Footer;
