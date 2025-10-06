import { useEffect, useState } from "react";
import {
  Grid,
  TextField,
  FormHelperText,
  Autocomplete,
  CircularProgress,
} from "@mui/material";

const TimeZoneSelect = ({
  values,
  handleChange,
  handleBlur,
  touched,
  errors,
}) => {
  const [timeZones, setTimeZones] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTimeZones = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `http://api.timezonedb.com/v2.1/list-time-zone?key=IDU0ZFRYGTHL&format=json`
        );
        const data = await response.json();
        if (data.status === "OK") {
          const formatted = data.zones.map((tz) => ({
            label: `${tz.zoneName} (GMT${tz.gmtOffset >= 0 ? "+" : ""}${
              tz.gmtOffset / 3600
            })`,
            value: tz.zoneName,
          }));
          setTimeZones(formatted);
        } else {
          console.error("Error fetching time zones:", data.message);
        }
      } catch (error) {
        console.error("Error fetching time zones:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeZones();
  }, []);

  return (
    <Grid item xs={12}>
      <Autocomplete
        fullWidth
        size="small"
        loading={loading}
        options={timeZones}
        getOptionLabel={(option) => option.label || ""}
        value={timeZones.find((tz) => tz.value === values.timezone) || null}
        onChange={(event, newValue) => {
          handleChange({
            target: { name: "timezone", value: newValue ? newValue.value : "" },
          });
        }}
        onBlur={handleBlur}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Time Zone"
            variant="outlined"
            error={Boolean(touched.timezone && errors.timezone)}
            helperText={touched.timezone && errors.timezone}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress size={18} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: "8px",
            "& fieldset": { borderColor: "#e4e4e7" },
            "&:hover fieldset": { borderColor: "#1785C6" },
            "&.Mui-focused fieldset": { borderColor: "#1785C6 !important" },
          },
        }}
      />
      {touched.timezone && errors.timezone && (
        <FormHelperText error>{errors.timezone}</FormHelperText>
      )}
    </Grid>
  );
};

export default TimeZoneSelect;
