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
import { toProperCase } from "../utils/formatting";
import { createAPIEndPointAuth } from "../config/api/apiAuth";

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

export default function CategoryModal({ open, onClose, onSaved, category }) {
  const [name, setName] = useState("");
  const [assignee, setAssignee] = useState(null); // ✅ store whole object
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 400);

  // Pre-fill for edit
  useEffect(() => {
    if (category) {
      setName(category.name || "");
      // ✅ Pre-fill with object for Autocomplete
      if (category.assignee_id) {
        setAssignee({
          user_id: category.assignee_id,
          first_name: category.assignee_name?.split(" ")[0] || "",
          last_name:
            category.assignee_name?.split(" ").slice(1).join(" ") || "",
        });
      } else {
        setAssignee(null);
      }
    } else {
      setName("");
      setAssignee(null);
    }
  }, [category]);

  // 🔹 Search team members
  useEffect(() => {
    const searchTeamMembers = async (query) => {
      if (!query) return setSearchResults([]);
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

    if (debouncedSearch) {
      searchTeamMembers(debouncedSearch);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch]);

  // 🔹 Save category
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const payload = {
        name,
        assignee_id: assignee?.user_id || null, // ✅ send user_id
      };

      if (category) {
        await createAPIEndPoint(`category/${category.id}`).patch(payload);
      } else {
        await createAPIEndPoint("category").createWithJSONFormat(payload);
      }

      onSaved();
    } catch (err) {
      console.error("Error saving category:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle className="font-semibold text-brand-500 !text-lg flex justify-between items-center">
        {category ? "Edit Category" : "Add Category"}

        {/* 🔹 Close button */}
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
            label="Category Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            size="small"
          />

          {/* 🔹 Assignee Autocomplete */}
          <Autocomplete
            fullWidth
            size="small"
            options={searchResults}
            loading={searchLoading}
            filterOptions={(x) => x}
            getOptionLabel={(option) =>
              option
                ? `${toProperCase(option.first_name)} ${toProperCase(
                    option.last_name
                  )}`.trim()
                : ""
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Default Assigned To"
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
                : "Search to find team member"
            }
            value={assignee} // ✅ use selected object
            onChange={(e, newValue) => setAssignee(newValue)}
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
