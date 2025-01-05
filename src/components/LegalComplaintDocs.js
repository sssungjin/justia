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
  Spinner,
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
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import axios from "axios";
import { useTranslation } from "react-i18next";
import justiaLogo from "../styles/images/justia_logo.png";

const LegalComplaintDocs = ({ currentLanguage }) => {
  const { t } = useTranslation();

  const [userInfo, setUserInfo] = useState(null);

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");

  const [category, setCategory] = useState("");

  const [editorState, setEditorState] = useState(() => {
    const contentState = ContentState.createFromText("");
    return EditorState.createWithContent(contentState);
  });
  const [editorContent, setEditorContent] = useState("");

  const [webSocket, setWebSocket] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [signature, setSignature] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingComplaint, setIsGeneratingComplaint] = useState(false);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);

  const messageIndexRef = useRef(0);
  const chatAreaRef = useRef(null);
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const editorRef = useRef(null);

  const questions = Array.from({ length: 15 }, (_, i) => t(`questions.${i}`));

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
  };

  const searchTexts = [
    t("accusedStatus"),
    t("complainantStatus"),
    t("crimeDateTime"),
    t("crimeLocation"),
  ];

  useEffect(() => {
    const storedUserInfo = sessionStorage.getItem("userInfo");
    if (storedUserInfo) {
      setUserInfo(JSON.parse(storedUserInfo));
    }

    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3;
    let reconnectTimeout;

    const connectWebSocket = () => {
      // local
      const wsUrl = `ws://localhost:8080/webchat/dial/null`;

      // production ssl
      //const wsUrl = `wss://chat.justia.co.kr/webchat/dial/null`;
      const newWebSocket = new WebSocket(wsUrl);

      newWebSocket.onopen = () => {
        console.log("WebSocket connected");
        reconnectAttempts = 0;
        setMessages([
          {
            type: "ai",
            content: t("welcomeMessage"),
          },
        ]);
      };

      newWebSocket.onmessage = (event) => {
        handleIncomingMessage(event.data);
      };

      newWebSocket.onclose = (event) => {
        console.log("WebSocket disconnected", event);
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectTimeout = setTimeout(() => {
            reconnectAttempts++;
            connectWebSocket();
          }, 5000);
        } else {
          alert(t("websocketDisconnected"));
        }
      };

      newWebSocket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      setWebSocket(newWebSocket);
    };

    connectWebSocket();

    return () => {
      if (webSocket) {
        webSocket.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  useEffect(() => {
    const blocks = [
      new ContentBlock({
        key: genKey(),
        type: "header-two",
        text: t("complaint"),
      }),
      new ContentBlock({
        key: genKey(),
        type: "unstyled",
        text: t("creationDate", { date: formatDate(new Date()) }),
      }),
      new ContentBlock({
        key: genKey(),
        type: "unstyled",
        text: t("complainantStatus") + ":",
      }),
      new ContentBlock({
        key: genKey(),
        type: "unstyled",
        text: t("accusedStatus") + ":",
      }),
      new ContentBlock({
        key: genKey(),
        type: "unstyled",
        text: t("crimeDateTime") + ":",
      }),
      new ContentBlock({
        key: genKey(),
        type: "unstyled",
        text: t("crimeLocation") + ":",
      }),
      new ContentBlock({
        key: genKey(),
        type: "unstyled",
        text: t("complaintContent") + ":",
      }),
    ];

    const initialContent = ContentState.createFromBlockArray(blocks);
    const newEditorState = EditorState.createWithContent(initialContent);
    setEditorState(newEditorState);

    newEditorState.getCurrentContent().getBlocksAsArray();
  }, [t]);

  const blockStyleFn = (contentBlock) => {
    const data = contentBlock.getData();
    let styles = [];

    if (data.get("textAlign")) {
      styles.push(`text-align-${data.get("textAlign")}`);
    }
    if (data.get("fontSize")) {
      styles.push(`font-size-${data.get("fontSize").replace("px", "")}`);
    }
    if (data.get("fontWeight")) {
      styles.push(`font-weight-${data.get("fontWeight")}`);
    }

    return styles.join(" ");
  };

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
        setIsGeneratingComplaint(false);
      } else if (currentIndex === 14 && talk.msg) {
        setMessages((prevMessages) => [
          ...prevMessages,
          { type: "ai", content: talk.msg },
        ]);

        setEditorState((prevState) => {
          updateEditorWithComplaintContent(talk.msg, prevState);
          return prevState;
        });
        setIsGeneratingComplaint(false);
      } else if (currentIndex < questions.length) {
        const newIndex = currentIndex + 1;
        messageIndexRef.current = newIndex;
        setMessages((prevMessages) => [
          ...prevMessages,
          { type: "ai", content: questions[newIndex] },
        ]);
      }

      setIsWaitingForResponse(false);
      setIsLoading(false);
    } catch (e) {
      console.error("Error parsing message:", e);
      setIsWaitingForResponse(false);
      setIsLoading(false);
      setIsGeneratingComplaint(false);
    }

    console.log("Messages: " + messages);
  };

  const updateEditorWithAnswer = (index, answer) => {
    const validIndexes = [1, 2, 4, 5];
    if (!validIndexes.includes(index)) {
      console.log(`Skipping update for index: ${index}`);
      return;
    }

    const contentState = editorState.getCurrentContent();

    const searchTextIndex = index === 5 ? 3 : index === 4 ? 2 : index - 1;
    const searchText = searchTexts[searchTextIndex];

    const blocks = contentState.getBlocksAsArray();

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const text = block.getText().trim();

      if (text.startsWith(searchText)) {
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
        return;
      }
    }

    console.log(
      `Could not find location for answer: ${answer} at index: ${index}`
    );
  };

  const updateEditorWithComplaintContent = useCallback(
    (content, currentEditorState) => {
      // 중복된 내용이 추가되지 않도록 처리
      const existingContent = currentEditorState.getCurrentContent().getPlainText();
      if (existingContent.includes(content)) {
        console.log("Content already exists, skipping update.");
        return; // 이미 존재하는 내용이면 업데이트를 건너뜁니다.
      }

      let sentenceCount = 0;

      let modifiedContent; // 변수를 미리 선언

      console.log("Current Language:", currentLanguage); // 현재 언어 확인
      console.log("Original Content:", content); // 원본 내용 확인

      if (currentLanguage === "ko") {
        modifiedContent = content
          .replace(/([^다]다\.\s?)/g, (match) => {
            sentenceCount++;
            return sentenceCount % 3 === 0 ? match + "\n" : match;
          })
          .replace("[판례]", "\n\n[판례]\n")
          .replace("[처벌의사 표현]", "\n\n[처벌의사 표현]\n");
      } else {
        modifiedContent = content
          .replace(/([^다]다\.\s?)/g, (match) => {
            sentenceCount++;
            return sentenceCount % 3 === 0 ? match + "\n" : match;
          })
          .replace("[Case law]", "\n\n[Case law]\n")
          .replace("[Expression of intent to punish]", "\n\n[Expression of intent to punish]\n")
          .replace("&#39;", "'");
      }

      console.log("Modified Content:", modifiedContent); // 수정된 내용 확인

      let contentState = currentEditorState.getCurrentContent();
      let blocks = contentState.getBlocksAsArray();

      const complaintBlockIndex = blocks.findIndex(
        (block) => block.getText().trim() === t("complaintContent") + ":"
      );

      if (complaintBlockIndex !== -1) {
        const complaintBlock = blocks[complaintBlockIndex];
        const blockKey = complaintBlock.getKey();

        const selection = SelectionState.createEmpty(blockKey).merge({
          anchorOffset: complaintBlock.getLength(),
          focusOffset: complaintBlock.getLength(),
        });

        let newContentState = Modifier.splitBlock(contentState, selection);
        newContentState = Modifier.insertText(
          newContentState,
          newContentState.getSelectionAfter(),
          modifiedContent // modifiedContent를 사용
        );

        const newEditorState = EditorState.push(
          currentEditorState,
          newContentState,
          "insert-fragment"
        );

        setEditorState(newEditorState);
        console.log("Updated editor with complaint content");
      } else {
        console.log("Error: '고소 내용:' block not found.");
      }
    },
    [t, currentLanguage] // currentLanguage를 의존성 배열에 추가
  );

  const sendWebSocketMessage = (message, index = null) => {
    const currentIndex = index !== null ? index : messageIndexRef.current;
    const talk = {
      mode: "delator",
      id: userInfo ? userInfo.name : "unknown",
      index: currentIndex.toString(),
      reply: message,
      locale: currentLanguage,
    };
    console.log("Current language: " + currentLanguage);

    console.log("sendWebSocketMessage:", talk);

    if (webSocket && webSocket.readyState === WebSocket.OPEN) {
      webSocket.send(JSON.stringify(talk));
      setIsWaitingForResponse(true);
      setIsLoading(true);
      if (currentIndex === 14) {
        setIsGeneratingComplaint(true);
      }
    } else {
      console.error("WebSocket is not connected");
    }
  };

  const handleSendMessage = () => {
    if (inputMessage.trim() === "" || isWaitingForResponse) return;

    const currentIndex = messageIndexRef.current;
    const newMessage = { type: "user", content: inputMessage };
    setMessages((prevMessages) => [...prevMessages, newMessage]);

    if ([1, 2, 4, 5].includes(currentIndex)) {
      updateEditorWithAnswer(currentIndex, inputMessage.trim());
    }

    if (currentIndex === 14) {
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
    setMessages([
      {
        type: "ai",
        content: t("welcomeMessage"),
      },
      { type: "user", content: `${selectedCategory}` },
    ]);
    messageIndexRef.current = 0;
    sendWebSocketMessage(selectedCategory, 0);
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

    if (files.length === 0) {
      return;
    }

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

        if (newFiles.length > 0) {
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              type: "user",
              content: `Files uploaded: ${newFiles
                .map((f) => f.name)
                .join(", ")}`,
            },
          ]);
        }
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

      axios.post("/webchat/email", jsonData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      setIsShareModalOpen(false);
    } catch (error) {
      console.error("Error sharing document:", error);
      alert("Failed to share document. Please try again.");
    }
  };

  const removeFile = (index) => {
    setUploadedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const addSignatureToEditor = useCallback(
    (signatureDataURL) => {
      let newEditorState = EditorState.moveFocusToEnd(editorState);
      const contentState = newEditorState.getCurrentContent();
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
      const blockMap = contentStateWithEntity.getBlockMap();
      const lastBlock = blockMap.last();
      const lastBlockKey = lastBlock.getKey();
      const length = lastBlock.getLength();
      const selection = SelectionState.createEmpty(lastBlockKey).merge({
        anchorOffset: length,
        focusOffset: length,
      });
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

  const saveAsPDF = async () => {
    if (!editorRef.current) {
      console.error("Editor element not found");
      return;
    }

    const content = draftToHtml(convertToRaw(editorState.getCurrentContent()));

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;
    tempDiv.style.fontSize = "16px";
    tempDiv.style.width = "793px";
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
        unit: "pt",
        format: "a4",
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

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

      const emailPrefix = userInfo.email.split("@")[0];
      const docName = `${emailPrefix}_${new Date().toISOString().split("T")[0]
        }_complaint.pdf`;
      pdf.save(docName);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      document.body.removeChild(tempDiv);
    }
  };

  return (
    <Container fluid className="vh-100 flex-column">
      {userInfo && (
        <Header userName={userInfo.name} userEmail={userInfo.email} />
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
                  {category || t("category")} <ChevronDown size={20} />
                </DropdownToggle>
                <DropdownMenu className="w-80">
                  <DropdownItem
                    onClick={() => handleCategorySelect(t("prostitutionFraud"))}
                  >
                    {t("prostitutionFraud")}
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => handleCategorySelect(t("secondHandFraud"))}
                  >
                    {t("secondHandFraud")}
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => handleCategorySelect(t("other"))}
                  >
                    {t("other")}
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
              <div className="chat-messages overflow-auto" ref={chatAreaRef}>
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`mb-2 ${msg.type === "user" ? "text-right" : "text-left"
                      }`}
                  >
                    {msg.type === "user" ? (
                      <div className="user-bubble">
                        <div className="font-weight-bold">
                          {t("complainant")}: {userInfo.name}
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
                {isGeneratingComplaint && (
                  <div className="text-center">
                    <img
                      src={justiaLogo}
                      alt="Justia Logo"
                      style={{ width: "250px", height: "auto" }}
                    />
                    <p>{t("generatingComplaint")}</p>
                  </div>
                )}
                {isLoading && (
                  <div className="text-center">
                    <Spinner color="primary" children={""} />
                  </div>
                )}
              </div>
            </div>
          </div>

          <InputGroup className="mb-1" disabled={!category}>
            <Input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              style={{ fontSize: "1.1rem" }}
              disabled={!category}
            />
            <Button
              color="primary"
              onClick={handleSendMessage}
              style={{ marginLeft: "5px" }}
              disabled={!category}
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
              {t("complaint")}
            </CardTitle>
            <div className="editor-wrapper">
              <div ref={editorRef}>
                <Editor
                  editorState={editorState}
                  onEditorStateChange={handleEditorStateChange}
                  blockStyleFn={blockStyleFn}
                  editorStyle={{ fontSize: "16px" }}
                  onFocus={(event) => event.preventDefault()}
                  wrapperClassName="demo-wrapper"
                  editorClassName="demo-editor"
                  toolbarClassName="demo-toolbar"
                  toolbar={{
                    options: [
                      "inline",
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
                    locale: navigator.language,
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
              >
                Sign
              </Button>
              <Button
                color="success"
                onClick={() => setIsPaymentModalOpen(true)}
                className="mx-2"
                disabled={messageIndexRef.current < 14}
              >
                Payment
              </Button>
              <Button
                color="primary"
                onClick={() => setIsShareModalOpen(true)}
                className="mx-2"
                disabled={messageIndexRef.current < 14}
              >
                Share
              </Button>
              <Button
                color="info"
                onClick={saveAsPDF}
                className="mx-2"
                // disabled={messageIndexRef.current < 14}
                style={{ color: "white" }}
              >
                Download
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
