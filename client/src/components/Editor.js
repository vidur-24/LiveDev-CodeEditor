import React, { useEffect, useRef } from 'react';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/theme/3024-night.css';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/lib/codemirror.css';
import CodeMirror from 'codemirror';


function Editor({socket, roomid, onCodeChange}) {
    const textAreaRef = useRef(null);
    const editorRef = useRef(null);
    const liveSocketRef = useRef(null);

    useEffect(() => {
        liveSocketRef.current = socket;
    }, [socket]);

    useEffect(() => {
        if (!editorRef.current) {
            // Initialize only once
            editorRef.current = CodeMirror.fromTextArea(textAreaRef.current, {
            mode: { name: 'javascript', json: true },
            theme: '3024-night',
            autoCloseTags: true,
            autoCloseBrackets: true,
            lineNumbers: true
            });
            editorRef.current.setSize(null, '100%');

            // Ensure parent knows initial content immediately
            try {
                const initialCode = editorRef.current.getValue();
                onCodeChange(initialCode);
            } catch (e) {}
        
            editorRef.current.on('change', (instance, changes) => {
                // console.log(`changes`, instance, changes)
                const { origin } = changes;
                const code = instance.getValue();
                onCodeChange(code);

                if (origin !== 'setValue' && liveSocketRef.current) {
                    liveSocketRef.current.emit('code-change', {
                        roomid,
                        code
                    });
                }
            })
        }
    }, [onCodeChange, roomid, socket]);

    useEffect(() => {
        if (!socket) return;

        const handleCodeChange = ({ code }) => {
            if (code !== null) {
                editorRef.current.setValue(code);
            }
        };

        socket.on('code-change', handleCodeChange);
        return () => {
            socket.off('code-change', handleCodeChange);
        };
    }, [roomid, socket])

    return (
        <div style={{ height: '100%' }}>
            {/* Hide the textarea to avoid extra space */}
            <textarea className="bg-black-fade" ref={textAreaRef} style={{ display: 'none' }}></textarea>
        </div>
    );
}

export default Editor;


// import React, { useEffect, useRef } from 'react';
// import CodeMirror from 'codemirror';
// import "codemirror/mode/javascript/javascript";
// import 'codemirror/lib/codemirror.css';
// import "codemirror/theme/dracula.css";
// import "codemirror/addon/edit/closetag";
// import "codemirror/addon/edit/closebrackets";
// import "codemirror/lib/codemirror";


// function Editor() {
//     const editorRef = useRef(null);
//     useEffect(() => {
//         const init = async () => {
//             const editor = CodeMirror.fromTextArea(
//                 document.getElementById("realTimeEditor"),
//                 {
//                     mode: {name: "javascript", json: true},
//                     theme: "dracula",
//                     autoCloseTags: true,
//                     autoCloseBrackets: true,
//                     lineNumbers: true
//                 }
//             );
//             editor.setSize(null, "100%");
//         };
//         init();
//     }, []);

// return (
//     <div style={{height: "600px"}}>
//         <textarea id="realTimeEditor"></textarea>
//     </div>
// )
// };

// export default Editor
