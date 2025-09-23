import {
  Box,
  Paper,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

function TicketFilters({
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  categories,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onClear,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        mb: 2,
      }}
    >
      <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
        {/* Search */}
        <TextField
          placeholder="Search tickets..."
          size="small"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ flex: 1, minWidth: 200 }}
        />

        {/* Status */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="In Progress">In Progress</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
          </Select>
        </FormControl>

        {/* Category */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={categoryFilter}
            label="Category"
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            {Object.entries(categories).map(([id, name]) => (
              <MenuItem key={id} value={id}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Dates */}
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={(date) => setStartDate(date)}
            maxDate={endDate}
            slotProps={{
              textField: { size: "small", fullWidth: true },
            }}
          />
        </LocalizationProvider>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={(date) => setEndDate(date)}
            minDate={startDate}
            slotProps={{
              textField: { size: "small", fullWidth: true },
            }}
          />
        </LocalizationProvider>

        {/* Clear */}
        <Button
          variant="outlined"
          size="small"
          onClick={onClear}
          sx={{ borderRadius: 2 }}
        >
          Clear
        </Button>
      </Stack>
    </Paper>
  );
}

export default TicketFilters;
