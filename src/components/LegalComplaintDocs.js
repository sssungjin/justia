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
  SelectionState,
  Modifier,
  ContentBlock,
  genKey,
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
import axios from "axios";

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

  //const [messageIndex, setMessageIndex] = useState(0);
  const messageIndexRef = useRef(0);

  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [editorContent, setEditorContent] = useState("");

  const [signature, setSignature] = useState(null);

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
    "고소장을 작성해 드리겠습니다. 받을 준비가 되었다면 '종료'라고 입력해주세요.",
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

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // 월은 0부터 시작하므로 +1
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
  };

  useEffect(() => {
    const blocks = [
      new ContentBlock({
        key: genKey(),
        type: "unstyled",
        text: "고소장",
      }),
      new ContentBlock({
        key: genKey(),
        type: "unstyled",
        text: formatDate(new Date()),
      }),
      new ContentBlock({
        key: genKey(),
        type: "unstyled",
        text: "고소인",
      }),
      new ContentBlock({
        key: genKey(),
        type: "unstyled",
        text: "신분:",
      }),
      new ContentBlock({
        key: genKey(),
        type: "unstyled",
        text: "피고소인",
      }),
      new ContentBlock({
        key: genKey(),
        type: "unstyled",
        text: "신분:",
      }),
      new ContentBlock({
        key: genKey(),
        type: "unstyled",
        text: "시간:",
      }),
      new ContentBlock({
        key: genKey(),
        type: "unstyled",
        text: "장소:",
      }),
      new ContentBlock({
        key: genKey(),
        type: "unstyled",
        text: "고소 내용:",
      }),
    ];

    const initialContent = ContentState.createFromBlockArray(blocks);
    const newEditorState = EditorState.createWithContent(initialContent);
    setEditorState(newEditorState);

    console.log("Initial editor content:");
    newEditorState
      .getCurrentContent()
      .getBlocksAsArray()
      .forEach((block, i) => {
        console.log(`Block ${i}: "${block.getText()}"`); // 여기서 초기 블록 내용을 확인합니다.
      });
  }, []);

  const handleIncomingMessage = (data) => {
    try {
      const talk = JSON.parse(data);
      console.log("Received message:", talk);
      if (talk.error) {
        console.error("Server error:", talk.error);
        return;
      }

      const currentIndex = messageIndexRef.current;

      console.log("current index:", currentIndex);

      if (talk.action === "종료") {
        console.log("대화가 종료되었습니다.");
      } else if (currentIndex === 14 && talk.msg) {
        setMessages((prevMessages) => [
          ...prevMessages,
          { type: "ai", content: talk.msg },
        ]);

        // 에디터 업데이트 - AI의 메시지를 고소 내용 뒤에 추가
        setEditorState((prevState) => {
          updateEditorWithComplaintContent(talk.msg, prevState); // 이전 상태를 사용하여 업데이트합니다.
          return prevState; // 이전 상태를 그대로 반환합니다.
        });
      } else if (currentIndex < questions.length) {
        const newIndex = currentIndex + 1;
        messageIndexRef.current = newIndex;
        setMessages((prevMessages) => [
          ...prevMessages,
          { type: "ai", content: questions[newIndex] },
        ]);
      }

      setIsWaitingForResponse(false);
    } catch (e) {
      console.error("Error parsing message:", e);
      setIsWaitingForResponse(false);
    }
  };

  const updateEditorWithAnswer = (index, answer) => {
    const validIndexes = [1, 2, 4, 5];
    if (!validIndexes.includes(index)) {
      console.log(`Skipping update for index: ${index}`);
      return;
    }

    const contentState = editorState.getCurrentContent();
    const searchTexts = ["피고소인", "고소인", "시간", "장소"];

    const searchTextIndex = index === 5 ? 3 : index === 4 ? 2 : index - 1;
    const searchText = searchTexts[searchTextIndex];

    console.log(`Searching for: "${searchText}" to update with: "${answer}"`);

    const blocks = contentState.getBlocksAsArray();
    console.log("Current editor content:");
    blocks.forEach((block, i) => {
      console.log(`Block ${i}: "${block.getText()}"`);
    });

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const text = block.getText();
      if (text.trim() === searchText) {
        const nextBlock = blocks[i + 1];
        if (nextBlock && nextBlock.getText().startsWith("신분:")) {
          const blockKey = nextBlock.getKey();
          const start = "신분:".length;
          const end = nextBlock.getLength();
          const selection = SelectionState.createEmpty(blockKey).merge({
            anchorOffset: start,
            focusOffset: end,
          });

          const newContent = Modifier.replaceText(
            contentState,
            selection,
            ` ${answer}`
          );

          const newEditorState = EditorState.push(
            editorState,
            newContent,
            "insert-characters"
          );
          setEditorState(newEditorState);
          console.log(
            `Updated editor with answer: ${answer} at index: ${index}`
          );
          return;
        }
      } else if (text.startsWith(searchText)) {
        const blockKey = block.getKey();
        const start = text.indexOf(":") + 1;
        const end = text.length;
        const selection = SelectionState.createEmpty(blockKey).merge({
          anchorOffset: start,
          focusOffset: end,
        });

        const newContent = Modifier.replaceText(
          contentState,
          selection,
          ` ${answer}`
        );

        const newEditorState = EditorState.push(
          editorState,
          newContent,
          "insert-characters"
        );
        setEditorState(newEditorState);
        console.log(`Updated editor with answer: ${answer} at index: ${index}`);
        return;
      }
    }

    console.log(
      `Could not find location for answer: ${answer} at index: ${index}`
    );
  };

  const updateEditorWithComplaintContent = useCallback(
    (content, currentEditorState) => {
      let contentState = currentEditorState.getCurrentContent();
      let blocks = contentState.getBlocksAsArray();

      console.log(
        "Current editor content in updateEditorWithComplaintContent:"
      );
      blocks.forEach((block, i) => {
        console.log(
          `Block ${i}: "${block.getText()}" (Key: ${block.getKey()})`
        );
      });

      // "고소 내용:" 블록 찾기
      const complaintBlockIndex = blocks.findIndex(
        (block) => block.getText().trim() === "고소 내용:"
      );

      if (complaintBlockIndex !== -1) {
        const complaintBlock = blocks[complaintBlockIndex];
        const blockKey = complaintBlock.getKey();

        // "고소 내용:" 블록 다음에 새 블록 추가
        const selection = SelectionState.createEmpty(blockKey).merge({
          anchorOffset: complaintBlock.getLength(),
          focusOffset: complaintBlock.getLength(),
        });

        let newContentState = Modifier.splitBlock(contentState, selection);
        newContentState = Modifier.insertText(
          newContentState,
          newContentState.getSelectionAfter(),
          content
        );

        const newEditorState = EditorState.push(
          currentEditorState,
          newContentState,
          "insert-fragment"
        );

        setEditorState(newEditorState);
        console.log("Updated editor with complaint content");

        // 업데이트된 내용 로그 출력
        const updatedBlocks = newEditorState
          .getCurrentContent()
          .getBlocksAsArray();
        console.log("Updated editor content:");
        updatedBlocks.forEach((block, i) => {
          console.log(
            `Block ${i}: "${block.getText()}" (Key: ${block.getKey()})`
          );
        });
      } else {
        console.log("Error: '고소 내용:' block not found.");
      }
    },
    []
  );

  const sendWebSocketMessage = (message, index = null) => {
    const currentIndex = index !== null ? index : messageIndexRef.current;
    const talk = {
      mode: "delator",
      id: userInfo ? userInfo.name : "unknown",
      index: currentIndex.toString(),
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

    const currentIndex = messageIndexRef.current;
    const newMessage = { type: "user", content: inputMessage };
    setMessages((prevMessages) => [...prevMessages, newMessage]);

    // 사용자의 답변을 에디터에 즉시 반영 (인덱스 1, 2, 4, 5에 대해서만)
    if ([1, 2, 4, 5].includes(currentIndex)) {
      console.log(`Attempting to update editor for index: ${currentIndex}`);
      updateEditorWithAnswer(currentIndex, inputMessage.trim());
    }

    if (currentIndex === 14) {
      // 13번 인덱스 이후 사용자 입력 시 14번 인덱스로 전환
      messageIndexRef.current = 14;
      sendWebSocketMessage(inputMessage, 14);
    } else {
      sendWebSocketMessage(inputMessage, currentIndex);
    }

    setInputMessage("");
  };

  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].type === "user") {
      const lastUserMessage = messages[messages.length - 1].content;
      if ([1, 2, 4, 5].includes(messageIndexRef.current)) {
        console.log(
          `Attempting to update editor for index: ${messageIndexRef.current} from useEffect`
        );
        updateEditorWithAnswer(messageIndexRef.current, lastUserMessage);
      }
    }
  }, [messages]);

  const toggleDropdown = () => {
    setDropdownOpen((prevState) => !prevState);
    if (!dropdownOpen && dropdownRef.current) {
      dropdownRef.current.focus();
    }
  };

  const handleCategorySelect = (selectedCategory) => {
    setCategory(selectedCategory);
    setMessages([{ type: "user", content: `${selectedCategory}` }]);
    messageIndexRef.current = 0;
    sendWebSocketMessage(selectedCategory, 0);
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

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleEditorStateChange = (newEditorState) => {
    setEditorState(newEditorState);
    const contentState = newEditorState.getCurrentContent();
    const rawContentState = convertToRaw(contentState);
    const htmlContent = draftToHtml(rawContentState);
    setEditorContent(htmlContent);
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const filePromises = files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({ name: file.name, content: e.target.result });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
    );

    Promise.all(filePromises)
      .then((newFiles) => {
        setUploadedFiles((prevFiles) => [...prevFiles, ...newFiles]);
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            type: "user",
            content: `Files uploaded: ${files.map((f) => f.name).join(", ")}`,
          },
        ]);
      })
      .catch((error) => {
        console.error("Error reading files:", error);
        alert("Failed to upload files. Please try again.");
      });
  };

  const handleShareDocument = async (email) => {
    try {
      const jsonData = {
        email: email,
        files: uploadedFiles.map((file) => ({
          name: file.name,
          content: file.content,
          type: file.type,
        })),
      };

      console.log("Sending data:", jsonData);

      const response = await axios.post("/webchat/email", jsonData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Response:", response);

      if (response.status === 200) {
        alert("Document shared successfully!");
        setUploadedFiles([]);
      } else {
        throw new Error("Failed to share document");
      }
    } catch (error) {
      console.error("Error sharing document:", error);
      alert("Failed to share document. Please try again.");
    }
    setIsShareModalOpen(false);
  };

  const removeFile = (index) => {
    setUploadedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
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
                  <DropdownItem onClick={() => handleCategorySelect("기타")}>
                    기타
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

          <InputGroup className="mb-1" disabled={messageIndexRef.current === 0}>
            <Input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              style={{ fontSize: "1.1rem" }}
              disabled={messageIndexRef.current === 0}
            />
            <Button
              color="primary"
              onClick={handleSendMessage}
              style={{ marginLeft: "5px" }}
              disabled={messageIndexRef.current === 0}
            >
              Send
            </Button>
            <Button
              color="secondary"
              onClick={() => fileInputRef.current.click()}
              style={{ marginLeft: "5px" }}
              disabled={messageIndexRef.current < 14}
            >
              <Upload size={20} />
            </Button>
            <Input
              type="file"
              innerRef={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileUpload}
              disabled={messageIndexRef.current < 14}
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
                disabled={messageIndexRef.current < 14}
                //disabled={messageIndex < 14}
              >
                Sign
              </Button>
              <Button
                color="success"
                onClick={() => setIsPaymentModalOpen(true)}
                className="mx-2"
                disabled={messageIndexRef.current < 14}
                //disabled={messageIndex < 14}
              >
                Payment
              </Button>
              <Button
                color="primary"
                onClick={() => setIsShareModalOpen(true)}
                className="mx-2"
                disabled={messageIndexRef.current < 14}
                // disabled={messageIndex < 14}
              >
                Share
              </Button>
              <Button
                color="info"
                onClick={saveAsPDF}
                className="mx-2"
                disabled={messageIndexRef.current < 14}
                // disabled={messageIndex < 14}
              >
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
        onShare={handleShareDocument}
        uploadedFiles={uploadedFiles}
        removeFile={removeFile}
      />
    </Container>
  );
};

export default LegalComplaintDocs;
