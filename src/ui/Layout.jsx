import React from "react";
import {
  Outlet,
  NavLink,
  useNavigate,
  useLocation,
  useParams,
} from "react-router-dom";
import { Dropdown, Avatar } from "flowbite-react";
import {
  Bars3Icon,
  Squares2X2Icon,
  TicketIcon,
  PlusCircleIcon,
  UserCircleIcon,
  XMarkIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
  TagIcon,
  FolderIcon,
} from "@heroicons/react/24/outline";

import { useApp } from "../state/AppContext.jsx";
import ProfilePopover from "../components/ProfilePopover.jsx";
import AppMenu from "../components/AppMenu.jsx";
import { Box } from "@mui/material";
import { logoutUser } from "../utils/index.js";
import favicon from "../assets/favicon.png";

function NavItem({ to, icon: Icon, label, matchChildren = false }) {
  const location = useLocation();
  const pathname = location.pathname;

  // if matchChildren=true → parent stays active on subroutes
  const isActive = matchChildren
    ? pathname === to || pathname.startsWith(to + "/")
    : pathname === to;

  return (
    <NavLink
      to={to}
      className={[
        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white",
        isActive ? "bg-gray-800 text-white" : "",
      ].join(" ")}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </NavLink>
  );
}

export default function Layout() {
  const { user, sidebarOpen, setSidebarOpen } = useApp();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const isViewPage = location.pathname === `/tickets/${id}`;
  const isFormPage =
    location.pathname === `/forms/new-hire-form` ||
    location.pathname === `/forms/appointment-form` ||
    location.pathname.includes("form_entries/edit");
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  // Check if any settings child route is active
  const isSettingsActive =
    location.pathname.startsWith("/settings/categories") ||
    location.pathname.startsWith("/settings/form-types");

  const initials = React.useMemo(() => {
    const n = (user?.name || "Admin User").trim();
    return n
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [user?.name]);

  // Automatically open Settings menu when on a child route
  // React.useEffect(() => {
  //   if (isSettingsActive) setSettingsOpen(true);
  // }, [isSettingsActive]);

  // Close mobile sidebar with ESC
  React.useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setSidebarOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSidebarOpen, sidebarOpen]);

  React.useEffect(() => {
    setSidebarOpen(false);
  }, [navigate]);

  const SidebarContent = (
    <>
      {/* {!sidebarOpen && ( */}
      <div className="mt-0.5 mb-8  items-center gap-2 lg992:flex hidden">
        {/* <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 font-semibold">
            S
          </div> */}

        {/* <img
          src={favicon}
          alt="Support 360"
          className="flex h-8 w-8 rounded-lg"
        /> */}

        <div
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 cursor-pointer "
        >
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-brand-500 font-semibold">
            <TicketIcon style={{ width: 19 }} />
          </div>
          <div className="font-normal text-lg uppercase">Support 360</div>
        </div>
      </div>
      {/* )} */}
      <nav className="flex flex-col gap-2">
        <NavItem
          to="/dashboard"
          icon={Squares2X2Icon}
          label="Dashboard"
          // onClick={() => (window.location.href = "/dashboard")} // 🔁 hard reload
        />

        <NavItem to="/tickets" icon={TicketIcon} label="Tickets" />
        <NavItem to="/projects" icon={FolderIcon} label="Projects" matchChildren />
        {/* <NavItem to="/careers" icon={PlusCircleIcon} label="New Hire Form" /> */}
        {user?.is_form_access && (
          <>
            <NavItem
              to="/forms"
              icon={ClipboardDocumentListIcon}
              label="All Forms"
              matchChildren
            />
          </>
        )}

        <NavItem to="/contacts" icon={UserCircleIcon} label="Contacts" />

        {/* <NavItem
          to="/tickets/new"
          icon={PlusCircleIcon}
          label="New Ticket"
          exact
        /> */}
        {/* <NavItem to="/profile" icon={UserCircleIcon} label="Profile" exact /> */}
      </nav>

      <div className={`mt-auto pt-6 ${sidebarOpen ? "pb-2" : "!pb-0"}  `}>
        {/* 🔽 Settings Dropdown Above Main Settings */}
        {/* <div className="relative mb-2">
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
              settingsOpen || isSettingsActive
                ? "bg-gray-800 text-white"
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <Cog6ToothIcon className="h-5 w-5" />
              <span>Settings</span>
            </div>
            <svg
              className={`h-4 w-4 transition-transform duration-300 ${
                settingsOpen ? "rotate-180" : "rotate-0"
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <div
            className={`mt-1 flex flex-col gap-1 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] rounded-lg ${
              settingsOpen
                ? // ? "max-h-40 opacity-100 bg-gradient-to-b from-gray-900/90 to-gray-800/90 backdrop-blur-sm border border-gray-700/40 shadow-inner"
                  "max-h-40 opacity-100 bg-gradient-to-b bg-gray-900 backdrop-blur-sm border border-gray-700/40 shadow-inner"
                : "max-h-0 opacity-0"
            }`}
          >
            <NavLink
              to="/settings/categories"
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 mx-2 mt-1",
                  isActive
                    ? "bg-gray-800 text-white shadow-sm"
                    : "text-gray-300 hover:bg-gray-800/60 hover:text-white",
                ].join(" ")
              }
            >
              <TagIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-200 transition-colors duration-200" />
              <span>Categories</span>
            </NavLink>

            <NavLink
              to="/settings/form-types"
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 mx-2 mb-2",
                  isActive
                    ? "bg-gray-800 text-white shadow-sm"
                    : "text-gray-300 hover:bg-gray-800/60 hover:text-white",
                ].join(" ")
              }
            >
              <ClipboardDocumentListIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-200 transition-colors duration-200" />
              <span>Form Types</span>
            </NavLink>
          </div>
        </div> */}

        {/* Main Settings link (kept for reference or remove if redundant) */}
        <NavItem to="/settings" icon={Cog6ToothIcon} label="Settings" />
      </div>

      {/* <div className="mt-auto pt-6">
        <button
          onClick={() => logoutUser(navigate)}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <XMarkIcon className="h-5 w-5" />
          Sign Out
        </button>
      </div> */}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col bg-sidebar">
      {/* ===== Desktop Sidebar ===== */}
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col overflow-y-auto bg-sidebar px-5 py-3 text-white lg992:flex"
        aria-label="Sidebar"
      >
        {SidebarContent}
      </aside>

      {/* ===== Mobile Sidebar ===== */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg992:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-sidebar p-5 text-white shadow-xl transition-transform duration-200 lg992:hidden rounded-r-2xl ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {SidebarContent}
      </div>

      <div
        id="mobile-sidebar"
        role="dialog"
        aria-modal="true"
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-sidebar p-5 text-white shadow-xl transition-transform duration-200 lg992:hidden rounded-r-2xl ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 ">
            {/* <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 font-semibold">
              S
            </div> */}
            <img
              src={favicon}
              alt="Support 360"
              className="flex h-8 w-8 rounded-lg"
            />
            <div className="font-medium text-lg uppercase">Support 360</div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
            className="rounded-lg p-2 text-gray-300 hover:bg-gray-800"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto h-[calc(100dvh-92px)]">
          {SidebarContent}
        </div>
      </div>

      {/* ===== Main Layout ===== */}
      <div className="flex flex-col flex-1 lg992:pl-64">
        {/* Header */}
        <header className="z-20 flex h-14 flex-shrink-0 items-center justify-between bg-sidebar px-3 text-white lg992:pr-3">
          <div className="flex items-center gap-3">
            <button
              className="rounded-xl p-2 text-gray-300 hover:bg-gray-800 lg992:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <Box mr="auto">
              <AppMenu />
            </Box>
          </div>
          <ProfilePopover isMobile={false} />
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-[#fefeff]  lg992:rounded-tl-2xl shadow-sm relative">
          <div
            className={`${
              isViewPage
                ? "p-4 pr-2.5 scroll-width h-[calc(100dvh-58px)] border border-gray-100"
                : isFormPage
                ? "p-0 scroll-width h-[calc(100dvh-58px)]"
                : "p-4 scroll-width h-[calc(100dvh-58px)] border border-gray-100"
            }`}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
