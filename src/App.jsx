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

import axios from "axios";

const monday = mondaySdk();


const backend = {
  api: async (method, path, params) => {
    // console.log(`in backend.api, params: ${JSON.stringify(params)}`);
    const sessionToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXQiOnsiYWNjb3VudF9pZCI6IjEiLCJ1c2VyX2lkIjoiMSJ9LCJpYXQiOjE3NDg1MjY3NjgsImV4cCI6MTc0ODY5OTU2OH0.C2YDNjRhSgaktMuULXjAQHJ6yFHzLgQH0pvpY919rKE";
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

    // console.log(`in backend.api, config.data: ${JSON.stringify(config.data)}`);
    return await axios(config);
  },
  get: async (path, params) => {
    const response = await backend.api("get", path, params);
    return response;
  },
  post: async (path, params) => {
    // console.log(`in backend.post, params: ${JSON.stringify(params)}`);
    const response = await backend.api("post", path, params);
    return response;
  }
}

const VerificationPage = ({userId, setSessionValid}) => {
  const [code, setCode] = useState();

  const storeSession = async () => {
    // get current sessions
    /*
    const prevSessionsItem = monday.storage.instance.getItem("sessions")
    let prevSessions = prevSessionsItem.data.value;
    if (!prevSessions) {prevSessions = {}}
      
    // 1 hour
    const expireTime = Date.now() + 1 * 60 * 60 * 1000;
    
    // add session
    const newSessions = {...prevSessions};
    newSessions[userId] = expireTime;
    await monday.storage.instance.setItem("sessions", newSessions);*/
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
    <Flex direction="column" gap="small" className="">
        
        <Flex direction="column" align="center" justify="center" gap="medium">
          
          <Heading type="h1" weight="bold" align="center">
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
  //const [iconClickedAt, setIconClickedAt] = useState(Date.now());

  // fetch password on initial render and when itemId changes
  useEffect(() => {
    const fetchPassword = async () => {
      setLoading(true);
      try {
        const response = await backend.get("/api/get-password", {itemId});
        const password = response.data;
        console.log(`response: ${JSON.stringify(response)}`);
        console.log(`password: ${JSON.stringify(password)}`);
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
    // console.log(`pwdOnfocus: ${pwdOnFocus}`);
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
  // due to how monday itemviews work, initial render may occur anytime itemId changes
  useEffect(() => {
    // formats datetime according to the timeFormat ("12H" or "24H") and timeZoneOffset (in hours)
    const formatDatetime = (datetime, timeFormat, timeZoneOffset) => {
      const date = new Date(datetime);

      date.setHours(date.getHours() + timeZoneOffset);
      
      const dateString = date.toISOString().substring(0, 10);
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
      // loading?
      try {
        const response = await backend.get("/api/get-change-history", {itemId}); 
        const changeHistory = response.data;
        console.log("changeHistory length:")
        console.log(changeHistory.length);
        // [
        //   {datetimeChanged: 1748246586296, user: {id: 45345, name: "David Bailes"}},
        //   {datetimeChanged: 1748026586296, user: {id: 65465, name: "John Smith"}}
        // ];     
        const formattedHistory = formatChangeHistory(changeHistory, timeFormat, timeZoneOffset);
        
        setChangeHistory(formattedHistory);
      } catch(err) {
        console.error(err);
        // error toast/status
      }
      // set loading to false
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
      Loading...
    </div>
  );
}

const App = () => {
  const [sessionValid, setSessionValid] = useState(false);
  const [context, setContext] = useState();

  
  useEffect(() => {
    const fetchSession = async (userId) => {
      const expDatetime = Date.now() - 6000000 * 1000
      const sessionsItem = {data: {value: {"123": expDatetime}}}
      //await monday.storage.instance.getItem("sessions");
      const sessions = sessionsItem.data.value;

      const userSessionExp = sessions[userId];
      console.log("userSessionExp");
      console.log(userSessionExp);
      console.log( `date: ${Date.now()}`);

      if (!userSessionExp)             {setSessionValid(false);}
      if (userSessionExp < Date.now()) {setSessionValid(false);}
      if (userSessionExp > Date.now()) {setSessionValid(true);}
    }

    const fetchContext = async () => {
      // might have to do listener rather than get
      const context = {
        itemId: 423,
        user: {
          id: "123",
          name: "Dave Bailes",
          timeFormat: "12H",
          timeZoneOffset: 0
        }
      }//await monday.get("context");
      
      setContext(context);
      // fetchSession called after because it uses context data
      fetchSession(context.user.id);
    }

    fetchContext();
  }, []);
  
  const itemId =         context ? String(context.itemId) : null;
  const userName =       context ? context.user.name      : null;
  const userId =         context ? context.user.id        : null
  const timeFormat =     context ? context.user.timeFormat     : null;
  const timeZoneOffset = context ? context.user.timeZoneOffset : null;

  const passwordData = (
    typeof(itemId) === 'string' && 
    typeof(userName) === 'string' );
  const changeHistoryData = (
    (timeFormat === "12H" || timeFormat === "24H") && 
    typeof(timeZoneOffset) === 'number'
  );
  
  console.log(`context: ${context}`);

  console.log(`itemId: ${itemId}`);
  console.log(`userName: ${userName}`);
  console.log(`timeFormat: ${timeFormat}`);
  console.log(`timeZoneOffset: ${timeZoneOffset}`);
  console.log(`timeZoneOffset: ${(timeZoneOffset)}`);
  console.log(`sessionValid: ${(sessionValid)}`);

  return (
    <>
    {sessionValid ? (
      <div
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
            {passwordData ? (
              <PasswordPanel itemId={itemId} userName={userName} />
            ) : (
              <LoadingPanel />
            )}

            {changeHistoryData ? (
              <PasswordChangeHistoryPanel 
                itemId={itemId} 
                timeFormat={timeFormat} 
                timeZoneOffset={timeZoneOffset}
              />
            ) : (
              <LoadingPanel />
            )}
          </TabPanels>
        </TabsContext>
      </div>
    ) : (
      (itemId, userId) ? (
          <VerificationPage userId={userId} setSessionValid={setSessionValid} />
        ) : (
          <LoadingPanel />
        )
    )}
  </>
  );
};




export default App;