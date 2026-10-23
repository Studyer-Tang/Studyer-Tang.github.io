export type LandmarkChapter = 'reading' | 'research' | 'interests' | 'personal'
export type LandmarkId = LandmarkChapter | 'gate' | 'lake' | 'history' | 'bamboo' | 'ridge' | 'studio'

export type IslandLandmark = {
  id: LandmarkId
  chapter: LandmarkChapter
  kind: 'chapter' | 'observatory' | 'discovery'
  title: { zh: string; en: string }
  position: { x: number; z: number }
  entry: { x: number; z: number }
  radius: number
}

/** Shared positions for scene construction, walking destinations and the atlas. */
export const islandLandmarks: readonly IslandLandmark[] = [
  { id: 'reading', chapter: 'reading', kind: 'chapter', title: { zh: '藏书殿', en: 'The library palace' }, position: { x: -14, z: -10 }, entry: { x: -14, z: 2 }, radius: 14 },
  { id: 'research', chapter: 'research', kind: 'observatory', title: { zh: '山顶观星台', en: 'The hilltop observatory' }, position: { x: 27, z: -91 }, entry: { x: 27, z: -84 }, radius: 10 },
  { id: 'interests', chapter: 'interests', kind: 'chapter', title: { zh: '林间茶座', en: 'The woodland retreat' }, position: { x: -69, z: 25 }, entry: { x: -65, z: 31 }, radius: 10 },
  { id: 'personal', chapter: 'personal', kind: 'chapter', title: { zh: '临海长廊', en: 'The waterfront pavilion' }, position: { x: 94, z: 14 }, entry: { x: 92, z: 14 }, radius: 9 },
  { id: 'gate', chapter: 'personal', kind: 'discovery', title: { zh: '松风山门', en: 'The pine gate' }, position: { x: -14, z: 61 }, entry: { x: -14, z: 56 }, radius: 10 },
  { id: 'lake', chapter: 'reading', kind: 'discovery', title: { zh: '镜湖水榭', en: 'The lake pavilion' }, position: { x: -67, z: -33 }, entry: { x: -64, z: -29 }, radius: 10 },
  { id: 'history', chapter: 'reading', kind: 'discovery', title: { zh: '古籍碑廊', en: 'The history cloister' }, position: { x: -111, z: -76 }, entry: { x: -109, z: -68 }, radius: 11 },
  { id: 'bamboo', chapter: 'interests', kind: 'discovery', title: { zh: '竹影曲径', en: 'The bamboo walk' }, position: { x: -104, z: 65 }, entry: { x: -97, z: 65 }, radius: 10 },
  { id: 'ridge', chapter: 'research', kind: 'discovery', title: { zh: '远岫云台', en: 'The ridge lookout' }, position: { x: -26, z: -112 }, entry: { x: -25, z: -104 }, radius: 10 },
  { id: 'studio', chapter: 'reading', kind: 'discovery', title: { zh: '溪畔书斋', en: 'The waterside study' }, position: { x: -60, z: 91 }, entry: { x: -55, z: 84 }, radius: 10 },
]

export const chapterLandmarks = islandLandmarks.filter(place => place.id === place.chapter)
export const landmarkById = (id: LandmarkId) => islandLandmarks.find(place => place.id === id)!
