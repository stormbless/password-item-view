import { TabsContext, TabList, Tab, TabPanels } from "@vibe/core";
import { Box } from "@vibe/core";

import PasswordPanel from "./PasswordPanel";
import ChangeHistoryPanel from "./ChangeHistoryPanel";
import LoadingPage from "./LoadingPage";


const MainPage = ({data}) => {
  return (
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
          {data.passwordDataLoaded ? (
            <PasswordPanel itemId={data.itemId} userName={data.userName} />
          ) : (
            <LoadingPage />
          )}

          {data.changeHistoryDataLoaded ? (
            <ChangeHistoryPanel 
              itemId={data.itemId} 
              timeFormat={data.timeFormat}
              timeZoneOffset={data.timeZoneOffset} 
            />
          ) : (
            <LoadingPage />
          )}
        </TabPanels>
      </TabsContext>
    </Box>
  );
};

export default MainPage;