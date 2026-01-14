import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("features/dashboard/pages/dashboard.tsx"),
    route("/dashboard", "features/dashboard/pages/dashboard.tsx", { id: "dashboard" }),
    route("/survey/all", "features/survey/pages/all-surveys.tsx"),
    route("/survey/create", "features/survey/pages/create-survey.tsx"),
    route("/survey/:surveyId", "features/survey/pages/survey.tsx"),
    route("/archive/finish", "features/archive/pages/finished-archives.tsx"),
    route("/profile/survey", "features/profile/pages/my-surveys.tsx"),
    route("/profile/response", "features/profile/pages/my-response.tsx"),
] satisfies RouteConfig;
