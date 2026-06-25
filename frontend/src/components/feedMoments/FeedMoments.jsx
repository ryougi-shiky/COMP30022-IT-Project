import React, { useContext, useEffect, useState } from "react";
import "./feedMoments.css";
import Share from "../share/Share";
import Post from "../post/Post";
import axios from "axios";

import { AuthContext } from "../../context/AuthContext";
import { validateProfilePage } from "../../regex/validateUrl";

const backend_url = import.meta.env.VITE_BACKEND_URL;

export default function FeedMoments({username}) {
  // const { user:currentUser, isFetching, error, dispatch, feed_display_moments } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const {user} = useContext(AuthContext);

  useEffect(()=>{
    const fetchPosts = async () => {
      const res = await axios.get(`${backend_url}/users/post/moments/${user._id}`);
      
      console.log("posts: ", res.data);
      console.log("username: ", username);
      setPosts(res.data);
    };
    fetchPosts();
  },[username, user._id])

  return (
    <div className="F">
      <div className="feedMomentsWrapper">
        {(!username || username === user.username) && <Share />}
        {posts && posts.map((p) => (
          <Post key={p.id} post={p} />
        ))}
      </div>
    </div>
  );
}
