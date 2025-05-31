// Global search component

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@rever/common";
import {
  globalSearchRoutes,
  globalSearchRoutesSetting,
} from "@rever/constants";
import { hasPermission } from "@rever/utils";

type CommandDemoProps = {
  redirectRoute: (url: string) => void;
};

export function CommandDemo({ redirectRoute }: CommandDemoProps) {
  return (
    <Command className="md:min-w-[450px] border text-slate-800">
      <CommandInput autoFocus placeholder="Search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Suggestions">
          {globalSearchRoutes
            ?.filter((v) => hasPermission(v.f_name, v.a_name))
            .map((v, i) => (
              <CommandItem
                key={i}
                className="cursor-pointer"
                onSelect={() => redirectRoute(v.url)}
              >
                {v.icon}
                <span>{v.name}</span>
              </CommandItem>
            ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          {globalSearchRoutesSetting.map((v, i) => (
            <CommandItem
              key={i}
              className="cursor-pointer"
              onSelect={() => redirectRoute(v.url)}
            >
              {v.icon}
              <span>{v.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
