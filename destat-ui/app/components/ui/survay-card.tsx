import { EyeIcon, User, UsersIcon, ViewIcon } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "~/components/ui/card";

export default function SurveyCard() {
    return (
        <Link to ="/survey/surveyId">
        <Card className="min-w-92">
            <CardHeader>
                <div className="flex flex-row justify-center items-center">
                    <CardTitle>Sample Survey</CardTitle>
                    <div className="flex flex-row text-xs gap-0.5">
                        <EyeIcon size={17}/> 1600
                    </div>
                    <div className="flex flex-row text-xs gap-0.5">
                        <UsersIcon size={17}/> 58
                    </div>
                </div>
                <CardDescription className="line-clamp-2 min-h-10">This is a sample survey. Let's join to get Rewards.</CardDescription>
            </CardHeader>
            <CardContent>
                <img className="rounded-2xl" src={"https://avatars.githubusercontent.com/u/62927029?v=4"}  />
            </CardContent>
        <CardFooter>
            <Button className="w-full">
                <Link to="/survey/surveyId">Join
                </Link>
            </Button>
        </CardFooter>
        </Card>
        </Link>
    )
}