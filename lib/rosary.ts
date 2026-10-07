import { seoulWeekday } from "./date";

export type MysteryKey = "joyful" | "luminous" | "sorrowful" | "glorious";

export interface MysterySet {
  key: MysteryKey;
  name: string; // 예: "환희의 신비"
  color: string; // UI 강조색
  decades: string[]; // 5단 묵상 제목
}

export const MYSTERIES: Record<MysteryKey, MysterySet> = {
  joyful: {
    key: "joyful",
    name: "환희의 신비",
    color: "#e0a94a",
    decades: [
      "예수님께서 성령으로 마리아께 잉태되심을 묵상합시다",
      "마리아께서 엘리사벳을 방문하심을 묵상합시다",
      "예수님께서 마구간에서 탄생하심을 묵상합시다",
      "예수님께서 성전에서 봉헌되심을 묵상합시다",
      "예수님을 성전에서 되찾으심을 묵상합시다",
    ],
  },
  luminous: {
    key: "luminous",
    name: "빛의 신비",
    color: "#4a9ae0",
    decades: [
      "예수님께서 요르단 강에서 세례받으심을 묵상합시다",
      "예수님께서 카나의 혼인 잔치에서 첫 기적을 행하심을 묵상합시다",
      "예수님께서 하느님 나라를 선포하심을 묵상합시다",
      "예수님께서 타볼 산에서 거룩하게 변모하심을 묵상합시다",
      "예수님께서 성체성사를 세우심을 묵상합시다",
    ],
  },
  sorrowful: {
    key: "sorrowful",
    name: "고통의 신비",
    color: "#b0504f",
    decades: [
      "예수님께서 우리를 위하여 피땀 흘리심을 묵상합시다",
      "예수님께서 우리를 위하여 매 맞으심을 묵상합시다",
      "예수님께서 우리를 위하여 가시관 쓰심을 묵상합시다",
      "예수님께서 우리를 위하여 십자가 지심을 묵상합시다",
      "예수님께서 우리를 위하여 십자가에 못 박혀 돌아가심을 묵상합시다",
    ],
  },
  glorious: {
    key: "glorious",
    name: "영광의 신비",
    color: "#6b4fbb",
    decades: [
      "예수님께서 부활하심을 묵상합시다",
      "예수님께서 승천하심을 묵상합시다",
      "성령께서 사도들에게 강림하심을 묵상합시다",
      "성모 마리아께서 하늘에 불려 올림을 받으심을 묵상합시다",
      "성모 마리아께서 하늘의 모후로 관을 쓰심을 묵상합시다",
    ],
  },
};

// 전통적인 요일별 신비 배정 (0=일 ~ 6=토)
const WEEKDAY_MYSTERY: MysteryKey[] = [
  "glorious", // 일
  "joyful", // 월
  "sorrowful", // 화
  "glorious", // 수
  "luminous", // 목
  "sorrowful", // 금
  "joyful", // 토
];

/** 오늘(서울 기준) 추천하는 신비 */
export function todaysMystery(d: Date = new Date()): MysterySet {
  return MYSTERIES[WEEKDAY_MYSTERY[seoulWeekday(d)]];
}

// ─── 기도문 ───────────────────────────────────────────────
export const PRAYERS = {
  signOfCross:
    "성부와 성자와 성령의 이름으로. 아멘.",
  creed:
    "전능하신 천주 성부, 천지의 창조주를 저는 믿나이다. 그 외아들 우리 주 예수 그리스도님, 성령으로 인하여 동정 마리아께 잉태되어 나시고, 본시오 빌라도 통치 아래서 고난을 받으시고 십자가에 못 박혀 돌아가시고 묻히셨으며, 저승에 가시어 사흗날에 죽은 이들 가운데서 부활하시고, 하늘에 올라 전능하신 천주 성부 오른편에 앉으시며, 그리로부터 산 이와 죽은 이를 심판하러 오시리라 믿나이다. 성령을 믿으며, 거룩하고 보편된 교회와 모든 성인의 통공을 믿으며, 죄의 용서와 육신의 부활을 믿으며, 영원한 삶을 믿나이다. 아멘.",
  lordsPrayer:
    "하늘에 계신 우리 아버지, 아버지의 이름이 거룩히 빛나시며, 아버지의 나라가 오시며, 아버지의 뜻이 하늘에서와 같이 땅에서도 이루어지소서. 오늘 저희에게 일용할 양식을 주시고, 저희에게 잘못한 이를 저희가 용서하오니 저희 죄를 용서하시고, 저희를 유혹에 빠지지 않게 하시고 악에서 구하소서. 아멘.",
  hailMary:
    "은총이 가득하신 마리아님, 기뻐하소서. 주님께서 함께 계시니 여인 중에 복되시며 태중의 아들 예수님 또한 복되시나이다. 천주의 성모 마리아님, 이제와 저희 죽을 때에 저희 죄인을 위하여 빌어 주소서. 아멘.",
  glory:
    "영광이 성부와 성자와 성령께, 처음과 같이 이제와 항상 영원히. 아멘.",
  fatima:
    "예수님, 저희 죄를 용서하시며, 저희를 지옥 불에서 구하시고, 연옥 영혼을 돌보시며, 가장 버림받은 영혼을 돌보소서.",
  closing:
    "묵주기도의 모후이신 성모 마리아님, 저희를 위하여 빌어 주소서. 아멘.",
} as const;

export type BeadKind = "cross" | "large" | "small";

export interface RosaryStep {
  title: string; // 기도 이름 (예: "성모송")
  text: string; // 기도문 전문 또는 묵상
  bead: BeadKind; // 묵주알 종류
  decade: number; // 0 = 도입부, 1~5 = 각 단
  smallIndex?: number; // 작은알 순번 (1~10) — 성모송에만
}

/** 선택한 신비로 묵주기도 전체 순서를 생성한다. */
export function buildRosarySteps(mystery: MysterySet): RosaryStep[] {
  const steps: RosaryStep[] = [];

  // ── 도입부 ──
  steps.push({ title: "성호경", text: PRAYERS.signOfCross, bead: "cross", decade: 0 });
  steps.push({ title: "사도신경", text: PRAYERS.creed, bead: "cross", decade: 0 });
  steps.push({ title: "주님의 기도", text: PRAYERS.lordsPrayer, bead: "large", decade: 0 });
  for (let i = 1; i <= 3; i++) {
    steps.push({
      title: "성모송",
      text: PRAYERS.hailMary,
      bead: "small",
      decade: 0,
      smallIndex: i,
    });
  }
  steps.push({ title: "영광송", text: PRAYERS.glory, bead: "large", decade: 0 });

  // ── 5단 ──
  for (let d = 1; d <= 5; d++) {
    steps.push({
      title: `제${d}단 묵상`,
      text: mystery.decades[d - 1],
      bead: "large",
      decade: d,
    });
    steps.push({ title: "주님의 기도", text: PRAYERS.lordsPrayer, bead: "large", decade: d });
    for (let i = 1; i <= 10; i++) {
      steps.push({
        title: `성모송 (${i}/10)`,
        text: PRAYERS.hailMary,
        bead: "small",
        decade: d,
        smallIndex: i,
      });
    }
    steps.push({ title: "영광송", text: PRAYERS.glory, bead: "large", decade: d });
    steps.push({ title: "구원송", text: PRAYERS.fatima, bead: "large", decade: d });
  }

  // ── 마침 기도 ──
  steps.push({ title: "마침 기도", text: PRAYERS.closing, bead: "cross", decade: 0 });

  return steps;
}
