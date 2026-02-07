import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../services/axios";
import { notifyError } from "../../../utils/notify";

const CustomerStatement = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/erp/customers/${id}/statement`)
      .then((res) => {
        setRows(res.data.rows);
      })
      .catch(() => notifyError("Failed to load statement"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="container mt-4 pt-4">
      <div className="d-flex justify-content-between mb-3">
        <h4>Customer statement</h4>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
      </div>

      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Debit</th>
            <th>Credit</th>
            <th>Balance</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan="5" className="text-center">
                No entries
              </td>
            </tr>
          )}

          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.date}</td>
              <td>{r.description}</td>
              <td>{r.debit}</td>
              <td>{r.credit}</td>
              <td>{r.balance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerStatement;
