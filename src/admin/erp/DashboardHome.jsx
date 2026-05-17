// import { useEffect, useState } from "react";
// import axios from "../../services/axios";
// import "./DashboardHome.css";

// import {
//   LineChart,
//   Line,
//   CartesianGrid,
//   XAxis,
//   YAxis,
//   Tooltip,
//   ResponsiveContainer,
//   BarChart,
//   Bar,
// } from "recharts";

// export default function DashboardHome() {
//   const [data, setData] = useState(null);
//   const [timeframe, setTimeframe] = useState("7d");

//   useEffect(() => {
//     loadDashboard();
//   }, []);

//   const loadDashboard = async () => {
//     const res = await axios.get("/erp/dashboard/finance");
//     setData(res.data);
//   };

//   if (!data) {
//     return (
//       <div
//         className="d-flex justify-content-center align-items-center"
//         style={{ minHeight: "400px" }}
//       >
//         <div className="spinner-border text-primary" role="status">
//           <span className="visually-hidden">Loading...</span>
//         </div>
//       </div>
//     );
//   }

//   const { stats } = data;

//   const formatCurrency = (value) => {
//     return new Intl.NumberFormat("en-US", {
//       style: "currency",
//       currency: "USD",
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     }).format(value);
//   };

//   const formatNumber = (value) => {
//     return new Intl.NumberFormat("en-US").format(value);
//   };

//   return (
//     <div className="dashboard-container">
//       {/* Header with date/time */}
//       <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
//         <div>
//           <h4 className="fw-bold mb-1">Financial Dashboard</h4>
//           <p className="text-muted mb-0">
//             <i className="fas fa-calendar-alt me-2"></i>
//             {new Date().toLocaleDateString("en-US", {
//               weekday: "long",
//               year: "numeric",
//               month: "long",
//               day: "numeric",
//             })}
//           </p>
//         </div>
//         <div className="btn-group bg-white rounded shadow-sm">
//           <button
//             className={`btn btn-sm ${timeframe === "7d" ? "btn-primary" : "btn-light"}`}
//             onClick={() => setTimeframe("7d")}
//           >
//             7 Days
//           </button>
//           <button
//             className={`btn btn-sm ${timeframe === "30d" ? "btn-primary" : "btn-light"}`}
//             onClick={() => setTimeframe("30d")}
//           >
//             30 Days
//           </button>
//           <button
//             className={`btn btn-sm ${timeframe === "90d" ? "btn-primary" : "btn-light"}`}
//             onClick={() => setTimeframe("90d")}
//           >
//             90 Days
//           </button>
//         </div>
//       </div>

//       {/* Today Overview */}
//       <section className="mb-4">
//         <div className="d-flex align-items-center mb-3">
//           <div
//             className="bg-primary rounded-circle p-2 me-2"
//             style={{ width: "8px", height: "8px" }}
//           ></div>
//           <h5 className="fw-semibold mb-0">Today's Overview</h5>
//           <span className="badge bg-light text-dark ms-2">Real-time</span>
//         </div>

//         <div className="row g-3">
//           <div className="col-12 col-sm-6 col-xl-3">
//             <KpiCard
//               title="Sales Today"
//               value={formatCurrency(stats.sales_today)}
//               icon="fas fa-shopping-cart"
//               color="primary"
//             />
//           </div>
//           <div className="col-12 col-sm-6 col-xl-3">
//             <KpiCard
//               title="Payments Today"
//               value={formatCurrency(stats.payments_today)}
//               icon="fas fa-credit-card"
//               color="success"
//             />
//           </div>
//           <div className="col-12 col-sm-6 col-xl-3">
//             <KpiCard
//               title="Refunds Today"
//               value={formatCurrency(stats.refunds_today)}
//               icon="fas fa-undo-alt"
//               color="warning"
//             />
//           </div>
//           <div className="col-12 col-sm-6 col-xl-3">
//             <KpiCard
//               title="Outstanding Receivables"
//               value={formatCurrency(stats.outstanding)}
//               icon="fas fa-clock"
//               color="danger"
//             />
//           </div>
//         </div>
//       </section>

//       {/* Financial Snapshot */}
//       <section className="mb-4">
//         <div className="d-flex align-items-center mb-3">
//           <div
//             className="bg-success rounded-circle p-2 me-2"
//             style={{ width: "8px", height: "8px" }}
//           ></div>
//           <h5 className="fw-semibold mb-0">Financial Snapshot</h5>
//           <span className="badge bg-light text-dark ms-2">YTD</span>
//         </div>

