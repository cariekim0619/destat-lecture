import { Link } from "react-router";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "~/components/ui/navigation-menu";
import WalletButton from "~/components/wallet-button";

export default function Navigation() {
  return (
    <nav className="fixed top-0 right-0 left-0 z-50">
        <div className="flex w-screen items-center justify-between py-5 px-5">
            <Link to="/" className="text-lg font-bold">
            DESTAT
            </Link>
        <NavigationMenu>
        <NavigationMenuList>
            <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                    <Link to="/dashboard">Dashboard</Link>
                </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
                <NavigationMenuTrigger>Survey</NavigationMenuTrigger>
                <NavigationMenuContent>
                    <ul className="grid gap-2 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    <li className="row-span-2">
                        <NavigationMenuLink asChild>
                            <a className="from-muted/50 to-muted flex h-full w-full flex-col justify-center rounded-md bg-linear-to-b no-underline outline-hidden transition-all duration-200 select-none focus:shadow-md md:p-6" href="/">
                            <div className="text-lg font-medium">
                                shadcn/ui
                            </div>
                            <p className="text-muted-foreground text-sm leading-tight">
                                Beautifully designed components built with Tailwind CSS.
                            </p>
                            </a>
                        </NavigationMenuLink>
                    </li>
                    <li>
                    <NavigationMenuLink asChild>
                        <Link to="/survey/all">
                            <div className="text-sm leading-none font-medium">
                                All Surveys
                            </div>
                            <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
                                explore all existing ones and join the survey to get the reward.
                            </p>
                        </Link>
                    </NavigationMenuLink>
                </li>
                <li>
                    <NavigationMenuLink asChild>
                        <Link to="/survey/create">
                            <div className="text-sm leading-none font-medium">
                                Create Survey
                            </div>
                            <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
                                create a new survey.
                            </p>
                        </Link>
                    </NavigationMenuLink>
                </li>
                </ul>
            </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
            <NavigationMenuTrigger>Archive</NavigationMenuTrigger>
            <NavigationMenuContent>
                <ul className="grid gap-2 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                <li className="row-span-2">
                    <NavigationMenuLink asChild>
                    <a className="from-muted/50 to-muted flex h-full w-full flex-col justify-center rounded-md bg-linear-to-b no-underline outline-hidden transition-all duration-200 select-none focus:shadow-md md:p-6" href="/">
                        <div className="text-lg font-medium">
                        shadcn/ui
                        </div>
                        <p className="text-muted-foreground text-sm leading-tight">
                        Beautifully designed components built with Tailwind CSS.
                        </p>
                    </a>
                    </NavigationMenuLink>
                </li>
                <li>
                    <NavigationMenuLink asChild>
                        <Link to="/archive/finish">
                            <div className="text-sm leading-none font-medium">
                                Finished surveys
                            </div>
                            <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
                                Finished surveys.
                            </p>
                        </Link>
                    </NavigationMenuLink>
                </li>
                </ul>
            </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
            <NavigationMenuTrigger>Profile</NavigationMenuTrigger>
            <NavigationMenuContent>
                <ul className="grid gap-2 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                <li className="row-span-2">
                    <NavigationMenuLink asChild>
                    <a className="from-muted/50 to-muted flex h-full w-full flex-col justify-center rounded-md bg-linear-to-b no-underline outline-hidden transition-all duration-200 select-none focus:shadow-md md:p-6" href="/">
                        <div className="text-lg font-medium">
                        shadcn/ui
                        </div>
                        <p className="text-muted-foreground text-sm leading-tight">
                        Beautifully designed components built with Tailwind CSS.
                        </p>
                    </a>
                    </NavigationMenuLink>
                </li>
                <li>
                    <NavigationMenuLink asChild>
                        <Link to="/profile/survey">
                            <div className="text-sm leading-none font-medium">
                                My surveys
                            </div>
                            <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
                                My surveys.
                            </p>
                        </Link>
                    </NavigationMenuLink>
                </li>
                <li>
                    <NavigationMenuLink asChild>
                        <Link to="/profile/response">
                            <div className="text-sm leading-none font-medium">
                                My responses
                            </div>
                            <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
                                My responses.
                            </p>
                        </Link>
                    </NavigationMenuLink>
                </li>
                </ul>
            </NavigationMenuContent>
            </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
        <WalletButton />
        </div>
    </nav>
  );
}
