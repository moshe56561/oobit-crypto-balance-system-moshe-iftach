import { TICKER_MAP } from '@app/shared/constants/ticker-mapping';

export function normalizeAsset(asset: string): string {
  return TICKER_MAP[asset.toLowerCase()] || asset;
}
