import React, { useState, useEffect } from "react";
import {
  Modal,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  TextField,
  CircularProgress,
  Button,
} from "@mui/material";
import toast from "react-hot-toast";
import { createAPIEndPoint } from "../config/api/api";
import { createAPIEndPointAuth } from "../config/api/apiAuth";
import { toProperCase } from "../utils/formatting";
import { useApp } from "../state/AppContext";

export default function AssignModal({ open, onClose, ticketId, fetchTicket }) {
  const { user } = useApp();
  const [assignee, setAssignee] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (searchTerm) {
      searchTeamMembers(searchTerm);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const searchTeamMembers = async (query) => {
    setSearchLoading(true);
    try {
      const res = await createAPIEndPointAuth(
        `clinic_team/search?query=${query}`
      ).fetchAll();
      setSearchResults(res?.data?.results || []);
    } catch (err) {
      console.error("Failed to search team members", err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!assignee) return toast.error("Please select a team member");
    try {
      setLoading(true);
      const payload = {
        ticket_id: Number(ticketId),
        assign_to: assignee,
        assign_by: user?.id,
      };
      await createAPIEndPoint("assign").createWithJSONFormat(payload);
      toast.success("Ticket assigned successfully");
      fetchTicket?.();
      onClose();
    } catch (err) {
      toast.error("Failed to assign ticket");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          bgcolor: "background.paper",
          boxShadow: 24,
          p: 3,
          borderRadius: 2,
          width: 400,
          maxWidth: "90%",
        }}
      >
        <Typography variant="h6" mb={2} fontWeight={600}>
          Assign Ticket
        </Typography>

        <Autocomplete
          fullWidth
          size="small"
          options={searchResults}
          loading={searchLoading}
          filterOptions={(x) => x} // disable client-side filtering
          getOptionLabel={(option) =>
            option
              ? `${toProperCase(option.first_name)} ${toProperCase(
                  option.last_name
                )}`
              : ""
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Assign To"
              placeholder="Search team member..."
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {searchLoading ? <CircularProgress size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          noOptionsText={
            searchLoading
              ? "Searching..."
              : searchTerm.trim()
              ? "No team members found"
              : "Type to search"
          }
          value={searchResults.find((m) => m.user_id === assignee) || null}
          onChange={(e, newValue) => setAssignee(newValue?.user_id || "")}
        />

        <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={20} sx={{ color: "white" }} />
            ) : (
              "Assign"
            )}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
