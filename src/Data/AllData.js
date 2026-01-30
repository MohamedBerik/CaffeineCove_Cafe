// import axios from "axios";
// import React, { createContext, useEffect, useState } from "react";

// // 1. أنشئ Context وصدره - بحرف كبير
// export const ApiContext = createContext(); // ⬅️ ApiContext بدل apiValue

// // 2. أنشئ hook لاستخدام Context
// export const useApi = () => {
//   const context = React.useContext(ApiContext);
//   if (!context) {
//     throw new Error("useApi must be used within AllData");
//   }
//   return context;
// };

// // 3. المكون الرئيسي
// function AllData({ children }) {
//   const [api, setApi] = useState([]);

//   useEffect(() => {
//     axios
//       .get("http://localhost:3000/")
//       .then((result) => {
//         setApi(result.data.products);
//       })
//       .catch((error) => {
//         console.error("Error fetching data:", error);
//         setApi([]);
//       });
//   }, []);

//   return (
//     <ApiContext.Provider value={{ api, setApi }}>
//       {" "}
//       {/* ⬅️ ApiContext.Provider */}
//       {children}
//     </ApiContext.Provider>
//   );
// }

// export default AllData;
