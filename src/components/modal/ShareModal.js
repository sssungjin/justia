import React, { useState } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Spinner,
  Label,
  ListGroup,
  ListGroupItem,
} from "reactstrap";
import { Paperclip } from "lucide-react";

const ShareModal = ({ isOpen, toggle, onShare, uploadedFiles, removeFile }) => {
  const [email, setEmail] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (!email) {
      alert("Please enter an email address.");
      return;
    }
    setIsSharing(true);
    await onShare(email);
    setIsSharing(false);
    setEmail("");
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle}>
      <ModalHeader toggle={toggle}>Share Document</ModalHeader>
      <ModalBody>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email"
          className="mb-2"
        />
        {uploadedFiles.length > 0 && (
          <div className="mb-2">
            <Label>
              <Paperclip size={16} className="mr-1" />
              Attached files:
            </Label>
            <ListGroup>
              {uploadedFiles.map((file, index) => (
                <ListGroupItem
                  key={index}
                  className="d-flex justify-content-between align-items-center"
                >
                  {file.name}
                  <button
                    className="btn btn-link p-0"
                    onClick={() => removeFile(index)}
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      color: "#6c757d",
                      opacity: "0.8",
                      textDecoration: "none",
                    }}
                  >
                    &times;
                  </button>
                </ListGroupItem>
              ))}
            </ListGroup>
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button
          color="primary"
          onClick={handleShare}
          disabled={isSharing}
          block
        >
          {isSharing ? <Spinner size="sm" /> : "Send"}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ShareModal;
