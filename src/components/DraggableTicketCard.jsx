import React, { useState, useRef } from "react";
import { Card, Typography, Chip, CircularProgress, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import DateWithTooltip from "./DateWithTooltip";

export default function DraggableTicketCard({ ticket, onStatusChange, onDragStart, isDragging: externalIsDragging, isUpdating }) {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const dragStartTime = useRef(0);

  const handleDragStart = (e) => {
    dragStartTime.current = Date.now();
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", JSON.stringify({
      ticketId: ticket.id,
      currentStatus: ticket.status,
    }));
    // Call parent's onDragStart for optimistic update
    if (onDragStart) {
      onDragStart(ticket.id, ticket.status);
    }
    // Add visual feedback
    e.dataTransfer.setDragImage(e.currentTarget, 0, 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    // Reset after a short delay to prevent accidental clicks
    setTimeout(() => {
      dragStartTime.current = 0;
    }, 100);
  };

  const isCurrentlyDragging = isDragging || externalIsDragging;

  const handleClick = (e) => {
    // Don't navigate if we just finished dragging (within 200ms)
    const timeSinceDrag = Date.now() - dragStartTime.current;
    if (timeSinceDrag > 200 || dragStartTime.current === 0) {
      navigate(`/tickets/${ticket.id}`);
    }
  };

  return (
    <Card
      draggable={!isUpdating}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      className={`!p-4 !transition-all !relative !bg-white !border !border-gray-200 !rounded-lg !shadow-none ${
        isCurrentlyDragging
          ? "!opacity-50 !scale-95 !shadow-lg !border-brand-500 !cursor-grabbing"
          : isUpdating
          ? "!opacity-75 !cursor-wait"
          : "hover:!shadow-lg hover:!border-gray-300 !cursor-grab"
      }`}
    >
      {isUpdating && (
        <Box
          className="!absolute !inset-0 !flex !items-center !justify-center !bg-white !bg-opacity-80 !rounded-lg !z-10"
          sx={{
            backdropFilter: "blur(2px)",
          }}
        >
          <CircularProgress size={24} sx={{ color: "#824EF2" }} />
        </Box>
      )}
      <div className="!flex !items-start !justify-between !mb-2">
        <Typography variant="subtitle2" className="!font-semibold !text-gray-800 !flex-1 !text-sm">
          #{ticket.id} - {ticket.title}
        </Typography>
        <StatusBadge status={ticket.priority} isInside />
      </div>
      {ticket.details && (
        <Typography
          variant="caption"
          className="!text-gray-600 !line-clamp-2 !mb-3 !block !text-xs"
        >
          {ticket.details}
        </Typography>
      )}
      <div className="!flex !items-center !justify-between !pt-2 !border-t !border-gray-100">
        {ticket.category && (
          <Chip
            label={ticket.category.name}
            size="small"
            className="!text-xs !bg-gray-100"
          />
        )}
        {ticket.due_date && (
          <DateWithTooltip date={ticket.due_date} />
        )}
      </div>
    </Card>
  );
}

