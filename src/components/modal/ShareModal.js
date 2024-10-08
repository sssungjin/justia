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
import { X, Paperclip, XCircle } from "lucide-react";

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
      <ModalHeader
        toggle={toggle}
        close={
          <button className="close" onClick={toggle}>
            <X />
          </button>
        }
      >
        Share Document
      </ModalHeader>
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
                  <Button close onClick={() => removeFile(index)}>
                    <XCircle size={16} />
                  </Button>
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
