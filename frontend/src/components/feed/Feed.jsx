import React, { useContext, useEffect, useState } from "react";
import "./feed.css";
import Share from "../share/Share";
import Post from "../post/Post";
import axios from "axios";

import { AuthContext } from "../../context/AuthContext";
import { validateProfilePage } from "../../regex/validateUrl";

const backend_url = import.meta.env.VITE_BACKEND_URL;

export default function Feed({username}) {
  // const { user:currentUser, isFetching, error, dispatch, feed_display_moments } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const { user } = useContext(AuthContext);

  const fetchPosts = async () => {
    const res = username 
      ? await axios.get(`${backend_url}/users/post/profile/${username}`)
      : await axios.get(`${backend_url}/users/post/allposts`);
    
    // console.log("posts: ", res.data);
    // console.log("username: ", username);

    // Sort the posts in descending order by 'createdAt' (latest first)
    const sortedPosts = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    setPosts(sortedPosts);
    
    // setPosts(res.data.sort((p1, p2) => {
    //   return new Date(p2.createdAt) - new Date(p1.createdAt);
    // }));
  };

  useEffect(()=>{
    fetchPosts();
  },[username, user._id])

  // When delete a post, let the feed to filter the deleted post in the displayed posts.
  const handlePostDelete = (postId) => {
    setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
  };

  // When create a new post, notify the frontend to refresh the page once.
  const handlePostCreate = () => {
    fetchPosts();
  };
  
  return (
    <div className="feed">
      <div className="feedWrapper">
        {(!username || username === user.username) && <Share onPostCreate={handlePostCreate} />}
        {posts && posts.map((p) => (
          <Post key={p._id} post={p} onPostDelete={handlePostDelete} />
        ))}
      </div>
    </div>
  );
}
