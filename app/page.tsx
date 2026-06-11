"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { TournamentBracket } from "./components/TournamentBracket";
import {
  FORMATION_SLOTS,
  NATIONS,
  WORLD_CUP_GROUPS,
  getGroupForNation,
} from "./lib/data";
import { getPlayersByNation } from "../data/players";
import { calculateTeamRatings } from "./lib/ratings";
import {
  createGroupTable,
  createMatch,
  getLiveScore,
  updateGroupTable,
} from "./lib/simulation";
import {
  createBackgroundGroupResults,
  createTournamentAwards,
  createOfficialGroupStage,
  completeOfficialBracket,
  createNextOfficialRound,
  simulateAutomaticKnockoutRound,
  simulateKnockoutFixtures,
} from "./lib/tournament";
import {
  createTournamentForm,
  type TournamentForm,
} from "./lib/nation-strength";
import {
  FORMATIONS,
  type Formation,
  type GroupTableRow,
  type Nation,
  type Player,
  type PositionCategory,
  type SimMatch,
  type TournamentStats,
  type TournamentFixture,
  type TournamentRoundResults,
} from "./lib/types";

type View = "landing" | "builder" | "simulation" | "result";

const emptyStats = (): TournamentStats => ({
  wins: 0,
  draws: 0,
  losses: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  points: 0,
  scorers: {},
  substitutions: [],
});

function Modal({
  open,
  title,
  eyebrow,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  eyebrow: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <button
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
        onClick={onClose}
        aria-label="Close modal"
      />
      <section
        className="relative flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#101713] shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d8b75b]">
              {eyebrow}
            </p>
            <h2 className="text-xl font-black">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-xl text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            ×
          </button>
        </header>
        {children}
      </section>
    </div>,
    document.body,
  );
}

