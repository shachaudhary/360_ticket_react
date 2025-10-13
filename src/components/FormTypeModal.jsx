import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  Autocomplete,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { createAPIEndPoint } from "../config/api/api";
import { createAPIEndPointAuth } from "../config/api/apiAuth";
import { toProperCase } from "../utils/formatting";
import { useApp } from "../state/AppContext";

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

export default function FormTypeModal({ open, onClose, onSaved, formType }) {
  const { user } = useApp();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 400);

  useEffect(() => {
    if (formType) {
      setName(formType.name || "");
      setDescription(formType.description || "");

      // ✅ Use assign_users instead of users
      setSelectedUsers(
        formType.assign_users?.map((u) => ({
          user_id: u.id,
          first_name: u.username?.split(" ")[0] || "",
          last_name: u.username?.split(" ")[1] || "",
          email: u.email || "",
        })) || []
      );
    } else {
      setName("");
      setDescription("");
      setSelectedUsers([]);
    }
  }, [formType]);

  useEffect(() => {
    const searchUsers = async (query) => {
      if (!query) return setSearchResults([]);
      setSearchLoading(true);
      try {
        const res = await createAPIEndPointAuth(
          `clinic_team/search?query=${query}`
        ).fetchAll();
        setSearchResults(res?.data?.results || []);
      } catch (err) {
        console.error("Search users failed:", err);
      } finally {
        setSearchLoading(false);
      }
    };

    if (debouncedSearch) {
      searchUsers(debouncedSearch);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch]);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const payload = {
        name,
        description,
        clinic_id: 1,
        location_id: 30,
        user_ids: selectedUsers.map((u) => u.user_id),
        user_id: user?.id || null,
        // user_id: selectedUsers[0]?.user_id || null, // primary owner
      };

      if (formType?.id) {
        await createAPIEndPointAuth(`form_types/${formType.id}`).patch(payload);
      } else {
        await createAPIEndPointAuth("form_types").create(payload);
      }
      onSaved();
    } catch (err) {
      console.error("Error saving form type:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle className="font-semibold text-brand-500 !text-lg flex justify-between items-center">
        {formType ? "Edit Form" : "Add Form"}
        <IconButton
          aria-label="close"
          onClick={onClose}
          size="small"
          sx={{
            color: "#e74c3c",
            "&:hover": { backgroundColor: "#F3F4F6" },
          }}
        >
          <CloseIcon fontSize="medium" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <div className="space-y-4 py-2">
          <TextField
            label="Form Type Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            size="small"
          />

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
            size="small"
          />

          <Autocomplete
            multiple
            fullWidth
            size="small"
            options={searchResults}
            loading={searchLoading}
            value={selectedUsers}
            onChange={(e, newValue) => setSelectedUsers(newValue)}
            filterOptions={(x) => x}
            getOptionLabel={(option) =>
              option
                ? option.first_name
                  ? `${toProperCase(option.first_name)} ${toProperCase(
                      option.last_name || ""
                    )}`.trim()
                  : toProperCase(option.username || "")
                : ""
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Members to Notify"
                placeholder="Search members..."
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
            renderOption={(props, option) => (
              <li {...props} key={option.user_id}>
                <div className="flex flex-col">
                  <span className="font-medium text-gray-600">
                    {toProperCase(option.first_name)}{" "}
                    {toProperCase(option.last_name)}
                  </span>
                  <span className="text-xs text-gray-500">{option.email}</span>
                </div>
              </li>
            )}
          />
        </div>
      </DialogContent>

      <DialogActions className="!py-[16px] !px-[24px]">
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={submitting}
          sx={{
            textTransform: "none",
            borderColor: "#E5E7EB",
            color: "#6B7270",
            "&:hover": { borderColor: "#E5E7EB", backgroundColor: "#Fafafa" },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          sx={{ boxShadow: "none", textTransform: "none", color: "white" }}
          disabled={submitting || !name}
        >
          {submitting ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
