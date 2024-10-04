import React from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Row,
  Col,
} from "reactstrap";
import { X } from "lucide-react";

const PaymentModal = ({ isOpen, toggle }) => {
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
        Payment
      </ModalHeader>
      <ModalBody>
        <Input type="text" placeholder="Card Number" className="mb-2" />
        <Row form>
          <Col md={6}>
            <Input type="text" placeholder="MM" className="mb-2" />
          </Col>
          <Col md={6}>
            <Input type="text" placeholder="YY" className="mb-2" />
          </Col>
        </Row>
        <Input type="text" placeholder="CVC" className="mb-2" />
        <Input type="text" placeholder="Name on Card" className="mb-2" />
        <Input type="text" placeholder="Amount" className="mb-2" />
      </ModalBody>
      <ModalFooter>
        <Button color="success" onClick={toggle} block>
          Pay
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default PaymentModal;
