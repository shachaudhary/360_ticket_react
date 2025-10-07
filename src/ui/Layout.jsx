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
  console.log("🚀 ~ Layout ~ isViewPage:", `/tickets/${id}`, isViewPage);

  const initials = React.useMemo(() => {
    const n = (user?.name || "Admin User").trim();
    return n
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [user?.name]);

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
      <div className="mb-8  items-center gap-2 lg992:flex hidden">
        {/* <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 font-semibold">
            S
          </div> */}
        <img
          src={favicon}
          alt="Support 360"
          className="flex h-8 w-8 rounded-lg"
        />
        <div className="font-semibold">Support 360</div>
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
        {/* <NavItem
          to="/tickets/new"
          icon={PlusCircleIcon}
          label="New Ticket"
          exact
        /> */}
        {/* <NavItem to="/profile" icon={UserCircleIcon} label="Profile" exact /> */}
      </nav>

      <div className={`mt-auto pt-6 ${sidebarOpen ? "pb-2" : "!pb-0"}  `}>
        {/* <button
          onClick={() => navigate("/settings")}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <Cog6ToothIcon className="h-5 w-5" />
          Settings
        </button> */}
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
            <div className="font-semibold">Support 360</div>
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
        <main className="flex-1 overflow-y-auto bg-white border border-gray-100 lg992:rounded-tl-2xl shadow-sm relative">
          <div
            className={`${
              isViewPage
                ? "p-4 pr-2.5"
                : "p-4 scroll-width h-[calc(100dvh-58px)]"
            }`}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
