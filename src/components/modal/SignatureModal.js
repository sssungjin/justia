import React, { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "reactstrap";
import { X } from "lucide-react";

const SignatureModal = ({ isOpen, toggle }) => {
  const [signature, setSignature] = useState(null);
  const sigCanvasRef = useRef(null);

  const clearSignature = () => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear();
      setSignature(null);
    }
  };

  const saveSignature = () => {
    if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
      const dataURL = sigCanvasRef.current.toDataURL("image/png");
      setSignature(dataURL);
    }
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
        Signature
      </ModalHeader>
      <ModalBody>
        <div className="border h-32 d-flex align-items-center justify-content-center mb-4">
          {signature ? (
            <img src={signature} alt="Signature" className="h-100" />
          ) : (
            <SignatureCanvas
              ref={sigCanvasRef}
              penColor="black"
              canvasProps={{
                width: 400,
                height: 150,
                className: "border rounded",
              }}
            />
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color="danger" onClick={clearSignature}>
          Clear Signature
        </Button>
        <Button color="primary" onClick={saveSignature}>
          Save Signature
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default SignatureModal;
