"use client";

import { Clock, LogOut, Plug } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  onOpenConnections: () => void;
  onOpenHistory: () => void;
  connectedCount: number;
}

export function TopBar({
  onOpenConnections,
  onOpenHistory,
  connectedCount,
}: TopBarProps) {
  const { user, signOut } = useAuth();
  const name = user?.displayName || user?.email || "Account";
  const initial = (user?.displayName || user?.email || "?").charAt(0).toUpperCase();

  return (
    <header className="border-border/60 bg-background/80 sticky top-0 z-30 border-b backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-3">
        <span className="font-semibold tracking-tight">
          One Idea, <span className="text-primary">Every Format</span>
        </span>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onOpenHistory} className="gap-1.5">
            <Clock className="size-4" />
            <span className="hidden sm:inline">History</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenConnections}
            className="gap-1.5"
          >
            <Plug className="size-4" />
            Connections
            {connectedCount > 0 && (
              <span className="bg-primary/20 text-primary ml-0.5 rounded-full px-1.5 text-xs font-semibold">
                {connectedCount}
              </span>
            )}
          </Button>

          <div className="flex items-center gap-2 pl-1">
            <Avatar className="size-8">
              {user?.photoURL && <AvatarImage src={user.photoURL} alt={name} />}
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => void signOut()}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
