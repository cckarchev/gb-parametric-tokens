import { Vec2 } from "../types";
import { TokenPart } from "./tokenPart";

export const plateTokenParts = (parts: TokenPart[], offsets: Vec2[]): TokenPart[] => {
  return parts.map((part) => {
    const copies = offsets.map((offset) => part.manifold.translate(offset[0], offset[1], 0));
    const platedManifold = copies.reduce((union, copy) => union.add(copy));

    return { colorGroupId: part.colorGroupId, manifold: platedManifold };
  });
};
