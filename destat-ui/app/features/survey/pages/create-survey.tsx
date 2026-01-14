import { decodeEventLog, parseEther } from "viem";
import { Form, useNavigate } from "react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
  SURVEY_FACTORY_ABI,
  SURVEY_FACTORY_ADDRESS,
} from "~/features/survey/constant";
import { supabase } from "~/postgres/supaclient";
import type { Route } from "./+types/create-survey";

type SurveyQuestion = {
  question: string;
  options: string[];
};

type SurveyMetadata = {
  id: string;
  title: string;
  description: string;
  targetNumber: number;
  rewardAmount: number;
  questions: SurveyQuestion[];
  owner: string | undefined;
};

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const metadataRaw = formData.get("metadata");
  const imageFile = formData.get("image");

  if (typeof metadataRaw !== "string") return { ok: false, error: "Missing metadata" };
  if (!(imageFile instanceof File)) return { ok: false, error: "Missing image" };

  const metadata = JSON.parse(metadataRaw) as SurveyMetadata;

  const { data: uploaded, error: uploadError } = await supabase.storage
    .from("images")
    .upload(metadata.id, imageFile, { upsert: true });

  if (uploadError) return { ok: false, error: uploadError.message };

  const publicUrl = supabase.storage.from("images").getPublicUrl(uploaded.path);

  const { error: insertError } = await supabase.from("survey").upsert({
    id: metadata.id,
    title: metadata.title,
    description: metadata.description,
    target_number: metadata.targetNumber,
    reward_amount: metadata.rewardAmount,
    image: publicUrl.data.publicUrl,
    questions: metadata.questions,
    owner: metadata.owner ?? "",
    finish: false,
    view: 0,
  });

  if (insertError) return { ok: false, error: insertError.message };
  return { ok: true };
};

