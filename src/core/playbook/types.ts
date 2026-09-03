export interface Guild {
  name: string;
  minor: boolean;
  color: string;
  darkColor?: string;
  shadow?: string;
  roster: string[];
}

export interface Model {
  id: string;
  name: string;
  guild1: string;
  guild2?: string;
  captain: boolean;
  mascot: boolean;
  veteran: boolean;
  seasoned: boolean;
  hp: number;
  recovery: number;
  jog: number;
  sprint: number;
  tac: number;
  kickdice: number;
  kickdist: number;
  def: number;
  arm: number;
  inf: number;
  infmax: number;
  dehcneb?: string;
  benched?: string;
  base: number;
  reach: boolean;
  gbcp: boolean;
  character_plays: string[];
  character_traits: string[];
  heroic?: string;
  legendary?: string;
  types: string;
  playbook: (string | null)[][];
}

export interface CharacterPlay {
  name: string;
  text: string;
  CST: string | number;
  RNG: string | number;
  SUS: boolean;
  OPT: boolean;
}

export interface CharacterTrait {
  name: string;
  active: boolean;
  text: string;
}

export interface PlaybookData {
  Guilds: Guild[];
  Models: Model[];
  "Character Plays": CharacterPlay[];
  "Character Traits": CharacterTrait[];
}

export interface ParsedData {
  name: string;
  text: string;
}

export interface FileExportParams {
  guildName: string;
  data: ParsedData[];
}
