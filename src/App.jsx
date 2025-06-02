import React from "react";
import { useState, useEffect } from "react";
import "./App.css";
import mondaySdk from "monday-sdk-js";
import "@vibe/core/tokens";

import { TabPanel, TabPanels, TabList, Tab, TabsContext } from "@vibe/core";
import { Box } from "@vibe/core";
import { TextField } from "@vibe/core";
import { Show, Hide } from "@vibe/icons"
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from "@vibe/core"; 
import { Flex } from "@vibe/core";
import { Button } from "@vibe/core";
import { Heading } from "@vibe/core";
import { ThemeProvider } from "@vibe/core";

import axios from "axios";

const monday = mondaySdk();
monday.setApiVersion("2025-04");


const backend = {
  api: async (method, path, params) => {
    const res = await monday.get("sessionToken");
    const sessionToken = res.data;
    const config = {
      baseURL: import.meta.env.VITE_BACKEND,
      url: path,
      method,
      headers: {
        authorization: sessionToken
      },
    };
    if (method === "get") {
      config.params = params;
    } else {
      config.data = params;
    }

    return await axios(config);
  },
  get: async (path, params) => {
    const response = await backend.api("get", path, params);
    return response;
  },
  post: async (path, params) => {
    const response = await backend.api("post", path, params);
    return response;
  }
}