//         <div className="row g-3">
//           <div className="col-6 col-md-4 col-lg-3 col-xl-2">
//             <SmallCard
//               title="Total Sales"
//               value={formatCurrency(data.total_sales)}
//             />
//           </div>
//           <div className="col-6 col-md-4 col-lg-3 col-xl-2">
//             <SmallCard
//               title="Gross Collected"
//               value={formatCurrency(data.gross_collected)}
//             />
//           </div>
//           <div className="col-6 col-md-4 col-lg-3 col-xl-2">
//             <SmallCard
//               title="Refunds Total"
//               value={formatCurrency(data.refunds_total)}
//             />
//           </div>
//           <div className="col-6 col-md-4 col-lg-3 col-xl-2">
//             <SmallCard
//               title="Net Collected"
//               value={formatCurrency(data.net_collected)}
//             />
//           </div>
//           <div className="col-6 col-md-4 col-lg-3 col-xl-2">
//             <SmallCard
//               title="Receivables"
//               value={formatCurrency(data.receivables)}
//             />
//           </div>
//           <div className="col-6 col-md-4 col-lg-3 col-xl-2">
//             <SmallCard
//               title="Collected"
//               value={formatCurrency(data.total_collected)}
//             />
//           </div>
//           <div className="col-6 col-md-4 col-lg-3 col-xl-2">
//             <SmallCard
//               title="Total Purchases"
//               value={formatCurrency(data.total_purchases)}
//             />
//           </div>
//           <div className="col-6 col-md-4 col-lg-3 col-xl-2">
//             <SmallCard
//               title="Paid to Suppliers"
//               value={formatCurrency(data.total_paid_to_suppliers)}
//             />
//           </div>
//           <div className="col-6 col-md-4 col-lg-3 col-xl-2">
//             <SmallCard title="Payables" value={formatCurrency(data.payables)} />
//           </div>
//         </div>
//       </section>

//       {/* Charts */}
//       <section className="mb-4">
//         <div className="row g-4">
//           <div className="col-12 col-xl-6">
//             <div className="card h-100 shadow-sm">
//               <div className="card-header bg-white border-0 pt-3 px-3">
//                 <div className="d-flex justify-content-between align-items-center">
//                   <h6 className="fw-semibold mb-0">
//                     <i className="fas fa-chart-line me-2 text-primary"></i>
//                     Sales Trend (Last 7 Days)
//                   </h6>
//                   <span className="badge bg-primary bg-opacity-10 text-primary">
//                     +
//                     {(
//                       (data.sales_chart[data.sales_chart.length - 1]?.total /
//                         data.sales_chart[0]?.total -
//                         1) *
//                       100
//                     ).toFixed(1)}
//                     % vs last week
//                   </span>
//                 </div>
//               </div>
//               <div className="card-body">
//                 <ResponsiveContainer width="100%" height={280}>
//                   <LineChart data={data.sales_chart}>
//                     <Line
//                       type="monotone"
//                       dataKey="total"
//                       stroke="#0d6efd"
//                       strokeWidth={2}
//                       dot={{ fill: "#0d6efd", r: 4 }}
//                       activeDot={{ r: 6 }}
//                     />
//                     <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//                     <XAxis
//                       dataKey="date"
//                       tick={{ fontSize: 12, fill: "#6c757d" }}
//                       axisLine={{ stroke: "#dee2e6" }}
//                     />
//                     <YAxis
//                       tick={{ fontSize: 12, fill: "#6c757d" }}
//                       axisLine={{ stroke: "#dee2e6" }}
//                       tickFormatter={(value) =>
//                         formatCurrency(value).replace("$", "")
//                       }
//                     />
//                     <Tooltip
//                       formatter={(value) => [formatCurrency(value), "Sales"]}
//                       contentStyle={{
//                         backgroundColor: "white",
//                         border: "1px solid #dee2e6",
//                         borderRadius: "8px",
//                         boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
//                       }}
//                     />
//                   </LineChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>
//           </div>

