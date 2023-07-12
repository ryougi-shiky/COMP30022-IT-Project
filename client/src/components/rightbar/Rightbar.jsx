import React, { useState, useEffect, useContext, useRef } from "react";
import { Link } from 'react-router-dom';
import axios from "axios";
import "./rightbar.css";

import CakeIcon from "@mui/icons-material/Cake";
import { Add, Remove } from "@mui/icons-material";

import { Users } from "../../dummyData";
import OnlineFriends from "../onlineFriends/OnlineFriends";
import { AuthContext } from "../../context/AuthContext";

import { validateProfilePage } from "../../regex/validateUrl";
import { decodeImg } from "../../decodeImg";

import Weather from "../weather/Weather";

const backend_url = process.env.REACT_APP_BACKEND_URL;

export default function Rightbar({user}) {
  const [friends, setFriends] = useState([]);
  const [followed, setFollowed] = useState(false);
  const { user:currentUser, dispatch } = useContext(AuthContext);

  const [isEditing, setIsEditing] = useState(false);
  const [editAge, setEditAge] = useState(user?.age);
  const [editFrom, setEditFrom] = useState(user?.from);
  const inputAge = useRef();
  const inputFrom = useRef();
  


  useEffect(() => {
    // if no user, it will be an error
    setFollowed(currentUser.followings.includes(user?._id));
  }, [currentUser.followings, user?._id])
  
  useEffect(() => {
    const getFriends = async () => {
      try {
        const friendList = await axios.get(`${backend_url}/users/friends/${user?._id}`);
        setFriends(friendList.data);
      } catch (err) {
        console.log(err);
      }
    };
    getFriends();
  }, [currentUser._id]);

  const handleFollow = async () => {
    try {
      if (followed){
        await axios.put(`${backend_url}/users/${user._id}/unfollow`, {id: currentUser._id});
        dispatch({type: 'UNFOLLOW', payload:user._id});
      } else {
        await axios.put(`${backend_url}/users/${user._id}/follow`, {id: currentUser._id});
        dispatch({type: 'FOLLOW', payload:user._id});
      }
    } catch (err) {
      console.log(err);
    }
    setFollowed(!followed);
  }

  const handleEdit = () => {
    setIsEditing(!isEditing);
  }

  const handleCancel = () => {
    // setEditAge(user.age);
    // setEditFrom(user.from);
    setIsEditing(false);
  }

  const updateLocalUserinfo = () => {
    user.age = inputAge.current.value;
    user.from = inputFrom.current.value;
  }

  const handleSave = async (event) => {
    event.preventDefault();
    // make the PUT request here to update the user info
    try {
      const res = await axios.put(`${backend_url}/users/update/userinfo/${currentUser._id}`, 
      {age: inputAge.current.value, from: inputFrom.current.value});
      if (res.status === 200) {
        currentUser.age = inputAge.current.value;
        currentUser.from = inputFrom.current.value;
        updateLocalUserinfo();
        setIsEditing(false);
      }
    } catch (err) {
      console.log(err);
    }
  }

  const HomeRightbar = () => {
    return (
      <React.Fragment>
        <Weather />
        {/* <div className="birthdayContainer">
          <CakeIcon className="birthdayImg" />
          <span className="birthdayText">
            <b>Tifa</b> and <b>another 5 firends</b> have a birthday today
          </span>
        </div>
        <img src="/assets/img/2018-04-16 144229.jpg" alt="" className="rightbarAd" />
        <h4 className="rightbarTitle">Online Friends</h4>
        <ul className="rightbarFriendList">
          {Users.map((u) => (
            <OnlineFriends key={u.id} user={u} />
          ))}
        </ul> */}
      </React.Fragment>
    )
  }

  const ProfileRightbar = () => {
    return (
      <React.Fragment>
        {user.username !== currentUser.username && (
          <button className="rightbarFollowButton" onClick={handleFollow}>
            {followed ? 'Unfollow' : 'Follow'}
            {followed ? <Remove /> : <Add />}
          </button>
        )}
        <h4 className="rightbarTitle">User Info
          {user.username === currentUser.username &&
          (<div className="rightbarUserinfoEditButtons">
            {!isEditing && <button className="rightbarEditButton" onClick={handleEdit}>Edit</button>}
            {isEditing && <button className="rightbarEditButton" onClick={handleSave}>Save</button>}
            {isEditing && <button className="rightbarEditButton" onClick={handleCancel}>Cancel</button>}
          </div>)}
        </h4>
        <div className="rightbarInfo">
          <div className="rightbarInfoItem">
            <span className="rightbarInfoKey">Age: </span>
            {
              isEditing
                ? <input className="rightbarInfoValue" type="number" ref={inputAge} placeholder="Edit your age" />
                : <span className="rightbarInfoValue">{user.age}</span>
            }
          </div>
          <div className="rightbarInfoItem">
            <span className="rightbarInfoKey">From: </span>
            {
              isEditing
                ? <input className="rightbarInfoValue" type="text" ref={inputFrom} placeholder="Edit your location" />
                : <span className="rightbarInfoValue">{user.from}</span>
            }
          </div>
        </div>
        {/* <h4 className="rightbarTitle">Friends</h4>
        <div className="rightbarFollowings">
          {friends.map((friend) => (
            <Link to={`/profile/${friend.username}`}>
              <div className="rightbarFollowing">
                <img 
                  src= {friend.profilePicture ? `data:image/jpeg;base64,${decodeImg(friend.profilePicture.data)}` : "/assets/icon/person/noAvatar.png"} 
                  alt="" 
                  className="rightbarFollowingImg" />
                <span className="rightbarFollowingName">{friend.username}</span>
              </div>
            </Link>
          ))}
        </div> */}
      </React.Fragment>
    )
  }
  return (
    <div className="rightbar">
      <div className="rightbarWrapper">
        {validateProfilePage.test(window.location.href) ? <ProfileRightbar /> : <HomeRightbar />}
      </div>
    </div>
  );
}
