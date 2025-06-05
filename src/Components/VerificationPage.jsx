import { useState } from "react";
import mondaySdk from "monday-sdk-js";

import { TextField } from "@vibe/core";
import { Flex } from "@vibe/core";
import { Button } from "@vibe/core";
import { Heading } from "@vibe/core";

import backend from "../backend";
import ActionToast from "./ActionToast";

const monday = mondaySdk();
monday.setApiVersion("2025-04");

const VerificationPage = ({ userId, setSessionValid }) => {
  const [code, setCode] = useState();
  const [toastState, setToastState] = useState("closed");
  
  const toastText = {
    normal: "Verifying...",
    success: "Verified!",
    error: "Incorrect code!"
  }

  const storeSession = async () => {
    // get current sessions
    const prevSessionsItem = await monday.storage.instance.getItem("sessions");
    if (!prevSessionsItem) {return;}
    if (!prevSessionsItem.data) {return;}
    if (!prevSessionsItem.data.success) {return;}
    
    let prevSessions = JSON.parse(prevSessionsItem.data.value);
    if (!prevSessions) {prevSessions = {}}
      
    // 5 minutes
    const expireTime = Date.now() + 5 * 60 * 1000;
    
    // update user session
    const newSessions = {...prevSessions};
    newSessions[userId] = expireTime;

    // store and set session
    await monday.storage.instance.setItem("sessions", JSON.stringify(newSessions));
    setSessionValid(true);
  }

  const verifyCode = async () => {
    setToastState("verifying");
    try {
      const codeValidRes = await backend.post("/api/verify-account-code", {code});
      if (codeValidRes.status === 200) {
        setToastState("success");
        storeSession();
      }
    } catch (error) {
      setToastState("error");
      console.log(error);
    }
    

  }
  function onButtonClick() {
    verifyCode();
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      verifyCode();
    }
  }

  return (
    <Flex direction="column" gap="small">
      <Flex direction="column" align="center" justify="center" gap="medium">
        
        <Heading type="h1" weight="medium" align="center">
          Verification
        </Heading>

        <TextField
          title="Code"
          placeholder="Enter access code"
          size="medium"
          maxLength={9}

          type="password"
          value={code}

          onKeyDown={(handleKeyDown)}
          onChange={(value) => setCode(value)}
        />              
      
      </Flex>
      <Button
        kind="primary"
        size="medium"
        color="positive"
        onClick={onButtonClick}
        className="verify-button"
      >
        Verify
      </Button>

      <ActionToast 
        toastState={toastState}
        setToastState={setToastState}
        toastText={toastText}
      />
    </Flex>
  );
}

export default VerificationPage;