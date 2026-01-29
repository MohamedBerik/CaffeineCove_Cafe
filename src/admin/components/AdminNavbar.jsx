import { useAuth } from "../../context/AuthContext";

const AdminNavbar = () => {
  const { logout } = useAuth();

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white fixed-top">
      <a className="navbar-brand" href="/admin/dashboard">
        Dashboard
      </a>
      <button
        className="navbar-toggler"
        type="button"
        data-toggle="collapse"
        data-target="#navbarScroll"
        aria-controls="navbarScroll"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon" />
      </button>
      <div className="collapse navbar-collapse" id="navbarScroll">
        <ul
          className="navbar-nav mr-auto my-2 my-lg-0 navbar-nav-scroll"
          style={{ maxHeight: 100 }}
        >
          <li className="nav-item active">
            <a className="nav-link" href="/">
              Home <span className="sr-only">(current)</span>
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="/admin/users">
              Users
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="/admin/categories">
              Categories
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="/admin/products">
              Products
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="/admin/customers">
              Customers
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="/admin/orders">
              Orders
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="/admin/employees">
              Employees
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="/admin/sales">
              Sales
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="/admin/reservations">
              Reservations
            </a>
          </li>
        </ul>
        <form className="d-flex">
          {/* <input
            className="form-control mr-2"
            type="search"
            placeholder="Search"
            aria-label="Search"
          /> */}
          <button className="btn btn-danger" type="submit" onClick={logout}>
            Logout
          </button>
        </form>
      </div>
    </nav>
  );
};
export default AdminNavbar;
