import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { assets } from '../assets/assets';

const Homeadmin = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => setCustomers(data));
  }, []);

  const filteredCustomers = customers.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const isPending = c.orders < 3;
    const isCompleted = c.orders >= 3;

    return (
      matchesSearch &&
      (filter === 'all' ||
        (filter === 'pending' && isPending) ||
        (filter === 'completed' && isCompleted))
    );
  });

  return (
    <div>
      <style>{`
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          background-color: #fff5f8;
        }

        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 40px;
          background-color: #d63384;
          color: white;
        }

        .nav-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .nav-left img {
          width: 35px;
          height: 35px;
          border-radius: 50%;
        }

        .logo-wrapper {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .logo-chef {
          font-size: 27px;
          font-family: 'Cream Cake', cursive;
          font-weight: 400;
          color: #FFF;
          line-height: normal;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-left: 40px;
        }

        .nav-links a {
          color: white;
          text-decoration: none;
          font-weight: 700;
          font-size: 14px;
          font-family: 'Montserrat', sans-serif;
          text-align: center;
          line-height: normal;
        }

        .nav-links a:hover {
          text-decoration: underline;
        }

        .user-icon {
          width: 24px;
          height: 24px;
          cursor: pointer;
        }

        .container {
          margin: 40px auto;
          max-width: 900px;
          background: white;
          padding: 30px;
          border: 1px solid #ccc;
          border-radius: 10px;
          position: relative;
          z-index: 1;
        }

        h2 {
          color: #d63384;
          margin-bottom: 10px;
        }

        .search-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          margin-bottom: 20px;
        }

        .search-wrapper img {
          position: absolute;
          left: 10px;
          width: 20px;
          height: 20px;
        }

        .search-wrapper input {
          flex: 1;
          padding: 10px 10px 10px 40px;
          border: 1px solid #ccc;
          border-radius: 5px;
          font-size: 14px;
        }

        .filter-select {
          margin-left: 10px;
          padding: 10px;
          font-size: 14px;
          border-radius: 5px;
          border: 1px solid #ccc;
        }

        table {
          border-collapse: collapse;
          width: 100%;
          background-color: #fff;
        }

        th, td {
          text-align: left;
          padding: 12px;
          border-bottom: 1px solid #ddd;
        }

        th {
          background-color: #f8f8f8;
        }

        .footer-gradient {
          width: 100%;
          height: 150px;
          background: radial-gradient(circle, #f7ebcc, #e99aa5, #d26a8b);
          margin-top: 50px;
          box-shadow: inset 0 10px 10px rgba(0, 0, 0, 0.05);
          position: relative;
        }

        .footer-gradient::before {
          content: "";
          position: absolute;
          top: -30px;
          width: 100%;
          height: 30px;
          background: linear-gradient(to bottom, rgba(255, 245, 248, 0), #fff5f8);
        }

        @media screen and (max-width: 600px) {
          .nav-links {
            display: none;
          }
        }
      `}</style>

      <div className="container">
        <h2>CUSTOMER LIST</h2>
        <div className="search-wrapper">
          <img src= {assets.SearchLOGO} alt="Search Icon" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customer..."
          />
          <select
            className="filter-select"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending Orders</option>
            <option value="completed">Completed Orders</option>
          </select>
        </div>

        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Orders</th>
              <th>Account Created</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((c, index) => (
              <tr key={index}>
                <td>{c.name}</td>
                <td>{c.email}</td>
                <td>{c.orders}</td>
                <td>{c.accountCreated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="footer">
        <div className="footer-gradient"></div>
      </footer>
    </div>
  );
};

export default Homeadmin;
