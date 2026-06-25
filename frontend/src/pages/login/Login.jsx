import React, { useContext, useRef, useReducer, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { AuthContext } from '../../context/AuthContext';
import AuthReducer from '../../context/AuthReducer';
import { useCookies } from 'react-cookie';

import "./login.css";

import axios from "axios";
import { loginCall } from '../../apiCall';
// import { CircularProgress } from '@chakra-ui/react'
import { CircularProgress } from '@mui/material';

export default function Login() {
  const backend_url = import.meta.env.VITE_BACKEND_URL;
  const email = useRef();
  const password = useRef();
  const {user: currentUser, isFetching, error, dispatch} = useContext(AuthContext);
  const [cookies, setCookie, removeCookie] = useCookies(["user"]);
  const navigate = useNavigate();

  const loginSetCookie = async (e) => {
    e.preventDefault();
    console.log("login email: ", email.current.value, " login password: ", password.current.value, " dispatch: ", dispatch);

    await loginCall({email: email.current.value, password: password.current.value}, dispatch);
    let user = {email: email.current.value, password: password.current.value };
    // setCookie("email", email.current.value, {path: '/'});
    // setCookie("password", password.current.value, {path: '/'});
    setCookie("user", user, {path: '/'});
  }
  
  useEffect(() => {
    if (cookies.user && !currentUser){
      loginCall({email: cookies.user.email, password: cookies.user.password}, dispatch);
    }
  }, []);

  // console.log("currentUser: ", currentUser);
  // console.log("login page cookie: ", cookies);
  // console.log("login dispatch: ", dispatch);

  const redirectToRegister = () => {
    navigate('/register');
  }

  return (
    <React.Fragment>
      <div className="login">
        <div className="loginWrapper">
          <div className="loginLeft">
            <h3 className="loginLogo">Ani Ani Login</h3>
            <span className="loginDesc">
              Connect with another Ani friends here ^&^
            </span>
          </div>
          <div className="loginRight">
            <form className="loginBox" onSubmit={loginSetCookie}>
              <input 
                placeholder='Email' 
                required 
                type="email" 
                className="loginInput" 
                ref={email} />
              <input 
                placeholder='Password' 
                required 
                type="password" 
                className="loginInput" 
                ref={password} 
                minLength="6" />
              <button className="loginButton" type='submit' data-testid="login-button" disabled={isFetching}>
                { isFetching 
                ? (<CircularProgress value={80} color='white' size='20px' />)
                : ("Log In") }
              </button>
              <span className="loginForgot">Forgot Password?</span>
              <button className="loginRegisterButton" data-testid="register-button" onClick={redirectToRegister} >Register</button>
            </form>
          </div>
        </div>
      </div>
    </React.Fragment>
  )
}