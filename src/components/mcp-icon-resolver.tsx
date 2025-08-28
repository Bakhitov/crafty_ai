import React from "react";

import { GithubIcon } from "ui/github-icon";
import { NotionIcon } from "ui/notion-icon";
import { LinearIcon } from "ui/linear-icon";
import { PlaywrightIcon } from "ui/playwright-icon";
import { NeonIcon } from "ui/neon-icon";
import { StripeIcon } from "ui/stripe-icon";
import { CanvaIcon } from "ui/canva-icon";
import { PaypalIcon } from "ui/paypal-icon";
import { AtlassianIcon } from "ui/atlassian-icon";
import { AsanaIcon } from "ui/asana-icon";

const NAME_TO_ICON: Record<string, React.ComponentType<any>> = {
  GithubIcon,
  NotionIcon,
  LinearIcon,
  PlaywrightIcon,
  NeonIcon,
  StripeIcon,
  CanvaIcon,
  PaypalIcon,
  AtlassianIcon,
  AsanaIcon,
};

export function getIconByName(
  name?: string | null,
): React.ComponentType<any> | undefined {
  if (!name) return undefined;
  return NAME_TO_ICON[name];
}

export function MCPTemplateIcon({
  icon,
  className,
}: {
  icon?: string | null;
  className?: string;
}) {
  const IconComp = getIconByName(icon ?? undefined);
  if (IconComp) {
    return <IconComp className={className} />;
  }
  if (icon && /^https?:\/\//i.test(icon)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={icon} alt="icon" className={className ?? "size-4"} />
    );
  }
  return null;
}
