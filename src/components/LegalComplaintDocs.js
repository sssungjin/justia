import React, { useState, useRef, useEffect } from "react";
import {
  Row,
  Col,
  Input,
  Button,
  InputGroup,
  Container,
  CardTitle,
} from "reactstrap";
import { Upload } from "lucide-react";
import { Editor } from "react-draft-wysiwyg";
import { EditorState, ContentState } from "draft-js";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import SignatureModal from "./modal/SignatureModal";
import PaymentModal from "./modal/PaymentModal";
import ShareModal from "./modal/ShareModal";
import Header from "./common/Header";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const LegalComplaintDocs = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [editorState, setEditorState] = useState(EditorState.createEmpty());

  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const chatAreaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [userInfo, setUserInfo] = useState(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const storedUserInfo = sessionStorage.getItem("userInfo");
    if (storedUserInfo) {
      setUserInfo(JSON.parse(storedUserInfo));
    }
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const aiResponses = [
    "고소인의 이름이 어떻게 되나요?",
    "고소인의 신분이 어떻게 되나요?",
    "고소인의 주민등록번호를 말씀해 주세요.",
    "고소인의 전화번호를 말씀해 주세요.",
    "고소인의 주소를 말씀해 주세요.",
    "고소인의 기타 참고 사항을 말씀해 주세요.",
    "피고소인의 이름이 어떻게 되나요?",
    "피고소인의 신분이 어떻게 되나요?",
    "피고소인의 주민등록번호를 말씀해 주세요.",
    "피고소인의 전화번호를 말씀해 주세요.",
    "피고소인의 주소를 말씀해 주세요.",
    "피고소인의 기타 참고 사항을 말씀해 주세요.",
    "고소 내용을 구체적으로 말씀해 주세요.",
    '분석 결과 고소 취지는 "이 몸이 죽고 죽어 일백번 고쳐죽어, 백골이 진토외어 넋이라도 있고없고 님향한 일편단심이야 가실 줄이 있으랴" 입니다.',
  ];

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const initialContent = ContentState.createFromText(
      "강제추행 고소장\n\n고소인:\n성명:\n신분:\n주민등록번호:\n전화번호:\n주소:\n기타:\n\n피고소인:\n성명:\n신분:\n주민등록번호:\n전화번호:\n주소:\n기타:\n\n고소취지:\n\n"
    );
    setEditorState(EditorState.createWithContent(initialContent));

    setMessages([
      { type: "user", content: "성매매 유도 사기로 고소하고 싶어요" },
      { type: "ai", content: "고소인의 이름이 어떻게 되나요?" },
    ]);
  }, []);

  const handleSendMessage = () => {
    if (inputMessage.trim() === "") return;

    const newMessage = { type: "user", content: inputMessage };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInputMessage("");

    const currentIndex = Math.floor((updatedMessages.length - 2) / 2);
    const nextIndex = currentIndex;

    if (currentIndex < aiResponses.length) {
      setTimeout(() => {
        const aiResponse = aiResponses[nextIndex + 1];
        setMessages((prevMessages) => [
          ...prevMessages,
          { type: "ai", content: aiResponse },
        ]);
      }, 200);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { type: "user", content: `File uploaded: ${file.name}` },
      ]);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleEditorStateChange = (newEditorState) => {
    setEditorState(newEditorState);
  };

  return (
    <Container fluid className="vh-100 d-flex flex-column">
      {userInfo && (
        <Header
          userName={userInfo.name}
          userEmail={userInfo.email}
          onLogout={handleLogout}
        />
      )}
      <Row className="flex-grow-1">
        <Col md="6" className="d-flex flex-column p-3">
          <div className="chat-container flex-grow-1 mb-3 mt-2">
            <div className="chat-messages overflow-auto" ref={chatAreaRef}>
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-2 ${
                    msg.type === "user" ? "text-right" : "text-left"
                  }`}
                >
                  {msg.type === "user" ? (
                    <div className="user-bubble">
                      <div className="font-weight-bold">고소인</div>
                      <div>{msg.content}</div>
                    </div>
                  ) : (
                    <div className="justia-bubble">
                      <div className="font-weight-bold">Justia</div>
                      <div>{msg.content}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <InputGroup className="mb-1">
            <Input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              style={{ fontSize: "1.1rem" }}
            />
            <Button
              color="primary"
              onClick={handleSendMessage}
              style={{ marginLeft: "5px" }}
            >
              Send
            </Button>
            <Button
              color="secondary"
              onClick={() => fileInputRef.current.click()}
              style={{ marginLeft: "5px" }}
            >
              <Upload size={20} />
            </Button>
            <Input
              type="file"
              innerRef={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileUpload}
            />
          </InputGroup>
        </Col>
        <Col md="6" className="d-flex flex-column p-3">
          <div className="editor-container flex-grow-1 mb-1 mt-2">
            <CardTitle tag="h2" className="text-center mt-3">
              Complaint
            </CardTitle>
            <div className="editor-wrapper">
              <Editor
                editorState={editorState}
                onEditorStateChange={handleEditorStateChange}
                onFocus={(event) => event.preventDefault()}
                wrapperClassName="demo-wrapper"
                editorClassName="demo-editor"
                toolbarClassName="demo-toolbar"
                toolbar={{
                  options: [
                    "inline",
                    "blockType",
                    "fontSize",
                    "fontFamily",
                    "list",
                    "textAlign",
                    "remove",
                    "history",
                  ],
                  inline: {
                    inDropdown: false,
                    className: "toolbar-inline",
                    options: [
                      "bold",
                      "italic",
                      "underline",
                      "strikethrough",
                      "monospace",
                    ],
                  },
                  blockType: {
                    inDropdown: true,
                    options: [
                      "Normal",
                      "H1",
                      "H2",
                      "H3",
                      "H4",
                      "H5",
                      "H6",
                      "Blockquote",
                      "Code",
                    ],
                    className: "toolbar-block",
                  },
                  fontSize: {
                    options: [
                      8, 9, 10, 11, 12, 14, 16, 18, 24, 30, 36, 48, 60, 72, 96,
                    ],
                    className: "toolbar-font-size",
                  },
                  fontFamily: {
                    options: [
                      "Arial",
                      "Georgia",
                      "Impact",
                      "Tahoma",
                      "Times New Roman",
                      "Verdana",
                    ],
                    className: "toolbar-font-family",
                  },
                  list: {
                    inDropdown: false,
                    className: "toolbar-list",
                    options: ["unordered", "ordered"],
                  },
                  textAlign: {
                    inDropdown: false,
                    className: "toolbar-text-align",
                  },
                }}
                localization={{
                  locale: "ko",
                }}
              />
            </div>
            <div className="d-flex justify-content-center mb-1">
              <Button
                color="secondary"
                onClick={() => setIsSignatureModalOpen(true)}
                className="mx-2"
              >
                Sign
              </Button>
              <Button
                color="success"
                onClick={() => setIsPaymentModalOpen(true)}
                className="mx-2"
              >
                Payment
              </Button>
              <Button
                color="info"
                onClick={() => setIsShareModalOpen(true)}
                className="mx-2"
              >
                Share
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <SignatureModal
        isOpen={isSignatureModalOpen}
        toggle={() => setIsSignatureModalOpen(!isSignatureModalOpen)}
      />
      <PaymentModal
        isOpen={isPaymentModalOpen}
        toggle={() => setIsPaymentModalOpen(!isPaymentModalOpen)}
      />
      <ShareModal
        isOpen={isShareModalOpen}
        toggle={() => setIsShareModalOpen(!isShareModalOpen)}
      />
    </Container>
  );
};

export default LegalComplaintDocs;
