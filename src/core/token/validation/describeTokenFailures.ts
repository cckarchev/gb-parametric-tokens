import {
  ComponentFailure,
  describeComponentFailure,
  describeVanishedDetailCount,
} from "./validateMinStrokeWidth";

// One reason string for a whole token, from every component that failed on it.
//
// Most invalid tokens have exactly one line of text and no effect text, so their only failing
// component's text is identical to the token's own name. The UI already names the token by that
// name (see ExportPanel.tsx), so repeating it as `Text "The Owner": ...` right next to it read as
// pure noise (user feedback, caught live in the browser). Naming the source still earns its keep
// whenever it's NOT just restating the name: an icon, or a second line whose own text differs
// from the name.
// One failure per line (not joined with a space): a run-on paragraph of several "Icon ...:
// Text ...:" clauses back to back read as illegible (user feedback). ExportPanel.tsx and the
// contact-sheet marker's tooltip both render \n as a real line break.
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

  // A left and right stud icon are frequently the very same icon at the same scale, so they fail
  // the same way (same counts): nothing is lost by only saying it once. Dedupes on the final
  // worded message, not the raw source, so it still keeps two icons apart the moment either
  // their id or their counts genuinely differ (user feedback: "si son los mismos no tiene
  // sentido duplicarlos").
  return [...new Set(messages)].join("\n");
};
