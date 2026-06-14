"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { TournamentBracket } from "./components/TournamentBracket";
import {
  LeaderboardModal,
  SaveToLeaderboardModal,
} from "./components/Leaderboard";
import { ShareResult } from "./components/ShareResult";
import {
  createLeaderboardEntry,
  saveLeaderboardEntry,
} from "./lib/leaderboard";
import { generateRandomXI } from "./lib/random-xi";
import {
  calculateWorldCupScore,
  getDefeatedOpponents,
} from "./lib/score";
import {
  FORMATION_SLOTS,
  NATIONS,
  WORLD_CUP_GROUPS,
  getGroupForNation,
} from "./lib/data";
import { getPlayersByNation } from "../data/players";
import { calculateTeamRatings } from "./lib/ratings";
import { getNationFlag } from "./lib/flags";
import {
  createGroupTable,
  createMatch,
  getGroupMatchdayFixtures,
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
  type OfficialGroupStage,
  type TournamentStats,
  type TournamentFixture,
  type TournamentRoundResults,
} from "./lib/types";

type View = "landing" | "builder" | "overview" | "simulation" | "result";
type OverviewType = "group-complete" | "round-intro";
type MatchScreenSnapshot = {
  view: View;
  match: SimMatch | null;
  groupIndex: number;
  groupTable: GroupTableRow[];
  pendingRound: TournamentRoundResults | null;
  bracketRounds: TournamentRoundResults[];
  overviewType: OverviewType | null;
  revealedEvents: number;
  matchStatus: "ready" | "playing" | "paused" | "finished";
};

const PRIMARY_FORMATIONS: Formation[] = ["4-3-3", "4-4-2", "4-2-3-1"];

const emptyStats = (): TournamentStats => ({
  wins: 0,
  draws: 0,
  losses: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  points: 0,
  scorers: {},
});

const nextRoundLabel = (round: SimMatch["round"]) =>
  ({
    "Group Stage": "Round of 32",
    "Round of 32": "Round of 16",
    "Round of 16": "Quarter-final",
    "Quarter-final": "Semi-final",
    "Semi-final": "Final",
    Final: "Tournament Overview",
  })[round];

