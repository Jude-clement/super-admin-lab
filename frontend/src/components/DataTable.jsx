import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Users from './Users';
import Dashboard from './Dashboard';
import Labs from './Labs';
import CreateLab from './CreateLab';
import EditLab from './EditLab';
import api from '../api';
import Tickets from './Tickets';
import CreateTicket from './CreateTicket';
import EditTicket from './EditTicket';

const menuComponents = {
  dashboard: Dashboard,
  'manage-user': Users,
  labs: Labs,
  'labs/create': CreateLab,
  'labs/edit': EditLab,
  tickets: Tickets,
  'tickets/create': CreateTicket,
  'tickets/edit': EditTicket,
};

const menuTitles = {
  dashboard: 'Dashboard',
  'manage-user': 'Users',
  'labs/create': 'Create New Lab',
  'labs/edit': 'Edit Lab',
  labs: 'Labs',
  tickets: 'Tickets',
};

const DataTable = () => {
  const [activeMenu, setActiveMenu] = useState(
    localStorage.getItem('activeMenu') || 'dashboard'
  );
  const [selectedLab, setSelectedLab] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const navigate = useNavigate();

  const handleLabAction = useCallback(async (action, labData) => {
    try {
      setActiveMenu('labs');
    } catch (err) {
      console.error(`${action} lab failed`, err);
    }
  }, [selectedLab]);

  const handleLogout = useCallback(async () => {
    try {
      await api.post('/logout');
      localStorage.clear();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  }, [navigate]);

  useEffect(() => {
    localStorage.setItem('activeMenu', activeMenu);
  }, [activeMenu]);

  const toggleSidebar = useCallback(() => {
    document.body.classList.toggle('sidebar-collapse');
  }, []);

  const handleMenuClick = useCallback((menu) => {
    setActiveMenu(menu);
  }, []);

  const renderActiveComponent = () => {
    const Component = menuComponents[activeMenu];
    if (!Component) return null;

    const isTicket = activeMenu.startsWith('tickets');
    const isLab = activeMenu.startsWith('labs');

    const commonProps = {
      setActiveMenu,
      setSelectedLab,
      setSelectedTicket,
      onSubmit: () => setActiveMenu(isTicket ? 'tickets' : 'labs'),
      onCancel: () => setActiveMenu(isTicket ? 'tickets' : 'labs'),
    };

    if (activeMenu === 'labs/edit') {
      return <Component lab={selectedLab} {...commonProps} />;
    }
    if (activeMenu === 'tickets/edit') {
      return <Component ticket={selectedTicket} {...commonProps} />;
    }
    return <Component {...commonProps} />;
  };

  const navItems = [
    { menu: 'dashboard', icon: 'tachometer-alt', text: 'Dashboard' },
    { menu: 'manage-user', icon: 'table', text: 'Manage User' },
    { menu: 'labs', icon: 'cog', text: 'Manage Labs' },
    { menu: 'tickets', icon: 'ticket-alt', text: 'Tickets' },
    { menu: 'logout', icon: 'sign-out-alt', text: 'Logout', action: handleLogout },
  ];

  return (
    <div className="wrapper">
      <nav className="main-header navbar navbar-expand navbar-white navbar-light">
        <ul className="navbar-nav">
          <li className="nav-item">
            <a className="nav-link" data-widget="pushmenu" href="#" role="button" onClick={toggleSidebar}>
              <i className="fas fa-bars"></i>
            </a>
          </li>
          {navItems.slice(0, -1).map((item) => (
            <li key={item.menu} className="nav-item d-none d-sm-inline-block">
              <a href="#" className="nav-link" onClick={() => handleMenuClick(item.menu)}>
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <aside className="main-sidebar sidebar-dark-primary elevation-4">
        <a href="../../index3.html" className="brand-link">
          <span className="brand-text font-weight-light">AdminLTE 3</span>
        </a>

        <div className="sidebar">
          <nav className="mt-2">
            <ul className="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu" data-accordion="false">
              {navItems.map((item) => (
                <li key={item.menu} className="nav-item has-treeview">
                  <a 
                    href="#" 
                    className="nav-link" 
                    onClick={item.action || (() => handleMenuClick(item.menu))}
                  >
                    <i className={`nav-icon fas fa-${item.icon}`}></i>
                    <p>{item.text}</p>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>

      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1>{menuTitles[activeMenu] || ''}</h1>
              </div>
            </div>
          </div>
        </section>

        <section className="content">
          <div className="row">
            <div className="col-12">
              {renderActiveComponent()}
            </div>
          </div>
        </section>
      </div>

      <footer className="main-footer">
        <div className="float-right d-none d-sm-block">
          <b>Version</b> 3.0.4
        </div>
        <strong>
          Copyright &copy; 2014-2019 <a href="http://adminlte.io">AdminLTE.io</a>.
        </strong> All rights reserved.
      </footer>
    </div>
  );
};

export default React.memo(DataTable);
