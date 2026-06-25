import React, { useContext, useRef } from 'react'
import "./share.css";

import { PermMedia, Label, Room, EmojiEmotions } from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import { useState } from 'react';
import axios from 'axios';

import { decodeImg } from "../../decodeImg";


export default function Share({ onPostCreate }) {
  const backend_url = import.meta.env.VITE_BACKEND_URL;
  const {user} = useContext(AuthContext);
  const desc = useRef();
  const [file, setFile] = useState(null);

  const submitHandler = async (e) => {
    e.preventDefault();
    const newPost = {
      uid: user._id,
      username: user.username,
      desc: desc.current.value
    }
    try {
      await axios.post(`${backend_url}/users/post/create`, newPost);
      onPostCreate(); // notify the parent component to refresh posts
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <div className='share'>
      <div className="shareWrapper">
        <div className="shareTop">
          <img className='shareProfileImg' src={user.profilePicture ? `data:image/jpeg;base64,${decodeImg(user.profilePicture.data)}` : '/assets/icon/person/noAvatar.png'} alt='' />
          <input placeholder="Share something here" type="text" className="shareInput" ref={desc} />
        </div>
        <hr className="shareHr" />
        <form className="shareBottom" onSubmit={submitHandler}>
          <div className="shareOptions">
            <label htmlFor='file' className="shareOption">
              <PermMedia htmlColor='tomato' className='shareIcon' />
              <span className="shareOptionText">Photo or Video</span>
              <input 
                style={{display: 'none'}} 
                type="file" 
                id="file" 
                accept='.png,.jpeg,.jpg' 
                onChange={(e) => setFile(e.target.files[0])} />
            </label>
            <div className="shareOption">
              <Label htmlColor='blue' className='shareIcon' />
              <span className="shareOptionText">Tag</span>
            </div>
            <div className="shareOption">
              <Room htmlColor='green' className='shareIcon' />
              <span className="shareOptionText">Location</span>
            </div>
            <div className="shareOption">
              <EmojiEmotions htmlColor='goldenrod' className='shareIcon' />
              <span className="shareOptionText">Feeling</span>
            </div>
          </div>
          <button className="shareButton" type='submit'>Share</button>
        </form>
        
      </div>
    </div>
  )
}