export default function CreateSurvey() {
  const navigate = useNavigate();
  const { address } = useAccount();
  const { data: hash, writeContract, isPending } = useWriteContract();
  const { data: receipt } = useWaitForTransactionReceipt({ hash });

  const hasFactoryAddress = Boolean(SURVEY_FACTORY_ADDRESS);
  const factoryAddressForReads = (SURVEY_FACTORY_ADDRESS ??
    "0x0000000000000000000000000000000000000000") as `0x${string}`;

  const { data: minPool } = useReadContract({
    address: factoryAddressForReads,
    abi: SURVEY_FACTORY_ABI,
    functionName: "min_pool_amount",
    query: { enabled: hasFactoryAddress },
  });

  const { data: minReward } = useReadContract({
    address: factoryAddressForReads,
    abi: SURVEY_FACTORY_ABI,
    functionName: "min_reward_amount",
    query: { enabled: hasFactoryAddress },
  });

  const [questionOptionCounts, setQuestionOptionCounts] = useState<number[]>([2]);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [pendingMetadata, setPendingMetadata] = useState<Omit<SurveyMetadata, "id"> | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const minPoolText = useMemo(() => {
    if (!minPool) return null;
    return `${Number(minPool) / 1e18}`;
  }, [minPool]);

  const minRewardText = useMemo(() => {
    if (!minReward) return null;
    return `${Number(minReward) / 1e18}`;
  }, [minReward]);

  const onChangeImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const addQuestion = () => setQuestionOptionCounts((prev) => [...prev, 2]);
  const removeQuestion = () =>
    setQuestionOptionCounts((prev) => (prev.length <= 1 ? prev : prev.slice(0, -1)));

  const addOption = (questionIndex: number) =>
    setQuestionOptionCounts((prev) =>
      prev.map((count, index) => (index === questionIndex ? count + 1 : count))
    );

  const removeOption = (questionIndex: number) =>
    setQuestionOptionCounts((prev) =>
      prev.map((count, index) =>
        index === questionIndex ? Math.max(2, count - 1) : count
      )
    );

  const createSurvey = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");

    if (!address) {
      setErrorMessage("Please connect wallet first.");
      return;
    }
    if (!SURVEY_FACTORY_ADDRESS) {
      setErrorMessage("Missing VITE_SURVEY_FACTORY_ADDRESS.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const targetNumberRaw = String(formData.get("target") ?? "").trim();
    const poolSizeRaw = String(formData.get("pool") ?? "").trim();

    const targetNumber = Number(targetNumberRaw);
    const poolSize = Number(poolSizeRaw);

    if (!title || !description) {
      setErrorMessage("Title/Description are required.");
      return;
    }
    if (!Number.isFinite(targetNumber) || targetNumber <= 0) {
      setErrorMessage("Target Number must be a positive integer.");
      return;
    }
    if (!Number.isFinite(poolSize) || poolSize <= 0) {
      setErrorMessage("Pool Size must be a positive number.");
      return;
    }
    if (!selectedImage) {
      setErrorMessage("Please upload an image.");
      return;
    }

    const questionTexts = formData.getAll("q").map((v) => String(v).trim());
    const questions: SurveyQuestion[] = questionTexts.map((q, i) => {
      const options = formData
        .getAll(i.toString())
        .map((v) => String(v).trim())
        .filter(Boolean);
      return { question: q, options };
    });

    if (questions.length === 0 || questions.some((q) => !q.question || q.options.length < 2)) {
      setErrorMessage("Each question needs text and at least 2 options.");
      return;
    }

    writeContract({
      address: SURVEY_FACTORY_ADDRESS,
      abi: SURVEY_FACTORY_ABI,
      functionName: "createSurvey",
      args: [
        {
          title,
          description,
          targetNumber: BigInt(targetNumber),
          questions,
        },
      ],
      value: parseEther(poolSizeRaw),
    });

    setPendingMetadata({
      title,
      description,
      targetNumber,
      rewardAmount: poolSize / targetNumber,
      questions,
      owner: address,
    });
  };

  useEffect(() => {
    if (!receipt || !pendingMetadata || !selectedImage) return;

    let contractAddress: string | undefined;
    for (const log of receipt.logs) {
      try {
        const event = decodeEventLog({
          abi: SURVEY_FACTORY_ABI,
          data: log.data,
          topics: log.topics,
        });
        if (event.eventName === "SurveyCreated") {
          const args = event.args as unknown as { surveyAddress?: string } & Record<number, string>;
          contractAddress = args.surveyAddress ?? args[0];
          break;
        }
      } catch {
        // ignore non-matching logs
      }
    }

    if (!contractAddress) {
      setErrorMessage("Could not find SurveyCreated event in transaction logs.");
      return;
    }

    const formData = new FormData();
    formData.append(
      "metadata",
      JSON.stringify({
        ...pendingMetadata,
        id: contractAddress,
      } satisfies SurveyMetadata)
    );
    formData.append("image", selectedImage);

    fetch("/survey/create", {
      method: "post",
      body: formData,
    })
      .then(() => navigate(`/survey/${contractAddress}`))
      .catch((e) => setErrorMessage(String(e)));
  }, [receipt, pendingMetadata, selectedImage, navigate]);

  return (
    <div className="flex justify-center w-full">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Create Survey</CardTitle>
          <CardDescription>
            Deploy a new Survey contract and register metadata in Supabase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground mb-4">
            <div>SurveyFactory: {SURVEY_FACTORY_ADDRESS || "(set VITE_SURVEY_FACTORY_ADDRESS)"}</div>
            {minPoolText && <div>min pool: {minPoolText}</div>}
            {minRewardText && <div>min reward/respondent: {minRewardText}</div>}
          </div>

          {errorMessage && <div className="text-sm text-red-600 mb-4">{errorMessage}</div>}

          <Form onSubmit={createSurvey} encType="multipart/form-data">
            <label className="flex flex-col mb-4">
              <span className="font-bold">Title</span>
              <Input type="text" name="title" placeholder="ex) Daily Mood Survey" />
            </label>

            <label className="flex flex-col mb-4">
              <span className="font-bold">Description</span>
              <Input type="text" name="description" placeholder="ex) Answer and get rewards!" />
            </label>

            <label className="flex flex-col mb-4">
              <span className="font-bold">Target Number</span>
              <Input type="number" name="target" placeholder="ex) 100" />
            </label>

            <label className="flex flex-col mb-4">
              <span className="font-bold">Reward Pool Size</span>
              <Input type="number" name="pool" placeholder="ex) 50" />
            </label>

            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold">Questions</h2>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={removeQuestion}>
                  -
                </Button>
                <Button type="button" variant="secondary" onClick={addQuestion}>
                  +
                </Button>
              </div>
            </div>

            {questionOptionCounts.map((optionCount, questionIndex) => (
              <div className="mb-4" key={`q-${questionIndex}`}>
                <Input type="text" placeholder="Question" name="q" />

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-semibold">Options</span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => removeOption(questionIndex)}
                    >
                      -
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => addOption(questionIndex)}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="mt-2 space-y-2">
                  {Array.from({ length: optionCount }).map((_, optionIndex) => (
                    <Input
                      key={`q-${questionIndex}-opt-${optionIndex}`}
                      type="text"
                      placeholder={`Option ${optionIndex + 1}`}
                      name={questionIndex.toString()}
                    />
                  ))}
                </div>
              </div>
            ))}

            <h2 className="font-bold mb-2">Upload Image</h2>
            <Card className="mb-4">
              <CardContent className="pt-6">
                <div className="flex justify-center items-center relative">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      className="rounded-2xl object-cover w-[300px] h-[300px]"
                      alt="Preview"
                    />
                  ) : (
                    <div className="flex justify-center items-center w-[300px] h-[300px] border-2 rounded-2xl text-muted-foreground">
                      Click to upload
                    </div>
                  )}
                  <label className="absolute w-[300px] h-[300px] top-0">
                    <Input
                      type="file"
                      className="hidden"
                      onChange={onChangeImage}
                      name="image"
                      accept="image/*"
                    />
                  </label>
                </div>
              </CardContent>
            </Card>

            <Button className="w-full" type="submit" disabled={isPending}>
              {isPending ? "Deploying..." : "Create"}
            </Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
