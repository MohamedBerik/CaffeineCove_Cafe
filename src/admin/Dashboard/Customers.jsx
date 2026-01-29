import CrudTable from "../../components/admin/CrudTable";
import { customersApi } from "../../services/adminApi";

const Customers = () => {
  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "status", label: "Status" },
    { key: "created_at", label: "Date" },
  ];

  return <CrudTable title="Customers" columns={columns} api={customersApi} />;
};

export default Customers;
