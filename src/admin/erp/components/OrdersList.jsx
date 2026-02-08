import React, { useEffect, useState } from "react";
import api from "../../../services/axios";
import { notifyError, notifySuccess } from "../../../utils/notify";
import { useNavigate } from "react-router-dom";

const OrdersList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    setLoading(true);
    api
      .get("/erp/orders")
      .then((res) => setOrders(res.data))
      .catch((err) => {
        console.error(err);
        notifyError("Failed to fetch orders");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleConfirm = async (id) => {
    try {
      const res = await api.post(`/erp/orders/${id}/confirm`);
      notifySuccess(res.data.msg);
      fetchOrders();
    } catch (err) {
      console.error(err);
      notifyError(err.response?.data?.msg || "Confirm failed");
    }
  };

  const handleCancel = async (id) => {
    try {
      const res = await api.post(`/erp/orders/${id}/cancel`);
      notifySuccess(res.data.msg);
      fetchOrders();
    } catch (err) {
      console.error(err);
      notifyError(err.response?.data?.msg || "Cancel failed");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500 text-lg animate-pulse">Loading orders...</p>
      </div>
    );

  return (
    <div className="mt-6 px-4 sm:px-6 lg:px-8">
      <h3 className="text-2xl font-semibold mb-4">Orders List</h3>

      {/* Responsive table wrapper */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 shadow rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                ID
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                Customer
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                Total
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                Status
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">
                  {o.id}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">
                  {o.customer?.name || "-"}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">
                  ${o.total}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      o.status === "confirmed"
                        ? "bg-green-100 text-green-800"
                        : o.status === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {o.status}
                  </span>
                </td>
                <td className="px-4 py-2 whitespace-nowrap flex flex-wrap gap-2">
                  <button
                    className={`px-2 py-1 rounded text-white text-sm ${
                      o.status === "confirmed" || o.status === "cancelled"
                        ? "bg-green-300 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                    onClick={() => handleConfirm(o.id)}
                    disabled={
                      o.status === "confirmed" || o.status === "cancelled"
                    }
                  >
                    Confirm
                  </button>

                  <button
                    className={`px-2 py-1 rounded text-white text-sm ${
                      o.status === "cancelled"
                        ? "bg-red-300 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                    onClick={() => handleCancel(o.id)}
                    disabled={o.status === "cancelled"}
                  >
                    Cancel
                  </button>

                  <button
                    className="px-2 py-1 rounded text-white text-sm bg-blue-600 hover:bg-blue-700"
                    onClick={() => navigate(`/admin/erp/orders/${o.id}`)}
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrdersList;
