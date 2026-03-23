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
import { useTranslate } from "@rever/i18n";

type CommandDemoProps = {
  redirectRoute: (url: string) => void;
};

export function CommandDemo({ redirectRoute }: CommandDemoProps) {
  const translate = useTranslate();

  return (
    <Command className="md:min-w-112.5 border text-neutral-1100">
      <CommandInput autoFocus placeholder={translate("global_search.search_placeholder")} />
      <CommandList>
        <CommandEmpty>{translate("global_search.no_results")}</CommandEmpty>

        <CommandGroup heading={translate("global_search.suggestions")}>
          {globalSearchRoutes
            ?.filter((v) => hasPermission(v.f_name, v.a_name))
            .map((v, i) => (
              <CommandItem
                key={i}
                className="cursor-pointer"
                onSelect={() => redirectRoute(v.url)}
              >
                {v.icon}
                <span>{translate(v.i18nKey)}</span>
              </CommandItem>
            ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={translate("sidebar.settings.settings")}>
          {globalSearchRoutesSetting.map((v, i) => (
            <CommandItem
              key={i}
              className="cursor-pointer"
              onSelect={() => redirectRoute(v.url)}
            >
              {v.icon}
              <span>{translate(v.i18nKey)}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
