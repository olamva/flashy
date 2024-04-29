import classes from "@/components/user/UserButton.module.css";
import { Avatar, Container, Group, Text, UnstyledButton, rem } from "@mantine/core";
import { IconChevronRight } from "@tabler/icons-react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";

export function UserButton() {
  const { data: session } = useSession();
  return (
    <>
      {session ? (
        <>
          <UnstyledButton className={classes.user} component={Link} href="/profile">
            <Group justify="center" gap="xs">
              <Avatar src={session.user?.image} radius="xl" />
              <Container maw={180} px="xs">
                <Text size="sm" fw={500} style={{textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden" }} >
                  {session.user?.name}
                </Text>
                <Text size="xs" fw={500} style={{textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden" }} >
                  {session.user?.email}
                </Text>
              </Container>
              <IconChevronRight style={{ width: rem(14), height: rem(14) }} stroke={1.5} />
            </Group>
          </UnstyledButton>
        </>
      ) : (
        <>
          <UnstyledButton className={classes.user} onClick={() => signIn()}>
            <Group justify="space-between">
              <Avatar
                src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-8.png"
                radius="xl"
              />

              <Container style={{ flex: 1 }}>
                <Text size="sm" fw={500}>
                  Sign in to continue
                </Text>
              </Container>

              <IconChevronRight style={{ width: rem(14), height: rem(14) }} stroke={1.5} />
            </Group>
          </UnstyledButton>
        </>
      )}
    </>
  );
}
