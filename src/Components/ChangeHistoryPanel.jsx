import { useState, useEffect } from "react";

import { TabPanel } from "@vibe/core";
import { Box } from "@vibe/core";
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from "@vibe/core"; 

import backend from "../backend.jsx"

const ChangeHistoryPanel = ({ itemId, timeFormat, timeZoneOffset }) => {
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


export default ChangeHistoryPanel;