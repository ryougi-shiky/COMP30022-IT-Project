import "./conversation.css";

import React, { useContext, useState, useEffect } from 'react'
import axios from "axios";

import { AuthContext } from "../../context/AuthContext";

const backend_url = import.meta.env.VITE_BACKEND_URL;

export default function Conversation({conversation}) {
  const {user:currentUser} = useContext(AuthContext);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const friendId = conversation.members.find((m) => m !== currentUser._id);
    const getUser = async ()=> {
      try {
        const res = await axios(`${backend_url}/users?uid=${friendId}`);
        setUser(res.data);
        console.log("c res: ", res);
      } catch (err) {
        console.log(err);
      }
    }
    getUser();
  }, [currentUser, conversation])
  
  return (
    <div className="conversation">
      <img src={user?.profilePicture ? user.profilePicture : "/assets/icon/person/noAvatar.png"} alt="" className="conversationImg" />
      <span className="conversationName">{user?.username}</span>
    </div>
  )
}
