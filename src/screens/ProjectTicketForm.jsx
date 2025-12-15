import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Card, Typography, CircularProgress, Chip } from "@mui/material";
import { createAPIEndPoint } from "../config/api/api";
import ProjectTicketCreate from "./ProjectTicketCreate";
import { toProperCase } from "../utils/formatting";
import StatusBadge from "../components/StatusBadge";
import toast from "react-hot-toast";
import BackButton from "../components/BackButton";

export default function ProjectTicketForm() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);

    // Dummy data for fallback UI
    const dummyProject = {
        id: projectId || 1,
        name: "Website Redesign Project",
        description: "Complete redesign of company website with modern UI/UX. This project includes frontend development, backend integration, and user testing phases.",
        status: "active",
        priority: "high",
        color: "#FF3838",
        tags: ["Design", "Frontend", "UI/UX"],
        due_date: "2024-12-31",
        created_at: "2024-01-15T10:00:00Z",
        assignees: [
            {
                id: 1,
                user_id: 1,
                username: "Jane Smith",
                name: "Jane Smith",
            },
        ],
    };

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const res = await createAPIEndPoint(`project/${projectId}`).fetchAll();
                setProject(res.data);
            } catch (err) {
                console.error("Failed to fetch project", err);
                // Use dummy data on error for UI preview
                setProject(dummyProject);
                toast.error("Failed to load project details. Showing preview.");
            } finally {
                setLoading(false);
            }
        };

        if (projectId) {
            fetchProject();
        } else {
            // Use dummy data if no projectId
            setProject(dummyProject);
            setLoading(false);
        }
    }, [projectId, navigate]);

    if (loading) {
        return (
            <Box className="absolute inset-0 flex items-center justify-center bg-purple-50">
                <CircularProgress color="primary" />
            </Box>
        );
    }

    // Use dummy data if project is null (for UI preview)
    const displayProject = project || dummyProject;

    const projectColor = displayProject.color || "#5F27CD";

    return (
        <Box className="space-y-6">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <BackButton self={`/projects/${projectId}`} />
                    <div>
                        <h2 className="text-lg md:text-2xl font-semibold text-sidebar">
                            Create New Ticket
                        </h2>
                        <Typography variant="body2" className="text-gray-500 mt-0.5">
                            Add a ticket to track work and issues for this project
                        </Typography>
                    </div>
                </div>
            </div>

            {/* Project Info Card - Enhanced */}
            <Card
                className="!p-5 !border-l-4 !shadow-md !bg-gradient-to-r !from-white !to-gray-50 !rounded-lg hover:!shadow-lg !transition-all"
                style={{ borderLeftColor: projectColor }}
            >
                <div className="flex items-start gap-4">
                    <Box
                        className="!w-4 !h-4 !rounded-full !shrink-0 !mt-1 !shadow-sm"
                        style={{ backgroundColor: projectColor }}
                    />
                    <div className="flex-1">
                        <Typography variant="caption" className="!text-gray-500 !block !mb-2 !text-xs !font-semibold !uppercase !tracking-wide">
                            Creating ticket for project
                        </Typography>
                        <div className="flex items-center gap-3 flex-wrap mb-3">
                            <Typography variant="h5" className="!font-semibold !text-gray-900 !text-xl">
                                {toProperCase(displayProject.name)}
                            </Typography>
                            <StatusBadge status={displayProject.status || "active"} isInside />
                            {displayProject.priority && (
                                <StatusBadge status={displayProject.priority} isInside />
                            )}
                        </div>
                        {displayProject.description && (
                            <Typography variant="body2" className="!text-gray-600 !text-sm !leading-relaxed !mb-3">
                                {displayProject.description}
                            </Typography>
                        )}
                        {displayProject.tags && displayProject.tags.length > 0 && (
                            <div className="!flex !gap-2 !flex-wrap">
                                {displayProject.tags.map((tag, idx) => (
                                    <Chip
                                        key={idx}
                                        label={tag}
                                        size="small"
                                        className="!bg-white !text-gray-700 !border !border-gray-300 !text-xs !shadow-sm"
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* Ticket Form */}
            <ProjectTicketCreate projectId={projectId} />
        </Box>
    );
}

