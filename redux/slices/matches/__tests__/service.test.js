const { compareGroupedLeagues } = require("@/constants/leagues");
const { dedupeMatchesById, mergeMatchesForAllTab } = require("../service");

describe("matches service helpers", () => {
  test("dedupeMatchesById keeps last version by id", () => {
    const a = { id: 1, status: "NOT STARTED", time: "12:00" };
    const b = { id: 1, status: "IN PLAY", time: "55" };
    const c = { id: 2, status: "FINISHED" };
    const out = dedupeMatchesById([a, b, c]);
    expect(out).toHaveLength(2);
    expect(out.find((m) => m.id === 1)?.status).toBe("IN PLAY");
  });

  test("mergeMatchesForAllTab applies fixture < history < live priority", () => {
    const fixtures = [{ id: 10, status: "NOT STARTED", date: "2026-04-20" }];
    const history = [{ id: 10, status: "FINISHED", date: "2026-04-20" }];
    const live = [{ id: 10, status: "IN PLAY", date: "2026-04-20" }];

    const out = mergeMatchesForAllTab({
      selectedDate: "2026-04-20",
      fixtures,
      historyPageMatches: history,
      liveMatches: live,
    });

    expect(out).toHaveLength(1);
    expect(out[0]?.status).toBe("IN PLAY");
  });

  test("compareGroupedLeagues sorts Turkey then UEFA then Big Five", () => {
    const turkey = { competition_id: 6, competition_name: "Super Lig", country_id: 48 };
    const uefa = { competition_id: 245, competition_name: "UCL", country_id: 1 };
    const bigFive = { competition_id: 2, competition_name: "Premier League", country_id: 19 };
    const other = { competition_id: 9999, competition_name: "Other", country_name: "Brazil" };
    const list = [other, bigFive, uefa, turkey];
    const sorted = [...list].sort(compareGroupedLeagues);
    expect(sorted[0]).toBe(turkey);
    expect(sorted[1]).toBe(uefa);
    expect(sorted[2]).toBe(bigFive);
    expect(sorted[3]).toBe(other);
  });
});
