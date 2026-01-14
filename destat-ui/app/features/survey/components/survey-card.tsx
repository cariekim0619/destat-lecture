import { EyeIcon, UsersIcon } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

type SurveyCardProps = {
  title: string;
  description: string;
  address: string;
  image?: string | null;
  view?: number | null;
  count?: number | null;
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&w=900&q=60";

export default function SurveyCard({
  title,
  description,
  address,
  image,
  view,
  count,
}: SurveyCardProps) {
  return (
    <Card className="max-w-92">
      <CardHeader>
        <div className="flex flex-row justify-between items-center gap-2">
          <CardTitle className="truncate">
            <Link to={`/survey/${address}`} className="hover:underline">
              {title}
            </Link>
          </CardTitle>
          <div className="flex flex-row gap-2 text-xs">
            <div className="flex flex-row items-center gap-0.5">
              <EyeIcon size={17} /> {view ?? 0}
            </div>
            <div className="flex flex-row items-center gap-0.5">
              <UsersIcon size={17} /> {count ?? 0}
            </div>
          </div>
        </div>
        <CardDescription className="line-clamp-2 min-h-10">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <img
          className="rounded-2xl object-cover w-full h-44"
          src={image || FALLBACK_IMAGE}
          alt={title}
          loading="lazy"
        />
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link to={`/survey/${address}`}>Join</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

