"use client";

import { getAllUsers } from "@/app/utils/firebase";
import { UsersTable } from "@/components/admin/UserTable";
import { LoadingOverlay, Stack, Title } from "@mantine/core";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { User } from "../types/user";

export default function Home() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!session || session.user.role !== "admin") return;
    async function getUserTable() {
      const users = await getAllUsers();
      return setUsers(users);
    }
    getUserTable();
  }, [session]);

  return (
    <Stack align="center">
      {session?.user.role == "admin" ? (
        <Stack>
          <Title>Velkommen, {session.user?.name}</Title>
          {users.length > 0 ? (
            <UsersTable users={users} />
          ) : (
            <Stack>
              <LoadingOverlay visible />
            </Stack>
          )}
        </Stack>
      ) : (
        <>
          <Title>You are not an admin!</Title>
        </>
      )}
    </Stack>
  );
}
