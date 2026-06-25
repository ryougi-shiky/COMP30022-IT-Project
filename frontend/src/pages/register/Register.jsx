import React from 'react';
import {useContext, useEffect, useState} from 'react';
import {useNavigate} from "react-router-dom";
import {Link} from 'react-router-dom';
import {useCookies} from 'react-cookie';

import "./register.css";
import {AuthContext} from '../../context/AuthContext';
import {loginCall} from '../../apiCall';
import axios from 'axios';

export default function Register() {
  const backend_url = import.meta.env.VITE_BACKEND_URL;
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");

  const [unameDupErr, setUnameDupErr] = useState("");
  const [emailDupErr, setEmailDupErr] = useState("");
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const {user, dispatch} = useContext(AuthContext);
  const [cookies] = useCookies(["user"]);
  const navigate = useNavigate();

  const errMsgPwdNotMatch = "Passwords don't match!";

  useEffect(() => {
    if (cookies.user) {
      loginCall({email: cookies.user.email, password: cookies.user.password}, dispatch);
    }
  }, [cookies, dispatch]);


  const handleClick = async (e) => {
    e.preventDefault();
    setFormSubmitted(true);
    setUnameDupErr("");
    setEmailDupErr("");

    if (password !== passwordAgain) {
      setPasswordMismatch(true);
      return;
    }
    setPasswordMismatch(false);

    const user = {
      username,
      email,
      password,
    };

    try {
      await axios.post(`${backend_url}/users/auth/register`, user);
      navigate('/login');
    } catch (err) {
      if (err.response?.status === 400) {
        if (err.response.data.type === "unameDupErr") {
          setUnameDupErr(err.response.data.message);
        } else if (err.response.data.type === "emailDupErr") {
          setEmailDupErr(err.response.data.message);
        }
      } else {
        console.log("Register failed:", err);
      }
    }
  };

  return (
    <div className="register">
      <div className="registerWrapper">
        <div className="registerLeft">
          <h3 className="registerLogo">Ani Ani Register</h3>
          <span className="registerDesc">
            Connect with another Ani friends here ^&^
          </span>
        </div>
        <div className="registerRight">
          <form className="registerBox" onSubmit={handleClick}>
            <input
              placeholder="Username"
              type="text"
              className="registerInput"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            {unameDupErr && <span className="error-msg">{unameDupErr}</span>}

            <input
              placeholder="Email"
              type="email"
              className="registerInput"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {emailDupErr && <span className="error-msg">{emailDupErr}</span>}

            <input
              placeholder="Password"
              type="password"
              className="registerInput"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />

            <input
              placeholder="Password Again"
              type="password"
              className="registerInput"
              value={passwordAgain}
              onChange={(e) => setPasswordAgain(e.target.value)}
              required
            />
            {formSubmitted && passwordMismatch && (
              <span className="error-msg">{errMsgPwdNotMatch}</span>
            )}

            <button type="submit" className="registerButton">Sign Up</button>
            <span className="registerForgot">Already have an account?</span>
            <Link to="/login">
              <button className="registerRegisterButton" type="button">Log into Account</button>
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
