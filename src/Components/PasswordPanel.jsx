import { useState, useEffect } from "react";

import { TabPanel } from "@vibe/core";
import { Box } from "@vibe/core";
import { TextField } from "@vibe/core";
import { Show, Hide } from "@vibe/icons"

import backend from "../backend.jsx"
import ActionToast from "./ActionToast.jsx";

const PasswordPanel = ({ itemId, userName }) => {
  const [pwd, setPwd] = useState("");
  const [pwdOnFocus, setPwdOnFocus] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastState, setToastState] = useState("closed");
  
  const toastText = {
    normal: "Saving password...",
    success: "Password saved!",
    error: "Password failed to save!"
  }


  // fetch password on initial render and when itemId changes
  useEffect(() => {
    const fetchPassword = async () => {
      setLoading(true);
      try {
        const response = await backend.get("/api/get-password", {itemId});
        const password = response.data;
        setPwd(password);
      } catch(err) {
        console.error(err);
      }
      setLoading(false);
    }

    fetchPassword();
  }, [itemId]);
  
  // icon toggles password visibility
  const handleIconClick = () => {
    //setIconClickedAt(Date.now());
    setShowPwd(!showPwd);
  }

  // Passsword loses focus when enter key pressed
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.target.blur();
    }
  }

  // password saves when password loses focus (if pwd changed from when focused on)
  const handleBlur = async () => {
    if (pwd === pwdOnFocus) { return; }

    setLoading(true);
    setToastState("saving");
    try {
      await backend.post("/api/store-password", {
        itemId: itemId, 
        password: pwd,
        changedBy: userName
      })
      setToastState("success")
    } catch(err) {
      console.error(err);
      setToastState("error")
    }
    setLoading(false);
  }

  return (
    <TabPanel>
      <Box
        marginStart="xxxl"
        padding="medium"
        style={{
          width: '75%'
        }}
      >
        <TextField
          title="Password"
          placeholder="Enter password"
          size="medium"
          maxLength={40}

          iconName={showPwd ? Hide : Show}
          iconTooltipContent={showPwd ? "Hide" : "Show"}
          type={showPwd ? "text" : "password"}
          loading={loading}
          value={pwd}

          onIconClick={handleIconClick}
          onFocus={(e) => setPwdOnFocus(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(handleKeyDown)}
          onChange={(value) => setPwd(value)}
        />              
      </Box>
      <ActionToast 
        toastState={toastState} 
        setToastState={setToastState}
        toastText={toastText}
      />
      
    </TabPanel>
  );
}


export default PasswordPanel;