const VerificationPage = ({ userId, setSessionValid }) => {

  const [code, setCode] = useState();

  // const exp = Date.now() + 2 * 60 * 1000;
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

  const verifyCode = () => {
    // const codeValid = await backend.get('/api/codeValid', {itemId, code})
    // if (codeValid)
    if (code === '123456789') {
      storeSession();
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
          placeholder="Enter security code"
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
    </Flex>
  );
}

const PasswordPanel = ({ itemId, userName }) => {
  const [pwd, setPwd] = useState("");
  const [pwdOnFocus, setPwdOnFocus] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

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
        // error toast/status
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
    try {
      await backend.post("/api/store-password", {
        itemId: itemId, 
        password: pwd,
        changedBy: userName
      })
      //success toast/success status
    } catch(err) {
      console.error(err);
      //error toast/error status
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
    </TabPanel>
  );
}

const PasswordChangeHistoryPanel = ({ itemId, timeFormat, timeZoneOffset }) => {
  const [loading, setLoading] = useState(false);
  const [changeHistory, setChangeHistory] = useState([]);
  const columns = [
    {
      id: "changedOn",
      title: "Changed on",
      //width: 150,
      loadingStateType: "medium-text",
    },
    {
      id: "changedBy",
      title: "Changed by",
      loadingStateType: "medium-text",
    },
  ];


  // fetch changeHistory on initial render and when itemId changes
  // due to how monday itemviews work, initial render may occur anytime new item selected
  useEffect(() => {
    // formats datetime according to the user's timeFormat ("12H" or "24H")
    // datetime in the form YYYY-MM-DD HH:MM, "12H" has AM/PM after that
    // also adjusts datetime string for user's locale
    const formatDatetime = (datetime, timeFormat, timeZoneOffset) => {
      const date = new Date(datetime);    

      const adjustedDate = new Date(datetime);
     	adjustedDate.setHours(date.getHours() + timeZoneOffset)

      // toLocalestring formats time for timezone of browser 
      // Usually same as timeZoneOffset stored in monday user account but can be different, 
      // calculate diff so toLocaleString formats the time according to the monday account settings
      const browserMondayDiff = timeZoneOffset + (date.getTimezoneOffset() / 60);
      date.setHours(date.getHours() + browserMondayDiff);
      
      const dateString = adjustedDate.toISOString().substring(0, 10);
      const timeString = date.toLocaleString([], {
        hour12: (timeFormat === "12H"), 
        hour: "numeric", 
        minute: "2-digit"
      });

      const datetimeString = `${dateString} ${timeString}`;
      
      return datetimeString;
    }

    const formatChangeHistory = (changeHistory, timeFormat, timeZoneOffset) => {      
      const formattedChangeHistory = changeHistory.map((change) => {
        const formattedDatetime = formatDatetime(change.datetimeChanged, timeFormat, timeZoneOffset);
        
        return {
          id: change.datetimeChanged, 
          changedOn: formattedDatetime, 
          changedBy: change.user.name
        };
      })
        
      return formattedChangeHistory;
    }

    const fetchChangeHistory = async () => {
      setLoading(true);
      try {
        const response = await backend.get("/api/get-change-history", {itemId}); 
        const changeHistory = response.data;
        const formattedHistory = formatChangeHistory(changeHistory, timeFormat, timeZoneOffset);
        
        setChangeHistory(formattedHistory);
      } catch(err) {
        console.error(err);
        // error toast/status
      }
      setLoading(false);
    }

    fetchChangeHistory();
  }, [itemId, timeFormat, timeZoneOffset]);

  // might need to add empty and errorstate to table and test those
  return (
    <TabPanel>
      <Box
        marginStart="xxxl"
        padding="medium"
        style={{
          width: '75%'
        }}
      >
        <Table
          withoutBorder
          columns={columns}
          dataState={{
            isLoading: loading,
          }}
        >
          <TableHeader>
            {columns.map((headerCell, index) => (
              <TableHeaderCell key={index} title={headerCell.title} />
            ))}
          </TableHeader>
          <TableBody>
            {changeHistory.map(rowItem => (
              <TableRow key={rowItem.id}>
                <TableCell>{rowItem.changedOn}</TableCell>
                <TableCell>{rowItem.changedBy}</TableCell>                        
              </TableRow>
            ))}
          </TableBody>
        </Table>          
      </Box>
    </TabPanel>
  );
}

const LoadingPanel = () => {
  return (
    <div>
    </div>
  );
};

const App = () => {
  const [loadingSessionData, setLoadingSessionData] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);
  const [context, setContext] = useState();
  
  useEffect(() => {
    const fetchSession = async (userId) => {
      const sessionsItem = await monday.storage.instance.getItem("sessions");

      if (!sessionsItem) {return;}
      if (!sessionsItem.data) {return;}
      if (!sessionsItem.data.success) {return;}
      if (!sessionsItem.data.value) {return;}

      const sessions = JSON.parse(sessionsItem.data.value);
      const userSessionExp = sessions[userId];

      if (!userSessionExp)             {setSessionValid(false);}
      if (userSessionExp < Date.now()) {setSessionValid(false);}
      if (userSessionExp > Date.now()) {setSessionValid(true);}
    }

    const getUserName = async (monday) => {
      const query = `query {
        me {
          name
        } 
      }`;

      const apiRes = await monday.api(query);
      const userName = apiRes.data.me.name;
      return userName;
    }

    const fetchContext = async () => {
      const contextRes = await monday.get("context");
      const context = contextRes.data;

      context.user.name = await getUserName(monday);
      
      setContext(context);
      // fetchSession called after because it uses context data
      await fetchSession(context.user.id);
      setLoadingSessionData(false);
    }

    fetchContext();
  }, []);
  
  const itemId =         context ? String(context.itemId)     : null;
  const userName =       context ? context.user.name          : null;
  const userId =         context ? context.user.id            : null;
  const timeFormat =     context ? context.user.timeFormat    : null;
  const timeZoneOffset = context ? context.user.timeZoneOffset: null;
  const theme =          context ? context.theme              : "dark";

  const passwordDataLoaded = (
    typeof(itemId) === 'string' && 
    typeof(userName) === 'string' 
  );
  const changeHistoryDataLoaded = (
    (timeFormat === "12H" || timeFormat === "24H") &&
    (typeof(timeZoneOffset) === 'number') 
  );

  return (
    <ThemeProvider
      systemTheme={theme}
    >
      <Flex direction="column">
        {sessionValid ? (
          <Box
          style={{
            width: "75%",
          }}
          >
            <TabsContext>
              <TabList tabType="stretched">
                <Tab>Password</Tab>
                <Tab>Password Change History</Tab>
              </TabList>
              <TabPanels>
                {passwordDataLoaded ? (
                  <PasswordPanel itemId={itemId} userName={userName} />
                ) : (
                  <LoadingPanel />
                )}

                {changeHistoryDataLoaded ? (
                  <PasswordChangeHistoryPanel 
                  itemId={itemId} 
                  timeFormat={timeFormat}
                  timeZoneOffset={timeZoneOffset} />
                ) : (
                  <LoadingPanel />
                )}
              </TabPanels>
            </TabsContext>
          </Box>
        ) : (
          (itemId && userId && !loadingSessionData) ? (
            <VerificationPage userId={userId} setSessionValid={setSessionValid} />
          ) : (
            <LoadingPanel />
          )
        )}
    </Flex>
  </ThemeProvider>
  );
};


export default App;