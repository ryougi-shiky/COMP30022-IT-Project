import {BrowserRouter, Routes, Route, Navigate} from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import { useCookies } from 'react-cookie';

import Home from "./pages/home/Home";
import Profile from "./pages/profile/Profile"
import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
import Moments from "./pages/moments/Moments";
import HealthCheck from "./pages/healthcheck/HealthCheck";

function App() {
  const { user } = useContext(AuthContext);
  const [cookies, setCookie, removeCookie] = useCookies(["user"]);
  // Read user icon from database
  // if (user.profilePicture) {
  //   user.profilePicture = Buffer.from(user.profilePicture).toString("base64");
  // }
  return (
    <BrowserRouter>
        <div>
            
        </div>
        <Routes>
            <Route exact path="/" element={(user && cookies.user) ? <Home /> : <Register />}></Route>
            <Route exact path="/login" element={(user && cookies.user) ? <Navigate to='/' /> : <Login />}></Route>
            <Route exact path="/register" element={cookies.user ? <Navigate to='/' /> : <Register />}></Route>
            <Route path="/profile/:username" element={user ? <Profile /> : <Navigate to='/login' />}></Route>
            <Route exact path="/moments" element= {user ? <Moments /> : <Navigate to='/' /> }></Route>
            <Route exact path="/healthcheck" element= { <HealthCheck /> }></Route>
        </Routes>
    </BrowserRouter>
  )
}

export default App;
