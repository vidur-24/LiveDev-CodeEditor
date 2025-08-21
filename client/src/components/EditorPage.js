import React, { useEffect, useState, useRef } from 'react'
import Client from './Client'
import Editor from './Editor'
import { initSocket } from '../socket'
import { useNavigate, useLocation, useParams, Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import axios from "axios";


const LANGUAGES = [
    "python3",
    "java",
    "cpp",
    "nodejs",
    "c",
    "ruby",
    "go",
    "scala",
    "bash",
    "sql",
    "pascal",
    "csharp",
    "php",
    "swift",
    "rust",
    "r",
];

function EditorPage() {
    const [clients, setClients] = useState([])
    const codeRef = useRef("");
    const [socket, setSocket] = useState(null);

    const [output, setOutput] = useState("");
    const [isCompileWindowOpen, setIsCompileWindowOpen] = useState(false);
    const [isCompiling, setIsCompiling] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState("python3");

    const location = useLocation();
    const navigate = useNavigate();
    const {roomid} = useParams();
    
    const socketRef = useRef(null);

    useEffect(() => {
        const init = async () => {
            socketRef.current = await initSocket();
            setSocket(socketRef.current);
            socketRef.current.on('connect_error', (err) => handleErrors(err));
            socketRef.current.on('connect_failed', (err) => handleErrors(err));
            
            const handleErrors = (e) => {
                console.log("Socket Error: ", e);
                toast.error("Socket connection failed");
                navigate("/");
            }
            
            socketRef.current.emit('join', {
                roomid,
                username: location.state?.username,
            })

            socketRef.current.on('joined', ({clients, username, socketId}) => {
                setClients(clients);
                // Only existing users should push their current code to the newcomer
                if (username !== location.state?.username) {
                    toast.success(`${username} joined`)
                    socketRef.current.emit('sync-code', {
                        code: codeRef.current,
                        socketId,
                    })
                }
            })

            //disconnected
            socketRef.current.on('disconnected', ({socketId, username}) => {
                toast.error(`${username} left`)
                setClients((prev) => {
                    return prev.filter((client) => client.socketId !== socketId)
                })
            })
        }

        init();

        return () => {
            socketRef.current && socketRef.current?.disconnect();
            socketRef.current?.off('joined');
            socketRef.current?.off('disconnected');
            setSocket(null);
        }

    }, [location.state?.username, navigate, roomid])

    if(!location.state){
        return <Navigate to="/" />
    }

    const copyRoomId = async () => {
        try {
            await navigator.clipboard.writeText(roomid);
            toast.success("Room ID copied to clipboard")
        } catch (error) {
            console.log(error)
            toast.error("Unable to copy Room ID")
        }
    }

    const leaveRoom = () => {
        navigate("/");
    }

    // new
    const runCode = async () => {
        setIsCompiling(true);
        try {
            const response = await axios.post("http://localhost:5000/compile", 
            {
                code: codeRef.current,
                language: selectedLanguage,
            });
            console.log("Backend response:", response.data);
            setOutput(response.data.output || JSON.stringify(response.data));
        } catch (error) {
            console.error("Error compiling code:", error);
            setOutput(error.response?.data?.error || "An error occurred");
        } finally {
            setIsCompiling(false);
        }
    };

    const toggleCompileWindow = () => {
        setIsCompileWindowOpen(!isCompileWindowOpen);
    };

    return (
    <div className='container-fluid vh-100'>
        <div className='row h-100'>
            <div className='col-md-2 bg-dark text-light d-flex flex-column h-100' style={{boxShadow: "2px 0px 4px rgba(0,0,0,0.1)"}}>
                    <img src='/images/FullLogo_Transparent.png' alt='LiveDev' className='img-fluid mx-auto' style={{maxWidth: "150px"}} />
                    <hr style={{marginTop: "-0.02rem"}}/>
                {/* {client list container} */}
                <div className='d-flex flex-column overflow-auto'>
                    {clients.map((client) => (
                        <Client key={client.socketId} username={client.username} />
                    ))}
                </div>
                {/* {buttons} */}
                <div className='mt-auto'>
                    <hr />
                    <button onClick={copyRoomId} className='btn btn-success mb-2 btn-block' style={{marginRight:"4px"}}>Copy Room ID</button>
                    <button onClick={leaveRoom} className='btn btn-danger mb-2 px-3 btn-block'>Leave Room</button>
                </div>
            </div>
            <div className='col-md-10 text-light d-flex flex-column h-100'>
                {/* Language selector */}
                <div className="bg-dark p-2 d-flex justify-content-end">
                    <select
                        className="form-select w-auto"
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                    >
                    {LANGUAGES.map((lang) => (
                        <option key={lang} value={lang}>
                            {lang}
                        </option>
                    ))}
                    </select>
                </div>
                

                <Editor 
                    socket={socket}
                    roomid={roomid}
                    onCodeChange= {(code) => (codeRef.current = code)}
                />

                {/* Compiler toggle button */}
                <button
                    className="btn btn-primary position-fixed bottom-0 end-0 m-3"
                    onClick={toggleCompileWindow}
                    style={{ zIndex: 1050 }}
                >
                    {isCompileWindowOpen ? "Close Compiler" : "Open Compiler"}
                </button>

                {/* Compiler section */}
                <div
                    className={`bg-dark text-light p-3 ${isCompileWindowOpen ? "d-block" : "d-none"}`}
                    style={{
                        position: "fixed",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: isCompileWindowOpen ? "30vh" : "0",
                        transition: "height 0.3s ease-in-out",
                        overflowY: "auto",
                        zIndex: 1040,
                    }}
                >
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="m-0">Compiler Output ({selectedLanguage})</h5>
                        <div>
                            <button
                                className="btn btn-success me-2"
                                onClick={runCode}
                                disabled={isCompiling}
                            >
                                {isCompiling ? "Compiling..." : "Run Code"}
                            </button>
                    
                            <button className="btn btn-secondary" onClick={toggleCompileWindow}>
                                Close
                            </button>
                        </div>
                    </div>
                    <pre className="bg-secondary p-3 rounded">
                        {output || "Output will appear here after compilation"}
                    </pre>
                </div>
            </div>
        </div>
    </div>
    )
}

export default EditorPage