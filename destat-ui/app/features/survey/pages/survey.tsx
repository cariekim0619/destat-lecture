import { SendIcon } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Form } from "react-router";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import MessageBubble from "../components/message-bubble";
import { SURVEY_ABI } from "~/features/survey/constant";
import { supabase } from "~/postgres/supaclient";
import type { Route } from "./+types/survey";

type LoaderData = {
  finish: boolean;
};

export const loader = async ({ params }: Route.LoaderArgs): Promise<LoaderData> => {
  const { data, error } = await supabase
    .from("survey")
    .select("finish")
    .eq("id", params.surveyId)
    .maybeSingle();

  if (error || !data) return { finish: false };
  return { finish: Boolean((data as any).finish) };
};

export default function Survey({ params, loaderData }: Route.ComponentProps) {
  const { address } = useAccount();

  const { data: questions } = useReadContract({
    address: params.surveyId as `0x${string}`,
    abi: SURVEY_ABI,
    functionName: "getQuestions",
  });
  const { data: title } = useReadContract({
    address: params.surveyId as `0x${string}`,
    abi: SURVEY_ABI,
    functionName: "title",
  });
  const { data: description } = useReadContract({
    address: params.surveyId as `0x${string}`,
    abi: SURVEY_ABI,
    functionName: "description",
  });
  const { data: answers } = useReadContract({
    address: params.surveyId as `0x${string}`,
    abi: SURVEY_ABI,
    functionName: "getAnswers",
  });
  const { data: target } = useReadContract({
    address: params.surveyId as `0x${string}`,
    abi: SURVEY_ABI,
    functionName: "targetNumber",
  });

  const [isFinished, setIsFinished] = useState(Boolean(loaderData?.finish));
  const [counts, setCounts] = useState<number[][]>([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingAnswers, setPendingAnswers] = useState<number[] | null>(null);

  const targetNumber = useMemo(() => (target ? Number(target) : null), [target]);

  const computeCounts = () => {
    if (!questions || !answers || !targetNumber) return null;

    return questions.map((q, questionIndex) => {
      const optionCounts = Array.from({ length: q.options.length }).fill(0) as number[];
      for (const a of answers) {
        const selected = a.answers?.[questionIndex];
        if (selected === undefined) continue;
        optionCounts[Number(selected)]++;
      }
      return optionCounts.map((n) => (n / targetNumber) * 100);
    });
  };

  useEffect(() => {
    if (!answers || !questions || !address) return;

    for (const a of answers) {
      if (a.respondent === address) {
        const calculated = computeCounts();
        if (calculated) setCounts(calculated);
        setIsAnswered(true);
        return;
      }
    }

    setIsAnswered(false);
  }, [answers, address, questions, targetNumber]);

  useEffect(() => {
    if (!targetNumber || !answers) return;
    if (answers.length >= targetNumber) setIsFinished(true);
  }, [answers, targetNumber]);

  useEffect(() => {
    if (!isFinished || !questions || !answers) return;
    const calculated = computeCounts();
    if (calculated) setCounts(calculated);
    setIsAnswered(true);
  }, [isFinished, questions, answers, targetNumber]);

  const { data: submitTxHash, writeContract, isPending } = useWriteContract();
  const { isFetched: isSubmitConfirmed } = useWaitForTransactionReceipt({ hash: submitTxHash });

  const submitAnswers = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");

    if (!address) {
      setErrorMessage("Please connect your wallet first.");
      return;
    }
    if (!questions || questions.length === 0) {
      setErrorMessage("Questions not loaded yet.");
      return;
    }
    if (isFinished) {
      setErrorMessage("This survey is already finished.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const selectedAnswers = questions.map((_, index) => {
      const value = formData.get(index.toString());
      if (value === null) return Number.NaN;
      return Number(value);
    });

    if (selectedAnswers.some((n) => !Number.isFinite(n))) {
      setErrorMessage("Please answer all questions.");
      return;
    }

    writeContract({
      address: params.surveyId as `0x${string}`,
      abi: SURVEY_ABI,
      functionName: "submitAnswers",
      args: [{ respondent: address, answers: selectedAnswers }],
    });
    setPendingAnswers(selectedAnswers);
  };

  useEffect(() => {
    if (!isSubmitConfirmed) return;
    const refreshFinish = async () => {
      if (pendingAnswers) {
        await supabase.from("answer").insert({
          survey_id: params.surveyId,
          answers: pendingAnswers,
        });
        setPendingAnswers(null);
      }

      if (!targetNumber) return;
      const { data } = await supabase
        .from("survey")
        .select("finish")
        .eq("id", params.surveyId)
        .maybeSingle();

      const alreadyFinished = Boolean((data as any)?.finish);
      const reachedTarget = Boolean(answers && answers.length >= targetNumber);

      if (!alreadyFinished && reachedTarget) {
        await supabase.from("survey").update({ finish: true }).eq("id", params.surveyId);
        setIsFinished(true);
      }
    };
    refreshFinish().catch(() => {});
  }, [isSubmitConfirmed, params.surveyId, targetNumber, answers, pendingAnswers]);

  const displayTitle = isFinished && title ? `${title} (Finished)` : title;

  return (
    <div className="grid grid-cols-3 w-screen gap-3">
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="font-extrabold text-3xl">{displayTitle}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>

        {errorMessage && <div className="px-6 pb-2 text-sm text-red-600">{errorMessage}</div>}

        {isAnswered || isFinished ? (
          <CardContent className="overflow-y-auto h-[70vh]">
            <h2 className="font-semibold text-xl pb-4">Survey Result</h2>
            <div className="gap-5 grid grid-cols-2">
              {questions?.map((q, questionIndex) => (
                <div key={questionIndex} className="flex flex-col gap-2">
                  <h3 className="font-bold">{q.question}</h3>
                  <div className="flex flex-col gap-1">
                    {q.options.map((option, optionIndex) => (
                      <div
                        key={`${questionIndex}-${optionIndex}`}
                        className="flex flex-row justify-center items-center relative"
                      >
                        <div className="left-2 absolute text-xs font-semibold">{option}</div>
                        <div className="w-full bg-gray-200 h-5 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-400 h-5 rounded-full"
                            style={{ width: `${counts?.[questionIndex]?.[optionIndex] ?? 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        ) : (
          <CardContent className="overflow-y-auto h-[70vh]">
            <Form onSubmit={submitAnswers} className="grid grid-cols-2 gap-4">
              {questions?.map((q, questionIndex) => (
                <div key={questionIndex} className="flex flex-col gap-2">
                  <h3 className="font-semibold">{q.question}</h3>
                  {q.options.map((option, optionIndex) => (
                    <label
                      key={`${questionIndex}-${optionIndex}`}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Input
                        type="radio"
                        name={questionIndex.toString()}
                        value={optionIndex.toString()}
                        required={optionIndex === 0}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              ))}

              <div className="col-span-2">
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </Form>
          </CardContent>
        )}
      </Card>

      <Card className="col-span-1 flex flex-col">
        <CardHeader>
          <CardTitle>Live Chat</CardTitle>
          <CardDescription className="text-xs">
            (Optional) This is a placeholder UI.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 overflow-y-auto h-[70vh]">
          {Array.from({ length: 10 }).map((_, i) => (
            <MessageBubble key={i} sender={i % 2 === 0} />
          ))}
        </CardContent>
        <CardFooter className="w-full">
          <form className="flex flex-row items-center relative w-full">
            <input
              type="text"
              placeholder="Type a message..."
              className="border-1 w-full h-8 rounded-2xl px-2 text-xs"
              disabled
            />
            <Button
              type="button"
              className="flex flex-row justify-center items-center w-6 h-6 absolute right-2"
              disabled
            >
              <SendIcon />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
