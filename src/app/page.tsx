import prisma from "@/lib/db";
import { Leaderboard } from "@/components/leaderboard";

// Placeholder standings data matching your spreadsheet
const PLACEHOLDER_STANDINGS = [
  { rank: 1, name: "Jon", totalPoints: 108.3, weeklyPoints: [{ week: 1, points: 108.3 }] },
  { rank: 2, name: "Brad", totalPoints: 85.1, weeklyPoints: [{ week: 1, points: 85.1 }] },
  { rank: 3, name: "Sam", totalPoints: 83.8, weeklyPoints: [{ week: 1, points: 83.8 }] },
  { rank: 4, name: "Nick", totalPoints: 55.2, weeklyPoints: [{ week: 1, points: 55.2 }] },
  { rank: 5, name: "JC", totalPoints: 49.6, weeklyPoints: [{ week: 1, points: 49.6 }] },
  { rank: 6, name: "Johnny", totalPoints: 46.6, weeklyPoints: [{ week: 1, points: 46.6 }] },
  { rank: 7, name: "Eli", totalPoints: 35.2, weeklyPoints: [{ week: 1, points: 35.2 }] },
  { rank: 8, name: "Ben", totalPoints: 21.3, weeklyPoints: [{ week: 1, points: 21.3 }] },
];

async function getLeaderboardData() {
  try {
    const owners = await prisma.owner.findMany({
      include: {
        rosters: {
          where: {
            year: new Date().getFullYear(),
          },
          include: {
            player: {
              include: {
                scores: {
                  where: {
                    year: new Date().getFullYear(),
                  },
                },
              },
            },
          },
        },
      },
    });

    if (owners.length === 0) {
      return PLACEHOLDER_STANDINGS;
    }

    const leaderboardEntries = owners.map((owner) => {
      const weeklyTotals = new Map<number, number>();

      for (const roster of owner.rosters) {
        for (const score of roster.player.scores) {
          const current = weeklyTotals.get(score.week) ?? 0;
          weeklyTotals.set(score.week, current + score.points);
        }
      }

      const weeklyPoints = Array.from(weeklyTotals.entries())
        .map(([week, points]) => ({ week, points }))
        .sort((a, b) => a.week - b.week);

      const totalPoints = weeklyPoints.reduce((sum, w) => sum + w.points, 0);

      return {
        name: owner.name,
        totalPoints,
        weeklyPoints,
      };
    });

    leaderboardEntries.sort((a, b) => b.totalPoints - a.totalPoints);

    return leaderboardEntries.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return PLACEHOLDER_STANDINGS;
  }
}

export default async function HomePage() {
  const leaderboardData = await getLeaderboardData();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl md:text-5xl font-bold text-[var(--chalk-yellow)] chalk-text">
          2025 Playoff Best Ball
        </h1>
        <p className="text-[var(--chalk-muted)]">Last updated: {new Date().toLocaleString()}</p>
      </div>

      {/* Leaderboard */}
      <Leaderboard entries={leaderboardData} title="Standings" showWeeklyBreakdown={true} />

      {/* Getting Started */}
      <div className="chalk-box chalk-box-blue p-6">
        <h2 className="font-bold text-[var(--chalk-blue)] text-lg mb-2 chalk-text">
          Getting Started
        </h2>
        <p className="text-[var(--chalk-white)] text-sm leading-relaxed">
          This app needs to be connected to a Neon database. Set up your{" "}
          <code className="bg-[rgba(0,0,0,0.3)] px-2 py-0.5 rounded text-[var(--chalk-pink)]">
            DATABASE_URL
          </code>{" "}
          environment variable and run{" "}
          <code className="bg-[rgba(0,0,0,0.3)] px-2 py-0.5 rounded text-[var(--chalk-pink)]">
            npx prisma db push
          </code>{" "}
          to create the tables. Then seed your rosters and sync scores from ESPN.
        </p>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
