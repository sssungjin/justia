import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Row,
  Col,
  Input,
  Button,
  InputGroup,
  Container,
  CardTitle,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";
import { ChevronDown, Upload } from "lucide-react";
import { Editor } from "react-draft-wysiwyg";
import {
  EditorState,
  ContentState,
  convertToRaw,
  AtomicBlockUtils,
  Modifier,
  SelectionState,
} from "draft-js";
import draftToHtml from "draftjs-to-html";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import SignatureModal from "./modal/SignatureModal";
import PaymentModal from "./modal/PaymentModal";
import ShareModal from "./modal/ShareModal";
import Header from "./common/Header";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const LegalComplaintDocs = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [editorState, setEditorState] = useState(() => {
    const contentState = ContentState.createFromText("");
    return EditorState.createWithContent(contentState);
  });

  const [webSocket, setWebSocket] = useState(null);
  const [category, setCategory] = useState("성매매 피해 사기");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const chatAreaRef = useRef(null);
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);

  const [userInfo, setUserInfo] = useState(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [messageIndex, setMessageIndex] = useState(0);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);

  const [signature, setSignature] = useState(null);

  const customStyleMap = {
    FONTSIZE_24: {
      fontSize: "24px",
    },
  };

  const prev_actions = [
    "범죄 수법",
    "피고소인 신분",
    "고소인 신분",
    "피고소인을 알게된 경위",
    "날짜",
    "장소",
    "거래 방법",
    "거짓말의 내용",
    "재산 마련 방법",
    "재산의 처분 방법",
    "거짓임을 깨닫게 된 계기",
    "다른 피해사실",
    "고소 이유",
    "다른 민형사",
  ];

  const questions = [
    "",
    "피고소인의 직업이나 신분에 대해 알려주세요",
    "고객님의 신분도 알려주세요",
    "처음에 피고소인은 어떻게 알게 되었습니까?",
    "사건이 일어난 날짜는 언제인가요?",
    "사건이 일어난 장소는 어디인가요?",
    "어떤 방식으로 서비스를 받고 돈을 지불하는 걸로 결정했었나요?",
    "피고소인이 뭐라고 거짓말을 하며 돈을 입금하라고 했습니까?",
    "재산은 어떻게 마련했습니까?",
    "재산의 처분은 어떻게 하였습니까?",
    "피고소인이 거짓말을 해왔다는 걸 알게 된 계기는 무엇입니까?",
    "다른 피해 사실도 있습니까?",
    "고소하게 된 동기는 무엇입니까?",
    "사건과 관련하여 민형사를 진행하고 있습니까?",
    "고소장을 작성해 드리겠습니다. 잠시만 기다려주세요.",
  ];

  useEffect(() => {
    const storedUserInfo = sessionStorage.getItem("userInfo");
    if (storedUserInfo) {
      setUserInfo(JSON.parse(storedUserInfo));
    }

    // WebSocket 연결
    const wsUrl = `ws://localhost:8080/webchat/dial/null`;
    const newWebSocket = new WebSocket(wsUrl);

    newWebSocket.onopen = () => {
      console.log("WebSocket connected");
    };

    newWebSocket.onmessage = (event) => {
      handleIncomingMessage(event.data);
    };

    newWebSocket.onclose = () => {
      console.log("WebSocket disconnected");
    };

    newWebSocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    setWebSocket(newWebSocket);

    return () => {
      if (newWebSocket) {
        newWebSocket.close();
      }
    };
  }, []);

  const handleIncomingMessage = (data) => {
    try {
      const talk = JSON.parse(data);
      console.log(talk);
      if (talk.error) {
        console.error("Server error:", talk.error);
        return;
      }

      if (talk.action === "종료") {
        console.log("대화가 종료되었습니다.");
      } else if (messageIndex < questions.length) {
        // messageIndex가 업데이트된 후에 다음 질문을 추가하기 위해 setMessageIndex의 콜백에서 처리
        setMessageIndex((prevIndex) => {
          const newIndex = prevIndex + 1;
          setMessages((prevMessages) => [
            ...prevMessages,
            { type: "ai", content: questions[newIndex] }, // 증가된 인덱스 사용
          ]);
          return newIndex; // 인덱스를 증가시킨 값을 반환
        });
      }

      setIsWaitingForResponse(false);
    } catch (e) {
      console.error("Error parsing message:", e);
      setIsWaitingForResponse(false);
    }
  };

  const sendWebSocketMessage = (message) => {
    const talk = {
      mode: "delator",
      id: userInfo ? userInfo.name : "unknown",
      index: messageIndex.toString(),
      reply: message,
      locale: navigator.language,
    };

    if (webSocket && webSocket.readyState === WebSocket.OPEN) {
      webSocket.send(JSON.stringify(talk));
      console.log("Sent message:", talk);
      setIsWaitingForResponse(true);
    } else {
      console.error("WebSocket is not connected");
    }
  };

  const handleSendMessage = () => {
    if (inputMessage.trim() === "" || isWaitingForResponse) return;

    const newMessage = { type: "user", content: inputMessage };
    setMessages((prevMessages) => [...prevMessages, newMessage]);

    sendWebSocketMessage(inputMessage);
    setInputMessage("");
  };

  const toggleDropdown = () => {
    setDropdownOpen((prevState) => !prevState);
    if (!dropdownOpen && dropdownRef.current) {
      dropdownRef.current.focus();
    }
  };

  const handleCategorySelect = (selectedCategory) => {
    setCategory(selectedCategory);
    setMessages([{ type: "user", content: `${selectedCategory}` }]);
    sendWebSocketMessage(selectedCategory);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const initialContent = ContentState.createFromText(
      "강제추행 고소장\n\n고소인:\n성명:\n신분:\n주민등록번호:\n전화번호:\n주소:\n기타:\n\n피고소인:\n성명:\n신분:\n주민등록번호:\n전화번호:\n주소:\n기타:\n\n고소취지:\n"
    );
    setEditorState(EditorState.createWithContent(initialContent));
  }, []);

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

  const addSignatureToEditor = useCallback(
    (signatureDataURL) => {
      // Move the cursor to the end of the editor
      let newEditorState = EditorState.moveFocusToEnd(editorState);

      // Get the updated content state
      const contentState = newEditorState.getCurrentContent();

      // Create the image entity
      const contentStateWithEntity = contentState.createEntity(
        "IMAGE",
        "IMMUTABLE",
        {
          src: signatureDataURL,
          alt: "Signature",
          height: "auto",
          width: "300px",
        }
      );
      const entityKey = contentStateWithEntity.getLastCreatedEntityKey();

      // Get the last block
      const blockMap = contentStateWithEntity.getBlockMap();
      const lastBlock = blockMap.last();
      const lastBlockKey = lastBlock.getKey();
      const length = lastBlock.getLength();

      // Create a selection at the end of the last block
      const selection = SelectionState.createEmpty(lastBlockKey).merge({
        anchorOffset: length,
        focusOffset: length,
      });

      // Insert the atomic block with the image
      const finalEditorState = AtomicBlockUtils.insertAtomicBlock(
        EditorState.acceptSelection(newEditorState, selection),
        entityKey,
        " "
      );

      console.log("Editor state updated with signature");
      setEditorState(finalEditorState);
    },
    [editorState]
  );

  const editorRef = useRef(null);

  const saveAsPDF = async () => {
    if (!editorRef.current) {
      console.error("Editor element not found");
      return;
    }

    const content = draftToHtml(convertToRaw(editorState.getCurrentContent()));

    // Create a temporary div to render the HTML content
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;
    tempDiv.style.fontSize = "16px"; // Increase base font size
    tempDiv.style.width = "793px"; // A4 width in pixels at 96 DPI
    tempDiv.style.margin = "0";
    tempDiv.style.padding = "20px";
    document.body.appendChild(tempDiv);

    try {
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt", // Use points for more precise sizing
        format: "a4",
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

      // If content exceeds one page, add more pages
      if (pdfHeight > pdf.internal.pageSize.getHeight()) {
        let remainingHeight = pdfHeight;
        let position = -pdf.internal.pageSize.getHeight();
        while (remainingHeight > 0) {
          pdf.addPage();
          position += pdf.internal.pageSize.getHeight();
          pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
          remainingHeight -= pdf.internal.pageSize.getHeight();
        }
      }

      const docName =
        userInfo.name +
        "_" +
        new Date().toISOString().split("T")[0] +
        "_complaint.pdf";
      pdf.save(docName);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      // Clean up: remove the temporary div
      document.body.removeChild(tempDiv);
    }
  };

  return (
    <Container fluid className="vh-100 flex-column">
      {userInfo && (
        <Header
          userName={userInfo.name}
          userEmail={userInfo.email}
          onLogout={handleLogout}
        />
      )}
      <Row className="flex-grow-1">
        <Col md="6" className="d-flex flex-column p-3">
          <div className="chat-outer-container d-flex flex-column">
            <div className="chat-container flex-grow-1 mt-2">
              <Dropdown
                isOpen={dropdownOpen}
                toggle={toggleDropdown}
                className="mt-2 ml-2"
              >
                <DropdownToggle
                  caret
                  className="w-80 text-left d-flex justify-content-between align-items-center custom-dropdown-toggle"
                >
                  {category} <ChevronDown size={20} />
                </DropdownToggle>
                <DropdownMenu className="w-80">
                  <DropdownItem
                    onClick={() => handleCategorySelect("성매매 피해 사기")}
                  >
                    성매매 피해 사기
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => handleCategorySelect("중고 거래 사기")}
                  >
                    중고 거래 사기
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
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
                        <div className="font-weight-bold">
                          고소인: {userInfo.name}
                        </div>
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
          </div>

          <InputGroup className="mb-1" disabled={messageIndex === 0}>
            <Input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              style={{ fontSize: "1.1rem" }}
              disabled={messageIndex === 0}
            />
            <Button
              color="primary"
              onClick={handleSendMessage}
              style={{ marginLeft: "5px" }}
              disabled={messageIndex === 0}
            >
              Send
            </Button>
            <Button
              color="secondary"
              onClick={() => fileInputRef.current.click()}
              style={{ marginLeft: "5px" }}
              disabled={messageIndex < 14}
            >
              <Upload size={20} />
            </Button>
            <Input
              type="file"
              innerRef={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileUpload}
              disabled={messageIndex < 14}
            />
          </InputGroup>
        </Col>
        <Col md="6" className="d-flex flex-column p-3">
          <div className="editor-container flex-grow-1 mb-1 mt-2">
            <CardTitle tag="h2" className="text-center mt-3">
              Complaint
            </CardTitle>
            <div className="editor-wrapper">
              <div ref={editorRef}>
                <Editor
                  editorState={editorState}
                  onEditorStateChange={handleEditorStateChange}
                  editorStyle={{ fontSize: "16px" }}
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
                        8, 9, 10, 11, 12, 14, 16, 18, 24, 30, 36, 48, 60, 72,
                        96,
                      ],
                      className: "toolbar-font-size",
                      defaultSize: 24,
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
            </div>
            <div className="d-flex justify-content-center mb-2">
              <Button
                color="secondary"
                onClick={() => setIsSignatureModalOpen(true)}
                className="mx-2"
                //disabled={messageIndex < 14}
              >
                Sign
              </Button>
              <Button
                color="success"
                onClick={() => setIsPaymentModalOpen(true)}
                className="mx-2"
                //disabled={messageIndex < 14}
              >
                Payment
              </Button>
              <Button
                color="primary"
                onClick={() => setIsShareModalOpen(true)}
                className="mx-2"
                // disabled={messageIndex < 14}
              >
                Share
              </Button>
              <Button color="info" onClick={saveAsPDF} className="mx-2">
                Save as PDF
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <SignatureModal
        isOpen={isSignatureModalOpen}
        toggle={() => setIsSignatureModalOpen(!isSignatureModalOpen)}
        setSignature={setSignature}
        addSignatureToEditor={addSignatureToEditor}
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
