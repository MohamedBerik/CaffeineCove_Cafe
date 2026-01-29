import CrudTable from "../../components/admin/CrudTable";
import { usersApi } from "../../services/adminApi";

const Users = () => {
  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role" },
    { key: "status", label: "Status" },
    { key: "created_at", label: "Date" },
  ];

  return <CrudTable title="Users" columns={columns} api={usersApi} />;
};

export default Users;
