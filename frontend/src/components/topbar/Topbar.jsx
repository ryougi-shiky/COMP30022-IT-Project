import React, { useContext, useState, useEffect, useRef } from 'react';
import { Search, Person, Chat, Notifications } from "@mui/icons-material";
import { Link, useNavigate } from 'react-router-dom';
import { useCookies } from 'react-cookie';

// import Dropdown from 'react-dropdown';
// import Dropdown from 'react-bootstrap/Dropdown';
// import DropdownButton from 'react-bootstrap/DropdownButton';
// import SplitButton from 'react-bootstrap/SplitButton';
// import ButtonGroup from 'react-bootstrap/ButtonGroup';
// import { MenuItem } from '@mui/material';

import Dropdown from 'rc-dropdown';
import Menu, { Item as MenuItem, Divider } from 'rc-menu';
import 'rc-dropdown/assets/index.css';

import "./topbar.css";

import { AuthContext } from '../../context/AuthContext';
import { Button } from '@mui/material';
import { decodeImg } from "../../decodeImg";
import axios from 'axios';
import { fontWeight } from '@mui/system';


const backend_url = import.meta.env.VITE_BACKEND_URL;
const defaultProfilePicture = "/assets/icon/person/noAvatar.png";

const menuOptions = [
  'Account', 'Log out'
];

const defaultOption = menuOptions[0];

const onSelect = ({ key }) => {
  console.log(`${key} selected`);
}

const onVisibleChange = (visible) => {
  // console.log(visible);
}

