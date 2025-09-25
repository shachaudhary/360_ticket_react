import { useEffect, useState } from "react";
import {
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Stack,
} from "@mui/material";

const TimeZoneSelect = ({
  values,
  handleChange,
  handleBlur,
  touched,
  errors,
}) => {
  const [timeZones, setTimeZones] = useState([]);

  useEffect(() => {
    const fetchTimeZones = async () => {
      try {
        const response = await fetch(
          `http://api.timezonedb.com/v2.1/list-time-zone?key=IDU0ZFRYGTHL&format=json`
        );
        const data = await response.json();
        if (data.status === "OK") {
          setTimeZones(data.zones);
        } else {
          console.error("Error fetching time zones:", data.message);
        }
      } catch (error) {
        console.error("Error fetching time zones:", error);
      }
    };

    fetchTimeZones();
  }, []);

  console.log(values.timezone, "TIMEZONE");

  return (
    <Grid item xs={12}>
      {/* <FormControl fullWidth> */}
      <InputLabel>Time Zone</InputLabel>
      <Stack>
        <Select
          // labelId="timezone-label"
          size="small"
          id="timezone"
          value={values.timezone}
          name="timezone"
          onChange={handleChange}
          onBlur={handleBlur}
          fullWidth
          error={Boolean(touched.timezone && errors.timezone)}
          sx={{
            mt: "8px",
            width: "100%",
            backgroundColor: "transparent",
            borderRadius: "8px",
            "& fieldset": { borderColor: "#e4e4e7" },
            "&:hover fieldset": { borderColor: "secondary.main" },
            "&.Mui-focused fieldset": {
              borderColor: "#1785C6 !important",
            },
          }}
        >
          {timeZones.length > 0 ? (
            timeZones.map((tz) => (
              <MenuItem key={tz.zoneName} value={tz.zoneName}>
                {tz.zoneName} (GMT{tz.gmtOffset >= 0 ? "+" : ""}
                {tz.gmtOffset / 3600})
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled>Loading time zones...</MenuItem>
          )}
        </Select>
      </Stack>
      {/* </FormControl> */}
      {touched.timezone && errors.timezone && (
        <FormHelperText error>{errors.timezone}</FormHelperText>
      )}
    </Grid>
  );
};

export default TimeZoneSelect;