function NationModal({
  open,
  selected,
  onClose,
  onSelect,
}: {
  open: boolean;
  selected: Nation | null;
  onClose: () => void;
  onSelect: (nation: Nation) => void;
}) {
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const visibleGroups = Object.entries(WORLD_CUP_GROUPS)
    .map(([group, nations]) => ({
      group,
      nations: nations.filter((nation) =>
        nation.name.toLowerCase().includes(query),
      ),
    }))
    .filter(({ nations }) => nations.length > 0);

  return (
    <Modal open={open} title="Choose your nation" eyebrow="The road begins" onClose={onClose}>
      <div className="shrink-0 p-4 pb-2">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search nations..."
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-[#d8b75b]/60"
          autoFocus
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 pt-1">
        <div className="grid gap-3 sm:grid-cols-2">
          {visibleGroups.map(({ group, nations }) => (
            <section
              key={group}
              className="rounded-2xl border border-white/8 bg-black/20 p-2"
            >
              <p className="px-2 pb-1 pt-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#d8b75b]">
                Group {group}
              </p>
              {nations.map((nation) => (
                <button
                  key={nation.code}
                  onClick={() => {
                    setSearch("");
                    onSelect(nation);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition ${
                    selected?.code === nation.code
                      ? "bg-[#d8b75b]/15 ring-1 ring-[#d8b75b]/40"
                      : "hover:bg-white/[0.06]"
                  }`}
                >
                  <span className="text-2xl">{nation.flag}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-extrabold">
                    {nation.name}
                  </span>
                  <span className="text-[9px] font-black tracking-widest text-white/30">
                    {nation.code}
                  </span>
                </button>
              ))}
            </section>
          ))}
        </div>
      </div>
    </Modal>
  );
}

function PlayerModal({
  open,
  nation,
  usedIds,
  currentId,
  slotLabel,
  slotCategory,
  onClose,
  onSelect,
}: {
  open: boolean;
  nation: Nation | null;
  usedIds: Set<string>;
  currentId?: string;
  slotLabel: string;
  slotCategory: PositionCategory;
  onClose: () => void;
  onSelect: (player: Player) => void;
}) {
  const [search, setSearch] = useState("");
  const players = nation
    ? getPlayersByNation(nation.name).filter((player) => {
        const query = search.trim().toLowerCase();
        return (
          player.position === slotCategory &&
          (!query ||
            player.name.toLowerCase().includes(query) ||
            player.position.toLowerCase().includes(query) ||
            player.club.toLowerCase().includes(query))
        );
      })
    : [];

  return (
    <Modal open={open} title={`Select ${slotLabel}`} eyebrow={`${nation?.name ?? "Squad"} · ${slotCategory}`} onClose={onClose}>
      <div className="shrink-0 p-4 pb-2">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search players or positions..."
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-[#d8b75b]/60"
          autoFocus
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 pt-1">
        {players.map((player) => {
          const unavailable = usedIds.has(player.id) && currentId !== player.id;
          return (
            <button
              key={player.id}
              disabled={unavailable}
              onClick={() => {
                setSearch("");
                onSelect(player);
              }}
              className="mb-1 flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#1d3427] text-lg font-black text-[#8cf2a7]">
                {player.rating}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-extrabold">{player.name}</span>
                <span className="block truncate text-xs font-bold text-white/35">
                  {player.position} · {player.club}
                </span>
                <span className="text-[10px] font-bold text-white/25">
                  {player.caps} caps · {player.goals} goals
                </span>
              </span>
              {unavailable ? <span className="text-[10px] font-bold uppercase text-white/40">Selected</span> : null}
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

function Pitch({
  formation,
  selections,
  onSlotClick,
}: {
  formation: Formation;
  selections: Record<string, Player>;
  onSlotClick: (id: string) => void;
}) {
  return (
    <div className="pitch relative aspect-[3/4] w-full overflow-hidden rounded-[2rem] border border-emerald-300/20 shadow-[0_30px_90px_rgba(0,0,0,.5)]">
      <div className="pointer-events-none absolute inset-4 rounded-2xl border-2 border-white/25" />
      <div className="pointer-events-none absolute inset-x-4 top-1/2 border-t-2 border-white/25" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[24%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/25" />
      <div className="pointer-events-none absolute left-1/2 top-4 h-[15%] w-[48%] -translate-x-1/2 border-2 border-t-0 border-white/25" />
      <div className="pointer-events-none absolute bottom-4 left-1/2 h-[15%] w-[48%] -translate-x-1/2 border-2 border-b-0 border-white/25" />
      {FORMATION_SLOTS[formation].map((slot) => {
        const player = selections[slot.id];
        return (
          <button
            key={slot.id}
            onClick={() => onSlotClick(slot.id)}
            style={{ top: `${slot.top}%`, left: `${slot.left}%` }}
            className="group absolute z-10 w-[4.5rem] -translate-x-1/2 -translate-y-1/2 sm:w-24"
          >
            <span className={`mx-auto grid h-12 w-12 place-items-center rounded-full border-2 text-sm font-black shadow-lg transition group-hover:scale-105 sm:h-14 sm:w-14 ${
              player
                ? "border-[#f6dc86] bg-[#101713] text-[#f6dc86]"
                : "border-dashed border-white/50 bg-black/25 text-xl text-white/60"
            }`}>
              {player?.rating ?? "+"}
            </span>
            <span className="mt-1 block truncate rounded-lg bg-black/70 px-1.5 py-1 text-[9px] font-black sm:text-[11px]">
              {player ? player.name.split(" ").at(-1) : slot.label}
            </span>
            {player ? <span className="text-[8px] font-bold text-white/60">{slot.label} · {player.position}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

function RatingPanel({ ratings }: { ratings: ReturnType<typeof calculateTeamRatings> }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {[
        ["Overall", ratings.overall],
        ["Attack", ratings.attack],
        ["Midfield", ratings.midfield],
        ["Defense", ratings.defense],
      ].map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-white/8 bg-white/[0.04] px-2 py-3 text-center">
          <p className="text-[8px] font-black uppercase tracking-wider text-white/35 sm:text-[10px]">{label}</p>
          <p className="mt-1 text-xl font-black text-[#f6dc86] sm:text-3xl">{value ?? "–"}</p>
        </div>
      ))}
    </div>
  );
}

function ResultCard({ fixture }: { fixture: TournamentFixture }) {
  return (
    <div
      className={`mb-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl border px-3 py-2 text-xs last:mb-0 ${
        fixture.isUserMatch
          ? "border-[#d8b75b]/30 bg-[#d8b75b]/8"
          : "border-white/5 bg-white/[0.03]"
      }`}
    >
      <span className="truncate font-bold">
        {fixture.home.flag} {fixture.home.name}
      </span>
      <span className="font-black text-[#f6dc86]">
        {fixture.homeGoals} - {fixture.awayGoals}
      </span>
      <span className="truncate text-right font-bold">
        {fixture.away.name} {fixture.away.flag}
      </span>
    </div>
  );
}

function AwardCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
      <p className="text-[9px] font-black uppercase tracking-widest text-white/35">
        {title}
      </p>
      <p className="mt-1 font-black">{value}</p>
      <p className="mt-1 text-[10px] font-bold text-white/30">{detail}</p>
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("landing");
  const [selectedNation, setSelectedNation] = useState<Nation | null>(null);
  const [nationModalOpen, setNationModalOpen] = useState(false);
  const [formation, setFormation] = useState<Formation>("4-3-3");
  const [selections, setSelections] = useState<Record<string, Player>>({});
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [match, setMatch] = useState<SimMatch | null>(null);
  const [revealedEvents, setRevealedEvents] = useState(0);
  const [matchStatus, setMatchStatus] = useState<
    "ready" | "playing" | "paused" | "finished"
  >("ready");
  const [speed, setSpeed] = useState<"normal" | "fast">("normal");
  const [groupOpponents, setGroupOpponents] = useState<Nation[]>([]);
  const [groupTable, setGroupTable] = useState<GroupTableRow[]>([]);
  const [backgroundGroupResults, setBackgroundGroupResults] = useState<
    TournamentFixture[]
  >([]);
  const [userGroupResults, setUserGroupResults] = useState<TournamentFixture[]>(
    [],
  );
  const [bracketRounds, setBracketRounds] = useState<TournamentRoundResults[]>(
    [],
  );
  const [pendingRound, setPendingRound] =
    useState<TournamentRoundResults | null>(null);
  const [groupIndex, setGroupIndex] = useState(0);
  const [stats, setStats] = useState<TournamentStats>(emptyStats);
  const [finish, setFinish] = useState("");
  const [tournamentForm, setTournamentForm] = useState<TournamentForm>({});

  const slots = FORMATION_SLOTS[formation];
  const xi = slots.map((slot) => selections[slot.id]).filter(Boolean);
  const ratings = useMemo(
    () => calculateTeamRatings(slots.map((slot) => selections[slot.id])),
    [selections, slots],
  );
  const currentSlot = slots.find((slot) => slot.id === activeSlot);
  const matchComplete = Boolean(match && revealedEvents >= match.events.length);
  const liveScore = match
    ? getLiveScore(match, revealedEvents)
    : { user: 0, opponent: 0 };
  const awards = useMemo(
    () =>
      selectedNation && bracketRounds.length
        ? createTournamentAwards(bracketRounds, selectedNation, stats.scorers)
        : null,
    [bracketRounds, selectedNation, stats.scorers],
  );
  const selectedGroupCodes = new Set(
    selectedNation
      ? (getGroupForNation(selectedNation.name)?.[1] ?? []).map(
          (nation) => nation.code,
        )
      : [],
  );
  const visibleOtherGroupResults = backgroundGroupResults
    .filter(
      (fixture) =>
        selectedGroupCodes.has(fixture.home.code) &&
        selectedGroupCodes.has(fixture.away.code),
    )
    .slice(0, Math.min(groupIndex + 1, 3));

  useEffect(() => {
    if (
      view !== "simulation" ||
      matchStatus !== "playing" ||
      !match ||
      matchComplete
    ) {
      return;
    }
    const nextEvent = match.events[revealedEvents];
    const delay =
      speed === "fast"
        ? nextEvent?.phase === "outcome"
          ? 350
          : 750
        : nextEvent?.phase === "outcome"
          ? 700
          : 1500 + Math.floor(Math.random() * 500);
    const timer = window.setTimeout(() => {
      const nextCount = Math.min(revealedEvents + 1, match.events.length);
      setRevealedEvents(nextCount);
      if (nextCount >= match.events.length) setMatchStatus("finished");
    }, delay);
    return () => window.clearTimeout(timer);
  }, [
    match,
    matchComplete,
    matchStatus,
    revealedEvents,
    speed,
    view,
  ]);

  const chooseNation = (nation: Nation) => {
    setSelectedNation(nation);
    setNationModalOpen(false);
    setFormation("4-3-3");
    setSelections({});
    setView("builder");
  };

  const changeFormation = (next: Formation) => {
    const currentPlayers = slots
      .map((slot) => selections[slot.id])
      .filter((player): player is Player => Boolean(player));
    const playersByCategory: Record<PositionCategory, Player[]> = {
      GK: currentPlayers.filter((player) => player.position === "GK"),
      DF: currentPlayers.filter((player) => player.position === "DF"),
      MF: currentPlayers.filter((player) => player.position === "MF"),
      FW: currentPlayers.filter((player) => player.position === "FW"),
    };
    const nextSelections: Record<string, Player> = {};
    FORMATION_SLOTS[next].forEach((slot) => {
      const player = playersByCategory[slot.category].shift();
      if (player) nextSelections[slot.id] = player;
    });
    setFormation(next);
    setSelections(nextSelections);
    setActiveSlot(null);
  };

  const startTournament = () => {
    if (!selectedNation || xi.length !== 11 || ratings.overall === null) return;
    const groupEntry = getGroupForNation(selectedNation.name);
    if (!groupEntry) return;
    const [, group] = groupEntry;
    const opponents = group.filter(
      (nation) => nation.code !== selectedNation.code,
    );
    const nextForm = createTournamentForm();
    setTournamentForm(nextForm);
    setGroupOpponents(opponents);
    setGroupTable(createGroupTable(group));
    setGroupIndex(0);
    setStats(emptyStats());
    setBackgroundGroupResults(
      createBackgroundGroupResults(selectedNation, nextForm),
    );
    setUserGroupResults([]);
    setBracketRounds([]);
    setPendingRound(null);
    setMatchStatus("ready");
    setSpeed("normal");
    setFinish("");
    setMatch(
      createMatch(
        "Group Stage",
        opponents[0],
        xi,
        ratings.overall,
        nextForm,
      ),
    );
    setRevealedEvents(0);
    setView("simulation");
  };

  const applyMatch = (played: SimMatch) => {
    const won = played.userGoals > played.opponentGoals;
    const drew = played.userGoals === played.opponentGoals;
    const scorerUpdates: Record<string, number> = {};
    played.events
      .filter((event) => event.isGoal && event.forUser && event.scorer)
      .forEach((event) => {
        if (event.scorer) {
          scorerUpdates[event.scorer] =
            (scorerUpdates[event.scorer] ?? 0) + 1;
        }
      });

    const nextStats: TournamentStats = {
      wins: stats.wins + (won ? 1 : 0),
      draws: stats.draws + (drew ? 1 : 0),
      losses: stats.losses + (!won && !drew ? 1 : 0),
      goalsFor: stats.goalsFor + played.userGoals,
      goalsAgainst: stats.goalsAgainst + played.opponentGoals,
      points: stats.points + (played.round === "Group Stage" ? (won ? 3 : drew ? 1 : 0) : 0),
      scorers: { ...stats.scorers },
      substitutions: [...stats.substitutions, played.userSubstitutions],
    };
    Object.entries(scorerUpdates).forEach(([name, goals]) => {
      nextStats.scorers[name] = (nextStats.scorers[name] ?? 0) + goals;
    });
    setStats(nextStats);
    return nextStats;
  };

  const nextMatch = () => {
    if (!match || !selectedNation || ratings.overall === null) return;
    applyMatch(match);
    const nextTable =
      match.round === "Group Stage"
        ? updateGroupTable(
            groupTable,
            selectedNation,
            match.opponent,
            match.userGoals,
            match.opponentGoals,
          )
        : groupTable;
    if (match.round === "Group Stage") setGroupTable(nextTable);
    const completedGroupFixture: TournamentFixture | null =
      match.round === "Group Stage"
        ? {
            id: `user-group-${groupIndex}`,
            round: "Group Stage",
            home: selectedNation,
            away: match.opponent,
            homeGoals: match.userGoals,
            awayGoals: match.opponentGoals,
            winner:
              match.userGoals === match.opponentGoals
                ? undefined
                : match.userGoals > match.opponentGoals
                  ? selectedNation
                  : match.opponent,
            isUserMatch: true,
          }
        : null;
    const completedUserGroupResults = completedGroupFixture
      ? [...userGroupResults, completedGroupFixture]
      : userGroupResults;
    if (completedGroupFixture) {
      setUserGroupResults(completedUserGroupResults);
    }
    if (match.round === "Group Stage") {
    }

    if (match.round === "Group Stage") {
      if (groupIndex < 2) {
        const nextIndex = groupIndex + 1;
        setGroupIndex(nextIndex);
        const opponent = groupOpponents[nextIndex];
        setMatch(
          createMatch(
            "Group Stage",
            opponent,
            xi,
            ratings.overall,
            tournamentForm,
          ),
        );
        setRevealedEvents(0);
        setMatchStatus("ready");
        return;
      }
      const officialStage = createOfficialGroupStage(
        selectedNation,
        completedUserGroupResults,
        backgroundGroupResults,
        tournamentForm,
      );
      const selectedGroup = getGroupForNation(selectedNation.name)?.[0];
      if (selectedGroup) setGroupTable(officialStage.tables[selectedGroup]);
      const qualified = officialStage.qualifiers.some(
        (team) => team.nation.code === selectedNation.code,
      );
      if (!qualified) {
        setFinish("Group Stage exit");
        const roundOf32 = simulateAutomaticKnockoutRound(
          "Round of 32",
          officialStage.roundOf32,
          tournamentForm,
        );
        setBracketRounds(
          completeOfficialBracket([roundOf32], tournamentForm),
        );
        setView("result");
        return;
      }
      const userRoundOf32 = officialStage.roundOf32.find(
        (fixture) =>
          fixture.home.code === selectedNation.code ||
          fixture.away.code === selectedNation.code,
      );
      if (!userRoundOf32) {
        setFinish("Group Stage exit");
        const roundOf32 = simulateAutomaticKnockoutRound(
          "Round of 32",
          officialStage.roundOf32,
          tournamentForm,
        );
        setBracketRounds(
          completeOfficialBracket([roundOf32], tournamentForm),
        );
        setView("result");
        return;
      }
      const opponent =
        userRoundOf32.home.code === selectedNation.code
          ? userRoundOf32.away
          : userRoundOf32.home;
      const nextMatch = createMatch(
        "Round of 32",
        opponent,
        xi,
        ratings.overall,
        tournamentForm,
      );
      setMatch(nextMatch);
      setPendingRound(
        simulateKnockoutFixtures(
          "Round of 32",
          officialStage.roundOf32,
          selectedNation,
          opponent,
          nextMatch.userGoals,
          nextMatch.opponentGoals,
          tournamentForm,
        ),
      );
      setRevealedEvents(0);
      setMatchStatus("ready");
      return;
    }

    if (!pendingRound) return;
    const completedRound = pendingRound;
    const completedRounds = [...bracketRounds, completedRound];
    setBracketRounds(completedRounds);

    if (match.userGoals < match.opponentGoals) {
      setFinish(
        match.round === "Final" ? "World Cup Runner-up" : `Eliminated in ${match.round}`,
      );
      setBracketRounds(
        completeOfficialBracket(completedRounds, tournamentForm),
      );
      setView("result");
      return;
    }
    if (match.round === "Final") {
      setFinish("World Cup Winners");
      setView("result");
      return;
    }

    const nextRound = createNextOfficialRound(completedRound);
    if (!nextRound) return;
    const userFixture = nextRound.fixtures.find(
      (fixture) =>
        fixture.home.code === selectedNation.code ||
        fixture.away.code === selectedNation.code,
    );
    if (!userFixture) {
      setBracketRounds(
        completeOfficialBracket(completedRounds, tournamentForm),
      );
      setFinish(`Eliminated in ${match.round}`);
      setView("result");
      return;
    }
    const opponent =
      userFixture.home.code === selectedNation.code
        ? userFixture.away
        : userFixture.home;
    const upcomingMatch = createMatch(
      nextRound.round,
      opponent,
      xi,
      ratings.overall,
      tournamentForm,
    );
    setMatch(upcomingMatch);
    setPendingRound(
      simulateKnockoutFixtures(
        nextRound.round,
        nextRound.fixtures,
        selectedNation,
        opponent,
        upcomingMatch.userGoals,
        upcomingMatch.opponentGoals,
        tournamentForm,
      ),
    );
    setRevealedEvents(0);
    setMatchStatus("ready");
  };

  const playAgain = () => {
    setMatch(null);
    setStats(emptyStats());
    setFinish("");
    setBracketRounds([]);
    setPendingRound(null);
    setUserGroupResults([]);
    setView("builder");
  };

  const changeNation = () => {
    setView("landing");
    setSelectedNation(null);
    setSelections({});
    setNationModalOpen(true);
  };

  const topScorer = Object.entries(stats.scorers).sort((a, b) => b[1] - a[1])[0];
  const mvp = [...xi].sort((a, b) => b.rating - a.rating)[0];
  const averageSubstitutions = stats.substitutions.length
    ? (
        stats.substitutions.reduce((sum, count) => sum + count, 0) /
        stats.substitutions.length
      ).toFixed(1)
    : "0.0";

  return (
    <main className="stadium-bg min-h-screen overflow-hidden text-white">
      {view === "landing" ? (
        <section className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6 sm:px-10">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full border border-[#d8b75b]/50 bg-[#d8b75b]/10 font-black text-[#f6dc86]">W</span>
              <span className="text-sm font-black uppercase tracking-[0.15em]">World Cup Simulator</span>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-white/50">Version 0.1</span>
          </nav>

          <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
            <div className="mb-7 grid h-28 w-28 place-items-center rounded-full border border-[#d8b75b]/30 bg-[#d8b75b]/5 shadow-[0_0_80px_rgba(216,183,91,.2)]">
              <div className="ball-mark h-16 w-16 rounded-full border-2 border-[#f6dc86]" />
            </div>
            <p className="mb-4 text-xs font-black uppercase tracking-[0.4em] text-[#d8b75b]">Your nation. Your legacy.</p>
            <h1 className="max-w-4xl text-5xl font-black uppercase leading-[0.88] tracking-[-0.055em] sm:text-7xl lg:text-8xl">
              World Cup<br /><span className="text-gradient">Simulator</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-white/55 sm:text-lg">
              Pick your nation. Build your XI. Simulate the tournament.
            </p>
            <button
              onClick={() => setNationModalOpen(true)}
              className="mt-9 rounded-2xl bg-[#d8b75b] px-8 py-4 text-sm font-black uppercase tracking-[0.16em] text-[#10130f] shadow-[0_15px_50px_rgba(216,183,91,.25)] transition hover:-translate-y-1 hover:bg-[#f6dc86]"
            >
              Choose Nation <span className="ml-2">→</span>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-5 text-center text-[9px] font-black uppercase tracking-widest text-white/30">
            <span>{NATIONS.length} nations</span><span>12 groups</span><span>Chase glory</span>
          </div>
        </section>
      ) : null}

      {view === "builder" && selectedNation ? (
        <section className="mx-auto min-h-screen max-w-6xl px-4 py-5 sm:px-8">
          <header className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#d8b75b]">World Cup Simulator</p>
              <h1 className="text-xl font-black sm:text-2xl">Build your starting XI</h1>
            </div>
            <button onClick={() => setNationModalOpen(true)} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-black hover:bg-white/10">
              <span className="text-xl">{selectedNation.flag}</span><span className="hidden sm:inline">{selectedNation.name}</span>
            </button>
          </header>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div>
              <div className="mb-3 flex gap-2 overflow-x-auto pb-2">
                {FORMATIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => changeFormation(option)}
                    className={`shrink-0 rounded-xl px-3 py-2 text-xs font-black transition ${
                      formation === option ? "bg-[#d8b75b] text-black" : "border border-white/10 bg-white/5 text-white/60 hover:text-white"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <Pitch formation={formation} selections={selections} onSlotClick={setActiveSlot} />
            </div>

            <aside className="flex flex-col gap-4 lg:pt-12">
              <div className="rounded-[1.75rem] border border-white/10 bg-[#101713]/90 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-xs font-black uppercase tracking-[0.18em] text-white/50">Team ratings</h2>
                  <span className="text-xs font-black text-[#8cf2a7]">{ratings.filled}/11</span>
                </div>
                <RatingPanel ratings={ratings} />
              </div>
              <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5">
                <p className="text-xs leading-5 text-white/45">
                  Tap any position on the pitch to select or replace a player. Every rating updates live.
                </p>
              </div>
              <button
                disabled={ratings.filled !== 11}
                onClick={startTournament}
                className="rounded-2xl bg-[#d8b75b] px-5 py-4 text-sm font-black uppercase tracking-[0.12em] text-black transition hover:bg-[#f6dc86] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/25"
              >
                {ratings.filled === 11 ? "Simulate World Cup →" : `Select ${11 - ratings.filled} more players`}
              </button>
            </aside>
          </div>
        </section>
      ) : null}

      {view === "simulation" && selectedNation && match ? (
        <section className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-6 sm:px-8">
          <header className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#d8b75b]">{match.round}</p>
              <h1 className="text-2xl font-black">Matchday</h1>
            </div>
            <span className="rounded-xl bg-white/5 px-3 py-2 text-xs font-black text-white/50">
              {match.round === "Group Stage"
                ? `Group ${getGroupForNation(selectedNation.name)?.[0]}`
                : "Knockout"}
            </span>
          </header>

          <div className="rounded-[2rem] border border-white/10 bg-[#101713]/95 p-5 shadow-2xl sm:p-8">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
              <div>
                <span className="text-5xl">{selectedNation.flag}</span>
                <h2 className="mt-2 text-lg font-black">{selectedNation.name}</h2>
              </div>
              <div className="text-xs font-black uppercase tracking-[0.2em] text-white/25">vs</div>
              <div>
                <span className="text-5xl">{match.opponent.flag}</span>
                <h2 className="mt-2 text-lg font-black">{match.opponent.name}</h2>
              </div>
            </div>

            <div className="my-7 rounded-2xl border border-white/8 bg-black/25 px-3 py-5 text-center">
              <p className="flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#8cf2a7]">
                {!matchComplete && matchStatus === "playing" ? (
                  <span className="live-dot h-2 w-2 rounded-full bg-[#8cf2a7]" />
                ) : null}
                {matchComplete
                  ? "Full time"
                  : matchStatus === "paused"
                    ? "Paused"
                    : matchStatus === "ready"
                      ? "Ready for kick-off"
                      : "Live score"}
              </p>
              <p className="mt-2 text-xl font-black sm:text-3xl">
                {selectedNation.name} {liveScore.user}
                <span className="px-2 text-white/25">-</span>
                {liveScore.opponent} {match.opponent.name}
              </p>
            </div>

            <div className="min-h-60 space-y-2">
              {match.events.slice(0, revealedEvents).map((event, index) => (
                <div
                  key={`${event.minute}-${index}`}
                  className={`event-in rounded-2xl border px-4 py-3 text-sm font-bold ${
                    event.isGoal
                      ? event.forUser
                        ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                        : "border-red-300/15 bg-red-300/10 text-red-100"
                      : "border-white/5 bg-white/[0.035] text-white/55"
                  }`}
                >
                  {event.text}
                </div>
              ))}
              {revealedEvents === 0 ? (
                <p className="pt-16 text-center text-sm text-white/30">
                  {matchStatus === "ready"
                    ? "The teams are in the tunnel."
                    : "The whistle blows..."}
                </p>
              ) : null}
            </div>
          </div>

          {!matchComplete ? (
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {matchStatus === "ready" ? (
                <button
                  onClick={() => setMatchStatus("playing")}
                  className="col-span-2 rounded-2xl bg-[#d8b75b] px-5 py-4 text-sm font-black uppercase tracking-[0.14em] text-black sm:col-span-1"
                >
                  Start
                </button>
              ) : matchStatus === "playing" ? (
                <button
                  onClick={() => setMatchStatus("paused")}
                  className="rounded-2xl bg-[#d8b75b] px-5 py-4 text-sm font-black uppercase tracking-[0.14em] text-black"
                >
                  Pause
                </button>
              ) : (
                <button
                  onClick={() => setMatchStatus("playing")}
                  className="rounded-2xl bg-[#d8b75b] px-5 py-4 text-sm font-black uppercase tracking-[0.14em] text-black"
                >
                  Resume
                </button>
              )}
              <button
                onClick={() =>
                  setSpeed((current) =>
                    current === "normal" ? "fast" : "normal",
                  )
                }
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-wider"
              >
                Speed: {speed === "normal" ? "Normal" : "Fast"}
              </button>
              <span className="grid place-items-center rounded-2xl border border-white/8 bg-black/20 px-3 text-xs font-black text-white/45">
                Auto subs {match.userSubstitutions}
              </span>
            </div>
          ) : null}

          {match.round === "Group Stage" ? (
            <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-[#101713]/90">
              <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                <h2 className="text-[10px] font-black uppercase tracking-[0.18em] text-[#d8b75b]">
                  Group table
                </h2>
                <span className="text-[9px] font-bold text-white/30">P · GD · PTS</span>
              </div>
              {groupTable.map((row, index) => (
                <div
                  key={row.nation.code}
                  className={`grid grid-cols-[1.5rem_1fr_2rem_2rem_2rem] items-center gap-2 border-b border-white/5 px-4 py-2.5 text-xs last:border-0 ${
                    row.nation.code === selectedNation.code ? "bg-[#d8b75b]/8" : ""
                  }`}
                >
                  <span className="text-white/30">{index + 1}</span>
                  <span className="truncate font-bold">
                    {row.nation.flag} {row.nation.name}
                  </span>
                  <span className="text-center text-white/45">{row.played}</span>
                  <span className="text-center text-white/45">
                    {row.goalsFor - row.goalsAgainst}
                  </span>
                  <span className="text-center font-black text-[#f6dc86]">{row.points}</span>
                </div>
              ))}
            </div>
          ) : null}

          {matchComplete && match.round === "Group Stage" ? (
            <section className="mt-5 rounded-2xl border border-white/10 bg-[#101713]/90 p-4">
              <h2 className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#d8b75b]">
                Group results
              </h2>
              <ResultCard
                fixture={{
                  id: `current-${groupIndex}`,
                  round: "Group Stage",
                  home: selectedNation,
                  away: match.opponent,
                  homeGoals: match.userGoals,
                  awayGoals: match.opponentGoals,
                  winner:
                    match.userGoals === match.opponentGoals
                      ? undefined
                      : match.userGoals > match.opponentGoals
                        ? selectedNation
                        : match.opponent,
                  isUserMatch: true,
                }}
              />
              {visibleOtherGroupResults.map((fixture) => (
                <ResultCard key={fixture.id} fixture={fixture} />
              ))}
            </section>
          ) : null}

          {match.round !== "Group Stage" ? (
            <section className="mt-5 rounded-2xl border border-white/10 bg-[#101713]/90 p-4">
              <h2 className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#d8b75b]">
                Tournament bracket
              </h2>
              <TournamentBracket
                rounds={
                  matchComplete && pendingRound
                    ? [...bracketRounds, pendingRound]
                    : bracketRounds
                }
                selectedNationCode={selectedNation.code}
              />
            </section>
          ) : null}

          {matchComplete ? (
            <button
              onClick={nextMatch}
              className="mt-5 rounded-2xl bg-[#d8b75b] px-5 py-4 text-sm font-black uppercase tracking-[0.14em] text-black transition hover:bg-[#f6dc86]"
            >
              Next Match →
            </button>
          ) : null}
        </section>
      ) : null}

      {view === "result" && selectedNation ? (
        <section className="mx-auto min-h-screen max-w-6xl px-4 py-10 sm:px-8">
          <div className="w-full rounded-[2.25rem] border border-[#d8b75b]/20 bg-[#101713]/95 p-5 text-center shadow-2xl sm:p-9">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d8b75b]">Tournament complete</p>
            <span className="mt-5 block text-7xl">{selectedNation.flag}</span>
            <h1 className="mt-3 text-3xl font-black">{selectedNation.name}</h1>
            <div className="mx-auto mt-3 inline-block rounded-full bg-[#d8b75b]/10 px-4 py-2 text-sm font-black uppercase tracking-wider text-[#f6dc86]">
              {finish}
            </div>

            {awards ? (
              <div className="mt-8 rounded-2xl border border-[#d8b75b]/15 bg-[#d8b75b]/5 p-5">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#d8b75b]">
                  World Cup winner
                </p>
                <p className="mt-2 text-2xl font-black">
                  {awards.winner.flag} {awards.winner.name}
                </p>
                <p className="mt-1 text-xs text-white/45">
                  Final: {awards.winner.name} {awards.finalScore} {awards.runnerUp.name}
                </p>
              </div>
            ) : null}

            <div className="mt-8 grid grid-cols-3 gap-2 sm:grid-cols-6">
              <div className="result-stat"><b>{stats.wins}</b><span>Wins</span></div>
              <div className="result-stat"><b>{stats.draws}</b><span>Draws</span></div>
              <div className="result-stat"><b>{stats.losses}</b><span>Losses</span></div>
              <div className="result-stat"><b>{stats.goalsFor}</b><span>Goals for</span></div>
              <div className="result-stat"><b>{stats.goalsAgainst}</b><span>Against</span></div>
              <div className="result-stat"><b>{averageSubstitutions}</b><span>Avg subs</span></div>
            </div>

            <div className="mt-4 grid gap-2 text-left sm:grid-cols-2">
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/35">Top scorer</p>
                <p className="mt-1 font-black">{topScorer ? `${topScorer[0]} · ${topScorer[1]} goals` : "No goals scored"}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/35">Tournament MVP</p>
                <p className="mt-1 font-black">{mvp?.name ?? "–"} · {mvp?.rating ?? "–"}</p>
              </div>
            </div>

            {awards ? (
              <div className="mt-5 grid gap-2 text-left sm:grid-cols-2 lg:grid-cols-4">
                <AwardCard
                  title="Golden Boot"
                  value={`${awards.goldenBoot.name} · ${awards.goldenBoot.goals} goals`}
                  detail={awards.goldenBoot.nation}
                />
                <AwardCard
                  title="Player of the Tournament"
                  value={awards.playerOfTournament.name}
                  detail={awards.playerOfTournament.nation}
                />
                <AwardCard
                  title="Best Goalkeeper"
                  value={awards.bestGoalkeeper.name}
                  detail={awards.bestGoalkeeper.nation}
                />
                <AwardCard
                  title="Best Young Player"
                  value={awards.bestYoungPlayer.name}
                  detail={awards.bestYoungPlayer.nation}
                />
              </div>
            ) : null}

            <div className="mt-7 text-left">
              <h2 className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#d8b75b]">
                Full tournament bracket
              </h2>
              <TournamentBracket
                rounds={bracketRounds}
                selectedNationCode={selectedNation.code}
              />
            </div>

            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              <button onClick={playAgain} className="rounded-2xl bg-[#d8b75b] px-4 py-3 text-xs font-black uppercase tracking-wider text-black hover:bg-[#f6dc86]">Play Again</button>
              <button onClick={changeNation} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-wider hover:bg-white/10">Change Nation</button>
              <button
                onClick={() => navigator.clipboard?.writeText(`${selectedNation.name}: ${finish} in World Cup Simulator`)}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-wider hover:bg-white/10"
              >
                Share Result
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <NationModal
        open={nationModalOpen}
        selected={selectedNation}
        onClose={() => setNationModalOpen(false)}
        onSelect={chooseNation}
      />
      <PlayerModal
        open={activeSlot !== null}
        nation={selectedNation}
        usedIds={new Set(Object.values(selections).map((player) => player.id))}
        currentId={activeSlot ? selections[activeSlot]?.id : undefined}
        slotLabel={currentSlot?.label ?? "Player"}
        slotCategory={currentSlot?.category ?? "FW"}
        onClose={() => setActiveSlot(null)}
        onSelect={(player) => {
          if (!activeSlot) return;
          setSelections((current) => ({ ...current, [activeSlot]: player }));
          setActiveSlot(null);
        }}
      />
    </main>
  );
}
