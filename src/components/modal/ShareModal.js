import React, { useState } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from "reactstrap";
import { X } from "lucide-react";

const ShareModal = ({ isOpen, toggle }) => {
  const [email, setEmail] = useState("");

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
        Share
      </ModalHeader>
      <ModalBody>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email"
          className="mb-2"
        />
      </ModalBody>
      <ModalFooter>
        <Button color="primary" onClick={toggle} block>
          Send
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ShareModal;
