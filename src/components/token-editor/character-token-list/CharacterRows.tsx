import { resolveAoeTemplate } from "@/core/token/catalog/aoeTemplates";
import type { CatalogCharacter } from "@/core/token/catalog/catalogTypes";
import { characterSelectableIds } from "@/core/token/catalog/characterSelectableIds";
import { buildEffectLabels } from "@/core/token/catalog/effectLabels";
import { effectMaxCopies, resolveEffect } from "@/core/token/catalog/effects";
import { resolveTokenCopies } from "@/core/token/catalog/token-items/resolveTokenCopies";
import {
  characterAoeTemplateId,
  characterTokenId,
  MIN_COPIES,
} from "@/core/token/catalog/token-items/tokenItem";

import { CharacterRow } from "./CharacterRow";
import styles from "./CharacterTokenList.module.css";
import { TokenRow } from "./TokenRow";

const AOE_TEMPLATE_TAG = "AOE";

type CharacterRowsProps = {
  character: CatalogCharacter;
  selectedTokenIds: string[];
  tokenCopies: Record<string, number>;
  onToggleCharacter: (checked: boolean) => void;
  onToggleToken: (id: string, checked: boolean) => void;
  onCopiesChange: (id: string, copies: number) => void;
};

// One character's header row followed by a row per token and AoE template it carries, as
// siblings so the list's zebra striping runs on across characters.
export const CharacterRows = ({
  character,
  selectedTokenIds,
  tokenCopies,
  onToggleCharacter,
  onToggleToken,
  onCopiesChange,
}: CharacterRowsProps) => {
  const ids = characterSelectableIds(character);
  const hasTokens = ids.length > 0;
  const selectedCount = ids.filter((id) =>
    selectedTokenIds.includes(id),
  ).length;
  const effects = character.effects.map(resolveEffect);
  const effectLabels = buildEffectLabels(effects);
  const templates = (character.aoeTemplates ?? []).map(resolveAoeTemplate);

  const renderRow = (
    id: string,
    label: string,
    maxCopies: number,
    tag?: string,
  ) => (
    <TokenRow
      key={id}
      label={label}
      tag={tag}
      maxCopies={maxCopies}
      selected={selectedTokenIds.includes(id)}
      copies={resolveTokenCopies(tokenCopies[id], maxCopies)}
      onToggle={(checked) => onToggleToken(id, checked)}
      onCopiesChange={(copies) => onCopiesChange(id, copies)}
    />
  );

  return (
    <>
      <CharacterRow
        name={character.name}
        selectedCount={selectedCount}
        tokenCount={ids.length}
        onToggle={onToggleCharacter}
      />

      {effects.map((effect, tokenIndex) =>
        renderRow(
          characterTokenId(character.name, tokenIndex),
          effectLabels[tokenIndex],
          effectMaxCopies(effect),
        ),
      )}

      {templates.map((template, templateIndex) =>
        renderRow(
          characterAoeTemplateId(character.name, templateIndex),
          template.name,
          template.maxCopies ?? MIN_COPIES,
          AOE_TEMPLATE_TAG,
        ),
      )}

      {!hasTokens && (
        <div className={`${styles.row} ${styles.rowToken}`}>
          <span className={styles.characterNameDisabled}>No tokens</span>
        </div>
      )}
    </>
  );
};
