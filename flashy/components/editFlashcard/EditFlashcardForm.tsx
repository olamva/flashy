import { EditFlashCardType, EditFlashcardView, FlashcardSet, Visibility } from "@/app/types/flashcard";
import { ConvertToBase64, editFlashcard, getAllUsers } from "@/app/utils/firebase";
import { ActionIcon, Button, ComboboxData, Divider, FileButton, Flex, Grid, Group, MultiSelect, Select, Space, Stack, Text, Textarea, rem } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconSearch, IconX } from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type EditFlashCardFormType = {
  flashcardSet: FlashcardSet;
};

export const EditFlashCardForm = ({ flashcardSet }: EditFlashCardFormType) => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [prevFlashcardSet, setPrevFlashcardSet] = useState<FlashcardSet>(flashcardSet);
  const [userOptions, setUserOptions] = useState<ComboboxData | undefined>(undefined);

  useEffect(() => {
    const usersToComboBoxData = async () => {
      try {
        let users = await getAllUsers();
        // filter out the user that created the initial flashcard set
        users = users.filter((user) => user.id !== prevFlashcardSet.creator?.id);
        return users.map((user) => ({
          value: user.id,
          label: user.name,
        }));
      } catch (error) {
        console.error("Error fetching users:", error);
        return [];
      }
    };

    const fetchUserOptions = async () => {
      try {
        const users = await usersToComboBoxData();
        setUserOptions(users);
      } catch (error) {
        console.error("Error fetching user options:", error);
        setUserOptions([]);
      }
    };

    fetchUserOptions();
  }, [prevFlashcardSet.creator?.id]);
  const router = useRouter();

  const form = useForm<EditFlashCardType>({
    initialValues: {
      views: flashcardSet.views ?? [],
      visibility: flashcardSet.visibility ?? Visibility.Private,
      coAuthors: flashcardSet.coAuthors?.map((coAuthor) => coAuthor.id) ?? [],
      coverImage: undefined,
    },
  });

  const onSubmit = (values: typeof form.values) => {
    if (!session) {
      return;
    }
    setLoading(true);

    const editedFlashcard: EditFlashCardType = {
      views: values.views,
      visibility: values.visibility,
      coAuthors: values.coAuthors,
      coverImage: values.coverImage,
    };
    editFlashcard(session.user, prevFlashcardSet, editedFlashcard)
      .then((newViews) => {
        notifications.show({
          title: "Settet er oppdatert",
          message: "",
          color: "green",
          onClick: () => {
            router.push("/carousel/" + flashcardSet.title);
            notifications.clean();
          },
        });
        setPrevFlashcardSet({ ...prevFlashcardSet, views: newViews, visibility: editedFlashcard.visibility, coverImage: editedFlashcard.coverImage });
        form.setInitialValues(editedFlashcard);
        form.reset();
      })
      .catch((error) => {
        notifications.show({
          title: "Noe gikk galt",
          message: error.message,
          color: "red",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleOnChangeAddImage = async (file: File | null, index: number, view: EditFlashcardView) => {
    if (file) {
      const imageBase64 = (await ConvertToBase64(file)) as string;
      form.setFieldValue(`views.${index}.image`, imageBase64);
      view.image = imageBase64;
    } else {
      form.setFieldValue(`views.${index}.image`, undefined);
      view.image = undefined;
    }
  };

  return (
    <form onSubmit={form.onSubmit((values) => onSubmit(values))}>
      <Stack>
        <Select label="Sett synlighet" placeholder="Rediger synlighet" data={Object.values(Visibility)} {...form.getInputProps("visibility")} maw={150} />
        <Group>
          <MultiSelect
            label="Legge til medarbeidere?"
            placeholder="Søk etter brukere"
            data={userOptions || []}
            searchable
            clearable
            value={form.values.coAuthors}
            onChange={(value) => {
              form.setFieldValue("coAuthors", value);
            }}
            w="400"
            leftSection={<IconSearch style={{ width: rem(9), height: rem(9) }} stroke={1} />}
          />
        </Group>
        <Group align="center" my="xl">
          <Text fw={600}>Endre Forsidebilde:</Text>
          <FileButton onChange={(file) => form.setFieldValue("coverImage", file || undefined)} accept="image/png, image/jpeg">
            {(props) => (
              <Button {...props} color={form.getInputProps("coverImage").value?.name ? "green" : "blue"}>
                {form.getInputProps("coverImage").value?.name ? (
                  <>
                    {form.getInputProps("coverImage").value?.name} <IconCheck stroke={3} style={{ marginLeft: "8px" }} />{" "}
                  </>
                ) : (
                  "Last opp bilde"
                )}
              </Button>
            )}
          </FileButton>
        </Group>

        <Divider />

        <Stack gap="xl">
          {form.values.views.map((view, index) => (
            <Grid key={index}>
              <Grid.Col span={1}>
                <Flex justify="center" align="center" style={{ height: "100%" }}>
                  <Text fw={700}>{index + 1}:</Text> {/* Order is not guaranteed to be the same in Firebase*/}
                </Flex>
              </Grid.Col>
              <Grid.Col span={5}>
                <Textarea
                  label="Framside"
                  placeholder="Skriv inn det som skal vises på framsiden"
                  {...form.getInputProps(`views.${index}.front`)}
                  autosize
                  resize="vertical"
                  minRows={4}
                />
                <Space h={10} />
                {view.image && (
                  <Group>
                    Bilde: <Image src={view.image} alt="Bilde" height={50} width={200} />
                  </Group>
                )}
                <Space h={10} />
                <Group align="center">
                  <FileButton
                    onChange={(file) => {
                      handleOnChangeAddImage(file, index, view);
                    }}
                    accept="image/png, image/jpeg"
                  >
                    {(props) => (
                      <Button {...props} color="lime.4" variant="filled">
                        {form.getInputProps(`views.${index}.image`) && (
                          <>{view.image ? "Endre bilde" : "Valgt bilde: " + (form.getInputProps(`views.${index}.image`).value?.name || "Ingen valgt bilde")}</>
                        )}
                      </Button>
                    )}
                  </FileButton>
                </Group>
              </Grid.Col>
              <Grid.Col span={5}>
                <Textarea
                  label="Bakside"
                  placeholder="Skriv inn det som skal vises på baksiden"
                  {...form.getInputProps(`views.${index}.back`)}
                  autosize
                  resize="vertical"
                  minRows={4}
                />
              </Grid.Col>
              <Grid.Col span={1}>
                <Flex justify="center" align="center" style={{ height: "100%" }}>
                  <ActionIcon
                    onClick={() =>
                      form.setFieldValue(
                        "views",
                        form.values.views.filter((_, i) => i !== index)
                      )
                    }
                    color="red"
                  >
                    <IconX stroke={1.5} />
                  </ActionIcon>
                </Flex>
              </Grid.Col>
            </Grid>
          ))}
        </Stack>
        <Group justify="center">
          <Button onClick={() => form.setFieldValue("views", [...form.values.views, { front: "", back: "" }])}>Legg til nytt kort</Button>
        </Group>

        <Group justify="flex-end" mt="md">
          <Button onClick={() => form.reset()} color="red" disabled={!form.isDirty()}>
            Reset
          </Button>
          <Button type="submit" disabled={!form.isDirty()} loading={loading}>
            Lagre redigert sett
          </Button>
        </Group>
      </Stack>
    </form>
  );
};
