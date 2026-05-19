// import React, { useState } from "react";
// import Navbar from "../../components/Navbar/Navbar";
// import Footer from "../../components/Footer/Footer";
// import api from "../../services/axios"; // Axios مهيأ مسبقًا مع BaseURL
// import { useAuth } from "../../context/AuthContext";
// import { notifyError, notifySuccess } from "../../utils/notify";

// function AllContact() {
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     persons: "",
//     date: "",
//     time: "",
//     message: "",
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");

//   const { user } = useAuth();
//   const token = user?.token || localStorage.getItem("token");

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value,
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");
//     setSuccess("");
//     setLoading(true);

//     try {
//       const response = await api.post("/reservations", formData, {
//         // headers: {
//         //   Authorization: `Bearer ${token}`,
//         // },
//       });

//       setSuccess("Reservation sent successfully ✅");
//       notifySuccess("Reservation confirmed");
//       setFormData({
//         name: "",
//         email: "",
//         persons: "",
//         date: "",
//         time: "",
//         message: "",
//       });
//       console.log(response.data);
//     } catch (err) {
//       notifyError("Failed to confirm reservation");
//       console.error(err);
//       if (err.response?.data?.message) {
//         setError(err.response.data.message);
//       } else {
//         setError("Server error ❌");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div>
//       <Navbar />

//       <Footer />
//     </div>
//   );
// }

// export default AllContact;
