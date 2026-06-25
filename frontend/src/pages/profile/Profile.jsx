import React, { useRef, useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from "axios";
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

import "./profile.css";

import Topbar from "../../components/topbar/Topbar";
import Rightbar from "../../components/rightbar/Rightbar";
import Feed from "../../components/feed/Feed";
import Sidebar from "../../components/sidebar/Sidebar";
import { AuthContext } from "../../context/AuthContext";
import { decodeImg } from "../../decodeImg";

const backend_url = import.meta.env.VITE_BACKEND_URL;

export default function Profile() {
  const { user:currentUser, dispatch } = useContext(AuthContext);
  console.log("currentUser: ", currentUser);
  const [user, setUser] = useState({});
  const params = useParams();
  const fileInput = useRef(); // reference to the file input element
  const [snackbarOpenOversize, setSnackbarOpenOversize] = useState(false); // Notification window
  const [snackbarOpenUploading, setSnackbarOpenUploading] = useState(false); // Notification window

  console.log("params: ", params);

  useEffect(()=>{
    const fetchUser = async () => {
      const res = await axios.get(`${backend_url}/users?username=${params.username}`);
      // console.log(res);
      setUser(res.data);
      // console.log("res.data.profilePicture: ", res.data.profilePicture);
      // console.log("user.profilePicture: ", user.profilePicture);
    };
    fetchUser();
  },[params.username]);

  var coverImg = "/assets/icon/person/noCover.png";
  const defaultProfilePicture = "/assets/icon/person/noAvatar.png";

  const handleProfilePictureClick = () => {
    if (user._id === currentUser._id) {
      fileInput.current.click(); // simulate a click on the file input element
    }
    
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file && file.size <= 256000) { // Ensure file is less than 256KB
      const formData = new FormData();
      formData.append('profilePicture', file);
      formData.append('userId', user._id);

      setSnackbarOpenUploading(true); // Notify user that image is uploading.
      console.log("img is uploading...");

      const response = await axios.put(`${backend_url}/users/${currentUser._id}/profilePicture`, formData);
      // after successful upload, dispatch the action to update the user in your context
      if (response.status === 200) {
        const updatedUserResponse = await axios.get(`${backend_url}/users?username=${currentUser.username}`);
        if (updatedUserResponse.status === 200) {
          // dispatch the action to update the user in your context
          dispatch({ type: 'UPDATE_USER', payload: updatedUserResponse.data });
        }
      }
    } else {
      setSnackbarOpenOversize(true); // Notify user that image is too large
      console.log("img is too large to upload!");
    }
  };
  
  return (
    <React.Fragment>
      <Topbar />
      <div className="profile">
        <Sidebar />
        <div className="profileRight">
          <div className="profileRightTop">
            <div className="profileCover">
              <img src={user.coverImg ? user.coverImg : coverImg} alt="" className="profileCoverImg" />
              <img
                src={user.profilePicture ? `data:image/jpeg;base64,${decodeImg(user.profilePicture.data)}` : defaultProfilePicture}
                alt=""
                className="profileUserImg"
                onClick={handleProfilePictureClick}
              />
              <input
                ref={fileInput}
                type="file"
                hidden
                onChange={handleFileChange}
              />
            </div>
            <div className="profileInfo">
              <h4 className="profileInfoName">{user.username}</h4>
              <h4 className="profileInfoDesc">{user.desc}</h4>
            </div>
          </div>
          <div className="profileRightBottom">
            <Feed username={params.username}/>
            <Rightbar user={user}/>
          </div>
        </div>
        
      </div>
      <Snackbar
        open={snackbarOpenOversize}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpenOversize(false)}
      >
        <Alert onClose={() => setSnackbarOpenOversize(false)} severity="warning" sx={{ width: '100%' }}>
          Your image is too large to upload! Please select an image smaller than 256KB.
        </Alert>
      </Snackbar>

      <Snackbar
        open={snackbarOpenUploading}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpenOversize(false)}
      >
        <Alert onClose={() => setSnackbarOpenUploading(false)} severity="warning" sx={{ width: '100%' }}>
          Your image is uploading.
        </Alert>
      </Snackbar>
    </React.Fragment>
  )
}
