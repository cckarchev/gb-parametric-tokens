import {
  type ComponentFailure,
  describeComponentFailure,
  describeVanishedDetailCount,
} from "./validateMinStrokeWidth";

// One reason string for a whole token, one failing component per line
// (ExportPanel and the contact sheet's tooltip both render \n as a line break).
//
// A component is named only when the name adds something: an icon, or a second
// line whose text differs from the token's name. Most tokens fail on their only
// line, whose text is the token's name, and the UI already shows that name next
// to the reason.
export const describeTokenFailures = (
  name: string,
  componentFailures: ComponentFailure[],
): string => {
  const messages = componentFailures.map((failure) =>
    failure.kind === "stroke-width" &&
    failure.source.kind === "text" &&
    failure.source.text === name
      ? describeVanishedDetailCount(failure)
      : describeComponentFailure(failure),
  );

  // Both studs often carry the same icon and fail the same way, so identical
  // messages collapse into one. Two icons whose id or counts differ still word
  // differently and both stay.
  return [...new Set(messages)].join("\n");
};
