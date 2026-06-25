import axios from "axios";

const backend_url = import.meta.env.VITE_BACKEND_URL;
console.log("VITE_BACKEND_URL: ", backend_url);

export const loginCall = async (userCredential, dispatch) => {
  dispatch({ type: "LOGIN_START" });
  try {
    const res = await axios.post(`${backend_url}/users/auth/login`, userCredential);
    dispatch({type: "LOGIN_SUCCESS", payload: res.data});
  } catch (err) {
    dispatch({type: "LOGIN_FAIL", payload: err});
  }
}