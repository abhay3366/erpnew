"use client";

import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import NotificationDropdown from "@/components/header/NotificationDropdown";
import UserDropdown from "@/components/header/UserDropdown";
import { useSidebar } from "@/context/SidebarContext";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";

const AppHeader = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const inputRef = useRef(null);

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        if (inputRef.current) inputRef.current.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-99 flex w-full bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 lg:border-b">
      <div className="flex flex-col lg:flex-row w-full items-center justify-between lg:px-6">

        {/* Left Section */}
        <div className="flex w-full items-center justify-between px-3 py-3 lg:px-0 lg:py-4 border-b lg:border-b-0 border-gray-200 dark:border-gray-800">

          {/* Sidebar Toggle */}
          <button
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
            className="lg:flex hidden items-center justify-center w-11 h-11 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400"
          >
            {isMobileOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M6.22 7.28a.75.75 0 0 1 1.06-1.06L12 10.94l4.72-4.72a.75.75 0 1 1 1.06 1.06L13.06 12l4.72 4.72a.75.75 0 1 1-1.06 1.06L12 13.06l-4.72 4.72a.75.75 0 0 1-1.06-1.06L10.94 12 6.22 7.28Z"
                />
              </svg>
            ) : (
              <svg width="16" height="12" viewBox="0 0 16 12">
                <path
                  fill="currentColor"
                  d="M.58 1c0-.41.34-.75.75-.75h13.33c.41 0 .75.34.75.75s-.34.75-.75.75H1.33c-.41 0-.75-.34-.75-.75ZM.58 11c0-.41.34-.75.75-.75h13.33c.41 0 .75.34.75.75s-.34.75-.75.75H1.33c-.41 0-.75-.34-.75-.75ZM1.33 5.25c-.41 0-.75.34-.75.75s.34.75.75.75H8a.75.75 0 0 0 0-1.5H1.33Z"
                />
              </svg>
            )}
          </button>

          {/* Logo (Mobile Only) */}
          <Link href="/" className="lg:hidden">
            <Image
              width={154}
              height={32}
              src="./images/logo/logo.svg"
              alt="Logo"
              className="dark:hidden"
            />
            <Image
              width={154}
              height={32}
              src="./images/logo/logo-dark.svg"
              alt="Logo Dark"
              className="hidden dark:block"
            />
          </Link>

          {/* Application Menu (Mobile Only) */}
          <button
            onClick={toggleApplicationMenu}
            className="flex lg:hidden items-center justify-center w-10 h-10 rounded-lg text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M6 10.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm12 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm-6 1.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"
              />
            </svg>
          </button> 

        </div>

        {/* Right Section */}
        <div
          className={`${isApplicationMenuOpen ? "flex" : "hidden"} lg:flex w-full lg:w-auto items-center justify-between lg:justify-end px-5 py-4 lg:px-0 gap-4 shadow-theme-md lg:shadow-none`}
        >
          <div className="flex items-center gap-3">
            <ThemeToggleButton />
            {/* <NotificationDropdown /> */}
          </div>
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