export default function Topbar() {
  const [cookies, setCookie, removeCookie] = useCookies(["user"]);
  const { user:currentUser, feed_display_moments } = useContext(AuthContext);
  const navigate = useNavigate();
  

  const [notifications, setNotifications] = useState([]);  // New state to store notifications
  // For search bar
  const searchValue = useRef();
  const [results, setResults] = useState([]);


  // const chatButton = () => {
  //   redirect('/messenger');
  // }

  console.log("topbar cookie: ", cookies);

  const logout = () => {
    removeCookie("user", {path: '/'}); 
    console.log("topbar removed cookie");
    // setCookie(null);
    navigate('/login');
    console.log("topbar redirect to login page");
  }

  // click moments, feed display moments posts
  const displayMoments = () => {
    navigate('/moments');
    // feed_display_moments = true;
    // console.log("clicked moments, feed_display_moments: ", feed_display_moments);
  }
  
  // click home, feed display all posts
  // const displayHome = () => {
  //   // navigate('/moments');
  //   feed_display_moments = false;
  //   console.log("clicked home, feed_display_moments: ", feed_display_moments);
  // }


  const menu = (
    <Menu onSelect={onSelect}>
      <Button className='topbarMenuButton'>
        <MenuItem key="1" >Account</MenuItem>
      </Button>
      <Divider />
      <Button className='topbarMenuButton' onClick={logout} >
        <MenuItem key="2" >Log Out</MenuItem>
      </Button>
    </Menu>
  );

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      const res = await axios.get(`${backend_url}/users/notify/get/follow/${currentUser._id}`);
      setNotifications(res.data);
    }
    fetchNotifications();
  }, [currentUser]);

  // Handler to clear a specific notification. nid means notification._id
  const handleClear = async (nid) => {
    try {
      const res = await axios.delete(`${backend_url}/users/notify/delete/follow/${nid}`);
      console.log("delete notification res.status: ", res.status);
      console.log("status 200: Notification has been deleted.");
      // Remove notification from state
      setNotifications(notifications.filter(notification => notification.nid !== nid));
    } catch (err) {
      console.error('Failed to delete notification');
      console.error(err);
    }
  }

  // New variable to define the dropdown list of notifications
  const notificationMenu = (
    <Menu>
      {notifications.length > 0 
      ? notifications.map((notification, index) => (
        <div key={index} className='notificationWrapper'>
          <Link to={`/profile/${notification.senderName}`}>
            <img className="notificationIcon" src={ notification.senderIcon ? `data:image/jpeg;base64,${decodeImg(notification.senderIcon.data)}` : defaultProfilePicture} alt="" />
          </Link>
          <div className='notificationContainer'>
            <MenuItem className='notificationContent'><span className='notificationContentUsername'>{notification.senderName}</span> is following you</MenuItem>
            <button className='notificationClearButton' onClick={() => handleClear(notification.nid)}>Clear</button>
          </div>
        </div>
      ))
      : <div className='notificationWrapper'>
          <MenuItem className='notificationContent'>No notifications</MenuItem>
        </div>}
    </Menu>
  );

  // Search drop down menu layout
  const searchResults = (
    <div className='searchResultsWindowWrapper'>
    <Menu onSelect={onSelect}>
      {results.length > 0 ?
        results.map((user, index) => (
          <MenuItem key={index}>
            <Link to={`/profile/${user.username}`} className='linkNoUnderline'>
              <div className='searchResultUserLine'>
                <img className="searchUserIcon" src={user.profilePicture ? `data:image/jpeg;base64,${decodeImg(user.profilePicture.data)}` : defaultProfilePicture} alt="" />
                <p className='searchUsername'>{user.username}</p>
              </div>
            </Link>
          </MenuItem>
        ))
        : <div className='searchResultUserLine'>
          <MenuItem className='searchUsername'>No results</MenuItem>
        </div>}
    </Menu>
    </div>
  );

  const handleSearchClick = async (e) => {
    e.preventDefault(); // Prevent form submission
    setResults([]); // Clear results when start a new search
    try {
      // Solve empty search return all users issue
      if (searchValue.current.value.trim() !== ""){
        const res = await axios.get(`${backend_url}/users/search/users?username=${searchValue.current.value}`);
        setResults(res.data);
        console.log("search results.length: ", results.length);
      } else {
        setResults([]);
        console.log("Empty search, return nothing");
      }
      
    } catch (err) {
      console.error(err);
    }
  };
  

  return (
    <div className='topbarContainer'>
      <div className="topbarLeft">
        <Link to="/" style={{ textDecoration:"none" }}>
          <span className="logo">Ani Ani</span>
        </Link>
        {/* <Dropdown ClassName="topbarMenu" options={menuOptions} placeholder="Menu"  /> */}
        <Dropdown
          trigger={['hover']}
          overlay={menu}
          animation="slide-up"
          onVisibleChange={onVisibleChange}
          className="topbarMenu"
        >
          <button style={{ width: 50 }}>Menu</button>
        </Dropdown>
      </div>
      
      <div className="topbarCenter">
        <div className="searchBar">
          <Dropdown
            trigger={['click']}
            overlay={searchResults}
            animation="slide-up"
            onVisibleChange={onVisibleChange}
          >
            <Search className="searchIcon" onClick={handleSearchClick} />
          </Dropdown>
          <input type="text" className="searchInput" placeholder='Search People or Posts' ref={searchValue} />
        </div>
      </div>
      <div className="topbarRight">
        <div className="topbarLinks">
          <span className="topbarLink">Home</span>
          <span className="topbarLink" onClick={ displayMoments }>Moments</span>
        </div>
        <div className="topbarIcons">
          <div className="topbarIconItem">
            <Person/>
            <span className="topbarIconBadge">1</span>
          </div>
          <div className="topbarIconItem">
            <Chat />
            <span className="topbarIconBadge">3</span>
          </div>
          <div className="topbarIconItem">
            <Dropdown
              trigger={['click']}
              overlay={notificationMenu}
              animation="slide-up"
              onVisibleChange={onVisibleChange}
            >
              <Notifications/>
            </Dropdown>
            <span className="topbarIconBadge">{notifications.length}</span>
          </div>
        </div>
        <Link to={`/profile/${currentUser.username}`}>
          <img src={ currentUser.profilePicture ? `data:image/jpeg;base64,${decodeImg(currentUser.profilePicture.data)}` : defaultProfilePicture} alt="" className="topbarImg" />
        </Link>
      </div>
    </div>
  )
}
