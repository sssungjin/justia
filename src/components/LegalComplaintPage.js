import React, { useState, useRef, useEffect } from "react";
import {
  Row,
  Col,
  Input,
  Button,
  Card,
  CardBody,
  CardTitle,
  CardText,
  InputGroup,
} from "reactstrap";
import { Upload } from "lucide-react";
import SignatureModal from "./modal/SignatureModal";
import PaymentModal from "./modal/PaymentModal";
import ShareModal from "./modal/ShareModal";

const LegalComplaintPage = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [complaint, setComplaint] = useState({
    title: "강제추행 고소장",
    plaintiff: {
      name: "",
      identity: "",
      id: "",
      phone: "",
      address: "",
      other: "",
    },
    defendant: {
      name: "",
      identity: "",
      id: "",
      phone: "",
      address: "",
      other: "",
    },
    content: "",
    effect: "",
  });

  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const chatAreaRef = useRef(null);
  const fileInputRef = useRef(null);

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
    setComplaint(() => {
      return {
        title: "강제추행 고소장",
        plaintiff: {
          name: "",
          identity: "",
          id: "",
          phone: "",
          address: "",
          other: "",
        },
        defendant: {
          name: "",
          identity: "",
          id: "",
          phone: "",
          address: "",
          other: "",
        },
        content: "",
        effect: "",
      };
    });
    const initialMessage = "성매매 유도 사기로 고소하고 싶어요";
    setMessages([{ type: "user", content: initialMessage }]);

    const aiResponse = "고소인의 이름이 어떻게 되나요?";
    setMessages((prevMessages) => [
      ...prevMessages,
      { type: "ai", content: aiResponse },
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
      if (currentIndex === 0) {
        setComplaint((prev) => ({
          ...prev,
          plaintiff: { ...prev.plaintiff, name: inputMessage },
        }));
      } else if (currentIndex === 1) {
        setComplaint((prev) => ({
          ...prev,
          plaintiff: { ...prev.plaintiff, identity: inputMessage },
        }));
      } else if (currentIndex === 2) {
        setComplaint((prev) => ({
          ...prev,
          plaintiff: { ...prev.plaintiff, id: inputMessage },
        }));
      } else if (currentIndex === 3) {
        setComplaint((prev) => ({
          ...prev,
          plaintiff: { ...prev.plaintiff, phone: inputMessage },
        }));
      } else if (currentIndex === 4) {
        setComplaint((prev) => ({
          ...prev,
          plaintiff: { ...prev.plaintiff, address: inputMessage },
        }));
      } else if (currentIndex === 5) {
        setComplaint((prev) => ({
          ...prev,
          plaintiff: { ...prev.plaintiff, other: inputMessage },
        }));
      } else if (currentIndex === 6) {
        setComplaint((prev) => ({
          ...prev,
          defendant: { ...prev.defendant, name: inputMessage },
        }));
      } else if (currentIndex === 7) {
        setComplaint((prev) => ({
          ...prev,
          defendant: { ...prev.defendant, identity: inputMessage },
        }));
      } else if (currentIndex === 8) {
        setComplaint((prev) => ({
          ...prev,
          defendant: { ...prev.defendant, id: inputMessage },
        }));
      } else if (currentIndex === 9) {
        setComplaint((prev) => ({
          ...prev,
          defendant: { ...prev.defendant, phone: inputMessage },
        }));
      } else if (currentIndex === 10) {
        setComplaint((prev) => ({
          ...prev,
          defendant: { ...prev.defendant, address: inputMessage },
        }));
      } else if (currentIndex === 11) {
        setComplaint((prev) => ({
          ...prev,
          defendant: { ...prev.defendant, other: inputMessage },
        }));
      } else if (currentIndex === 12) {
        setComplaint((prev) => ({
          ...prev,
          content: inputMessage,
        }));

        setTimeout(() => {
          setComplaint((prev) => ({
            ...prev,
            effect: `분석 결과 고소 취지는 "이 몸이 죽고 죽어 일백번 고쳐죽어, 백골이 진토외어 넋이라도 있고없고 님향한 일편단심이야 가실 줄이 있으랴" 입니다.`,
          }));
        }, 200);
      }

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
      setMessages([
        ...messages,
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

  return (
    <div className="d-flex flex-column vh-100">
      <div className="flex-grow-1 d-flex overflow-hidden">
        <div
          className="w-50 p-3 d-flex flex-column"
          style={{ backgroundColor: "#f0f2f5" }}
        >
          <div
            className="chat-area flex-grow-1 mb-3 overflow-auto"
            ref={chatAreaRef}
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-2 ${
                  msg.type === "user" ? "text-right" : "text-left"
                }`}
              >
                <div
                  className={`d-inline-block p-5 m-5 rounded ${
                    msg.type === "user"
                      ? "bg-primary text-white ml-auto"
                      : "bg-secondary text-white mr-auto"
                  }`}
                  style={{ fontSize: "1.1rem" }}
                >
                  {msg.type === "user" ? (
                    <div>
                      <div className="font-weight-bold">고소인</div>
                      {msg.content}
                    </div>
                  ) : (
                    <div>
                      <div className="font-weight-bold">Justia</div>
                      {msg.content}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-50 p-3 d-flex flex-column overflow-auto">
          <Card className="flex-grow-1">
            <CardBody className="d-flex flex-column">
              <CardTitle
                tag="h2"
                className="text-center"
                style={{ fontSize: "2rem" }}
              >
                {complaint.title}
              </CardTitle>
              <CardText style={{ fontSize: "1.2rem" }}>
                <h3 className="text-left">고소인</h3>
                <div className="text-left">
                  <p>성명: {complaint.plaintiff.name}</p>
                  <p>신분: {complaint.plaintiff.identity}</p>
                  <p>주민등록번호: {complaint.plaintiff.id}</p>
                  <p>전화번호: {complaint.plaintiff.phone}</p>
                  <p>주소: {complaint.plaintiff.address}</p>
                  <p>기타: {complaint.plaintiff.other}</p>
                </div>

                <h3 className="mt-4 text-left">피고소인</h3>
                <div className="text-left">
                  <p>성명: {complaint.defendant.name}</p>
                  <p>신분: {complaint.defendant.identity}</p>
                  <p>주민등록번호: {complaint.defendant.id}</p>
                  <p>전화번호: {complaint.defendant.phone}</p>
                  <p>주소: {complaint.defendant.address}</p>
                  <p>기타: {complaint.defendant.other}</p>
                </div>

                <h3 className="mt-4 text-left">고소취지</h3>
                <div className="text-left">
                  <p>{complaint.effect}</p>
                </div>
              </CardText>
            </CardBody>
          </Card>
        </div>
      </div>

      <div className="p-3 bg-light">
        <Row>
          <Col md="6">
            <InputGroup>
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
                style={{ marginRight: "5px" }}
              >
                Send
              </Button>
              <Button
                color="secondary"
                onClick={() => fileInputRef.current.click()}
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
          <Col md="6" className="text-right">
            <Button
              color="secondary"
              onClick={() => setIsSignatureModalOpen(true)}
              className="mr-2"
            >
              Sign
            </Button>
            <Button
              color="success"
              onClick={() => setIsPaymentModalOpen(true)}
              className="mr-2"
            >
              Payment
            </Button>
            <Button color="info" onClick={() => setIsShareModalOpen(true)}>
              Share
            </Button>
          </Col>
        </Row>
      </div>

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
    </div>
  );
};

export default LegalComplaintPage;