//           <div className="col-12 col-xl-6">
//             <div className="card h-100 shadow-sm">
//               <div className="card-header bg-white border-0 pt-3 px-3">
//                 <div className="d-flex justify-content-between align-items-center">
//                   <h6 className="fw-semibold mb-0">
//                     <i className="fas fa-chart-bar me-2 text-success"></i>
//                     Payments vs Refunds
//                   </h6>
//                   <div className="d-flex gap-2">
//                     <span className="badge bg-success bg-opacity-10 text-success">
//                       <i
//                         className="fas fa-circle me-1"
//                         style={{ fontSize: "8px" }}
//                       ></i>
//                       Payments
//                     </span>
//                     <span className="badge bg-warning bg-opacity-10 text-warning">
//                       <i
//                         className="fas fa-circle me-1"
//                         style={{ fontSize: "8px" }}
//                       ></i>
//                       Refunds
//                     </span>
//                   </div>
//                 </div>
//               </div>
//               <div className="card-body">
//                 <ResponsiveContainer width="100%" height={280}>
//                   <BarChart data={data.payments_chart}>
//                     <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//                     <XAxis
//                       dataKey="date"
//                       tick={{ fontSize: 12, fill: "#6c757d" }}
//                       axisLine={{ stroke: "#dee2e6" }}
//                     />
//                     <YAxis
//                       tick={{ fontSize: 12, fill: "#6c757d" }}
//                       axisLine={{ stroke: "#dee2e6" }}
//                       tickFormatter={(value) =>
//                         formatCurrency(value).replace("$", "")
//                       }
//                     />
//                     <Tooltip
//                       formatter={(value, name) => [
//                         formatCurrency(value),
//                         name === "payments" ? "Payments" : "Refunds",
//                       ]}
//                       contentStyle={{
//                         backgroundColor: "white",
//                         border: "1px solid #dee2e6",
//                         borderRadius: "8px",
//                         boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
//                       }}
//                     />
//                     <Bar
//                       dataKey="payments"
//                       fill="#198754"
//                       radius={[4, 4, 0, 0]}
//                       maxBarSize={50}
//                     />
//                     <Bar
//                       dataKey="refunds"
//                       fill="#ffc107"
//                       radius={[4, 4, 0, 0]}
//                       maxBarSize={50}
//                     />
//                   </BarChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Lists */}
//       <section>
//         <div className="row g-4">
//           {/* Latest Invoices */}
//           <div className="col-12 col-xl-6">
//             <div className="card shadow-sm h-100">
//               <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
//                 <h6 className="fw-semibold mb-0">
//                   <i className="fas fa-file-invoice me-2 text-primary"></i>
//                   Latest Invoices
//                 </h6>
//                 <a
//                   href="/admin/erp/invoices"
//                   className="btn btn-sm btn-outline-primary"
//                 >
//                   View All <i className="fas fa-arrow-right ms-1"></i>
//                 </a>
//               </div>
//               <div className="card-body p-0">
//                 <div className="table-responsive">
//                   <table className="table table-hover mb-0">
//                     <thead className="bg-light">
//                       <tr>
//                         <th className="px-3 py-2">Invoice #</th>
//                         <th className="px-3 py-2">Customer</th>
//                         <th className="px-3 py-2 text-end">Amount</th>
//                         <th className="px-3 py-2 text-center">Status</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {data.latest_invoices.map((i) => (
//                         <tr
//                           key={i.id}
//                           className="cursor-pointer"
//                           onClick={() =>
//                             (window.location.href = `/admin/erp/invoices/${i.id}`)
//                           }
//                         >
//                           <td className="px-3 py-2">
//                             <span className="fw-medium">{i.number}</span>
//                           </td>
//                           <td className="px-3 py-2">{i.customer}</td>
//                           <td className="px-3 py-2 text-end fw-semibold">
//                             {formatCurrency(i.total)}
//                           </td>
//                           <td className="px-3 py-2 text-center">
//                             <span
//                               className={`badge bg-${i.status === "paid" ? "success" : i.status === "pending" ? "warning" : "secondary"} bg-opacity-10 text-${i.status === "paid" ? "success" : i.status === "pending" ? "warning" : "secondary"}`}
//                             >
//                               {i.status}
//                             </span>
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Recent Activity */}
//           <div className="col-12 col-xl-6">
//             <div className="card shadow-sm h-100">
//               <div className="card-header bg-white py-3">
//                 <h6 className="fw-semibold mb-0">
//                   <i className="fas fa-history me-2 text-info"></i>
//                   Recent Activity
//                 </h6>
//               </div>
//               <div className="card-body p-0">
//                 <div className="list-group list-group-flush">
//                   {data.activities.map((a, index) => (
//                     <div key={a.id} className="list-group-item px-3 py-2">
//                       <div className="d-flex align-items-center">
//                         <div className="flex-shrink-0">
//                           <div
//                             className={`bg-${index % 3 === 0 ? "primary" : index % 3 === 1 ? "success" : "info"} bg-opacity-10 rounded-circle p-2`}
//                           >
//                             <i
//                               className={`fas fa-${index % 3 === 0 ? "file-invoice" : index % 3 === 1 ? "credit-card" : "undo"} text-${index % 3 === 0 ? "primary" : index % 3 === 1 ? "success" : "info"}`}
//                               style={{
//                                 width: "20px",
//                                 height: "20px",
//                                 display: "flex",
//                                 alignItems: "center",
//                                 justifyContent: "center",
//                               }}
//                             ></i>
//                           </div>
//                         </div>
//                         <div className="flex-grow-1 ms-3">
//                           <div className="fw-semibold small">
//                             {a.description}
//                           </div>
//                           <div className="text-muted small">
//                             <i
//                               className="fas fa-clock me-1"
//                               style={{ fontSize: "11px" }}
//                             ></i>
//                             {a.created_at}
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// }

// /* ================================================= */

// function KpiCard({ title, value, icon, color = "primary" }) {
//   return (
//     <div className="card h-100 shadow-sm border-0">
//       <div className="card-body">
//         <div className="d-flex justify-content-between align-items-start">
//           <div>
//             <div
//               className={`text-${color} bg-${color} bg-opacity-10 rounded p-2 mb-2`}
//               style={{ width: "fit-content" }}
//             >
//               <i className={`${icon} fs-6`}></i>
//             </div>
//             <div className="text-muted small text-uppercase fw-semibold">
//               {title}
//             </div>
//             <div className="fs-3 fw-bold mt-1">{value}</div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// function SmallCard({ title, value }) {
//   return (
//     <div className="card h-100 shadow-sm border-0">
//       <div className="card-body p-3">
//         <div className="text-muted small mb-1">{title}</div>
//         <div className="fw-semibold fs-6">{value}</div>
//       </div>
//     </div>
//   );
// }
