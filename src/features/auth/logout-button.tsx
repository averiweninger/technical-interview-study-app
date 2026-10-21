"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { logout } from "./actions";
import type { AuthFormState } from "./validation";

export function LogoutButton() {
  const [state, action, pending] = useActionState(logout, { status: "idle" } as AuthFormState);
  return <form action={action}>
    <Button variant="outline" size="sm" type="submit" disabled={pending}>{pending ? "Signing out…" : "Sign out"}</Button>
    {state.status === "error" && <p role="alert" className="mt-2 max-w-48 text-xs">{state.message}</p>}
  </form>;
}
