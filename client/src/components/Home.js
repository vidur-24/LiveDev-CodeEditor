import React, { useState } from "react";
import { v4 as uuid} from "uuid"
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import "./Home.css"



function Home() {
    const[roomid, setRoomid] = useState("");
    const[username, setUsername] = useState("");
    const navigate = useNavigate();


    const generateRoomId = (e) => {
        e.preventDefault();
        setRoomid(uuid());
        toast.success("Room ID generated")
    }

    const joinRoom = () => {
        if(!roomid || !username){
            toast.error("Both the fields are required!")
            return;
        }

        navigate(`/editor/${roomid}`, {
            state: {username},
        })
        toast.success("Room Joined!")
    }

    
return (
    <div className="container-fluid">
        <div className="row justify-content-center align-items-center bg-black-radial vh-100">
            <div className="col-12 col-md-6">
                <div className="card rounded">
                    <div className="card-body rounded shadow-white text-center bg-dark">
                        <img
                        className="img-fluid mx-auto d-block"
                        src="/images/FullLogo_Transparent.png"
                        alt="LiveDev"
                        style={{maxWidth: "300px", margin: "30px" }}
                        />
                        <h4 className="text-light">Enter the Room ID:</h4>
                        <div className="form-group ">
                            <input 
                                value={roomid}
                                onChange={(e) => setRoomid(e.target.value)}
                                type="text"
                                className="form-control mb-2"
                                placeholder="Room ID"
                            />
                        </div>
                        <div className="form-group">
                            <input
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                type="text"
                                className="form-control mb-2"
                                placeholder="Username"
                            />
                        </div>
                        <button onClick={joinRoom} className="btn btn-success btn-lg btn-block">Join</button>
                        <p className="mt-3 text-light">
                            Dont have a room id?{" "}
                            <span
                                className="text-success p-2"
                                style={{cursor: "pointer"}}
                                onClick={generateRoomId}>New Room</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
);
}

export default Home;
