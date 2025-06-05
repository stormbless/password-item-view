import React from "react";
import { useState, useEffect } from "react";
import "./App.css";
import mondaySdk from "monday-sdk-js";
import "@vibe/core/tokens";

import { Flex } from "@vibe/core";
import { ThemeProvider } from "@vibe/core";

import LoadingPage from "./Components/LoadingPage.jsx";
import VerificationPage from "./Components/VerificationPage.jsx";
import MainPage from "./Components/MainPage.jsx";


const monday = mondaySdk();
monday.setApiVersion("2025-04");

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

  const initializeMainPageData = (context) => {
    const itemId =         context ? String(context.itemId)     : null;
    const userName =       context ? context.user.name          : null;
    const timeFormat =     context ? context.user.timeFormat    : null;
    const timeZoneOffset = context ? context.user.timeZoneOffset: null;

    const passwordDataLoaded = (
      typeof(itemId) === 'string' && 
      typeof(userName) === 'string' 
    );
    const changeHistoryDataLoaded = (
      (timeFormat === "12H" || timeFormat === "24H") &&
      (typeof(timeZoneOffset) === "number") 
    );
    
    const mainPageData = {
      passwordDataLoaded, 
      changeHistoryDataLoaded, 
      itemId, 
      userName,
      timeFormat,
      timeZoneOffset
    }

    return mainPageData;
  }
  
  const mainPageData = initializeMainPageData(context);
  
  const userId =         context ? context.user.id            : null;
  const theme =          context ? context.theme              : "light";
  const itemId =         context ? String(context.itemId)     : null;



  return (
    <ThemeProvider
      systemTheme={theme}
    >
      <Flex direction="column">
        {sessionValid ? (
          <MainPage data={mainPageData} />
        ) : (
          (itemId && userId && !loadingSessionData) ? (
            <VerificationPage userId={userId} setSessionValid={setSessionValid} />
          ) : (
            <LoadingPage />
          )
        )}
    </Flex>
  </ThemeProvider>
  );
};


export default App;