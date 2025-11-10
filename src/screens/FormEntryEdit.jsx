import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { createAPIEndPoint } from "../config/api/api";
import { CircularProgress, Box } from "@mui/material";
import NewHireForm from "./NewHireForm";
import AppointmentForm from "./AppointmentForm";

/**
 * Wrapper component that determines which form to render
 * based on the form_type_id of the entry being edited
 */
const FormEntryEdit = () => {
  const { id } = useParams();
  const [formTypeId, setFormTypeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFormType = async () => {
      try {
        setLoading(true);
        const res = await createAPIEndPoint(
          `form_entries/details/${id}`
        ).fetchAll();
        
        const entry = res.data;
        if (entry && entry.form_type_id) {
          setFormTypeId(entry.form_type_id);
        } else {
          setError("Form type not found");
        }
      } catch (err) {
        console.error("Failed to fetch form entry:", err);
        setError("Failed to load form data");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchFormType();
    }
  }, [id]);

  if (loading) {
    return (
      <Box className="absolute inset-0 flex items-center justify-center bg-purple-50">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="absolute inset-0 flex items-center justify-center bg-purple-50">
        <div className="text-center">
          <p className="text-red-600 font-semibold text-lg">{error}</p>
          <p className="text-gray-600 mt-2">Please try again later.</p>
        </div>
      </Box>
    );
  }

  // Route to the appropriate form based on form_type_id
  switch (formTypeId) {
    case 1:
      return <NewHireForm isEditMode={true} />;
    case 2:
      return <AppointmentForm />;
    default:
      return (
        <Box className="absolute inset-0 flex items-center justify-center bg-purple-50">
          <div className="text-center">
            <p className="text-gray-600 font-semibold text-lg">
              Unknown form type: {formTypeId}
            </p>
            <p className="text-gray-500 mt-2">
              This form type is not supported yet.
            </p>
          </div>
        </Box>
      );
  }
};

export default FormEntryEdit;

