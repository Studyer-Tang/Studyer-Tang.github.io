export type LandmarkId = 'reading' | 'research' | 'interests' | 'personal'
export type LandmarkChapter = LandmarkId

export type IslandLandmark = {
  id: LandmarkId
  chapter: LandmarkChapter
  title: { zh: string; en: string }
  position: { x: number; z: number }
  radius: number
}

/** World units in the island's XZ plane; the walker starts before the palace. */
export const islandLandmarks: readonly IslandLandmark[] = [
  { id: 'reading', chapter: 'reading', title: { zh: '藏书殿', en: 'The library palace' }, position: { x: -14, z: -10 }, radius: 14 },
  { id: 'research', chapter: 'research', title: { zh: '观星台', en: 'The observatory' }, position: { x: 30, z: -26 }, radius: 7 },
  { id: 'interests', chapter: 'interests', title: { zh: '林间茶座', en: 'The woodland retreat' }, position: { x: -35, z: 15 }, radius: 7 },
  { id: 'personal', chapter: 'personal', title: { zh: '临海长廊', en: 'The sea pavilion' }, position: { x: 94, z: 14 }, radius: 9 },
]
