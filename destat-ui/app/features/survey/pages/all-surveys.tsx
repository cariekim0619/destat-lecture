import SurveyCard from "~/features/survey/components/survey-card";
import { supabase } from "~/postgres/supaclient";
import type { Route } from "./+types/all-surveys";

type SurveyOverview = {
  title: string;
  description: string;
  count: number;
  view: number | null;
  image: string | null;
  address: string;
};

export const loader = async (): Promise<SurveyOverview[]> => {
  const { data: overview, error: overviewError } = await supabase
    .from("all_survey_overview")
    .select("*");

  if (!overviewError && overview) {
    return overview.map((row: any) => ({
      title: row.title ?? "",
      description: row.description ?? "",
      count: Number(row.count ?? 0),
      view: row.view ?? 0,
      image: row.image ?? null,
      address: row.id ?? "",
    }));
  }

  const { data: surveys, error: surveysError } = await supabase
    .from("survey")
    .select("id,title,description,image,view,finish")
    .eq("finish", false);

  if (surveysError || !surveys) return [];

  const withCounts = await Promise.all(
    surveys.map(async (survey: any) => {
      const { count } = await supabase
        .from("answer")
        .select("*", { count: "exact", head: true })
        .eq("survey_id", survey.id);

      return {
        title: survey.title ?? "",
        description: survey.description ?? "",
        count: count ?? 0,
        view: survey.view ?? 0,
        image: survey.image ?? null,
        address: survey.id ?? "",
      } satisfies SurveyOverview;
    })
  );

  return withCounts.filter((s) => s.address);
};

export default function AllSurveys({ loaderData }: Route.ComponentProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="flex flex-col justify-center items-center">
        <h1 className="text-2xl font-extrabold">Live Surveys</h1>
        <span className="font-light">Join the surveys!</span>
      </div>
      {loaderData.length === 0 ? (
        <div className="col-span-3 text-sm text-muted-foreground">
          No surveys yet. Create one!
        </div>
      ) : (
        loaderData.map((survey) => (
          <SurveyCard
            key={survey.address}
            title={survey.title}
            description={survey.description}
            view={survey.view}
            count={survey.count}
            image={survey.image}
            address={survey.address}
          />
        ))
      )}
    </div>
  );
}
