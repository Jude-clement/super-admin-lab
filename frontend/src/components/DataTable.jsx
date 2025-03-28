import React, { useState, useEffect } from 'react';
import Users from './Users';
import Dashboard from './Dashboard';
import Labs from './Labs';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import CreateLabModal from './CreateLabModal';
import EditLabModal from './EditLabModal';

const DataTable = () => {
  const [activeMenu, setActiveMenu] = useState(
    localStorage.getItem('activeMenu') || 'dashboard'
  );
  const [selectedLab, setSelectedLab] = useState(null);
  const navigate = useNavigate();

  const handleCreateLab = async (labData) => {
    try {
      // Your create lab API call would go here
      // await api.post('/labs', labData);
      setActiveMenu('labs'); // Return to labs view after creation
    } catch (err) {
      console.error('Failed to create lab', err);
    }
  };

  const handleEditLab = async (labData) => {
    try {
      // Your edit lab API call would go here
      // await api.put(`/labs/${selectedLab.lab_id}`, labData);
      setActiveMenu('labs'); // Return to labs view after edit
    } catch (err) {
      console.error('Failed to edit lab', err);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/logout');
      localStorage.clear();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  useEffect(() => {
    localStorage.setItem('activeMenu', activeMenu);
  }, [activeMenu]);

  const toggleSidebar = () => {
    document.body.classList.toggle('sidebar-collapse');
  };

  const handleMenuClick = (menu) => {
    setActiveMenu(menu);
  };

  return (
    <div className="wrapper">
      <nav className="main-header navbar navbar-expand navbar-white navbar-light">
        <ul className="navbar-nav">
          <li className="nav-item">
            <a
              className="nav-link"
              data-widget="pushmenu"
              href="#"
              role="button"
              onClick={toggleSidebar}
            >
              <i className="fas fa-bars"></i>
            </a>
          </li>
          <li className="nav-item d-none d-sm-inline-block">
            <a
              href="#"
              className="nav-link"
              onClick={() => handleMenuClick('dashboard')}
            >
              Home
            </a>
          </li>
          <li className="nav-item d-none d-sm-inline-block">
            <a
              href="#"
              className="nav-link"
              onClick={() => handleMenuClick('manage-user')}
            >
              Tables
            </a>
          </li>
          <li className="nav-item d-none d-sm-inline-block">
            <a
              href="#"
              className="nav-link"
              onClick={() => handleMenuClick('labs')}
            >
              Labs
            </a>
          </li>
        </ul>
      </nav>

      <aside className="main-sidebar sidebar-dark-primary elevation-4">
        <a href="../../index3.html" className="brand-link">
          <span className="brand-text font-weight-light">AdminLTE 3</span>
        </a>

        <div className="sidebar">
          <nav className="mt-2">
            <ul className="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu" data-accordion="false">
              <li className="nav-item has-treeview">
                <a href="#" className="nav-link" onClick={() => handleMenuClick('dashboard')}>
                  <i className="nav-icon fas fa-tachometer-alt"></i>
                  <p>Dashboard</p>
                </a>
              </li>
              <li className="nav-item has-treeview">
                <a href="#" className="nav-link" onClick={() => handleMenuClick('manage-user')}>
                  <i className="nav-icon fas fa-table"></i>
                  <p>Manage User</p>
                </a>
              </li>
              <li className="nav-item has-treeview">
                <a href="#" className="nav-link" onClick={() => handleMenuClick('labs')}>
                  <i className="nav-icon fas fa-cog"></i>
                  <p>Manage Labs</p>
                </a>
              </li>
              <li className="nav-item has-treeview">
                <a href="#" className="nav-link" onClick={handleLogout}>
                  <i className="nav-icon fas fa-sign-out-alt"></i>
                  <p>Logout</p>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1>
                  {activeMenu === 'dashboard' ? 'Dashboard' : 
                   activeMenu === 'manage-user' ? 'Users' : 
                   activeMenu === 'labs/create' ? 'Create New Lab' :
                   activeMenu === 'labs/edit' ? 'Edit Lab' :
                   activeMenu === 'labs' ? 'Labs' : ''}
                </h1>
              </div>
            </div>
          </div>
        </section>

        <section className="content">
          <div className="row">
            <div className="col-12">
              {activeMenu === 'dashboard' && <Dashboard />}
              {activeMenu === 'manage-user' && <Users />}
              {activeMenu === 'labs' && (
                <Labs 
                  setActiveMenu={setActiveMenu}
                  setSelectedLab={setSelectedLab}
                />
              )}
              {activeMenu === 'labs/create' && (
                <CreateLabModal 
                  onSubmit={handleCreateLab}
                  onCancel={() => setActiveMenu('labs')}
                />
              )}
              {activeMenu === 'labs/edit' && selectedLab && (
                <EditLabModal 
                  lab={selectedLab}
                  onSubmit={handleEditLab}
                  onCancel={() => setActiveMenu('labs')}
                />
              )}
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
        </strong>{' '}
        All rights reserved.
      </footer>
    </div>
  );
};

export default DataTable;