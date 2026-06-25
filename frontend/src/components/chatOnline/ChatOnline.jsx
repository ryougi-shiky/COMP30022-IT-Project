import "./chatOnline.css";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

const backend_url = import.meta.env.VITE_BACKEND_URL;

export default function ChatOnline({
  onlineUsers,
  currentUserId,
  setCurrentChat,
}) {
  const [friends, setFriends] = useState([]);
  const [onlineFriends, setOnlineFriends] = useState([]);

  useEffect(() => {
    const getFriends = async () => {
      const res = await axios.get(
        `${backend_url}/users/friends/${currentUserId}`
      );
      setFriends(res.data);
    };
    getFriends();
  }, [currentUserId]);

  console.log("chatOnline friends: ", friends);

  useEffect(() => {
    setOnlineFriends(friends.filter((f) => onlineUsers.includes(f._id)));
  }, [friends, onlineUsers]);

  console.log("onlineUsers: ", onlineUsers);

  const handleClick = async (onlineFriend) => {
    try {
      const res = await axios.get(`${backend_url}/conversation/find/${currentUserId}/${onlineFriend._id}`);
      setCurrentChat(res.data);
    } catch (err) {
      console.log(err);
    }
  }
  return (
    <div className="chatOnline">
      {onlineFriends.map((onlineFriend) => (
        <div className="chatOnlineFriend" onClick={()=>{handleClick(onlineFriend)}}>
          <div className="chatOnlineImgContainer">
            <img
              src={
                onlineFriend?.profilePicture
                  ? onlineFriend?.profilePicture
                  : "/assets/icon/person/noAvatar.png"
              }
              alt=""
              className="chatOnlineImg"
            />
            <div className="chatOnlineBadge"></div>
          </div>
          <span className="chatOnlineName">{onlineFriend?.username}</span>
        </div>
      ))}
    </div>
  );
}
