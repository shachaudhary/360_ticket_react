// DateWithTooltip.jsx
import React from "react";
import moment from "moment";
import { Tooltip, Typography } from "@mui/material";

const DateWithTooltip = ({ date, fallBack = "N/A" }) => {
  if (!date) {
    return <Typography component="span">{fallBack}</Typography>;
  }

  const formatted = moment(date).format("MM/DD/YYYY");
  const tooltipText = moment(date).format("MMMM D, YYYY"); // July 18, 2020

  return (
    <Tooltip title={tooltipText} arrow>
      {formatted || fallBack}
    </Tooltip>
  );
};

export default DateWithTooltip;
