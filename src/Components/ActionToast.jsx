import { useState } from "react";
import { Toast } from "@vibe/core";

const ActionToast = ({ toastState, setToastState, toastText }) => {
  // previous state needed so that type and text don't change when closing
  // otherwise no way of knowing what the text and type were previously
  const [prevState, setPrevState] = useState("");
  
  const getToastType = (toastState) => {
    if (toastState === "closed") { return getToastType(prevState); }

    switch(toastState) {
      case "success":
        return "positive";
      case "error":
        return "negative";
      default:
        return "normal";
    }
  }

  const getToastText = (toastState) => {
    if (toastState === "closed") { return getToastText(prevState); }
    
    switch(toastState) {
      case "success":
        return toastText.success;
      case "error":
        return toastText.error;
      default:
        return toastText.normal;
    }
  }

  // record previous state
  const handleClose = () => {
    setPrevState(toastState);
    setToastState("closed");
  }
  
  return (
    <Toast
      open={!(toastState === "closed")}
      type={getToastType(toastState)}
      onClose={handleClose}
      autoHideDuration={1500}
      loading={toastState === "normal"}
      className="toastBottom"
    >
      {getToastText(toastState)}
    </Toast>
  );
}

export default ActionToast;