const bracketPreviewRound = (
  round: TournamentRoundResults,
): TournamentRoundResults => ({
  ...round,
  fixtures: round.fixtures.map((fixture) => ({
    ...fixture,
    homeGoals: 0,
    awayGoals: 0,
    winner: undefined,
    isUpset: false,
  })),
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
        className="relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#101713] shadow-2xl sm:max-h-[80vh] sm:rounded-[1.75rem]"
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
            className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5 text-xl text-white/70 hover:bg-white/10 hover:text-white"
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
          className="min-h-11 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-[#d8b75b]/60"
          autoFocus
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 pt-1">
        <div className="grid gap-3 min-[420px]:grid-cols-2">
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
                  className={`flex min-h-11 w-full items-center gap-3 rounded-xl p-2.5 text-left transition ${
                    selected?.code === nation.code
                      ? "bg-[#d8b75b]/15 ring-1 ring-[#d8b75b]/40"
                      : "hover:bg-white/[0.06]"
                  }`}
                >
                  <span className="text-2xl">{getNationFlag(nation.name)}</span>
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
  slotLabel,
  slotCategory,
  onClose,
  onSelect,
}: {
  open: boolean;
  nation: Nation | null;
  usedIds: Set<string>;
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
          className="min-h-11 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-[#d8b75b]/60"
          autoFocus
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 pt-1">
        {players.map((player) => {
          const inXI = usedIds.has(player.id);
          return (
            <button
              key={player.id}
              onClick={() => {
                setSearch("");
                onSelect(player);
              }}
              className="mb-1 flex min-h-16 w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-white/[0.06]"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#1d3427] text-xs font-black text-[#8cf2a7]">
                {player.position}
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
              {inXI ? <span className="text-[10px] font-bold uppercase text-white/40">In XI</span> : null}
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
    <div className="pitch-wrapper mx-auto w-full max-w-full min-w-0 overflow-hidden sm:max-w-xl">
      <div className="pitch relative aspect-[3/4] w-full max-w-full overflow-hidden rounded-[1.5rem] border border-emerald-300/20 shadow-[0_30px_90px_rgba(0,0,0,.5)] sm:rounded-[2rem]">
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
              className="player-slot group absolute z-10 min-h-11 w-16 sm:w-24"
            >
              <span className={`mx-auto grid h-12 w-12 place-items-center rounded-full border-2 text-sm font-black shadow-lg transition group-hover:scale-105 sm:h-14 sm:w-14 ${
                player
                  ? "border-[#f6dc86] bg-[#101713] text-[#f6dc86]"
                  : "border-dashed border-white/50 bg-black/25 text-xl text-white/60"
              }`}>
                {player ? player.position : "+"}
              </span>
              <span className="mt-1 block truncate rounded-lg bg-black/70 px-1.5 py-1 text-[9px] font-black sm:text-[11px]">
                {player ? player.name.split(" ").at(-1) : slot.label}
              </span>
              {player ? <span className="text-[8px] font-bold text-white/60">{slot.label} · {player.position}</span> : null}
            </button>
          );
        })}
      </div>
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
        {getNationFlag(fixture.home.name)} {fixture.home.name}
      </span>
      <span className="font-black text-[#f6dc86]">
        {fixture.homeGoals} - {fixture.awayGoals}
      </span>
      <span className="truncate text-right font-bold">
        {fixture.away.name} {getNationFlag(fixture.away.name)}
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
  const [overviewType, setOverviewType] = useState<OverviewType | null>(null);
  const [groupStageOverview, setGroupStageOverview] =
    useState<OfficialGroupStage | null>(null);
  const [groupIndex, setGroupIndex] = useState(0);
  const [stats, setStats] = useState<TournamentStats>(emptyStats);
  const [finish, setFinish] = useState("");
  const [tournamentForm, setTournamentForm] = useState<TournamentForm>({});
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [saveLeaderboardOpen, setSaveLeaderboardOpen] = useState(false);
  const [leaderboardSaved, setLeaderboardSaved] = useState(false);
  const [showAllFormations, setShowAllFormations] = useState(false);
  const [previousResult, setPreviousResult] =
    useState<MatchScreenSnapshot | null>(null);
  const [resumeSnapshot, setResumeSnapshot] =
    useState<MatchScreenSnapshot | null>(null);
  const [reviewingPrevious, setReviewingPrevious] = useState(false);
  const eventFeedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.location.search.includes("simulator=1")) {
      const timer = window.setTimeout(() => setNationModalOpen(true), 0);
      return () => window.clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view, leaderboardOpen, nationModalOpen]);

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
  const currentEvent =
    revealedEvents > 0 ? match?.events[revealedEvents - 1] : undefined;
  const matchMinute = matchComplete ? 90 : currentEvent?.minute ?? 0;
  const awards = useMemo(
    () =>
      selectedNation && bracketRounds.length
        ? createTournamentAwards(bracketRounds, selectedNation, stats.scorers)
        : null,
    [bracketRounds, selectedNation, stats.scorers],
  );
  const currentGroupMatchday =
    selectedNation && match?.round === "Group Stage"
      ? getGroupMatchdayFixtures(
          getGroupForNation(selectedNation.name)?.[1] ?? [],
          selectedNation,
          groupIndex,
        )
      : null;
  const visibleOtherGroupResult = currentGroupMatchday
    ? backgroundGroupResults.find(
        (fixture) =>
          [fixture.home.code, fixture.away.code].sort().join("-") ===
          currentGroupMatchday.otherFixture
            .map((nation) => nation.code)
            .sort()
            .join("-"),
      )
    : undefined;
  const visibleGroupTable =
    matchComplete &&
    match?.round === "Group Stage" &&
    selectedNation &&
    visibleOtherGroupResult
      ? updateGroupTable(
          groupTable,
          selectedNation,
          match.opponent,
          match.userGoals,
          match.opponentGoals,
          visibleOtherGroupResult,
        )
      : groupTable;

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

  useEffect(() => {
    const feed = eventFeedRef.current;
    if (feed) feed.scrollTop = feed.scrollHeight;
  }, [revealedEvents]);

  const scrollToTop = () => {
    window.requestAnimationFrame(() => window.scrollTo(0, 0));
  };

  const captureMatchScreen = (): MatchScreenSnapshot => ({
    view,
    match,
    groupIndex,
    groupTable,
    pendingRound,
    bracketRounds,
    overviewType,
    revealedEvents,
    matchStatus,
  });

  const restoreMatchScreen = (snapshot: MatchScreenSnapshot) => {
    setMatch(snapshot.match);
    setGroupIndex(snapshot.groupIndex);
    setGroupTable(snapshot.groupTable);
    setPendingRound(snapshot.pendingRound);
    setBracketRounds(snapshot.bracketRounds);
    setOverviewType(snapshot.overviewType);
    setRevealedEvents(snapshot.revealedEvents);
    setMatchStatus(snapshot.matchStatus);
    setView(snapshot.view);
    scrollToTop();
  };

  const viewPreviousResult = () => {
    if (!previousResult || reviewingPrevious) return;
    setResumeSnapshot(captureMatchScreen());
    setReviewingPrevious(true);
    restoreMatchScreen(previousResult);
  };

  const returnFromPreviousResult = () => {
    if (!resumeSnapshot) return;
    const nextScreen = resumeSnapshot;
    setReviewingPrevious(false);
    setResumeSnapshot(null);
    restoreMatchScreen(nextScreen);
  };

  const chooseNation = (nation: Nation) => {
    setSelectedNation(nation);
    setNationModalOpen(false);
    setFormation("4-3-3");
    setShowAllFormations(false);
    setSelections({});
    setView("builder");
    scrollToTop();
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
    const opponents = [0, 1, 2].map((matchdayIndex) => {
      const { userFixture } = getGroupMatchdayFixtures(
        group,
        selectedNation,
        matchdayIndex,
      );
      return userFixture.find(
        (nation) => nation.code !== selectedNation.code,
      )!;
    });
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
    setOverviewType(null);
    setGroupStageOverview(null);
    setPreviousResult(null);
    setResumeSnapshot(null);
    setReviewingPrevious(false);
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
    scrollToTop();
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
    };
    Object.entries(scorerUpdates).forEach(([name, goals]) => {
      nextStats.scorers[name] = (nextStats.scorers[name] ?? 0) + goals;
    });
    setStats(nextStats);
    return nextStats;
  };

  const nextMatch = () => {
    if (!match || !selectedNation || ratings.overall === null) return;
    setPreviousResult({
      ...captureMatchScreen(),
      view: "simulation",
      revealedEvents: match.events.length,
      matchStatus: "finished",
    });
    applyMatch(match);
    const groupMatchday =
      match.round === "Group Stage"
        ? getGroupMatchdayFixtures(
            getGroupForNation(selectedNation.name)?.[1] ?? [],
            selectedNation,
            groupIndex,
          )
        : null;
    const otherGroupFixture = groupMatchday
      ? backgroundGroupResults.find(
          (fixture) =>
            [fixture.home.code, fixture.away.code].sort().join("-") ===
            groupMatchday.otherFixture
              .map((nation) => nation.code)
              .sort()
              .join("-"),
        )
      : undefined;
    const nextTable =
      match.round === "Group Stage" && otherGroupFixture
        ? updateGroupTable(
            groupTable,
            selectedNation,
            match.opponent,
            match.userGoals,
            match.opponentGoals,
            otherGroupFixture,
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
        scrollToTop();
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
      setGroupStageOverview(officialStage);
      const qualified = officialStage.qualifiers.some(
        (team) => team.nation.code === selectedNation.code,
      );
      if (!qualified) {
        setFinish("Group Stage exit");
        setMatch(null);
        setPendingRound(null);
        setOverviewType("group-complete");
        setView("overview");
        scrollToTop();
        return;
      }
      const userRoundOf32 = officialStage.roundOf32.find(
        (fixture) =>
          fixture.home.code === selectedNation.code ||
          fixture.away.code === selectedNation.code,
      );
      if (!userRoundOf32) {
        setFinish("Group Stage exit");
        setMatch(null);
        setPendingRound(null);
        setOverviewType("group-complete");
        setView("overview");
        scrollToTop();
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
      setOverviewType("group-complete");
      setView("overview");
      scrollToTop();
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
      scrollToTop();
      return;
    }
    if (match.round === "Final") {
      setFinish("World Cup Winners");
      setView("result");
      scrollToTop();
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
      scrollToTop();
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
    setOverviewType("round-intro");
    setView("overview");
    scrollToTop();
  };

  const continueFromOverview = () => {
    if (!selectedNation) return;
    if (overviewType === "group-complete" && !match && groupStageOverview) {
      const roundOf32 = simulateAutomaticKnockoutRound(
        "Round of 32",
        groupStageOverview.roundOf32,
        tournamentForm,
      );
      setBracketRounds(completeOfficialBracket([roundOf32], tournamentForm));
      setOverviewType(null);
      setView("result");
      scrollToTop();
      return;
    }
    if (!match) return;
    setOverviewType(null);
    setMatchStatus("ready");
    setView("simulation");
    scrollToTop();
  };

  const playAgain = () => {
    setMatch(null);
    setStats(emptyStats());
    setFinish("");
    setBracketRounds([]);
    setPendingRound(null);
    setOverviewType(null);
    setGroupStageOverview(null);
    setUserGroupResults([]);
    setLeaderboardSaved(false);
    setView("builder");
    setPreviousResult(null);
    setResumeSnapshot(null);
    setReviewingPrevious(false);
    scrollToTop();
  };

  const changeNation = () => {
    setView("landing");
    setSelectedNation(null);
    setSelections({});
    setOverviewType(null);
    setGroupStageOverview(null);
    setLeaderboardSaved(false);
    setNationModalOpen(true);
    setPreviousResult(null);
    setResumeSnapshot(null);
    setReviewingPrevious(false);
    scrollToTop();
  };

  const goHome = () => {
    setNationModalOpen(false);
    setActiveSlot(null);
    setView("landing");
    scrollToTop();
  };

  const topScorer = Object.entries(stats.scorers).sort((a, b) => b[1] - a[1])[0];
  const mvp = [...xi].sort((a, b) => b.rating - a.rating)[0];
  const defeatedOpponents = useMemo(
    () =>
      selectedNation
        ? getDefeatedOpponents(
            selectedNation,
            userGroupResults,
            bracketRounds,
          )
        : [],
    [selectedNation, userGroupResults, bracketRounds],
  );
  const worldCupScore = useMemo(() => {
    if (view !== "result" || !finish) return null;
    return calculateWorldCupScore({
      finish,
      stats,
      awards,
      topScorerName: topScorer?.[0],
      mvpName: mvp?.name,
      defeatedOpponents,
    });
  }, [
    view,
    finish,
    stats,
    awards,
    topScorer,
    mvp,
    defeatedOpponents,
  ]);

  const saveToLeaderboard = (displayName: string) => {
    if (!selectedNation || !worldCupScore || !finish) return;
    saveLeaderboardEntry(
      createLeaderboardEntry({
        name: displayName,
        nation: selectedNation.name,
        nationFlag: getNationFlag(selectedNation.name),
        finish,
        score: worldCupScore.score,
        scoreTitle: worldCupScore.title,
        record: `${stats.wins}W · ${stats.draws}D · ${stats.losses}L`,
        goalsFor: stats.goalsFor,
        goalsAgainst: stats.goalsAgainst,
        topScorer: topScorer?.[0] ?? "–",
        mvp: mvp?.name ?? "–",
      }),
    );
    setLeaderboardSaved(true);
    setSaveLeaderboardOpen(false);
  };

  return (
    <main className="stadium-bg min-h-screen w-full max-w-full overflow-x-hidden text-white">
      {view !== "landing" ? (
        <nav className="mobile-safe-nav no-print fixed inset-x-2 bottom-2 z-40 grid max-w-full grid-cols-4 gap-1 rounded-2xl border border-white/10 bg-[#07100b]/95 p-1.5 shadow-2xl backdrop-blur sm:inset-x-auto sm:bottom-auto sm:right-3 sm:top-3 sm:flex sm:gap-2">
          <button onClick={goHome} className="min-h-11 min-w-0 rounded-xl px-1 py-2 text-[9px] font-black uppercase tracking-normal text-white/55 hover:bg-white/5 hover:text-white sm:px-3 sm:text-[10px] sm:tracking-wider">
            Home
          </button>
          <button
            onClick={() => {
              setNationModalOpen(true);
              scrollToTop();
            }}
            className={`min-h-11 min-w-0 rounded-xl px-1 py-2 text-[9px] font-black uppercase tracking-normal hover:bg-white/10 sm:px-3 sm:text-[10px] sm:tracking-wider ${
              leaderboardOpen
                ? "text-white/55"
                : "bg-white/5 text-white"
            }`}
          >
            <span className="sm:hidden">Sim</span>
            <span className="hidden sm:inline">Simulator</span>
          </button>
          <button
            onClick={() => {
              setLeaderboardOpen(true);
              scrollToTop();
            }}
            className={`min-h-11 min-w-0 rounded-xl px-1 py-2 text-[9px] font-black uppercase tracking-normal hover:bg-white/5 sm:px-3 sm:text-[10px] sm:tracking-wider ${
              leaderboardOpen ? "bg-[#d8b75b]/15 text-[#f6dc86]" : "text-white/55"
            }`}
          >
            <span className="sm:hidden">Board</span>
            <span className="hidden sm:inline">Leaderboard</span>
          </button>
          <Link href="/wall-chart" className="flex min-h-11 min-w-0 items-center justify-center rounded-xl px-1 py-2 text-center text-[9px] font-black uppercase tracking-normal text-white/55 hover:bg-white/5 sm:bg-[#d8b75b]/10 sm:px-3 sm:text-[10px] sm:tracking-wider sm:text-[#f6dc86]">
            <span className="sm:hidden">Overview</span>
            <span className="hidden sm:inline">Overview</span>
          </Link>
        </nav>
      ) : null}
      {view === "landing" ? (
        <section className="relative mx-auto flex min-h-screen w-full max-w-6xl min-w-0 flex-col px-5 py-6 sm:px-10">
          <nav className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full border border-[#d8b75b]/50 bg-[#d8b75b]/10 font-black text-[#f6dc86]">W</span>
              <span className="truncate text-[11px] font-black uppercase tracking-[0.1em] sm:text-sm sm:tracking-[0.15em]">World Cup Simulator</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLeaderboardOpen(true)}
                className="min-h-11 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[9px] font-black uppercase tracking-[0.12em] text-white/50 hover:bg-white/10 hover:text-white/70 sm:min-h-0 sm:py-1.5 sm:tracking-[0.18em]"
              >
                Leaderboard
              </button>
              <span className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-white/50 sm:inline">Version 0.1</span>
            </div>
          </nav>

          <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
            <div className="mb-7 grid h-28 w-28 place-items-center rounded-full border border-[#d8b75b]/30 bg-[#d8b75b]/5 shadow-[0_0_80px_rgba(216,183,91,.2)]">
              <div className="ball-mark h-16 w-16 rounded-full border-2 border-[#f6dc86]" />
            </div>
            <p className="mb-4 text-xs font-black uppercase tracking-[0.4em] text-[#d8b75b]">Your nation. Your legacy.</p>
            <h1 className="max-w-4xl text-4xl font-black uppercase leading-[0.9] tracking-[-0.045em] sm:text-7xl sm:leading-[0.88] sm:tracking-[-0.055em] lg:text-8xl">
              World Cup<br /><span className="text-gradient">Simulator</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-white/55 sm:text-lg">
              Pick your nation. Build your XI. Simulate the tournament.
            </p>
            <div className="mt-9 grid w-full max-w-2xl min-w-0 gap-3 sm:grid-cols-2">
              <div className="min-w-0 rounded-[1.5rem] border border-[#d8b75b]/25 bg-[#d8b75b]/8 p-5 text-left">
                <h2 className="font-black">World Cup Simulator</h2>
                <p className="mt-2 min-h-10 text-xs leading-5 text-white/45">Build your XI and simulate the tournament.</p>
                <button onClick={() => setNationModalOpen(true)} className="mt-4 min-h-11 w-full rounded-xl bg-[#d8b75b] px-4 py-3 text-xs font-black uppercase tracking-wider text-black">Start Simulator</button>
              </div>
              <div className="min-w-0 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 text-left">
                <h2 className="font-black">World Cup Wall Chart</h2>
                <p className="mt-2 min-h-10 text-xs leading-5 text-white/45">Fill in results, track tables and complete the bracket.</p>
                <Link href="/wall-chart" className="mt-4 flex min-h-11 w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-xs font-black uppercase tracking-wider">Open Wall Chart</Link>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-5 text-center text-[9px] font-black uppercase tracking-widest text-white/30">
            <span>{NATIONS.length} nations</span><span>12 groups</span><span>Chase glory</span>
          </div>
        </section>
      ) : null}

      {view === "builder" && selectedNation ? (
        <section className="simulator-builder mx-auto min-h-screen w-full max-w-6xl min-w-0 overflow-x-hidden px-4 py-5 pb-24 sm:px-8 sm:pb-5">
          <header className="mb-6 flex min-w-0 items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#d8b75b]">World Cup Simulator</p>
              <h1 className="text-xl font-black sm:text-2xl">Build your starting XI</h1>
            </div>
            <button onClick={() => setNationModalOpen(true)} className="flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-black hover:bg-white/10">
              <span className="text-xl">{getNationFlag(selectedNation.name)}</span><span className="hidden sm:inline">{selectedNation.name}</span>
            </button>
          </header>

          <div className="grid w-full min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="min-w-0">
              <div className="mb-3 md:hidden">
                <div className="grid grid-cols-4 gap-2">
                  {PRIMARY_FORMATIONS.map((option) => (
                    <button
                      key={option}
                      onClick={() => changeFormation(option)}
                      className={`min-h-11 min-w-0 rounded-xl px-1.5 py-2 text-[10px] font-black transition ${
                        formation === option ? "bg-[#d8b75b] text-black" : "border border-white/10 bg-white/5 text-white/60"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowAllFormations((current) => !current)}
                    className={`min-h-11 min-w-0 rounded-xl px-1.5 py-2 text-[10px] font-black transition ${
                      !PRIMARY_FORMATIONS.includes(formation)
                        ? "bg-[#d8b75b] text-black"
                        : "border border-white/10 bg-white/5 text-white/60"
                    }`}
                  >
                    Other
                  </button>
                </div>
                {showAllFormations ? (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {FORMATIONS.filter(
                      (option) => !PRIMARY_FORMATIONS.includes(option),
                    ).map((option) => (
                      <button
                        key={option}
                        onClick={() => changeFormation(option)}
                        className={`min-h-11 min-w-0 rounded-xl px-2 py-2 text-xs font-black transition ${
                          formation === option
                            ? "bg-[#d8b75b] text-black"
                            : "border border-white/10 bg-white/5 text-white/60"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="mb-3 hidden w-full max-w-full min-w-0 gap-2 overflow-x-auto pb-2 md:flex">
                {FORMATIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => changeFormation(option)}
                    className={`min-h-11 shrink-0 rounded-xl px-3 py-2 text-xs font-black transition ${
                      formation === option ? "bg-[#d8b75b] text-black" : "border border-white/10 bg-white/5 text-white/60 hover:text-white"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div className="mb-3 grid w-full max-w-full min-w-0 grid-cols-1 gap-2 min-[360px]:grid-cols-2 sm:flex sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedNation) return;
                    setSelections(
                      generateRandomXI(selectedNation.name, slots),
                    );
                    setActiveSlot(null);
                  }}
                  className="min-h-11 rounded-xl bg-gradient-to-r from-[#d8b75b] to-[#f6dc86] px-3 py-2.5 text-[10px] font-black uppercase tracking-wide text-black shadow-[0_8px_24px_rgba(216,183,91,.25)] transition hover:brightness-110 active:scale-[0.98] sm:px-4 sm:text-xs sm:tracking-wider"
                >
                  Generate Random XI
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelections({});
                    setActiveSlot(null);
                  }}
                  className="min-h-11 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-[10px] font-black uppercase tracking-wide text-white/60 hover:bg-white/10 hover:text-white sm:px-4 sm:text-xs sm:tracking-wider"
                >
                  Clear XI
                </button>
              </div>
              <Pitch formation={formation} selections={selections} onSlotClick={setActiveSlot} />
            </div>

            <aside className="min-w-0 flex flex-col gap-4 lg:pt-12">
              <div className="rounded-[1.75rem] border border-white/10 bg-[#101713]/90 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-xs font-black uppercase tracking-[0.18em] text-white/50">Team ratings</h2>
                  <span className="text-xs font-black text-[#8cf2a7]">{ratings.filled}/11</span>
                </div>
                <RatingPanel ratings={ratings} />
              </div>
              <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5">
                <p className="text-xs leading-5 text-white/45">
                  Tap any position on the pitch to select or replace a player. Team strength updates live.
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

      {view === "overview" && selectedNation ? (
        <section className="mx-auto min-h-screen w-full max-w-6xl min-w-0 px-4 py-8 pb-24 sm:px-8 sm:py-12 sm:pb-12">
          {previousResult && !reviewingPrevious ? (
            <button
              type="button"
              onClick={viewPreviousResult}
              className="mb-4 min-h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-wider text-white/60 sm:w-auto"
            >
              View Previous Result
            </button>
          ) : null}
          <div
            className={`w-full max-w-full min-w-0 overflow-hidden rounded-[2.25rem] border p-5 shadow-2xl sm:p-8 ${
              match?.round === "Final"
                ? "border-[#d8b75b]/45 bg-[radial-gradient(circle_at_top,#3a2f13,#101713_48%)]"
                : "border-white/10 bg-[#101713]/95"
            }`}
          >
            <header className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d8b75b]">
                {overviewType === "group-complete"
                  ? "Tournament update"
                  : "Next challenge"}
              </p>
              <h1 className="mt-3 break-words text-2xl font-black uppercase sm:text-4xl lg:text-6xl">
                {overviewType === "group-complete"
                  ? "Group Stage Complete"
                  : match?.round === "Final"
                    ? "The World Cup Final"
                    : match?.round}
              </h1>
              <p className="mt-3 text-sm text-white/50">
                {match?.round === "Final"
                  ? "One match away from glory."
                  : overviewType === "group-complete"
                    ? "The final group standings are confirmed."
                    : "The bracket is updated. Your next opponent awaits."}
              </p>
            </header>

            {overviewType === "group-complete" && groupStageOverview ? (
              <section className="mt-8 grid w-full min-w-0 gap-5 lg:grid-cols-[1fr_1.2fr]">
                <div className="min-w-0">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-black uppercase tracking-wider text-[#f6dc86]">
                        Final Group Table
                      </h2>
                      <span className="text-xs font-bold text-white/35">
                        Group {getGroupForNation(selectedNation.name)?.[0]}
                      </span>
                    </div>
                    <div className="mt-3">
                      {groupTable.map((row, index) => (
                        <div
                          key={row.nation.code}
                          className={`grid grid-cols-[1.5rem_1fr_2rem_2rem] items-center gap-2 border-t border-white/5 py-2 text-xs ${
                            row.nation.code === selectedNation.code
                              ? "text-[#f6dc86]"
                              : "text-white/55"
                          }`}
                        >
                          <span>{index + 1}</span>
                          <span className="truncate font-bold">
                            {getNationFlag(row.nation.name)} {row.nation.name}
                          </span>
                          <span className="text-center">
                            {row.goalsFor - row.goalsAgainst}
                          </span>
                          <span className="text-center font-black">
                            {row.points}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-[#d8b75b]/20 bg-[#d8b75b]/8 p-4">
                    <p className="text-[9px] font-black uppercase tracking-wider text-[#d8b75b]">
                      Qualification
                    </p>
                    <p className="mt-1 text-xl font-black">
                      {groupStageOverview.qualifiers.some(
                        (team) => team.nation.code === selectedNation.code,
                      )
                        ? "Qualified for the Round of 32"
                        : "Eliminated in the Group Stage"}
                    </p>
                    {match ? (
                      <p className="mt-2 text-sm text-white/55">
                        Round of 32 opponent:{" "}
                        <strong className="text-white">
                          {getNationFlag(match.opponent.name)}{" "}
                          {match.opponent.name}
                        </strong>
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-[9px] font-black uppercase tracking-wider text-white/35">
                      Best third-placed teams
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {groupStageOverview.bestThirdPlaced.map((team) => (
                        <span
                          key={team.nation.code}
                          className="rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[10px] font-bold"
                        >
                          {getNationFlag(team.nation.name)} {team.nation.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <TournamentBracket
                  rounds={[
                    {
                      round: "Round of 32",
                      fixtures: groupStageOverview.roundOf32,
                    },
                  ]}
                  selectedNationCode={selectedNation.code}
                />
              </section>
            ) : match && pendingRound ? (
              <>
                <div className="mx-auto mt-7 grid max-w-xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-2xl border border-[#d8b75b]/20 bg-black/20 p-4 text-center sm:gap-4 sm:p-5">
                  <div className="min-w-0">
                    <span className="text-4xl">
                      {getNationFlag(selectedNation.name)}
                    </span>
                    <p className="mt-2 truncate text-sm font-black sm:text-base">{selectedNation.name}</p>
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-white/25">
                    vs
                  </span>
                  <div className="min-w-0">
                    <span className="text-4xl">
                      {getNationFlag(match.opponent.name)}
                    </span>
                    <p className="mt-2 truncate text-sm font-black sm:text-base">{match.opponent.name}</p>
                  </div>
                </div>
                <div className="mt-7 w-full max-w-full min-w-0 overflow-hidden">
                  <TournamentBracket
                    rounds={[
                      ...bracketRounds,
                      bracketPreviewRound(pendingRound),
                    ]}
                    selectedNationCode={selectedNation.code}
                  />
                </div>
              </>
            ) : null}

            <button
              type="button"
              onClick={continueFromOverview}
              className="mx-auto mt-7 block w-full max-w-md rounded-2xl bg-[#d8b75b] px-5 py-4 text-sm font-black uppercase tracking-[0.14em] text-black transition hover:bg-[#f6dc86]"
            >
              {overviewType === "group-complete"
                ? match
                  ? "Continue to Round of 32"
                  : "Tournament Overview"
                : match?.round === "Final"
                  ? "Start Final"
                  : `Start ${match?.round} Match`}
            </button>
          </div>
        </section>
      ) : null}

      {view === "simulation" && selectedNation && match ? (
        <section className="mx-auto flex min-h-screen w-full max-w-3xl min-w-0 flex-col px-4 py-4 pb-24 sm:px-8 sm:pb-4">
          {previousResult && !reviewingPrevious && !matchComplete ? (
            <button
              type="button"
              onClick={viewPreviousResult}
              className="mb-4 min-h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-wider text-white/60 sm:w-auto sm:self-start"
            >
              View Previous Result
            </button>
          ) : null}
          <header className="mb-4 flex items-center justify-between">
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

          <div className="w-full max-w-full min-w-0 overflow-hidden rounded-[2rem] border border-white/10 bg-[#101713]/95 p-4 shadow-2xl sm:p-6">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 text-center sm:gap-3">
              <div className="min-w-0">
                <span className="text-3xl sm:text-5xl">{getNationFlag(selectedNation.name)}</span>
                <h2 className="mt-2 truncate text-sm font-black sm:text-lg">{selectedNation.name}</h2>
              </div>
              <div className="text-xs font-black uppercase tracking-[0.2em] text-white/25">vs</div>
              <div className="min-w-0">
                <span className="text-3xl sm:text-5xl">{getNationFlag(match.opponent.name)}</span>
                <h2 className="mt-2 truncate text-sm font-black sm:text-lg">{match.opponent.name}</h2>
              </div>
            </div>

            <div className="my-4 rounded-2xl border border-white/8 bg-black/25 px-3 py-4 text-center">
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
              <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 text-lg font-black sm:text-3xl">
                <span className="truncate text-right">{selectedNation.name} {liveScore.user}</span>
                <span className="text-white/25">-</span>
                <span className="truncate text-left">{liveScore.opponent} {match.opponent.name}</span>
              </div>
              <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                {matchMinute}&apos;
              </p>
            </div>

            <div
              ref={eventFeedRef}
              className="h-52 space-y-2 overflow-y-auto overscroll-contain rounded-2xl border border-white/5 bg-black/15 p-2 sm:h-60"
            >
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
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-2">
              {matchStatus === "ready" ? (
                <button
                  onClick={() => setMatchStatus("playing")}
                  className="min-h-12 rounded-2xl bg-[#d8b75b] px-5 py-4 text-sm font-black uppercase tracking-[0.14em] text-black"
                >
                  Start
                </button>
              ) : matchStatus === "playing" ? (
                <button
                  onClick={() => setMatchStatus("paused")}
                  className="min-h-12 rounded-2xl bg-[#d8b75b] px-5 py-4 text-sm font-black uppercase tracking-[0.14em] text-black"
                >
                  Pause
                </button>
              ) : (
                <button
                  onClick={() => setMatchStatus("playing")}
                  className="min-h-12 rounded-2xl bg-[#d8b75b] px-5 py-4 text-sm font-black uppercase tracking-[0.14em] text-black"
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
                className="min-h-12 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-wider"
              >
                Speed: {speed === "normal" ? "Normal" : "Fast"}
              </button>
              <button
                onClick={() => {
                  setRevealedEvents(match.events.length);
                  setMatchStatus("finished");
                }}
                className="min-h-12 rounded-2xl border border-[#d8b75b]/30 bg-[#d8b75b]/10 px-4 py-3 text-xs font-black uppercase tracking-wider text-[#f6dc86]"
              >
                Skip Match
              </button>
            </div>
          ) : null}

          {matchComplete && match.round === "Group Stage" ? (
            <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-[#101713]/90">
              <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                <h2 className="text-[10px] font-black uppercase tracking-[0.18em] text-[#d8b75b]">
                  Group table
                </h2>
                <span className="text-[9px] font-bold text-white/30">P · GD · PTS</span>
              </div>
              {visibleGroupTable.map((row, index) => (
                <div
                  key={row.nation.code}
                  className={`grid grid-cols-[1.25rem_minmax(0,1fr)_1.75rem_1.75rem_2rem] items-center gap-1 border-b border-white/5 px-3 py-2.5 text-[11px] last:border-0 sm:grid-cols-[1.5rem_1fr_2rem_2rem_2rem] sm:gap-2 sm:px-4 sm:text-xs ${
                    row.nation.code === selectedNation.code ? "bg-[#d8b75b]/8" : ""
                  }`}
                >
                  <span className="text-white/30">{index + 1}</span>
                  <span className="truncate font-bold">
                    {getNationFlag(row.nation.name)} {row.nation.name}
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
              {visibleOtherGroupResult ? (
                <ResultCard fixture={visibleOtherGroupResult} />
              ) : null}
            </section>
          ) : null}

          {matchComplete && match.round !== "Group Stage" ? (
            <section className="mt-5 rounded-2xl border border-white/10 bg-[#101713]/90 p-4">
              <h2 className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#d8b75b]">
                Tournament bracket
              </h2>
              <div className="mb-4 grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-emerald-300/15 bg-emerald-300/8 p-3">
                  <p className="text-[8px] font-black uppercase tracking-wider text-emerald-200/60">
                    Advances
                  </p>
                  <p className="mt-1 font-black text-emerald-100">
                    {match.userGoals > match.opponentGoals
                      ? `${getNationFlag(selectedNation.name)} ${selectedNation.name}`
                      : `${getNationFlag(match.opponent.name)} ${match.opponent.name}`}
                  </p>
                </div>
                <div className="rounded-xl border border-rose-300/15 bg-rose-300/8 p-3">
                  <p className="text-[8px] font-black uppercase tracking-wider text-rose-200/60">
                    Eliminated
                  </p>
                  <p className="mt-1 font-black text-rose-100">
                    {match.userGoals < match.opponentGoals
                      ? `${getNationFlag(selectedNation.name)} ${selectedNation.name}`
                      : `${getNationFlag(match.opponent.name)} ${match.opponent.name}`}
                  </p>
                </div>
              </div>
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
              onClick={reviewingPrevious ? returnFromPreviousResult : nextMatch}
              className="mt-5 rounded-2xl bg-[#d8b75b] px-5 py-4 text-sm font-black uppercase tracking-[0.14em] text-black transition hover:bg-[#f6dc86]"
            >
              {reviewingPrevious
                ? "Return to Current Tournament"
                : match.round === "Group Stage"
                ? groupIndex === 2
                  ? "View Group Stage Overview"
                  : `Continue to Matchday ${groupIndex + 2}`
                : match.userGoals < match.opponentGoals ||
                    match.round === "Final"
                  ? "Tournament Overview"
                  : `Continue to ${nextRoundLabel(match.round)}`}
            </button>
          ) : null}
        </section>
      ) : null}

      {view === "result" && selectedNation ? (
        <section className="mx-auto min-h-screen w-full max-w-6xl min-w-0 px-4 py-8 pb-24 sm:px-8 sm:py-10 sm:pb-10">
          <div className="w-full max-w-full min-w-0 overflow-hidden rounded-[2.25rem] border border-[#d8b75b]/20 bg-[#101713]/95 p-5 text-center shadow-2xl sm:p-9">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d8b75b]">Tournament complete</p>
            <span className="mt-5 block text-6xl sm:text-7xl">{getNationFlag(selectedNation.name)}</span>
            <h1 className="mt-3 break-words text-2xl font-black sm:text-3xl">{selectedNation.name}</h1>
            <div className="mx-auto mt-3 inline-block rounded-full bg-[#d8b75b]/10 px-4 py-2 text-sm font-black uppercase tracking-wider text-[#f6dc86]">
              {finish}
            </div>

            {worldCupScore ? (
              <section className="mx-auto mt-8 max-w-md rounded-[1.75rem] border border-[#d8b75b]/30 bg-[#d8b75b]/[0.06] p-6 text-center shadow-[0_0_60px_rgba(216,183,91,.12)]">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d8b75b]">
                  World Cup Score
                </p>
                <p className="mt-3 text-7xl font-black leading-none text-[#f6dc86] sm:text-8xl">
                  {worldCupScore.score}
                </p>
                <p className="mt-3 text-lg font-black">{worldCupScore.title}</p>
                {worldCupScore.rarity ? (
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[#8cf2a7]/70">
                    {worldCupScore.rarity}
                  </p>
                ) : null}
              </section>
            ) : null}

            <div className="mx-auto mt-5 grid w-full max-w-md gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setSaveLeaderboardOpen(true)}
                disabled={leaderboardSaved || !worldCupScore}
                className="min-h-12 rounded-2xl border border-[#d8b75b]/30 bg-[#d8b75b]/10 px-4 py-3 text-xs font-black uppercase tracking-wider text-[#f6dc86] hover:bg-[#d8b75b]/15 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {leaderboardSaved ? "Saved to Leaderboard" : "Save to Leaderboard"}
              </button>
              <button
                type="button"
                onClick={() => setLeaderboardOpen(true)}
                className="min-h-12 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-wider hover:bg-white/10"
              >
                View Leaderboard
              </button>
            </div>

            <section className="mt-8 rounded-[1.75rem] border border-emerald-300/15 bg-emerald-300/[0.035] p-4 text-left sm:p-6">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#8cf2a7]">
                Your Team Awards
              </h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                <AwardCard
                  title="Your Top Scorer"
                  value={
                    topScorer
                      ? `${topScorer[0]} · ${topScorer[1]} goals`
                      : "No goals scored"
                  }
                  detail={selectedNation.name}
                />
                <AwardCard
                  title="Your MVP"
                  value={mvp?.name ?? "–"}
                  detail={selectedNation.name}
                />
                <AwardCard
                  title="Your Record"
                  value={`${stats.wins}W · ${stats.draws}D · ${stats.losses}L`}
                  detail={`${stats.wins + stats.draws + stats.losses} matches`}
                />
                <AwardCard
                  title="Goals For / Against"
                  value={`${stats.goalsFor} / ${stats.goalsAgainst}`}
                  detail="Tournament total"
                />
                <AwardCard title="Your Finish" value={finish} detail="World Cup 2026" />
              </div>
            </section>

            {awards ? (
              <section className="mt-5 rounded-[1.75rem] border border-[#d8b75b]/20 bg-[#d8b75b]/[0.045] p-4 text-left sm:p-6">
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#f6dc86]">
                  World Cup Awards
                </h2>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  <AwardCard
                    title="Tournament Top Scorer"
                    value={`${awards.goldenBoot.name} · ${awards.goldenBoot.goals} goals`}
                    detail={awards.goldenBoot.nation}
                  />
                  <AwardCard
                    title="Tournament MVP"
                    value={awards.playerOfTournament.name}
                    detail={awards.playerOfTournament.nation}
                  />
                  <AwardCard
                    title="Best Goalkeeper"
                    value={awards.bestGoalkeeper.name}
                    detail={awards.bestGoalkeeper.nation}
                  />
                  <AwardCard
                    title="Winner"
                    value={`${getNationFlag(awards.winner.name)} ${awards.winner.name}`}
                    detail={`Final ${awards.finalScore}`}
                  />
                  <AwardCard
                    title="Runner-up"
                    value={`${getNationFlag(awards.runnerUp.name)} ${awards.runnerUp.name}`}
                    detail="World Cup finalist"
                  />
                </div>
              </section>
            ) : null}

            <div className="mt-7 w-full max-w-full min-w-0 overflow-hidden text-left">
              <h2 className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#d8b75b]">
                Full tournament bracket
              </h2>
              <TournamentBracket
                rounds={bracketRounds}
                selectedNationCode={selectedNation.code}
              />
            </div>

            {previousResult && !reviewingPrevious ? (
              <button
                type="button"
                onClick={viewPreviousResult}
                className="mx-auto mt-6 min-h-11 w-full max-w-md rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-wider text-white/60"
              >
                View Previous Result
              </button>
            ) : null}
            {worldCupScore ? (
              <ShareResult
                data={{
                  nation: selectedNation,
                  finish,
                  score: worldCupScore.score,
                  scoreTitle: worldCupScore.title,
                  rarity: worldCupScore.rarity,
                  topScorer: topScorer?.[0],
                  mvp: mvp?.name,
                }}
                onPlayAgain={playAgain}
                onChangeNation={changeNation}
              />
            ) : null}
          </div>
        </section>
      ) : null}

      <NationModal
        open={nationModalOpen}
        selected={selectedNation}
        onClose={() => setNationModalOpen(false)}
        onSelect={chooseNation}
      />
      <LeaderboardModal
        open={leaderboardOpen}
        onClose={() => setLeaderboardOpen(false)}
      />
      <SaveToLeaderboardModal
        open={saveLeaderboardOpen}
        defaultName="Anonymous"
        onClose={() => setSaveLeaderboardOpen(false)}
        onSave={saveToLeaderboard}
      />
      <PlayerModal
        open={activeSlot !== null}
        nation={selectedNation}
        usedIds={new Set(Object.values(selections).map((player) => player.id))}
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
