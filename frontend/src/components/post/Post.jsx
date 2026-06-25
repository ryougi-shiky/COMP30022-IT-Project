import React, { useState, useEffect } from "react";
import "./post.css";
import { MoreVert } from "@mui/icons-material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
import AddCommentIcon from "@mui/icons-material/AddComment";
import { Menu, MenuItem } from "@mui/material";

import axios from "axios";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { decodeImg } from "../../decodeImg";

const backend_url = import.meta.env.VITE_BACKEND_URL;

export default function Post({ post, onPostDelete }) {
	const [like, setLike] = useState(post.likes.length);
	const [isLiked, setIsLiked] = useState(false);
	const { user: currentUser } = useContext(AuthContext);
	const [user, setUser] = useState({}); // Post owner
	const postTime = new Date(post.createdAt);

	const [showCommentBox, setShowCommentBox] = useState(false);
	const [commentText, setCommentText] = useState("");
	const [showComments, setShowComments] = useState(false);
	const [comments, setComments] = useState(post.comments || []);

	const [commentersData, setCommentersData] = useState({});


	useEffect(() => {
		setIsLiked(post.likes.includes(currentUser._id));
	}, [currentUser._id, post.likes]);

	// Get post owner
	useEffect(() => {
		const fetchUser = async () => {
			try {
				const res = await axios.get(`${backend_url}/users?uid=${post.uid}`);
				console.log(res);
				setUser(res.data);
			} catch (err) {
				console.log("Post component: retriving user info error !");
				console.log(err);
			}
		};
		fetchUser();
	}, [post.uid]);

	const likeHandler = async () => {
		try {
			await axios.put(`${backend_url}/users/post/like/${post._id}`, {
				uid: currentUser._id,
			});
		} catch (err) {
			console.log(err);
		}
		setLike(isLiked ? like - 1 : like + 1);
		setIsLiked(!isLiked);
	};

	// Handle the click of morevert button
	const [anchorEl, setAnchorEl] = useState(null);

	const handleClick = (event) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	const deletePost = async () => {
		try {
			await axios.delete(`${backend_url}/users/post/delete/${post._id}`, {
				data: { uid: currentUser._id },
			});
			onPostDelete(post._id); // notify the parent component to remove this post
			handleClose();
		} catch (err) {
			console.log(err);
		}
	};

	const addComment = async () => {
		try {
			const res = await axios.put(`${backend_url}/users/post/postcomment/${post._id}`, {
				commenterId: currentUser._id,
				commenterName: currentUser.username,
				text: commentText,
			});
			setCommentText("");  // Clear comment input field
			const updatedComments = await axios.get(`${backend_url}/users/post/getpost/${post._id}`);
			setComments(updatedComments.data.comments);
		} catch (err) {
			console.log(err);
		}
	};
	  
	const fetchComments = async () => {
		if (showComments) {
			// If comments are already being displayed, hide them
			setShowComments(false);
		} else {
			try {
				const res = await axios.get(`${backend_url}/users/post/getpost/${post._id}`);
				setComments(res.data.comments);
				setShowComments(true);
			} catch (err) {
				console.log(err);
			}
		}
	};

	useEffect(() => {
		const fetchCommentersData = async () => {
			let uniqueCommenters = [...new Set(comments.map(comment => comment.commenterId))];
			let fetchedCommentersData = {};
			console.log("uniqueCommenters: ", uniqueCommenters);

			for (let uid of uniqueCommenters) {
				try {
					const res = await axios.get(`${backend_url}/users?uid=${uid}`);
					console.log("fetchedCommentersData, res.data:, ", res.data);
					fetchedCommentersData[uid] = res.data;
					
				} catch (err) {
					console.log("Post component: retriving user info error !");
					console.log(err);
				}
			}
			setCommentersData(fetchedCommentersData);
			console.log("commentersData:, ", commentersData);
			console.log("fetchedCommentersData:, ", fetchedCommentersData);
			
		};
	
		fetchCommentersData();
	}, [comments]);
	  

	return (
		<div className="post">
			<div className="postWrapper">
				<div className="postTop">
					<div className="postTopLeft">
						<Link to={`profile/${post.username}`}>
							<img
								className="postProfileImg"
								src={ user.profilePicture ? `data:image/jpeg;base64,${decodeImg(user.profilePicture.data)}` : "/assets/icon/person/noAvatar.png" }
								alt=""
							/>
						</Link>
						<span className="postUsername">{post.username}</span>
						<span className="postDate">{postTime.toLocaleDateString()}</span>
					</div>
					<div className="postTopRight">
						<MoreVert className="morevert" onClick={handleClick} />
						<Menu
							id="simple-menu"
							anchorEl={anchorEl}
							keepMounted
							open={Boolean(anchorEl)}
							onClose={handleClose}
						>
							<MenuItem onClick={deletePost}>Delete</MenuItem>
						</Menu>
					</div>
				</div>
				<div className="postCenter">
					<span className="postText">{post?.desc}</span>
					<img className="postImg" src={post.img} alt="" />
				</div>
				<div className="postBottom">
					<div className="postBottomLeft">
						{/* <img
							src="/assets/icon/like.png"
							alt=""
							className="likeIcon"
							onClick={likeHandler}
						/> */}
						<img src="/assets/icon/heart.png" alt="" className="likeIcon" onClick={likeHandler} />
						<span className="postLikeCounter">{like} Likes</span>
					</div>
					<div className="postBottomRight">
						<AddCommentIcon className="addCommentIcon" onClick={() => setShowCommentBox(!showCommentBox)} />

						<span className="postCommentText" onClick={fetchComments}>
							See Comments
						</span>

					</div>

				</div>
				<div className="postBottomCommentBox">
					{showCommentBox && (
						<div className="writeComment">
							<textarea
								className="commentTextbox"
								type="text"
								value={commentText}
								onChange={(e) => setCommentText(e.target.value)}
								placeholder="Enter your comment here."
								wrap="soft"
							/>
							<button className="commentTextboxButton" onClick={addComment}>Send</button>
						</div>
					)}

				</div>
				<div className="postBottomCommentList">
					{showComments && <br></br>}
					{showComments && <p>All comments:</p>}
					{showComments && <br></br>}
					{showComments && comments.map((comment) => (
						<div className="commentContainer" key={comment._id}>
							<div className="commentTop">
								<Link to={`profile/${comment.commenterName}`}>
									<img
										className="postProfileImg"
										src={
											commentersData[comment.commenterId]?.profilePicture
												? `data:image/jpeg;base64,${decodeImg(commentersData[comment.commenterId].profilePicture.data)}`
												: "/assets/icon/person/noAvatar.png"
										}
										alt=""
									/>
								</Link>
								{/* <span>{comment.timestamp.toDateString()}</span> */}
								<div className="commentInfo">
									<span className="commentUsername postUsername">{comment.commenterName}</span>
									<span className="commentDate postDate">{new Date(comment.timestamp).toLocaleDateString()}</span>
								</div>
							</div>
							
							<p className="commentText postText">{comment.text}</p>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
