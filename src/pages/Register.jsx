import React from 'react';
import './Login.css';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();

  return (
    <div className="login-background">
      <div className="login-glass">
        <h2 className="login-title">Create Account</h2>

        <form className="login-form">
          <div className="input-icon">
            <i className="bx bxs-user" style={{ color: "#ffffff" }}></i>
            <input type="text" placeholder="Username" className="login-input" />
          </div>
          <div className="input-icon">
            <i className="bx bx-at" style={{ color: "#ffffff" }}></i>
            <input type="email" placeholder="Email" className="login-input" />
          </div>
          <div className="input-icon">
            <i className="bx bxs-lock" style={{ color: "#ffffff" }}></i>
            <input type="password" placeholder="Password" className="login-input" />
          </div>

          <button type="submit" className="login-button">Register</button>
        </form>

        <div className="login-switch">
          Already have an account?{' '}
          <span className="switch-link" onClick={() => navigate('/login')}>
            Login
          </span>
        </div>
      </div>
    </div>
  );
};

export default Register;