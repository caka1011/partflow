"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Database,
  FileSpreadsheet,
  ShoppingCart,
  TrendingUp,
  BarChart3,
  Shuffle,
  ShieldCheck,
  Search,
  Bell,
  Settings,
  LogOut,
  User,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Parts Database", href: "/", icon: Database },
  { label: "BOMs", href: "#", icon: FileSpreadsheet },
  { label: "Sourcing", href: "/sourcing", icon: ShoppingCart },
  {
    label: "Market Intelligence",
    href: "/market-intelligence",
    icon: TrendingUp,
  },
  { label: "Demand Planning", href: "/demand-planning", icon: BarChart3 },
  { label: "Alternatives", href: "/alternatives", icon: Shuffle },
  { label: "Risk Manager", href: "/risk-manager", icon: ShieldCheck },
];

export function Header() {
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState("");

  return (
    <header className="flex shrink-0 items-center border-b bg-white">
      {/* Navigation tabs */}
      <nav className="flex flex-1 items-center gap-0.5 overflow-x-auto px-4">
        {navLinks.map((link) => {
          const isActive =
            link.href === "/"
              ? pathname === "/"
              : link.href !== "#" && pathname.startsWith(link.href);

          return (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-muted-foreground hover:border-slate-300 hover:text-foreground"
              )}
            >
              <link.icon className="size-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Right section: search + notifications + avatar */}
      <div className="flex items-center gap-3 px-4 py-2">
        {/* Global Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search parts, BOMs..."
            className="h-8 w-56 pl-8 text-sm"
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon-sm" className="relative">
          <Bell className="size-4 text-muted-foreground" />
          <Badge className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center p-0 text-[9px]">
            3
          </Badge>
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full p-0"
            >
              <Avatar size="sm">
                <AvatarImage src="" alt="User" />
                <AvatarFallback className="bg-blue-600 text-[10px] text-white">
                  JD
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Jane Doe</span>
                <span className="text-xs text-muted-foreground">
                  jane@partflow.io
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 size-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 size-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="mr-2 size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
